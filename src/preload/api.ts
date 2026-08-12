import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { PingResponse } from '@shared/types/ipc'
import type {
  Kontrahent,
  ListKontrahenciOptions,
  NewKontrahentInput,
  UpdateKontrahentInput
} from '@shared/types/kontrahent'
import type { Dokument, NewDokumentInput } from '@shared/types/dokument'

export const api = {
  app: {
    ping: (): Promise<PingResponse> => ipcRenderer.invoke(IPC_CHANNELS.app.ping)
  },
  kontrahenci: {
    list: (opts?: ListKontrahenciOptions): Promise<Kontrahent[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.kontrahenci.list, opts),
    get: (id: number): Promise<Kontrahent | undefined> =>
      ipcRenderer.invoke(IPC_CHANNELS.kontrahenci.get, id),
    create: (input: NewKontrahentInput): Promise<Kontrahent> =>
      ipcRenderer.invoke(IPC_CHANNELS.kontrahenci.create, input),
    update: (id: number, input: UpdateKontrahentInput): Promise<Kontrahent> =>
      ipcRenderer.invoke(IPC_CHANNELS.kontrahenci.update, id, input),
    deactivate: (id: number): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.kontrahenci.deactivate, id)
  },
  dokumenty: {
    create: (input: NewDokumentInput): Promise<Dokument> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.create, input)
  }
}

export type Api = typeof api
