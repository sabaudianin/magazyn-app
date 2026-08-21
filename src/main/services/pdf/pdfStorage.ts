import { app } from 'electron'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Dokument } from '@shared/types/dokument'

// Rok bierzemy z numeru (TYP/NNN/ROK), a nie ponownie z daty dokumentu — numer już go zawiera,
// więc unikamy powielania logiki parsowania roku z dokumentyService.
function dokumentPdfDir(dokument: Dokument): { dir: string; safeNumer: string } {
  const rok = dokument.numer.split('/')[2]
  const safeNumer = dokument.numer.replace(/\//g, '_')
  return { dir: join(app.getPath('userData'), 'dokumenty', dokument.typ, rok), safeNumer }
}

export function getKartaPdfPath(dokument: Dokument): string {
  const { dir, safeNumer } = dokumentPdfDir(dokument)
  return join(dir, `${safeNumer}.pdf`)
}

export function getCmrPdfPath(dokument: Dokument): string {
  const { dir, safeNumer } = dokumentPdfDir(dokument)
  return join(dir, `${safeNumer}_cmr.pdf`)
}

export function savePdfBytes(filePath: string, bytes: Uint8Array): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, bytes)
}
