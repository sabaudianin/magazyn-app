import { z } from 'zod'
import { emptyToNull } from '@shared/schemas/common'

// Formularz "Wydaj" tworzy dokument WZ z dokładnie jedną pozycją (opis/jednostka przychodzą ze
// stanu magazynowego, nie są tu polami formularza) — nadawca/odbiorca zarządzane osobno jak w
// dokumentFormSchema.ts. numerRejestracyjny jest tu wymagany (w odróżnieniu od bazowego
// NewDokumentInputSchema, gdzie jest nullable) — bez niego nie ma sensu wywoływać tego przepływu,
// bo cały jego cel to zebranie numeru auta do CMR.
export const WydajFormSchema = z.object({
  data: z.iso.date('Nieprawidłowa data (oczekiwany format RRRR-MM-DD)'),
  ilosc: z.number({ error: 'Ilość jest wymagana' }).positive('Ilość musi być większa od zera'),
  numerRejestracyjny: z.string().trim().min(1, 'Numer auta jest wymagany'),
  dokumentyTowarzyszace: z.preprocess(emptyToNull, z.string().trim().nullable())
})

export type WydajFormValues = z.input<typeof WydajFormSchema>
export type WydajFormOutput = z.output<typeof WydajFormSchema>
