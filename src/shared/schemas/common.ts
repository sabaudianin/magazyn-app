import { z } from 'zod'

export const IdSchema = z.number().int().positive()

// Formularze HTML wysyłają puste pole tekstowe jako '', a puste pole liczbowe
// (react-hook-form, { valueAsNumber: true }) jako NaN — oba traktujemy jak brak wartości (null),
// zanim zajmie się nim właściwa walidacja pola.
export const emptyToNull = (val: unknown): unknown => {
  if (typeof val === 'string' && val.trim() === '') return null
  if (typeof val === 'number' && Number.isNaN(val)) return null
  return val
}
