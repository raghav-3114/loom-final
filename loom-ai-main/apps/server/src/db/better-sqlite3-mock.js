const fs = require('fs');
const path = require('path');

class MockDatabase {
  constructor(dbPath) {
    // Use .json extension instead of SQLite binary format
    this.dbPath = dbPath.endsWith('.db') ? dbPath.replace(/\.db$/, '.json') : dbPath + '.json';
    this.data = {
      projects: [],
      sessions: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(content);
      }
    } catch (e) {
      console.warn('[MockDB] Failed to load JSON database, starting fresh:', e.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('[MockDB] Failed to save JSON database:', e.message);
    }
  }

  pragma() {
    // No-op for mock pragma operations
    return [];
  }

  exec(sql) {
    // Schema creation/updates are ignored as they are pre-wired in JS structure
    return this;
  }

  prepare(sql) {
    const self = this;
    const normSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

    return {
      run(...params) {
        if (normSql.includes('insert into projects')) {
          // INSERT INTO projects (id, name, stack, status, last_message) VALUES (?, ?, ?, ?, ?)
          const [id, name, stack, status, lastMessage] = params;
          const idx = self.data.projects.findIndex(p => p.id === id);
          const project = {
            id,
            name,
            stack,
            status,
            last_message: lastMessage || '',
            archived: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          if (idx >= 0) {
            self.data.projects[idx] = project;
          } else {
            self.data.projects.push(project);
          }
          self.save();
          return { changes: 1 };
        }

        if (normSql.includes('insert into sessions')) {
          // INSERT INTO sessions (id, project_id, state) VALUES (?, ?, ?)
          const [id, projectId, state] = params;
          const idx = self.data.sessions.findIndex(s => s.id === id);
          const session = {
            id,
            project_id: projectId,
            state,
            created_at: new Date().toISOString()
          };
          if (idx >= 0) {
            self.data.sessions[idx] = session;
          } else {
            self.data.sessions.push(session);
          }
          self.save();
          return { changes: 1 };
        }

        if (normSql.includes('update sessions set state = ? where id = ?')) {
          const [state, id] = params;
          const session = self.data.sessions.find(s => s.id === id);
          if (session) {
            session.state = state;
            self.save();
          }
          return { changes: session ? 1 : 0 };
        }

        if (normSql.includes('update projects') && normSql.includes('coalesce')) {
          // Handles status/lastMessage update or full project detail update
          if (params.length === 3) {
            // [status, lastMessage, projectId]
            const [status, lastMessage, id] = params;
            const project = self.data.projects.find(p => p.id === id);
            if (project) {
              if (status !== null) project.status = status;
              if (lastMessage !== null) project.last_message = lastMessage;
              project.updated_at = new Date().toISOString();
              self.save();
            }
            return { changes: project ? 1 : 0 };
          } else {
            // [name, stack, status, lastMessage, archived, id]
            const [name, stack, status, lastMessage, archived, id] = params;
            const project = self.data.projects.find(p => p.id === id);
            if (project) {
              if (name !== null) project.name = name;
              if (stack !== null) project.stack = stack;
              if (status !== null) project.status = status;
              if (lastMessage !== null) project.last_message = lastMessage;
              if (archived !== null) project.archived = archived;
              project.updated_at = new Date().toISOString();
              self.save();
            }
            return { changes: project ? 1 : 0 };
          }
        }

        if (normSql.includes('delete from projects')) {
          const [id] = params;
          const initialLength = self.data.projects.length;
          self.data.projects = self.data.projects.filter(p => p.id !== id);
          self.data.sessions = self.data.sessions.filter(s => s.project_id !== id);
          self.save();
          return { changes: initialLength - self.data.projects.length };
        }

        return { changes: 0 };
      },

      get(...params) {
        if (normSql.includes('select * from projects where id = ?')) {
          const [id] = params;
          return self.data.projects.find(p => p.id === id);
        }
        if (normSql.includes('select * from projects where status =') && normSql.includes('stack =')) {
          const [stack] = params;
          return self.data.projects.find(p => p.status === 'draft' && p.stack === stack);
        }
        if (normSql.includes('select id from sessions where id = ?') || normSql.includes('select * from sessions where id = ?')) {
          const [id] = params;
          return self.data.sessions.find(s => s.id === id);
        }
        return undefined;
      },

      all(...params) {
        if (normSql.includes('pragma table_info(projects)')) {
          // Mock structure representing table schema info
          return [
            { name: 'id' },
            { name: 'name' },
            { name: 'stack' },
            { name: 'created_at' },
            { name: 'updated_at' },
            { name: 'status' },
            { name: 'last_message' },
            { name: 'archived' }
          ];
        }

        if (normSql.includes('select p.id') && normSql.includes('inner join sessions')) {
          // List conversations:
          // SELECT p.id, p.name, p.stack, p.status, p.last_message, p.created_at, p.updated_at
          const joined = self.data.projects
            .filter(p => p.archived === 0 && p.status !== 'draft' && self.data.sessions.some(s => s.project_id === p.id))
            .map(p => ({
              id: p.id,
              name: p.name,
              stack: p.stack,
              status: p.status,
              last_message: p.last_message,
              created_at: p.created_at,
              updated_at: p.updated_at
            }));

          // Sort by updated_at desc, then created_at desc
          joined.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at) || new Date(b.created_at) - new Date(a.created_at));
          return joined;
        }

        return [];
      }
    };
  }
}

module.exports = MockDatabase;
