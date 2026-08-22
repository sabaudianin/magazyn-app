import { z } from 'zod'
import { IPC_CHANNELS } from '@shared/ipc-channels'
import { IdSchema } from '@shared/schemas/common'
import { handleIpc } from './handleIpc'
import { parseOrThrow } from '../utils/validate'
import { openPdf, savePdfAs } from '../services/pdf/pdfFileActions'

const PdfKindSchema = z.enum(['karta', 'cmr'])

export function registerPdfHandlers(): void {
  handleIpc(IPC_CHANNELS.pdf.open, (id: unknown, kind: unknown) =>
    openPdf(parseOrThrow(IdSchema, id), parseOrThrow(PdfKindSchema, kind))
  )
  handleIpc(IPC_CHANNELS.pdf.saveAs, (id: unknown, kind: unknown) =>
    savePdfAs(parseOrThrow(IdSchema, id), parseOrThrow(PdfKindSchema, kind))
  )
}
