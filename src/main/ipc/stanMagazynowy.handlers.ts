import { IPC_CHANNELS } from '@shared/ipc-channels'
import { handleIpc } from './handleIpc'
import { getStanMagazynowy } from '../services/stanMagazynowyService'

export function registerStanMagazynowyHandlers(): void {
  handleIpc(IPC_CHANNELS.stanMagazynowy.list, () => getStanMagazynowy())
}
