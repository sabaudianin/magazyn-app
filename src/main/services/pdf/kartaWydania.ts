import { buildKartaPdf } from './pdfBase'
import type { Dokument } from '@shared/types/dokument'

export function generateKartaWydania(dokument: Dokument): Promise<Buffer> {
  return buildKartaPdf(dokument, { tytul: 'Karta Wydania', signatureLabels: ['Wydał', 'Odebrał'] })
}
