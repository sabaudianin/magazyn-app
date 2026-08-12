import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { PingResponse } from '@shared/types/ipc'

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.app.ping, (): PingResponse => ({
    message: 'pong',
    timestamp: new Date().toISOString()
  }))
}
