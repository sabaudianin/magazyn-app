import { registerAppHandlers } from './app.handlers'
import { registerKontrahenciHandlers } from './kontrahenci.handlers'
import { registerDokumentyHandlers } from './dokumenty.handlers'
import { registerPdfHandlers } from './pdf.handlers'

export function registerAllHandlers(): void {
  registerAppHandlers()
  registerKontrahenciHandlers()
  registerDokumentyHandlers()
  registerPdfHandlers()
}
