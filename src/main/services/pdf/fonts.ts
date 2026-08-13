import fs from 'node:fs'
import fontkit from '@pdf-lib/fontkit'
import type { PDFDocument, PDFFont } from 'pdf-lib'
import { getResourcePath } from '../../utils/paths'

export interface PolishFonts {
  regular: PDFFont
  bold: PDFFont
}

let regularBytes: Buffer | null = null
let boldBytes: Buffer | null = null

function loadRegularBytes(): Buffer {
  regularBytes ??= fs.readFileSync(getResourcePath('fonts/DejaVuSans.ttf'))
  return regularBytes
}

function loadBoldBytes(): Buffer {
  boldBytes ??= fs.readFileSync(getResourcePath('fonts/DejaVuSans-Bold.ttf'))
  return boldBytes
}

// DejaVu Sans ma pełne pokrycie polskich znaków (ą/ć/ę/ł/ń/ó/ś/ź/ż), których standardowe
// fonty pdf-lib (WinAnsi) nie obsługują. registerFontkit jest wymagane per-dokument.
export async function loadPolishFonts(pdfDoc: PDFDocument): Promise<PolishFonts> {
  pdfDoc.registerFontkit(fontkit)
  const [regular, bold] = await Promise.all([
    pdfDoc.embedFont(loadRegularBytes(), { subset: true }),
    pdfDoc.embedFont(loadBoldBytes(), { subset: true })
  ])
  return { regular, bold }
}
