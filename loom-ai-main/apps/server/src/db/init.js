/**
 * @file init.js
 * @description SQLite database connection setup and table initialization module.
 * Uses better-sqlite3 to create `projects` and `sessions` tables if they do not exist.
 */

const fs = require('fs');
const path = require('path');
const Database = require('./better-sqlite3-mock');
const { validateEnv } = require('../config/env');
const { logger } = require('../utils/logger');

let db = null;

/**
 * Initializes SQLite database tables (projects and sessions).
 * 
 * @returns {import('better-sqlite3').Database} The SQLite database instance.
 */
function initDatabase() {
  const env = validateEnv();
  
  // Ensure target directory exists before opening database
  const dbDir = path.dirname(env.DATABASE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection instance
  db = new Database(env.DATABASE_PATH);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Schema creation for projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      stack TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Lightweight migrations keep every existing conversation intact when the
  // multi-project workspace is introduced.
  const projectColumns = db.prepare('PRAGMA table_info(projects)').all().map((column) => column.name);
  if (!projectColumns.includes('status')) db.exec("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'");
  if (!projectColumns.includes('last_message')) db.exec("ALTER TABLE projects ADD COLUMN last_message TEXT NOT NULL DEFAULT ''");
  if (!projectColumns.includes('archived')) db.exec('ALTER TABLE projects ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');

  // Schema creation for sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  logger.info('Database initialized successfully');
  return db;
}

/**
 * Returns active database connection instance.
 * @returns {import('better-sqlite3').Database}
 */
function getDb() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

module.exports = {
  initDatabase,
  getDb,
};
