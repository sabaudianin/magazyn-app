import type Database from 'better-sqlite3'
import { migrations } from './migrations'

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const appliedVersions = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => (row as { version: number }).version)
  )

  const insertMigration = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) continue

    const applyMigration = db.transaction(() => {
      db.exec(migration.sql)
      insertMigration.run(migration.version, migration.name)
    })
    applyMigration()
  }
}
