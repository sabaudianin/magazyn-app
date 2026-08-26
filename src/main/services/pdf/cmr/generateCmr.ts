import fs from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { getResourcePath } from '../../../utils/paths'
import { AppError } from '../../../utils/errors'
import { loadPolishFonts } from '../fonts'
import { drawWrappedTextOnPage, formatAddressLine } from '../pdfBase'
import { cmrFieldMappings, CMR_TABLE } from './fieldMapping'
import type { CmrFieldKey } from './fieldMapping'
import type { Dokument } from '@shared/types/dokument'
import type { Kontrahent } from '@shared/types/kontrahent'

export class CmrTemplateNotConfiguredError extends AppError {
  constructor() {
    super(
      'CMR_TEMPLATE_NOT_CONFIGURED',
      'Szablon CMR nie został jeszcze skonfigurowany (brak pliku resources/templates/cmr-template.pdf)'
    )
    this.name = 'CmrTemplateNotConfiguredError'
  }
}

function formatKontrahentBlock(kontrahent: Kontrahent): string {
  const addressLine = formatAddressLine(kontrahent)
  return [kontrahent.nazwa, kontrahent.ulica, addressLine || null, kontrahent.kraj]
    .filter((line): line is string => Boolean(line))
    .join(', ')
}

function buildFieldValues(dokument: Dokument): Partial<Record<CmrFieldKey, string>> {
  const values: Partial<Record<CmrFieldKey, string>> = {
    nadawca: formatKontrahentBlock(dokument.nadawca),
    odbiorca: formatKontrahentBlock(dokument.odbiorca),
    numerCmr: dokument.numer
  }

  const miejscePrzeznaczenia = [dokument.odbiorca.miejscowosc, dokument.odbiorca.kraj]
    .filter(Boolean)
    .join(', ')
  if (miejscePrzeznaczenia) values.miejscePrzeznaczenia = miejscePrzeznaczenia

  const miejsceZaladunku = [dokument.nadawca.miejscowosc, dokument.nadawca.kraj, dokument.data]
    .filter(Boolean)
    .join(', ')
  if (miejsceZaladunku) values.miejsceZaladunku = miejsceZaladunku

  if (dokument.dokumentyTowarzyszace) values.zalaczoneDokumenty = dokument.dokumentyTowarzyszace
  if (dokument.numerRejestracyjny) values.numerRejestracyjny = dokument.numerRejestracyjny

  const wystawiono = [dokument.nadawca.miejscowosc, `dnia ${dokument.data}`]
    .filter(Boolean)
    .join(', ')
  if (wystawiono) values.wystawiono = wystawiono

  return values
}

// Szablon (resources/templates/cmr-template.pdf) to płaski druk bez pól AcroForm — 4 identyczne
// strony (kopie dla nadawcy/odbiorcy/przewoźnika/nadawcy), te same dane wpisujemy na każdej.
// Pole 16 (Przewoźnik) zostaje puste poza podpolem "NR REJ." (numer rejestracyjny pojazdu,
// jedyne, co ten przepływ zbiera) — model danych aplikacji nie ma pojęcia przewoźnika jako
// osobnego kontrahenta, więc nazwa/adres przewoźnika i pola podpisów wypełnia się ręcznie po
// wydruku.
export async function generateCmr(dokument: Dokument): Promise<Buffer> {
  const templatePath = getResourcePath('templates/cmr-template.pdf')
  if (!fs.existsSync(templatePath)) {
    throw new CmrTemplateNotConfiguredError()
  }

  const templateBytes = fs.readFileSync(templatePath)
  const doc = await PDFDocument.load(templateBytes)
  const fonts = await loadPolishFonts(doc)
  const fieldValues = buildFieldValues(dokument)

  for (const page of doc.getPages()) {
    for (const [key, text] of Object.entries(fieldValues) as [CmrFieldKey, string][]) {
      const mapping = cmrFieldMappings[key]
      if (mapping.formFieldName) {
        // Placeholder na wypadek przyszłego szablonu z wypełnialnym AcroForm — obecny
        // cmr-template.pdf go nie ma. Rzucamy głośno zamiast po cichu pomijać pole.
        throw new AppError(
          'CMR_FORM_FIELD_NOT_SUPPORTED',
          `Wypełnianie pola AcroForm (${mapping.formFieldName}) nie jest jeszcze zaimplementowane`
        )
      }
      if (!mapping.position) continue
      drawWrappedTextOnPage(page, text, mapping.position.x, mapping.position.y, {
        font: fonts.regular,
        size: mapping.position.fontSize ?? 9,
        maxWidth: mapping.position.maxWidth ?? 200,
        lineHeight: 11
      })
    }

    let rowY = CMR_TABLE.headerY
    for (const pozycja of dokument.pozycje) {
      page.drawText(String(pozycja.ilosc), {
        x: CMR_TABLE.columns.ilosc.x,
        y: rowY,
        size: CMR_TABLE.fontSize,
        font: fonts.regular
      })
      const afterJednostka = drawWrappedTextOnPage(
        page,
        pozycja.jednostka,
        CMR_TABLE.columns.jednostka.x,
        rowY,
        {
          font: fonts.regular,
          size: CMR_TABLE.fontSize,
          maxWidth: CMR_TABLE.columns.jednostka.maxWidth,
          lineHeight: CMR_TABLE.rowHeight
        }
      )
      const afterOpis = drawWrappedTextOnPage(page, pozycja.opis, CMR_TABLE.columns.opis.x, rowY, {
        font: fonts.regular,
        size: CMR_TABLE.fontSize,
        maxWidth: CMR_TABLE.columns.opis.maxWidth,
        lineHeight: CMR_TABLE.rowHeight
      })
      if (pozycja.waga != null) {
        page.drawText(String(pozycja.waga), {
          x: CMR_TABLE.columns.waga.x,
          y: rowY,
          size: CMR_TABLE.fontSize,
          font: fonts.regular
        })
      }
      // jednostka miała własny domyślny lineHeight (16pt) różny od rowHeight (14pt) używanego
      // do wyliczania afterOpis, więc jej zawinięty tekst mógł nachodzić na kolejny wiersz —
      // oba kolumny liczą się teraz tym samym lineHeight i obie wchodzą do min().
      rowY = Math.min(afterOpis, afterJednostka, rowY - CMR_TABLE.rowHeight)
    }
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}
