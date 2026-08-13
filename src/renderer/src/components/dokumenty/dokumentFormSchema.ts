import type { z } from 'zod'
import { NewDokumentInputSchema } from '@shared/schemas/dokument'

// nadawca/odbiorca są zarządzane osobno jako obiekty Kontrahent (nie same id) — picker
// potrzebuje pełnego rekordu do wyświetlenia nazwy, więc nie przechodzą przez ten resolver.
export const DokumentFormSchema = NewDokumentInputSchema.omit({
  nadawcaId: true,
  odbiorcaId: true
})

export type DokumentFormValues = z.input<typeof DokumentFormSchema>
export type DokumentFormOutput = z.output<typeof DokumentFormSchema>
