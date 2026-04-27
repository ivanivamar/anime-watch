import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!_db) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return _db;
}

export function initDb(): void {
    const dbPath = process.env['DB_PATH'] ?? './data/library.db';
    _db = new Database(dbPath);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    runMigrations(_db);
}

function runMigrations(db: Database.Database): void {
    db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

    const migrationsDir = join(__dirname, 'migrations');
    let files: string[];
    try {
        files = readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .sort();
    } catch {
        // No migrations directory yet
        return;
    }

    const applied = new Set(
        db
            .prepare('SELECT name FROM _migrations')
            .all()
            .map((r: unknown) => (r as { name: string }).name),
    );

    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = readFileSync(join(migrationsDir, file), 'utf8');
        db.exec(sql);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        console.log(`Migration applied: ${file}`);
    }
}
