import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Dokument } from '@shared/types/dokument'

// Rok bierzemy z numeru (TYP/NNN/ROK), a nie ponownie z daty dokumentu — numer już go zawiera,
// więc unikamy powielania logiki parsowania roku z dokumentyService.
export function getKartaPdfPath(dokument: Dokument): string {
  const rok = dokument.numer.split('/')[2]
  const safeNumer = dokument.numer.replace(/\//g, '_')
  return join(app.getPath('userData'), 'dokumenty', dokument.typ, rok, `${safeNumer}.pdf`)
}

export function savePdfBytes(filePath: string, bytes: Uint8Array): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, bytes)
}
