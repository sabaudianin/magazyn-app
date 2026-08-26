import type { z } from 'zod'
import { NewDokumentInputSchema } from '@shared/schemas/dokument'

// nadawca/odbiorca są zarządzane osobno jako obiekty Kontrahent (nie same id) — picker
// potrzebuje pełnego rekordu do wyświetlenia nazwy, więc nie przechodzą przez ten resolver.
// numerRejestracyjny dotyczy tylko przepływu "Wydaj" (WydajPage) — ten formularz zawsze wysyła
// go jako null wprost w onSubmit, więc też nie jest tu polem formularza.
export const DokumentFormSchema = NewDokumentInputSchema.omit({
  nadawcaId: true,
  odbiorcaId: true,
  numerRejestracyjny: true
})

export type DokumentFormValues = z.input<typeof DokumentFormSchema>
export type DokumentFormOutput = z.output<typeof DokumentFormSchema>
