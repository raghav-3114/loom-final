/**
 * @file conversations.routes.js
 * @description Read-only APIs for listing and restoring saved conversations.
 */

const express = require('express');
const crypto = require('crypto');
const {
  createProject,
  saveSession,
  listConversations,
  getConversationByProjectId,
  updateProject,
  deleteProject,
} = require('../db/queries');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, conversations: listConversations() });
});

router.post('/', (req, res) => {
  try {
    const stack = req.body.stack === 'react-tailwind' ? 'react-tailwind' : 'vanilla';
    const id = `proj-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const state = {
      messages: [], files: {}, previewState: {}, builderState: {}, reviewerState: {}, documentation: '', activityLog: [],
    };
    const project = createProject({ id, name: 'New Chat', stack, status: 'draft' });
    saveSession({ id, projectId: id, state: JSON.stringify(state), status: 'draft' });
    res.status(201).json({ success: true, project, state });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not create a new chat' });
  }
});

router.get('/:projectId', (req, res) => {
  const conversation = getConversationByProjectId(req.params.projectId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  return res.json({ success: true, ...conversation });
});

router.patch('/:projectId', (req, res) => {
  try {
    const { name, archived } = req.body;
    const project = updateProject(req.params.projectId, { name, archived });
    if (!project) return res.status(404).json({ success: false, error: 'Conversation not found' });
    return res.json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Could not update conversation' });
  }
});

router.post('/:projectId/duplicate', (req, res) => {
  try {
    const source = getConversationByProjectId(req.params.projectId);
    if (!source) return res.status(404).json({ success: false, error: 'Conversation not found' });
    const id = `proj-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const project = createProject({ id, name: `${source.project.name} copy`, stack: source.project.stack, status: 'completed', lastMessage: source.project.last_message });
    saveSession({ id, projectId: id, state: JSON.stringify(source.state), status: 'completed', lastMessage: source.project.last_message });
    return res.status(201).json({ success: true, project });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Could not duplicate conversation' });
  }
});

router.delete('/:projectId', (req, res) => {
  try {
    if (!deleteProject(req.params.projectId)) return res.status(404).json({ success: false, error: 'Conversation not found' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Could not delete conversation' });
  }
});

module.exports = router;
