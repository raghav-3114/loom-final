/**
 * @file chat.routes.js
 * @description API router handling follow-up conversational agent routing POST /api/chat.
 * Wires graph state, restores project details from database, and pushes SSE streams.
 */

const express = require('express');
const { runGraph } = require('../agents/graph');
const { getProjectById, getSessionById, updateProject, saveSession } = require('../db/queries');

const router = express.Router();

router.post('/', async (req, res) => {
  const startTime = new Date().toLocaleTimeString();
  const { message, projectId, stack } = req.body;

  if (!message || !projectId) {
    return res.status(400).json({ success: false, error: 'Missing message or projectId' });
  }

  // Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    // 1. Fetch project & session
    const project = getProjectById(projectId);
    const session = getSessionById(projectId);

    if (!project || !session) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Project or session session not found' })}\n\n`);
      res.end();
      return;
    }

    const sessionState = JSON.parse(session.state || '{"messages":[], "files":{}}');
    const existingFiles = sessionState.files || {};
    const chatHistory = sessionState.messages || [];
    updateProject(projectId, { status: 'building', lastMessage: message });

    res.write(`data: ${JSON.stringify({ type: 'thinking', message: 'Analyzing files context...' })}\n\n`);

    // 2. Run graph with follow-up message
    const result = await runGraph({
      prompt: message,
      stack: stack || project.stack,
      files: existingFiles,
      history: chatHistory,
      onProgress: (progressMessage) => {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'thinking', message: progressMessage })}\n\n`);
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
    const summaryText = result.summary || 'Files updated successfully.';
    const intent = result.intent || 'edit';
    // Explain and debug are read-only: never overwrite files with an empty/undefined result
    const isReadOnly = intent === 'explain' || intent === 'debug' || intent === 'off_topic';
    const finalFiles = isReadOnly ? existingFiles : (result.files && Object.keys(result.files).length > 0 ? result.files : existingFiles);

    // Append to messages list
    const updatedMessages = [
      ...chatHistory,
      { id: `user-${Date.now()}`, role: 'user', content: message, stack: project.stack, timestamp: startTime },
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        stack: project.stack,
        content: explanationText || `I've updated the files based on your request.`,
        summary: summaryText,
        timestamp: new Date().toLocaleTimeString(),
      }
    ];

    const updatedState = JSON.stringify({
      messages: updatedMessages,
      files: finalFiles,
      previewState: sessionState.previewState || {},
      builderState: sessionState.builderState || {},
      reviewerState: sessionState.reviewerState || {},
      documentation: sessionState.documentation || '',
      activityLog: [...(sessionState.activityLog || []), { type: intent, status: 'completed', at: new Date().toISOString() }]
    });

    // 3. Save session back to SQLite
    saveSession({
      id: projectId,
      projectId,
      state: updatedState,
      status: 'completed',
      lastMessage: explanationText || summaryText,
    });

    // Stream done payload
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
    console.error('[Chat Route] Error:', error);
    // Guard against write-after-end if the client already disconnected
    if (!res.writableEnded) {
      updateProject(projectId, { status: 'error', lastMessage: error.message });
      res.write(`data: ${JSON.stringify({ type: 'error', message: `Chat failed: ${error.message}` })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
