import { getDb } from '../db/connection'
import type { StanMagazynowyItem } from '@shared/types/stanMagazynowy'

interface StanRow {
  opis: string
  jednostka: string
  przyjeto: number
  wydano: number
}

// COLLATE NOCASE na obu kolumnach grupowania — "Karton" i "karton" wpisane w różnych dokumentach
// to ta sama pozycja magazynowa, nie dwie osobne. MIN(p.opis)/MIN(p.jednostka) (nie gołe p.opis) —
// bez agregatu SQLite zwraca pisownię z dowolnego wiersza grupy (w praktyce zależną od kolejności
// skanowania), więc wyświetlana etykieta potrafiłaby się zmieniać przy każdym nowym dokumencie;
// MIN() daje deterministyczny wybór niezależny od kolejności wstawiania.
const STAN_QUERY = `
  SELECT MIN(p.opis) AS opis, MIN(p.jednostka) AS jednostka,
    SUM(CASE WHEN d.typ = 'PZ' THEN p.ilosc ELSE 0 END) AS przyjeto,
    SUM(CASE WHEN d.typ = 'WZ' THEN p.ilosc ELSE 0 END) AS wydano
  FROM PozycjeDokumentu p
  JOIN Dokumenty d ON d.id = p.dokument_id
  GROUP BY p.opis COLLATE NOCASE, p.jednostka COLLATE NOCASE
  ORDER BY MIN(p.opis) COLLATE NOCASE
`

export function getStanMagazynowy(): StanMagazynowyItem[] {
  const rows = getDb().prepare(STAN_QUERY).all() as StanRow[]
  return rows.map((row) => ({
    opis: row.opis,
    jednostka: row.jednostka,
    przyjeto: row.przyjeto,
    wydano: row.wydano,
    stan: row.przyjeto - row.wydano
  }))
}
