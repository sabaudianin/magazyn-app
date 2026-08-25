import { app, ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, (): string => app.getVersion())
}
