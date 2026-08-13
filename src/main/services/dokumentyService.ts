import type Database from 'better-sqlite3'
import { getDb } from '../db/connection'
import { AppError } from '../utils/errors'
import { getKontrahent } from './kontrahenciService'
import type { Dokument, DokumentTyp, NewDokumentInput } from '@shared/types/dokument'
import type { Kontrahent } from '@shared/types/kontrahent'

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
      )
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
