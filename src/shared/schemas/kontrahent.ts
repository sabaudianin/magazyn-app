import { z } from 'zod'

const optionalText = z.string().trim().min(1).nullable()

export const KontrahentInputSchema = z.object({
  nazwa: z.string().trim().min(1, 'Nazwa jest wymagana'),
  ulica: optionalText,
  kodPocztowy: optionalText,
  miejscowosc: optionalText,
  kraj: z.string().trim().min(1, 'Kraj jest wymagany'),
  nip: optionalText,
  telefon: optionalText,
  email: z.string().trim().email('Nieprawidłowy adres e-mail').nullable(),
  uwagi: z.string().nullable()
})

export const KontrahentUpdateSchema = KontrahentInputSchema.partial()

export const ListKontrahenciOptionsSchema = z.object({
  search: z.string().trim().min(1).optional(),
  includeInactive: z.boolean().optional()
})
