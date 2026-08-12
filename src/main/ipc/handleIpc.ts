import { ipcMain } from 'electron'
import { toErrorPayload } from '../utils/errors'

export function handleIpc<Args extends unknown[], Result>(
  channel: string,
  fn: (...args: Args) => Result | Promise<Result>
): void {
  ipcMain.handle(channel, async (_event, ...args: Args) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw new Error(JSON.stringify(toErrorPayload(error)))
    }
  })
}
