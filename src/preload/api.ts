import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { PingResponse } from '@shared/types/ipc'

export const api = {
  app: {
    ping: (): Promise<PingResponse> => ipcRenderer.invoke(IPC_CHANNELS.app.ping)
  }
}

export type Api = typeof api
