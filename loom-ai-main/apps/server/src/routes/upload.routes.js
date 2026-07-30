/**
 * @file upload.routes.js
 * @description API router handling project upload, stack auto-detection, and code validation for POST /api/upload.
 * Supports both JSON payload files map and multipart ZIP uploads.
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createProject, saveSession } = require('../db/queries');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * Helper to recursively list files in a directory and return as a path -> content object.
 * @param {string} dir - Directory to read
 * @param {string} [baseDir=dir] - Base directory for calculating relative paths
 * @returns {Object} Files map
 */
function readFilesRecursively(dir, baseDir = dir) {
  const results = {};
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      Object.assign(results, readFilesRecursively(filePath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');
      results[relativePath] = fs.readFileSync(filePath, 'utf8');
    }
  }
  return results;
}

/**
 * Inspects a ZIP archive's binary headers to find any path traversal entries (e.g. including '..').
 * Scans both Central Directory and Local File Headers directly.
 * @param {string} zipPath - Absolute path to zip file
 */
function inspectZipHeaders(zipPath) {
  const buffer = fs.readFileSync(zipPath);
  let offset = 0;
  
  while (offset < buffer.length - 4) {
    if (
      buffer[offset] === 0x50 && 
      buffer[offset+1] === 0x4b && 
      buffer[offset+2] === 0x01 && 
      buffer[offset+3] === 0x02
    ) {
      // Central Directory Header
      const fileNameLength = buffer.readUInt16LE(offset + 28);
      const extraFieldLength = buffer.readUInt16LE(offset + 30);
      const fileCommentLength = buffer.readUInt16LE(offset + 32);
      
      const fileNameStart = offset + 46;
      const fileNameEnd = fileNameStart + fileNameLength;
      
      if (fileNameEnd <= buffer.length) {
        const fileName = buffer.toString('utf8', fileNameStart, fileNameEnd);
        const normalized = fileName.replace(/\\/g, '/');
        
        if (
          normalized.includes('..') || 
          normalized.startsWith('/') || 
          /^[A-Za-z]:/.test(normalized)
        ) {
          throw new Error(`Path traversal or invalid absolute path detected: ${fileName}`);
        }
      }
      offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    } else if (
      buffer[offset] === 0x50 && 
      buffer[offset+1] === 0x4b && 
      buffer[offset+2] === 0x03 && 
      buffer[offset+3] === 0x04
    ) {
      // Local File Header
      const fileNameLength = buffer.readUInt16LE(offset + 26);
      const extraFieldLength = buffer.readUInt16LE(offset + 28);
      
      const fileNameStart = offset + 30;
      const fileNameEnd = fileNameStart + fileNameLength;
      
      if (fileNameEnd <= buffer.length) {
        const fileName = buffer.toString('utf8', fileNameStart, fileNameEnd);
        const normalized = fileName.replace(/\\/g, '/');
        
        if (
          normalized.includes('..') || 
          normalized.startsWith('/') || 
          /^[A-Za-z]:/.test(normalized)
        ) {
          throw new Error(`Path traversal or invalid absolute path detected: ${fileName}`);
        }
      }
      offset += 30 + fileNameLength + extraFieldLength;
    } else {
      offset++;
    }
  }
}

router.post('/', upload.single('file'), async (req, res) => {
  let files = {};
  let tempDir = null;

  try {
    if (req.file) {
      // 1. Process ZIP upload
      const zipPath = req.file.path;
      
      // Enforce file size limit for ZIP itself (max 5MB)
      const stats = fs.statSync(zipPath);
      if (stats.size > 5 * 1024 * 1024) {
        try { fs.unlinkSync(zipPath); } catch (e) {}
        return res.status(400).json({
          success: false,
          error: 'Zip file size exceeds limit of 5MB.'
        });
      }

      // Security check: inspect ZIP binary headers for path traversal BEFORE creating directories or extracting
      try {
        inspectZipHeaders(zipPath);
      } catch (err) {
        try { fs.unlinkSync(zipPath); } catch (e) {}
        return res.status(400).json({
          success: false,
          error: `Security violation in ZIP contents: ${err.message}`
        });
      }

      // Create a unique temporary extraction directory
      tempDir = path.join(__dirname, `../../temp-upload-${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // Extract ZIP using built-in system 'tar' command
      try {
        execSync(`tar -xf "${zipPath}" -C "${tempDir}"`);
      } catch (err) {
        console.error('[Upload Route] Extraction failed:', err);
        return res.status(400).json({
          success: false,
          error: 'Failed to extract project ZIP archive. Make sure it is a valid ZIP.'
        });
      } finally {
        // Delete the temporary uploaded ZIP file
        try { fs.unlinkSync(zipPath); } catch (e) {}
      }

      // Read files recursively
      files = readFilesRecursively(tempDir);
    } else if (req.body.files && typeof req.body.files === 'object') {
      // 2. Process JSON payload
      files = req.body.files;
    } else {
      return res.status(400).json({ success: false, error: 'No files provided for upload' });
    }

    // Strip common root folder if files are nested inside a single folder (e.g. from GitHub exports)
    const fileKeys = Object.keys(files);
    if (fileKeys.length > 0) {
      const firstKeyParts = fileKeys[0].split('/');
      if (firstKeyParts.length > 1) {
        const rootCandidate = firstKeyParts[0] + '/';
        const allHaveRoot = fileKeys.every(k => k.startsWith(rootCandidate));
        if (allHaveRoot) {
          const strippedFiles = {};
          for (const [k, v] of Object.entries(files)) {
            const newKey = k.substring(rootCandidate.length);
            if (newKey) strippedFiles[newKey] = v;
          }
          files = strippedFiles;
        }
      }
    }

    const processedKeys = Object.keys(files);
    if (processedKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'No files found in upload.' });
    }

    // --- STACK AUTO-DETECTION & VALIDATION ---
    
    // React signals: presence of any .jsx file, or App.js/App.jsx, or tailwind config
    const hasReactApp = processedKeys.some(f => 
      f.endsWith('App.jsx') || 
      f.endsWith('App.js') || 
      f.includes('/App.jsx') || 
      f.includes('/App.js')
    );
    const hasTailwindConfig = processedKeys.some(f => 
      f.includes('tailwind.config.js') || 
      f.includes('tailwind.config.cjs') ||
      f.includes('tailwind.config.ts')
    );
    const hasJsx = processedKeys.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'));
    const isReact = hasReactApp || hasTailwindConfig || hasJsx;

    // Vanilla signals: any .html file qualifies — index.html, about.html, anything
    const hasAnyHtml = processedKeys.some(f => f.endsWith('.html') || f.endsWith('.htm'));
    const hasAnyJs = processedKeys.some(f => f.endsWith('.js') && !f.endsWith('.config.js') && !f.endsWith('.config.cjs'));
    const hasAnyCss = processedKeys.some(f => f.endsWith('.css') && !f.includes('tailwind'));
    const isVanilla = hasAnyHtml || (!isReact && (hasAnyJs || hasAnyCss));

    if (!isVanilla && !isReact) {
      return res.status(400).json({
        success: false,
        error: "Unsupported project format. Please upload an HTML/CSS/JS project, or a React + Tailwind project with App.jsx."
      });
    }

    const stack = isReact ? 'react-tailwind' : 'vanilla';

    // --- FILE SECURITY & INTEGRITY VALIDATIONS ---
    const allowedExtensions = [
      '.html', '.css', '.js', '.jsx', '.json', '.txt', '.md', 
      '.config.js', '.config.cjs', '.config.ts', '.ts', '.tsx'
    ];

    for (const [filePath, content] of Object.entries(files)) {
      const ext = path.extname(filePath).toLowerCase();

      // Check: reject binary files or disallowed extensions
      const hasAllowedExtension = allowedExtensions.some(e => filePath.toLowerCase().endsWith(e));
      if (!hasAllowedExtension) {
        return res.status(400).json({
          success: false,
          error: `Rejected file "${filePath}": Only text-based project files are allowed (.html, .css, .js, .jsx, .json, etc.).`
        });
      }

      // Check: file size limit (max 500KB per text file)
      if (Buffer.byteLength(content, 'utf8') > 500 * 1024) {
        return res.status(400).json({
          success: false,
          error: `Rejected file "${filePath}": File exceeds the size limit of 500KB.`
        });
      }

      // Check: reject binary content (indicated by null bytes)
      if (content.includes('\0')) {
        return res.status(400).json({
          success: false,
          error: `Rejected file "${filePath}": Binary content detected.`
        });
      }

      // Check: prevent dangerous dynamic execution commands in JS/JSX
      if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
        if (content.includes('eval(') || content.includes('Function(')) {
          return res.status(400).json({
            success: false,
            error: `Security violation in "${filePath}": Dynamic execution (eval or Function constructor) is forbidden.`
          });
        }
      }
    }

    // --- PERSISTENCE IN DATABASE ---
    const projectId = `proj-${Date.now()}`;
    const name = stack === 'vanilla' ? 'Uploaded Vanilla App' : 'Uploaded React App';

    // 1. Create project row
    createProject({ id: projectId, name, stack });

    const explanationText = `Successfully imported project with ${processedKeys.length} files. Auto-detected stack: **${stack === 'vanilla' ? 'Vanilla HTML/CSS/JS' : 'React + Tailwind'}**.`;
    
    const dbState = JSON.stringify({
      messages: [
        {
          id: `assistant-import`,
          role: 'assistant',
          stack,
          content: explanationText,
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
      files: files
    });

    // 2. Save session row
    saveSession({
      id: projectId,
      projectId,
      state: dbState
    });

    res.json({
      success: true,
      data: {
        projectId,
        stack,
        files,
        message: explanationText
      }
    });
  } catch (error) {
    console.error('[Upload Route] Error:', error);
    res.status(500).json({ success: false, error: `Upload processing failed: ${error.message}` });
  } finally {
    // Recursively delete the temp extraction folder if it exists
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }
});

module.exports = router;
