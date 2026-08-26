// Bez osobnej tabeli produktów pozycja magazynowa to (opis, jednostka) z PozycjeDokumentu —
// stan liczony jako suma ilości przyjętych na PZ minus suma wydanych na WZ dla tej pary.
export interface StanMagazynowyItem {
  opis: string
  jednostka: string
  przyjeto: number
  wydano: number
  stan: number
}
