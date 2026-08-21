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

// step odpowiada efektowi ubocznemu zapisu dokumentu (karta PDF / CMR PDF / Excel), który się nie
// powiódł. severity 'info' oznacza stan oczekiwany (np. szablon CMR jeszcze nieskonfigurowany),
// nie błąd — UI nie powinien go pokazywać jako alarmujący ani oferować przycisku "Ponów".
export interface SaveWarning {
  step: 'pdfKarta' | 'pdfCmr' | 'excel'
  severity: 'error' | 'info'
  message: string
}

export interface CreateDokumentResult {
  dokument: Dokument
  warnings: SaveWarning[]
}
