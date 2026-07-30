/**
 * @file zip.service.js
 * @description Zip export service using archiver.
 * Compresses project file arrays/objects into streaming zip downloads.
 */

const archiver = require('archiver');
const { Readable } = require('stream');
const { createReactTailwindZipLayout } = require('../stacks/react-tailwind/zip-layout');
const { createVanillaZipLayout } = require('../stacks/vanilla/zip-layout');

/**
 * Generates a ZIP archive stream from project files according to stack layout.
 * @param {Object|Array} files - Project files map (filename -> content) or array of {path, content}.
 * @param {string} stack - Active stack identifier ("vanilla" | "react-tailwind").
 * @returns {import('stream').Readable} Readable stream of the generated ZIP archive.
 */
function createProjectZipStream(files, stack) {
  const archive = archiver('zip', { zlib: { level: 9 } });

  // Apply stack-specific zip layout formatting if we have a files map object
  let formattedFiles = files;
  if (typeof files === 'object' && !Array.isArray(files)) {
    if (stack === 'react-tailwind') {
      formattedFiles = createReactTailwindZipLayout(files);
    } else if (stack === 'vanilla') {
      formattedFiles = createVanillaZipLayout(files);
    }
  }

  // Convert files map to array if necessary
  const filesList = typeof formattedFiles === 'object' && !Array.isArray(formattedFiles)
    ? Object.entries(formattedFiles).map(([path, content]) => ({ path, content }))
    : formattedFiles;

  // Append each file to archive
  for (const file of filesList) {
    // Standardize leading slash removal
    const cleanPath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
    archive.append(file.content, { name: cleanPath });
  }

  // Finalize the archive (returns a stream)
  archive.finalize();
  return archive;
}

module.exports = {
  createProjectZipStream,
};
