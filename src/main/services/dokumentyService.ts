import type Database from 'better-sqlite3'
import { getDb } from '../db/connection'
import { AppError, toErrorPayload } from '../utils/errors'
import { logger } from '../utils/logger'
import { getKontrahent } from './kontrahenciService'
import { generateKartaPrzyjecia } from './pdf/kartaPrzyjecia'
import { generateKartaWydania } from './pdf/kartaWydania'
import { generateCmr, CmrTemplateNotConfiguredError } from './pdf/cmr/generateCmr'
import { getKartaPdfPath, getCmrPdfPath, savePdfBytes } from './pdf/pdfStorage'
import { appendPozycjeToExcel } from './excel/magazynExcelService'
import type {
  CreateDokumentResult,
  Dokument,
  DokumentListItem,
  DokumentTyp,
  DokumentyListFilters,
  NewDokumentInput,
  SaveWarning
} from '@shared/types/dokument'
import type { Kontrahent } from '@shared/types/kontrahent'

interface DokumentListRow {
  id: number
  typ: DokumentTyp
  numer: string
  data: string
  nadawca_nazwa: string
  odbiorca_nazwa: string
  pdf_karta_path: string | null
  pdf_cmr_path: string | null
  excel_zapisano: number
  utworzono: string
}

interface DokumentRow {
  id: number
  typ: DokumentTyp
  numer: string
  data_dokumentu: string
  nadawca_id: number
  odbiorca_id: number
  dokumenty_towarzyszace: string | null
  pdf_karta_path: string | null
  pdf_cmr_path: string | null
  excel_zapisano: number
  utworzono: string
}

interface PozycjaRow {
  id: number
  lp: number
  opis: string
  ilosc: number
  jednostka: string
  waga: number | null
}

interface Statements {
  getDokumentById: Database.Statement
  getPozycjeByDokumentId: Database.Statement
  upsertLicznik: Database.Statement
  insertDokument: Database.Statement
  insertPozycja: Database.Statement
  updatePdfKartaPath: Database.Statement
  updatePdfCmrPath: Database.Statement
}

let statements: Statements | null = null

function stmts(): Statements {
  if (!statements) {
    const db = getDb()
    statements = {
      getDokumentById: db.prepare('SELECT * FROM Dokumenty WHERE id = ?'),
      getPozycjeByDokumentId: db.prepare(
        'SELECT * FROM PozycjeDokumentu WHERE dokument_id = ? ORDER BY lp'
      ),
      upsertLicznik: db.prepare(
        `INSERT INTO Liczniki (typ, rok, wartosc) VALUES (@typ, @rok, 1)
         ON CONFLICT(typ, rok) DO UPDATE SET wartosc = wartosc + 1
         RETURNING wartosc`
      ),
      insertDokument: db.prepare(
        `INSERT INTO Dokumenty (typ, numer, data_dokumentu, nadawca_id, odbiorca_id, dokumenty_towarzyszace)
         VALUES (@typ, @numer, @data, @nadawcaId, @odbiorcaId, @dokumentyTowarzyszace)`
      ),
      insertPozycja: db.prepare(
        `INSERT INTO PozycjeDokumentu (dokument_id, lp, opis, ilosc, jednostka, waga)
         VALUES (@dokumentId, @lp, @opis, @ilosc, @jednostka, @waga)`
      ),
      updatePdfKartaPath: db.prepare('UPDATE Dokumenty SET pdf_karta_path = @path WHERE id = @id'),
      updatePdfCmrPath: db.prepare('UPDATE Dokumenty SET pdf_cmr_path = @path WHERE id = @id')
    }
  }
  return statements
}

// nadawca/odbiorca można podać z zewnątrz (createDokument już je pobrał do walidacji
// istnienia), żeby nie odpytywać o te same rekordy Kontrahenci drugi raz.
function assembleDokument(
  dokumentId: number,
  prefetched?: { nadawca: Kontrahent; odbiorca: Kontrahent }
): Dokument {
  const row = stmts().getDokumentById.get(dokumentId) as DokumentRow | undefined
  if (!row) {
    throw new AppError('NOT_FOUND', `Dokument o id ${dokumentId} nie istnieje`)
  }

  const nadawca = prefetched?.nadawca ?? getKontrahent(row.nadawca_id)
  const odbiorca = prefetched?.odbiorca ?? getKontrahent(row.odbiorca_id)
  if (!nadawca || !odbiorca) {
    throw new AppError('INTERNAL', 'Nie udało się odczytać kontrahentów dokumentu')
  }

  const pozycjeRows = stmts().getPozycjeByDokumentId.all(dokumentId) as PozycjaRow[]

  return {
    id: row.id,
    typ: row.typ,
    numer: row.numer,
    data: row.data_dokumentu,
    nadawca,
    odbiorca,
    dokumentyTowarzyszace: row.dokumenty_towarzyszace,
    pozycje: pozycjeRows.map((p) => ({
      id: p.id,
      lp: p.lp,
      opis: p.opis,
      ilosc: p.ilosc,
      jednostka: p.jednostka,
      waga: p.waga
    })),
    pdfKartaPath: row.pdf_karta_path,
    pdfCmrPath: row.pdf_cmr_path,
    excelZapisano: Boolean(row.excel_zapisano),
    utworzono: row.utworzono
  }
}

// input.data jest walidowane przez NewDokumentInputSchema (z.iso.date) do formatu RRRR-MM-DD,
// więc rok bierzemy z samego stringa — new Date(...).getFullYear() parsowałby datę jako UTC
// i odczytywał rok w strefie lokalnej, co przy ujemnym offsecie potrafi po cichu przesunąć rok.
function extractYear(isoDate: string): number {
  const rok = Number(isoDate.slice(0, 4))
  if (!Number.isInteger(rok)) {
    throw new AppError('VALIDATION', 'Nieprawidłowa data dokumentu')
  }
  return rok
}

export function createDokument(input: NewDokumentInput): Dokument {
  const db = getDb()
  const rok = extractYear(input.data)

  const nadawca = getKontrahent(input.nadawcaId)
  if (!nadawca) {
    throw new AppError('NOT_FOUND', `Nadawca o id ${input.nadawcaId} nie istnieje`)
  }
  const odbiorca = getKontrahent(input.odbiorcaId)
  if (!odbiorca) {
    throw new AppError('NOT_FOUND', `Odbiorca o id ${input.odbiorcaId} nie istnieje`)
  }

  const createTx = db.transaction((): number => {
    const counterRow = stmts().upsertLicznik.get({ typ: input.typ, rok }) as { wartosc: number }
    const numer = `${input.typ}/${String(counterRow.wartosc).padStart(3, '0')}/${rok}`

    const insertResult = stmts().insertDokument.run({
      typ: input.typ,
      numer,
      data: input.data,
      nadawcaId: input.nadawcaId,
      odbiorcaId: input.odbiorcaId,
      dokumentyTowarzyszace: input.dokumentyTowarzyszace
    })

    const dokumentId = Number(insertResult.lastInsertRowid)

    input.pozycje.forEach((pozycja, index) => {
      stmts().insertPozycja.run({
        dokumentId,
        lp: index + 1,
        opis: pozycja.opis,
        ilosc: pozycja.ilosc,
        jednostka: pozycja.jednostka,
        waga: pozycja.waga
      })
    })

    return dokumentId
  })

  return assembleDokument(createTx(), { nadawca, odbiorca })
}

export function getDokument(id: number): Dokument {
  return assembleDokument(id)
}

// LIKE traktuje % i _ jako wieloznaczniki nawet w treści wpisanej przez użytkownika — bez
// escapowania szukanie dosłownego "50%" albo nazwy z podkreślnikiem dopasowuje przypadkowe wiersze.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

// Filtry są dowolną kombinacją (typ/zakres dat/szukaj), więc w odróżnieniu od reszty tego serwisu
// nie cache'ujemy jednego stałego prepared statement — WHERE budujemy per wywołanie, tak samo jak
// listKontrahenci w kontrahenciService.ts.
export function listDokumenty(filters: DokumentyListFilters = {}): DokumentListItem[] {
  const db = getDb()
  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (filters.typ) {
    conditions.push('d.typ = @typ')
    params.typ = filters.typ
  }
  if (filters.dataOd) {
    conditions.push('d.data_dokumentu >= @dataOd')
    params.dataOd = filters.dataOd
  }
  if (filters.dataDo) {
    conditions.push('d.data_dokumentu <= @dataDo')
    params.dataDo = filters.dataDo
  }
  if (filters.search) {
    conditions.push(
      "(d.numer LIKE @search ESCAPE '\\' OR n.nazwa LIKE @search ESCAPE '\\' OR o.nazwa LIKE @search ESCAPE '\\')"
    )
    params.search = `%${escapeLikePattern(filters.search)}%`
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare<Record<string, unknown>, DokumentListRow>(
      `SELECT d.id, d.typ, d.numer, d.data_dokumentu as data,
              n.nazwa as nadawca_nazwa, o.nazwa as odbiorca_nazwa,
              d.pdf_karta_path, d.pdf_cmr_path, d.excel_zapisano, d.utworzono
       FROM Dokumenty d
       JOIN Kontrahenci n ON n.id = d.nadawca_id
       JOIN Kontrahenci o ON o.id = d.odbiorca_id
       ${where}
       ORDER BY d.id DESC`
    )
    .all(params)

  return rows.map((row) => ({
    id: row.id,
    typ: row.typ,
    numer: row.numer,
    data: row.data,
    nadawcaNazwa: row.nadawca_nazwa,
    odbiorcaNazwa: row.odbiorca_nazwa,
    pdfKartaPath: row.pdf_karta_path,
    pdfCmrPath: row.pdf_cmr_path,
    excelZapisano: Boolean(row.excel_zapisano),
    utworzono: row.utworzono
  }))
}

function generateKartaBytes(dokument: Dokument): Promise<Buffer> {
  return dokument.typ === 'PZ' ? generateKartaPrzyjecia(dokument) : generateKartaWydania(dokument)
}

// Mutuje przekazany obiekt dokument (pdfKartaPath) zamiast wymuszać ponowny SELECT — wywołujące
// funkcje (orchestrator, retry) mają już świeży obiekt w ręku.
async function generateAndSaveKartaPdf(dokument: Dokument): Promise<void> {
  const bytes = await generateKartaBytes(dokument)
  const filePath = getKartaPdfPath(dokument)
  savePdfBytes(filePath, bytes)
  stmts().updatePdfKartaPath.run({ id: dokument.id, path: filePath })
  dokument.pdfKartaPath = filePath
}

async function generateAndSaveCmrPdf(dokument: Dokument): Promise<void> {
  const bytes = await generateCmr(dokument)
  const filePath = getCmrPdfPath(dokument)
  savePdfBytes(filePath, bytes)
  stmts().updatePdfCmrPath.run({ id: dokument.id, path: filePath })
  dokument.pdfCmrPath = filePath
}

// Krok 1 (transakcja DB, createDokument powyżej) jest jedynym krokiem, którego błąd przerywa
// całość — rzuca i nic dalej się nie wykonuje. Kroki 2-4 (karta PDF, Excel, CMR) są non-fatal:
// błąd każdego z nich trafia do `warnings`, ale rekord w DB nigdy nie jest z tego powodu cofany.
// Brak skonfigurowanego szablonu CMR to stan oczekiwany (severity 'info'), nie błąd.
export async function createDokumentZDokumentami(
  input: NewDokumentInput
): Promise<CreateDokumentResult> {
  const dokument = createDokument(input)
  const warnings: SaveWarning[] = []

  try {
    await generateAndSaveKartaPdf(dokument)
  } catch (error) {
    logger.error(`[dokumenty] karta PDF nie powiodła się dla ${dokument.numer}`, error)
    warnings.push({ step: 'pdfKarta', severity: 'error', message: toErrorPayload(error).message })
  }

  try {
    await appendPozycjeToExcel(dokument)
    dokument.excelZapisano = true
  } catch (error) {
    logger.error(`[dokumenty] zapis do Excela nie powiódł się dla ${dokument.numer}`, error)
    warnings.push({ step: 'excel', severity: 'error', message: toErrorPayload(error).message })
  }

  try {
    await generateAndSaveCmrPdf(dokument)
  } catch (error) {
    if (error instanceof CmrTemplateNotConfiguredError) {
      warnings.push({ step: 'pdfCmr', severity: 'info', message: error.message })
    } else {
      logger.error(`[dokumenty] CMR nie powiódł się dla ${dokument.numer}`, error)
      warnings.push({ step: 'pdfCmr', severity: 'error', message: toErrorPayload(error).message })
    }
  }

  return { dokument, warnings }
}

// Retry ponawia tylko dany efekt uboczny nad już zapisanym rekordem DB, bez ponownego
// wprowadzania danych. W odróżnieniu od createDokumentZDokumentami (który zbiera warnings, bo
// próbuje wszystkich kroków naraz) retry to pojedyncza akcja użytkownika — błąd rzuca dalej jako
// AppError, tak jak każde inne pojedyncze wywołanie IPC w tej appce.
export async function retryPdfKarta(id: number): Promise<Dokument> {
  const dokument = getDokument(id)
  await generateAndSaveKartaPdf(dokument)
  return dokument
}

export async function retryPdfCmr(id: number): Promise<Dokument> {
  const dokument = getDokument(id)
  await generateAndSaveCmrPdf(dokument)
  return dokument
}

export async function retryExcel(id: number): Promise<Dokument> {
  const dokument = getDokument(id)
  await appendPozycjeToExcel(dokument)
  dokument.excelZapisano = true
  return dokument
}
