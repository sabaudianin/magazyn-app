import { app } from 'electron'
import { join } from 'path'

export function getDbPath(): string {
  const fileName = app.isPackaged ? 'magazyn.db' : 'magazyn-dev.db'
  return join(app.getPath('userData'), fileName)
}
