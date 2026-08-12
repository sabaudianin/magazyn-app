import { IPC_CHANNELS } from '@shared/ipc-channels'
import {
  KontrahentInputSchema,
  KontrahentUpdateSchema,
  ListKontrahenciOptionsSchema
} from '@shared/schemas/kontrahent'
import type { ListKontrahenciOptions } from '@shared/types/kontrahent'
import { handleIpc } from './handleIpc'
import { parseOrThrow } from '../utils/validate'
import {
  createKontrahent,
  deactivateKontrahent,
  getKontrahent,
  listKontrahenci,
  updateKontrahent
} from '../services/kontrahenciService'

export function registerKontrahenciHandlers(): void {
  handleIpc(IPC_CHANNELS.kontrahenci.list, (opts: ListKontrahenciOptions = {}) =>
    listKontrahenci(parseOrThrow(ListKontrahenciOptionsSchema, opts))
  )

  handleIpc(IPC_CHANNELS.kontrahenci.get, (id: number) => getKontrahent(id))

  handleIpc(IPC_CHANNELS.kontrahenci.create, (input: unknown) =>
    createKontrahent(parseOrThrow(KontrahentInputSchema, input))
  )

  handleIpc(IPC_CHANNELS.kontrahenci.update, (id: number, input: unknown) =>
    updateKontrahent(id, parseOrThrow(KontrahentUpdateSchema, input))
  )

  handleIpc(IPC_CHANNELS.kontrahenci.deactivate, (id: number) => deactivateKontrahent(id))
}
