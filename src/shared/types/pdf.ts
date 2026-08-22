export type PdfKind = 'karta' | 'cmr'

export interface SaveAsResult {
  saved: boolean
  path?: string
}
