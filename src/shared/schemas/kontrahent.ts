import { z } from 'zod'

// Formularze HTML wysyłają puste pole jako '' — traktujemy to jak brak wartości (null),
// zanim zajmie się nim właściwa walidacja.
const emptyToNull = (val: unknown): unknown =>
  typeof val === 'string' && val.trim() === '' ? null : val

const optionalText = z.preprocess(emptyToNull, z.string().trim().min(1).nullable())
const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().trim().email('Nieprawidłowy adres e-mail').nullable()
)
const optionalNote = z.preprocess(emptyToNull, z.string().nullable())

export const KontrahentInputSchema = z.object({
  nazwa: z.string().trim().min(1, 'Nazwa jest wymagana'),
  ulica: optionalText,
  kodPocztowy: optionalText,
  miejscowosc: optionalText,
  kraj: z.string().trim().min(1, 'Kraj jest wymagany'),
  nip: optionalText,
  telefon: optionalText,
  email: optionalEmail,
  uwagi: optionalNote
})

export const KontrahentUpdateSchema = KontrahentInputSchema.partial()

export const ListKontrahenciOptionsSchema = z.object({
  search: z.string().trim().min(1).optional(),
  includeInactive: z.boolean().optional()
})
