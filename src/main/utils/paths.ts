import { app } from 'electron'
import { join } from 'path'

export function getDbPath(): string {
  const fileName = app.isPackaged ? 'magazyn.db' : 'magazyn-dev.db'
  return join(app.getPath('userData'), fileName)
}

// W spakowanej appce zasoby (fonty, szablony) trafiają do extraResources i są dostępne pod
// process.resourcesPath; w dev odwołujemy się bezpośrednio do katalogu resources/ w repo.
export function getResourcePath(relativePath: string): string {
  const base = app.isPackaged ? process.resourcesPath : join(__dirname, '../../resources')
  return join(base, relativePath)
}
