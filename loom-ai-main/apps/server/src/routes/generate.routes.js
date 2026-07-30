/**
 * @file generate.routes.js
 * @description API router handling project generation endpoint POST /api/generate.
 * Wires execution graph, persists session to SQLite, and streams progress back to client via SSE.
 */

const express = require('express');
const { runGraph } = require('../agents/graph');
const { createProject, getProjectById, updateProject, saveSession } = require('../db/queries');

const router = express.Router();

router.post('/', async (req, res) => {
  const { prompt, stack, projectId: requestedProjectId } = req.body;

  if (!prompt || !stack) {
    return res.status(400).json({ success: false, error: 'Missing prompt or stack' });
  }

  // Setup Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const projectId = requestedProjectId || `proj-${Date.now()}`;
  const projectName = prompt.substring(0, 30) || 'New AI Project';

  try {
    // 1. A New Chat can already have a draft session. Reuse only that
    // project so two generation jobs never share a workspace.
    const existingProject = getProjectById(projectId);
    if (existingProject) {
      updateProject(projectId, { name: projectName, stack, status: 'building', lastMessage: prompt });
    } else {
      createProject({ id: projectId, name: projectName, stack, status: 'building', lastMessage: prompt });
    }

    res.write(`data: ${JSON.stringify({ type: 'project', projectId })}\n\n`);

    // Stream initial state
    res.write(`data: ${JSON.stringify({ type: 'thinking', message: 'Router agent classifying project intent...' })}\n\n`);

    // 2. Execute graph to generate files
    const result = await runGraph({
      prompt,
      stack,
      files: {},
      history: [],
      onProgress: (message) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'thinking', message })}\n\n`);
        }
      },
    });

    if (result.errors && result.errors.length > 0) {
      updateProject(projectId, { status: 'error', lastMessage: result.errors.join('. ') });
      res.write(`data: ${JSON.stringify({ type: 'error', message: result.errors.join('. ') })}\n\n`);
      res.end();
      return;
    }

    const explanationText = result.explanation || '';
    const summaryText = result.summary || 'Project generated successfully.';
    const intent = result.intent || 'generate';
    const finalFiles = result.files || {};

    const dbState = JSON.stringify({
      messages: [
        { id: `user-init`, role: 'user', content: prompt, stack, timestamp: new Date().toLocaleTimeString() },
        {
          id: `assistant-init`,
          role: 'assistant',
          stack,
          content: explanationText || `Here is the generated **${stack === 'vanilla' ? 'Vanilla HTML/CSS/JS' : 'React + Tailwind'}** project.`,
          summary: summaryText,
          timestamp: new Date().toLocaleTimeString(),
        }
      ],
      files: finalFiles,
      previewState: {}, builderState: {}, reviewerState: {}, documentation: '',
      activityLog: [{ type: 'generation', status: 'completed', at: new Date().toISOString() }]
    });

    // 3. Save session in SQLite
    saveSession({
      id: projectId,
      projectId,
      state: dbState,
      status: 'completed',
      lastMessage: explanationText || summaryText,
    });

    // Stream completed project payload to client
    res.write(`data: ${JSON.stringify({
      type: 'done',
      projectId,
      intent,
      files: finalFiles,
      explanation: explanationText,
      summary: summaryText,
    })}\n\n`);


    res.end();
  } catch (error) {
    console.error('[Generate Route] Error:', error);
    updateProject(projectId, { status: 'error', lastMessage: error.message });
    res.write(`data: ${JSON.stringify({ type: 'error', message: `Generation failed: ${error.message}` })}\n\n`);
    res.end();
  }
});

module.exports = router;
