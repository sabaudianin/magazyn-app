import { z } from 'zod'

export const IdSchema = z.number().int().positive()

// Formularze HTML wysyłają puste pole jako '' — traktujemy to jak brak wartości (null),
// zanim zajmie się nim właściwa walidacja pola.
export const emptyToNull = (val: unknown): unknown =>
  typeof val === 'string' && val.trim() === '' ? null : val
