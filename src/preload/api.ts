import { ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import type { PingResponse } from '@shared/types/ipc'
import type {
  Kontrahent,
  ListKontrahenciOptions,
  NewKontrahentInput,
  UpdateKontrahentInput
} from '@shared/types/kontrahent'
import type {
  CreateDokumentResult,
  Dokument,
  DokumentListItem,
  DokumentyListFilters,
  NewDokumentInput
} from '@shared/types/dokument'
import type { PdfKind, SaveAsResult } from '@shared/types/pdf'

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
    create: (input: NewDokumentInput): Promise<CreateDokumentResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.create, input),
    retryPdfKarta: (id: number): Promise<Dokument> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.retryPdfKarta, id),
    retryPdfCmr: (id: number): Promise<Dokument> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.retryPdfCmr, id),
    retryExcel: (id: number): Promise<Dokument> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.retryExcel, id),
    list: (filters?: DokumentyListFilters): Promise<DokumentListItem[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.list, filters),
    getById: (id: number): Promise<Dokument> =>
      ipcRenderer.invoke(IPC_CHANNELS.dokumenty.getById, id)
  },
  pdf: {
    open: (dokumentId: number, kind: PdfKind): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.pdf.open, dokumentId, kind),
    saveAs: (dokumentId: number, kind: PdfKind): Promise<SaveAsResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.pdf.saveAs, dokumentId, kind)
  }
}

export type Api = typeof api
