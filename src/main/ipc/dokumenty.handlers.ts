import { IPC_CHANNELS } from '@shared/ipc-channels'
import { NewDokumentInputSchema, DokumentyListFiltersSchema } from '@shared/schemas/dokument'
import { IdSchema } from '@shared/schemas/common'
import { handleIpc } from './handleIpc'
import { parseOrThrow } from '../utils/validate'
import {
  createDokumentZDokumentami,
  retryPdfKarta,
  retryPdfCmr,
  retryExcel,
  listDokumenty,
  getDokument
} from '../services/dokumentyService'

export function registerDokumentyHandlers(): void {
  handleIpc(IPC_CHANNELS.dokumenty.create, (input: unknown) =>
    createDokumentZDokumentami(parseOrThrow(NewDokumentInputSchema, input))
  )
  handleIpc(IPC_CHANNELS.dokumenty.retryPdfKarta, (id: unknown) =>
    retryPdfKarta(parseOrThrow(IdSchema, id))
  )
  handleIpc(IPC_CHANNELS.dokumenty.retryPdfCmr, (id: unknown) =>
    retryPdfCmr(parseOrThrow(IdSchema, id))
  )
  handleIpc(IPC_CHANNELS.dokumenty.retryExcel, (id: unknown) =>
    retryExcel(parseOrThrow(IdSchema, id))
  )
  handleIpc(IPC_CHANNELS.dokumenty.list, (filters: unknown = {}) =>
    listDokumenty(parseOrThrow(DokumentyListFiltersSchema, filters))
  )
  handleIpc(IPC_CHANNELS.dokumenty.getById, (id: unknown) =>
    getDokument(parseOrThrow(IdSchema, id))
  )
}
