import { buildKartaPdf } from './pdfBase'
import type { Dokument } from '@shared/types/dokument'

export function generateKartaPrzyjecia(dokument: Dokument): Promise<Buffer> {
  return buildKartaPdf(dokument, {
    tytul: 'Karta Przyjęcia',
    signatureLabels: ['Wydał', 'Przyjął']
  })
}
