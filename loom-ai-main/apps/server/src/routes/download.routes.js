/**
 * @file download.routes.js
 * @description API router handling project zip download GET /api/download/:projectId.
 */

const express = require('express');
const { getProjectById, getSessionById } = require('../db/queries');
const { createProjectZipStream } = require('../services/zip.service');

const router = express.Router();

router.get('/:projectId', async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) {
    return res.status(400).json({ success: false, error: 'Missing projectId' });
  }

  try {
    const project = getProjectById(projectId);
    const session = getSessionById(projectId);

    if (!project || !session) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const state = JSON.parse(session.state || '{"messages":[], "files":{}}');
    const files = state.files || {};

    // Generate zip stream
    const zipStream = createProjectZipStream(files, project.stack);

    // Set download attachment headers
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    zipStream.on('error', (err) => {
      console.error('[Download Route] Streaming error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'ZIP packaging failed' });
      }
    });

    zipStream.pipe(res);
  } catch (error) {
    console.error('[Download Route] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: `Download failed: ${error.message}` });
    }
  }
});

module.exports = router;
