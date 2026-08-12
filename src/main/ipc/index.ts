import type Database from 'better-sqlite3'
import { registerAppHandlers } from './app.handlers'

export function registerAllHandlers(_db: Database.Database): void {
  registerAppHandlers()
}
