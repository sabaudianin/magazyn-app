import { IPC_CHANNELS } from '@shared/ipc-channels'
import { NewDokumentInputSchema } from '@shared/schemas/dokument'
import { handleIpc } from './handleIpc'
import { parseOrThrow } from '../utils/validate'
import { createDokument } from '../services/dokumentyService'

export function registerDokumentyHandlers(): void {
  handleIpc(IPC_CHANNELS.dokumenty.create, (input: unknown) =>
    createDokument(parseOrThrow(NewDokumentInputSchema, input))
  )
}
