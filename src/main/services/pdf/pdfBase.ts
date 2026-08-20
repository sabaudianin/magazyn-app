import { PDFDocument, PageSizes, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage } from 'pdf-lib'
import { loadPolishFonts } from './fonts'
import type { Dokument, Pozycja } from '@shared/types/dokument'
import type { Kontrahent } from '@shared/types/kontrahent'

export const PAGE_MARGIN = 50
export const LINE_HEIGHT = 16
const GRAY_LINE = rgb(0.6, 0.6, 0.6)
const GRAY_TEXT = rgb(0.35, 0.35, 0.35)

export interface PdfContext {
  doc: PDFDocument
  page: PDFPage
  fonts: { regular: PDFFont; bold: PDFFont }
  width: number
  height: number
}

export async function createA4Document(): Promise<PdfContext> {
  const doc = await PDFDocument.create()
  const page = doc.addPage(PageSizes.A4)
  const fonts = await loadPolishFonts(doc)
  const { width, height } = page.getSize()
  return { doc, page, fonts, width, height }
}

// page.drawText's wbudowany maxWidth łamie tekst wizualnie, ale nie mówi ile linii z tego wyszło —
// bez tego kursor Y po takim wywołaniu przesuwałby się tylko o jedną linię, nachodząc na kolejny
// blok. Łamiemy tekst sami, żeby dokładnie znać liczbę linii i poprawnie przesunąć kursor.
// Eksportowane, bo tej samej logiki (i tego samego PDFFont z fontkit) potrzebuje też wypełnianie
// szablonu CMR (services/pdf/cmr) — tam nie ma PdfContext, tylko pojedyncza strona załadowanego PDF.
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']

  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (current === '' || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  lines.push(current)
  return lines
}

export function drawWrappedTextOnPage(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: {
    font: PDFFont
    size: number
    maxWidth: number
    color?: ReturnType<typeof rgb>
    lineHeight?: number
  }
): number {
  const lines = wrapText(text, options.font, options.size, options.maxWidth)
  const lineHeight = options.lineHeight ?? LINE_HEIGHT
  let cursorY = y
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: cursorY,
      size: options.size,
      font: options.font,
      color: options.color
    })
    cursorY -= lineHeight
  }
  return cursorY
}

function drawWrappedText(
  ctx: PdfContext,
  text: string,
  x: number,
  y: number,
  options: { font: PDFFont; size: number; maxWidth: number; color?: ReturnType<typeof rgb> }
): number {
  return drawWrappedTextOnPage(ctx.page, text, x, y, options)
}

export function drawDocumentHeader(
  ctx: PdfContext,
  info: { tytul: string; numer: string; data: string },
  y: number
): number {
  const { page, fonts, width } = ctx
  page.drawText(info.tytul, { x: PAGE_MARGIN, y, size: 18, font: fonts.bold })

  const numerText = `Nr: ${info.numer}`
  const numerWidth = fonts.regular.widthOfTextAtSize(numerText, 11)
  page.drawText(numerText, {
    x: width - PAGE_MARGIN - numerWidth,
    y: y + 3,
    size: 11,
    font: fonts.regular
  })

  let cursorY = y - LINE_HEIGHT * 1.5
  page.drawText(`Data: ${info.data}`, { x: PAGE_MARGIN, y: cursorY, size: 11, font: fonts.regular })
  cursorY -= LINE_HEIGHT

  page.drawLine({
    start: { x: PAGE_MARGIN, y: cursorY + 6 },
    end: { x: width - PAGE_MARGIN, y: cursorY + 6 },
    thickness: 0.75,
    color: GRAY_LINE
  })

  return cursorY - LINE_HEIGHT * 0.5
}

// Reużywane też przez CMR (services/pdf/cmr/generateCmr.ts), żeby format "kod miejscowość"
// nie rozjechał się między dwoma niezależnymi implementacjami.
export function formatAddressLine(kontrahent: Kontrahent): string {
  return [kontrahent.kodPocztowy, kontrahent.miejscowosc].filter(Boolean).join(' ')
}

export function drawKontrahentBlock(
  ctx: PdfContext,
  label: string,
  kontrahent: Kontrahent,
  x: number,
  y: number,
  boxWidth: number
): number {
  const { page, fonts } = ctx
  let cursorY = y

  page.drawText(label, { x, y: cursorY, size: 10, font: fonts.bold, color: GRAY_TEXT })
  cursorY -= LINE_HEIGHT

  cursorY = drawWrappedText(ctx, kontrahent.nazwa, x, cursorY, {
    font: fonts.bold,
    size: 11,
    maxWidth: boxWidth
  })

  const addressLine = formatAddressLine(kontrahent)
  const lines = [kontrahent.ulica, addressLine || null, kontrahent.kraj].filter(
    (line): line is string => Boolean(line)
  )
  for (const line of lines) {
    cursorY = drawWrappedText(ctx, line, x, cursorY, {
      font: fonts.regular,
      size: 10,
      maxWidth: boxWidth
    })
  }

  if (kontrahent.nip) {
    page.drawText(`NIP: ${kontrahent.nip}`, { x, y: cursorY, size: 10, font: fonts.regular })
    cursorY -= LINE_HEIGHT
  }

  return cursorY
}

const COL = {
  lp: 0,
  opis: 30,
  ilosc: 300,
  jednostka: 370,
  waga: 440
}

export function drawLineItemsTable(ctx: PdfContext, pozycje: Pozycja[], y: number): number {
  const { page, fonts, width } = ctx
  const left = PAGE_MARGIN
  const right = width - PAGE_MARGIN
  let cursorY = y

  const headerY = cursorY
  page.drawText('Lp.', {
    x: left + COL.lp,
    y: headerY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  page.drawText('Opis towaru', {
    x: left + COL.opis,
    y: headerY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  page.drawText('Ilość', {
    x: left + COL.ilosc,
    y: headerY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  page.drawText('J.m.', {
    x: left + COL.jednostka,
    y: headerY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  page.drawText('Waga (kg)', {
    x: left + COL.waga,
    y: headerY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  cursorY -= LINE_HEIGHT * 0.75

  page.drawLine({
    start: { x: left, y: cursorY },
    end: { x: right, y: cursorY },
    thickness: 0.5,
    color: GRAY_LINE
  })
  cursorY -= LINE_HEIGHT

  const opisMaxWidth = COL.ilosc - COL.opis - 10

  for (const pozycja of pozycje) {
    const rowY = cursorY
    page.drawText(String(pozycja.lp), { x: left + COL.lp, y: rowY, size: 10, font: fonts.regular })
    page.drawText(String(pozycja.ilosc), {
      x: left + COL.ilosc,
      y: rowY,
      size: 10,
      font: fonts.regular
    })
    page.drawText(pozycja.jednostka, {
      x: left + COL.jednostka,
      y: rowY,
      size: 10,
      font: fonts.regular
    })
    page.drawText(pozycja.waga != null ? String(pozycja.waga) : '—', {
      x: left + COL.waga,
      y: rowY,
      size: 10,
      font: fonts.regular
    })

    const afterOpis = drawWrappedText(ctx, pozycja.opis, left + COL.opis, rowY, {
      font: fonts.regular,
      size: 10,
      maxWidth: opisMaxWidth
    })
    cursorY = Math.min(afterOpis, rowY - LINE_HEIGHT)
  }

  return cursorY
}

export function drawSignatureLines(ctx: PdfContext, labels: [string, string], y: number): void {
  const { page, fonts, width } = ctx
  const gap = 40
  const lineWidth = (width - PAGE_MARGIN * 2 - gap) / 2
  const leftX = PAGE_MARGIN
  const rightX = PAGE_MARGIN + lineWidth + gap

  for (const [x, label] of [
    [leftX, labels[0]],
    [rightX, labels[1]]
  ] as const) {
    page.drawLine({
      start: { x, y },
      end: { x: x + lineWidth, y },
      thickness: 0.5,
      color: GRAY_LINE
    })
    const labelWidth = fonts.regular.widthOfTextAtSize(label, 9)
    page.drawText(label, {
      x: x + (lineWidth - labelWidth) / 2,
      y: y - 14,
      size: 9,
      font: fonts.regular,
      color: GRAY_TEXT
    })
  }
}

export function drawNoteBlock(ctx: PdfContext, dokument: Dokument, y: number): number {
  if (!dokument.dokumentyTowarzyszace) return y
  const { page, fonts, width } = ctx
  let cursorY = y
  page.drawText('Dokumenty towarzyszące:', {
    x: PAGE_MARGIN,
    y: cursorY,
    size: 9,
    font: fonts.bold,
    color: GRAY_TEXT
  })
  cursorY -= LINE_HEIGHT
  cursorY = drawWrappedText(ctx, dokument.dokumentyTowarzyszace, PAGE_MARGIN, cursorY, {
    font: fonts.regular,
    size: 10,
    maxWidth: width - PAGE_MARGIN * 2
  })
  return cursorY
}

export async function buildKartaPdf(
  dokument: Dokument,
  options: { tytul: string; signatureLabels: [string, string] }
): Promise<Buffer> {
  const ctx = await createA4Document()
  let y = ctx.height - PAGE_MARGIN

  y = drawDocumentHeader(
    ctx,
    { tytul: options.tytul, numer: dokument.numer, data: dokument.data },
    y
  )

  const gap = 30
  const halfWidth = (ctx.width - PAGE_MARGIN * 2 - gap) / 2
  const afterNadawca = drawKontrahentBlock(
    ctx,
    'Nadawca',
    dokument.nadawca,
    PAGE_MARGIN,
    y,
    halfWidth
  )
  const afterOdbiorca = drawKontrahentBlock(
    ctx,
    'Odbiorca',
    dokument.odbiorca,
    PAGE_MARGIN + halfWidth + gap,
    y,
    halfWidth
  )
  y = Math.min(afterNadawca, afterOdbiorca) - LINE_HEIGHT

  y = drawLineItemsTable(ctx, dokument.pozycje, y)
  y = drawNoteBlock(ctx, dokument, y - LINE_HEIGHT)

  drawSignatureLines(ctx, options.signatureLabels, Math.max(y - LINE_HEIGHT * 2, 100))

  const bytes = await ctx.doc.save()
  return Buffer.from(bytes)
}
