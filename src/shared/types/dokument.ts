import type { Kontrahent } from './kontrahent'

export type DokumentTyp = 'PZ' | 'WZ'

export interface NewPozycjaInput {
  opis: string
  ilosc: number
  jednostka: string
  waga: number | null
}

export interface NewDokumentInput {
  typ: DokumentTyp
  data: string
  nadawcaId: number
  odbiorcaId: number
  dokumentyTowarzyszace: string | null
  pozycje: NewPozycjaInput[]
}

export interface Pozycja extends NewPozycjaInput {
  id: number
  lp: number
}

export interface Dokument {
  id: number
  typ: DokumentTyp
  numer: string
  data: string
  nadawca: Kontrahent
  odbiorca: Kontrahent
  dokumentyTowarzyszace: string | null
  pozycje: Pozycja[]
  pdfKartaPath: string | null
  pdfCmrPath: string | null
  excelZapisano: boolean
  utworzono: string
}
