import { registerAppHandlers } from './app.handlers'
import { registerKontrahenciHandlers } from './kontrahenci.handlers'

export function registerAllHandlers(): void {
  registerAppHandlers()
  registerKontrahenciHandlers()
}
