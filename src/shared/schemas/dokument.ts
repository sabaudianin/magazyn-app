import { z } from 'zod'
import { emptyToNull, IdSchema } from './common'

export const NewPozycjaInputSchema = z.object({
  opis: z.string().trim().min(1, 'Opis jest wymagany'),
  ilosc: z.number({ error: 'Ilość jest wymagana' }).positive('Ilość musi być większa od zera'),
  jednostka: z.string().trim().min(1, 'Jednostka jest wymagana'),
  waga: z.preprocess(emptyToNull, z.number().positive('Waga musi być większa od zera').nullable())
})

export const NewDokumentInputSchema = z.object({
  typ: z.enum(['PZ', 'WZ']),
  data: z.iso.date('Nieprawidłowa data dokumentu (oczekiwany format RRRR-MM-DD)'),
  nadawcaId: IdSchema,
  odbiorcaId: IdSchema,
  dokumentyTowarzyszace: z.preprocess(emptyToNull, z.string().trim().nullable()),
  numerRejestracyjny: z.preprocess(emptyToNull, z.string().trim().nullable()),
  pozycje: z.array(NewPozycjaInputSchema).min(1, 'Dokument musi mieć co najmniej jedną pozycję')
})

// Białe znaki traktujemy jak brak filtra (undefined), nie jak błąd walidacji — w odróżnieniu od
// emptyToNull (common.ts) zwraca undefined, nie null, żeby zgadzało się z opcjonalnym (nie
// nullable) polem `search` w DokumentyListFilters.
const emptyToUndefined = (val: unknown): unknown =>
  typeof val === 'string' && val.trim() === '' ? undefined : val

export const DokumentyListFiltersSchema = z.object({
  typ: z.enum(['PZ', 'WZ']).optional(),
  dataOd: z.iso.date('Nieprawidłowa data (oczekiwany format RRRR-MM-DD)').optional(),
  dataDo: z.iso.date('Nieprawidłowa data (oczekiwany format RRRR-MM-DD)').optional(),
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional())
})
