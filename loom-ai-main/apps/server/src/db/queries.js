/**
 * @file queries.js
 * @description Prepared SQL query executions and helper functions for database CRUD operations
 * on projects and session records.
 */

const { getDb } = require('./init');

/**
 * Creates a new project record.
 * 
 * @param {Object} projectData
 * @param {string} projectData.id - Unique ID
 * @param {string} projectData.name - Project Name
 * @param {string} projectData.stack - Stack Identifier ("vanilla" | "react-tailwind")
 * @returns {Object} Created project object
 */
function createProject({ id, name, stack, status = 'draft', lastMessage = '' }) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO projects (id, name, stack, status, last_message)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, stack, status, lastMessage);
  return { id, name, stack, status, lastMessage };
}

/**
 * Finds a project by ID.
 * 
 * @param {string} id 
 * @returns {Object|null} Project record or null
 */
function getProjectById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const project = stmt.get(id);
  return project || null;
}

/**
 * Creates or updates a session.
 * 
 * @param {Object} sessionData 
 * @param {string} sessionData.id - Session/Project ID
 * @param {string} sessionData.projectId - Project ID link
 * @param {string} sessionData.state - Serialized state string (messages and files)
 * @returns {Object} Session record
 */
function saveSession({ id, projectId, state, status, lastMessage }) {
  const db = getDb();
  
  // Check if session exists
  const existing = db.prepare('SELECT id FROM sessions WHERE id = ?').get(id);
  
  if (existing) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET state = ?
      WHERE id = ?
    `);
    stmt.run(state, id);
  } else {
    const stmt = db.prepare(`
      INSERT INTO sessions (id, project_id, state)
      VALUES (?, ?, ?)
    `);
    stmt.run(id, projectId, state);
  }

  db.prepare(`
    UPDATE projects
    SET updated_at = CURRENT_TIMESTAMP,
        status = COALESCE(?, status),
        last_message = COALESCE(?, last_message)
    WHERE id = ?
  `).run(status || null, lastMessage || null, projectId);
  
  return { id, projectId, state };
}

/**
 * Retrieves a session by ID.
 * @param {string} id
 * @returns {Object|null}
 */
function getSessionById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  const session = stmt.get(id);
  return session || null;
}

/**
 * Returns saved conversations, newest activity first.  Sessions are kept in
 * the existing project/session schema so this does not alter prior records.
 *
 * @returns {Array<Object>} Saved conversation metadata.
 */
function listConversations() {
  const db = getDb();
  return db.prepare(`
    SELECT p.id, p.name, p.stack, p.status, p.last_message, p.created_at, p.updated_at
    FROM projects p
    INNER JOIN sessions s ON s.project_id = p.id
    WHERE p.archived = 0 AND p.status != 'draft'
    ORDER BY p.updated_at DESC, p.created_at DESC
  `).all();
}

function updateProject(id, { name, stack, status, lastMessage, archived }) {
  const db = getDb();
  const project = getProjectById(id);
  if (!project) return null;

  db.prepare(`
    UPDATE projects
    SET name = COALESCE(?, name),
        stack = COALESCE(?, stack),
        status = COALESCE(?, status),
        last_message = COALESCE(?, last_message),
        archived = COALESCE(?, archived),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name || null, stack || null, status || null, lastMessage || null, archived ?? null, id);

  return getProjectById(id);
}

function deleteProject(id) {
  return getDb().prepare('DELETE FROM projects WHERE id = ?').run(id).changes > 0;
}

/**
 * Retrieves the persisted project and complete conversation state.
 *
 * @param {string} projectId
 * @returns {{project: Object, state: Object}|null}
 */
function getConversationByProjectId(projectId) {
  const project = getProjectById(projectId);
  const session = getSessionById(projectId);
  if (!project || !session) return null;

  return {
    project,
    state: JSON.parse(session.state || '{"messages":[],"files":{}}'),
  };
}

module.exports = {
  createProject,
  getProjectById,
  saveSession,
  getSessionById,
  listConversations,
  getConversationByProjectId,
  updateProject,
  deleteProject,
};
