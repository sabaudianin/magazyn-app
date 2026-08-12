import Database from 'better-sqlite3'
import { getDbPath } from '../utils/paths'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath())
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}
