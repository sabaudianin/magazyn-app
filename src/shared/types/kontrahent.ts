export interface Kontrahent {
  id: number
  nazwa: string
  ulica: string | null
  kodPocztowy: string | null
  miejscowosc: string | null
  kraj: string
  nip: string | null
  telefon: string | null
  email: string | null
  uwagi: string | null
  aktywny: boolean
  utworzono: string
  zaktualizowano: string | null
}

export type NewKontrahentInput = Omit<
  Kontrahent,
  'id' | 'aktywny' | 'utworzono' | 'zaktualizowano'
>

export type UpdateKontrahentInput = Partial<NewKontrahentInput>

export interface ListKontrahenciOptions {
  search?: string
  includeInactive?: boolean
}
