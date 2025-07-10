import Database from 'better-sqlite3';
import { LoreConfig } from '../core/types';
import { LoreErrorHandler } from '../core/errors';

export class LoreDatabase {
  private db: Database.Database;

  constructor(config: LoreConfig) {
    try {
      this.db = new Database(config.database.connectionString);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');
      this.db.pragma('foreign_keys = ON');
    } catch (error) {
      throw LoreErrorHandler.create({
        type: 'database',
        message: 'Failed to initialize database',
        context: `Connection string: ${config.database.connectionString}`,
        suggestion: 'Check database file permissions and path',
        agent: 'database',
        canRetry: true,
      });
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.migrate();
    } catch (error) {
      throw LoreErrorHandler.create({
        type: 'database',
        message: 'Failed to initialize database schema',
        context: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check database migrations and schema definitions',
        agent: 'database',
        canRetry: true,
      });
    }
  }

  private async migrate(): Promise<void> {
    const migrations = [
      this.createNotesTable(),
      this.createSourcesTable(),
      this.createTagsTable(),
      this.createNoteTagsTable(),
      this.createContentTypesTable(),
      this.createNoteLinksTable(),
      this.createResearchSessionsTable(),
      this.createAuditLogTable(),
      this.createIndices(),
    ];

    this.db.transaction(() => {
      for (const migration of migrations) {
        this.db.exec(migration);
      }
    })();
  }

  private createNotesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source_id TEXT NOT NULL,
        confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
        note_type TEXT CHECK (note_type IN ('atomic', 'synthesis', 'question')),
        FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
      );
    `;
  }

  private createSourcesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        title TEXT,
        author TEXT,
        content_date TIMESTAMP,
        scraped_at TIMESTAMP NOT NULL,
        scraper_tool TEXT NOT NULL,
        extraction_method TEXT,
        raw_content TEXT,
        confidence REAL CHECK (confidence >= 0 AND confidence <= 1) DEFAULT 0.5
      );
    `;
  }

  private createTagsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        tag_type TEXT CHECK (tag_type IN ('content', 'quality', 'domain', 'method'))
      );
    `;
  }

  private createNoteTagsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT,
        tag_id INTEGER,
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      );
    `;
  }

  private createContentTypesTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS content_types (
        note_id TEXT,
        type TEXT CHECK (type IN ('FACT', 'OPINION', 'DATA', 'CLAIM', 'QUESTION')),
        PRIMARY KEY (note_id, type),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );
    `;
  }

  private createNoteLinksTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS note_links (
        from_note_id TEXT,
        to_note_id TEXT,
        link_type TEXT CHECK (link_type IN ('supports', 'contradicts', 'extends', 'questions')),
        strength REAL CHECK (strength >= 0 AND strength <= 1) DEFAULT 0.5,
        PRIMARY KEY (from_note_id, to_note_id),
        FOREIGN KEY (from_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (to_note_id) REFERENCES notes(id) ON DELETE CASCADE
      );
    `;
  }

  private createResearchSessionsTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS research_sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        depth_limit INTEGER DEFAULT 2,
        cost_estimate REAL DEFAULT 0,
        cost_limit REAL DEFAULT 15,
        status TEXT CHECK (status IN ('running', 'completed', 'failed', 'paused')) DEFAULT 'running'
      );
    `;
  }

  private createAuditLogTable(): string {
    return `
      CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id TEXT,
        agent_id TEXT,
        action TEXT NOT NULL,
        tool TEXT,
        details TEXT, -- JSON
        duration REAL,
        cost REAL,
        tokens_used INTEGER,
        FOREIGN KEY (session_id) REFERENCES research_sessions(id) ON DELETE CASCADE
      );
    `;
  }

  private createIndices(): string {
    return `
      CREATE INDEX IF NOT EXISTS idx_notes_source ON notes(source_id);
      CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);
      CREATE INDEX IF NOT EXISTS idx_notes_confidence ON notes(confidence);
      CREATE INDEX IF NOT EXISTS idx_sources_scraped ON sources(scraped_at);
      CREATE INDEX IF NOT EXISTS idx_sources_url ON sources(url);
      CREATE INDEX IF NOT EXISTS idx_note_links_from ON note_links(from_note_id);
      CREATE INDEX IF NOT EXISTS idx_note_links_to ON note_links(to_note_id);
      CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_log(session_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_research_sessions_started ON research_sessions(started_at);
    `;
  }

  // Transaction wrapper for complex operations
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  // Prepared statement helpers
  prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  // Health check
  healthCheck(): boolean {
    try {
      this.db.exec('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  // Close database connection
  close(): void {
    this.db.close();
  }

  // Backup database
  backup(backupPath: string): void {
    this.db.backup(backupPath);
  }

  // Get database instance for direct access (use carefully)
  getDb(): Database.Database {
    return this.db;
  }
}