import { z } from 'zod'
import { emptyToNull, IdSchema } from './common'

export const NewPozycjaInputSchema = z.object({
  opis: z.string().trim().min(1, 'Opis jest wymagany'),
  ilosc: z.number().positive('Ilość musi być większa od zera'),
  jednostka: z.string().trim().min(1, 'Jednostka jest wymagana'),
  waga: z.preprocess(emptyToNull, z.number().positive('Waga musi być większa od zera').nullable())
})

export const NewDokumentInputSchema = z.object({
  typ: z.enum(['PZ', 'WZ']),
  data: z.iso.date('Nieprawidłowa data dokumentu (oczekiwany format RRRR-MM-DD)'),
  nadawcaId: IdSchema,
  odbiorcaId: IdSchema,
  dokumentyTowarzyszace: z.preprocess(emptyToNull, z.string().trim().nullable()),
  pozycje: z.array(NewPozycjaInputSchema).min(1, 'Dokument musi mieć co najmniej jedną pozycję')
})
