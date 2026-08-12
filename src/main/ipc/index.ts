import type Database from 'better-sqlite3'
import { registerAppHandlers } from './app.handlers'
import { registerKontrahenciHandlers } from './kontrahenci.handlers'

export function registerAllHandlers(_db: Database.Database): void {
  registerAppHandlers()
  registerKontrahenciHandlers()
}
