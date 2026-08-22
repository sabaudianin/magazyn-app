import { dialog, shell } from 'electron'
import { copyFile } from 'node:fs/promises'
import { AppError } from '../../utils/errors'
import { getDokument } from '../dokumentyService'
import type { Dokument } from '@shared/types/dokument'
import type { PdfKind, SaveAsResult } from '@shared/types/pdf'

// dokumentId+kind (nie surowa ścieżka) — main sam odczytuje pdf_karta_path/pdf_cmr_path z DB,
// więc renderer nigdy nie przekazuje ścieżki pliku przez IPC i nie ma potrzeby jej walidować.
function requirePdfPath(dokument: Dokument, kind: PdfKind): string {
  const path = kind === 'karta' ? dokument.pdfKartaPath : dokument.pdfCmrPath
  if (!path) {
    throw new AppError(
      'PDF_NOT_GENERATED',
      `Plik PDF (${kind === 'karta' ? 'karta' : 'CMR'}) dla tego dokumentu jeszcze nie istnieje`
    )
  }
  return path
}

export async function openPdf(dokumentId: number, kind: PdfKind): Promise<void> {
  const path = requirePdfPath(getDokument(dokumentId), kind)
  const errorMessage = await shell.openPath(path)
  if (errorMessage) {
    throw new AppError('PDF_OPEN_FAILED', `Nie udało się otworzyć pliku: ${errorMessage}`)
  }
}

export async function savePdfAs(dokumentId: number, kind: PdfKind): Promise<SaveAsResult> {
  const dokument = getDokument(dokumentId)
  const sourcePath = requirePdfPath(dokument, kind)
  const suffix = kind === 'cmr' ? '_cmr' : ''
  const suggestedName = `${dokument.numer.replace(/\//g, '_')}${suffix}.pdf`

  const result = await dialog.showSaveDialog({
    defaultPath: suggestedName,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (result.canceled || !result.filePath) {
    return { saved: false }
  }
  try {
    await copyFile(sourcePath, result.filePath)
  } catch {
    throw new AppError(
      'PDF_SAVE_FAILED',
      'Nie udało się zapisać pliku — źródłowy PDF mógł zostać usunięty lub przeniesiony'
    )
  }
  return { saved: true, path: result.filePath }
}
