import type Database from 'better-sqlite3'
import { getDb } from '../db/connection'
import { AppError } from '../utils/errors'
import type {
  Kontrahent,
  ListKontrahenciOptions,
  NewKontrahentInput,
  UpdateKontrahentInput
} from '@shared/types/kontrahent'

interface KontrahentRow {
  id: number
  nazwa: string
  ulica: string | null
  kod_pocztowy: string | null
  miejscowosc: string | null
  kraj: string
  nip: string | null
  telefon: string | null
  email: string | null
  uwagi: string | null
  aktywny: number
  utworzono: string
  zaktualizowano: string | null
}

function mapRow(row: KontrahentRow): Kontrahent {
  return {
    id: row.id,
    nazwa: row.nazwa,
    ulica: row.ulica,
    kodPocztowy: row.kod_pocztowy,
    miejscowosc: row.miejscowosc,
    kraj: row.kraj,
    nip: row.nip,
    telefon: row.telefon,
    email: row.email,
    uwagi: row.uwagi,
    aktywny: Boolean(row.aktywny),
    utworzono: row.utworzono,
    zaktualizowano: row.zaktualizowano
  }
}

interface Statements {
  getById: Database.Statement
  insert: Database.Statement
  update: Database.Statement
  deactivate: Database.Statement
}

let statements: Statements | null = null

function stmts(): Statements {
  if (!statements) {
    const db = getDb()
    statements = {
      getById: db.prepare('SELECT * FROM Kontrahenci WHERE id = ?'),
      insert: db.prepare(
        `INSERT INTO Kontrahenci (nazwa, ulica, kod_pocztowy, miejscowosc, kraj, nip, telefon, email, uwagi)
         VALUES (@nazwa, @ulica, @kodPocztowy, @miejscowosc, @kraj, @nip, @telefon, @email, @uwagi)`
      ),
      update: db.prepare(
        `UPDATE Kontrahenci
         SET nazwa=@nazwa, ulica=@ulica, kod_pocztowy=@kodPocztowy, miejscowosc=@miejscowosc,
             kraj=@kraj, nip=@nip, telefon=@telefon, email=@email, uwagi=@uwagi,
             zaktualizowano=datetime('now')
         WHERE id=@id`
      ),
      deactivate: db.prepare(
        `UPDATE Kontrahenci SET aktywny = 0, zaktualizowano = datetime('now') WHERE id = ?`
      )
    }
  }
  return statements
}

export function listKontrahenci(opts: ListKontrahenciOptions = {}): Kontrahent[] {
  const db = getDb()
  const { search, includeInactive = false } = opts
  const conditions: string[] = []
  const params: Record<string, unknown> = {}

  if (!includeInactive) {
    conditions.push('aktywny = 1')
  }
  if (search) {
    conditions.push('(nazwa LIKE @search OR nip LIKE @search OR miejscowosc LIKE @search)')
    params.search = `%${search}%`
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare<Record<string, unknown>, KontrahentRow>(
      `SELECT * FROM Kontrahenci ${where} ORDER BY nazwa COLLATE NOCASE`
    )
    .all(params)
  return rows.map(mapRow)
}

export function getKontrahent(id: number): Kontrahent | undefined {
  const row = stmts().getById.get(id) as KontrahentRow | undefined
  return row ? mapRow(row) : undefined
}

export function createKontrahent(input: NewKontrahentInput): Kontrahent {
  const result = stmts().insert.run({
    nazwa: input.nazwa,
    ulica: input.ulica,
    kodPocztowy: input.kodPocztowy,
    miejscowosc: input.miejscowosc,
    kraj: input.kraj,
    nip: input.nip,
    telefon: input.telefon,
    email: input.email,
    uwagi: input.uwagi
  })
  const created = getKontrahent(Number(result.lastInsertRowid))
  if (!created) {
    throw new AppError('INTERNAL', 'Nie udało się odczytać utworzonego kontrahenta')
  }
  return created
}

export function updateKontrahent(id: number, input: UpdateKontrahentInput): Kontrahent {
  const existing = getKontrahent(id)
  if (!existing) {
    throw new AppError('NOT_FOUND', `Kontrahent o id ${id} nie istnieje`)
  }
  const merged = { ...existing, ...input }
  stmts().update.run({
    id,
    nazwa: merged.nazwa,
    ulica: merged.ulica,
    kodPocztowy: merged.kodPocztowy,
    miejscowosc: merged.miejscowosc,
    kraj: merged.kraj,
    nip: merged.nip,
    telefon: merged.telefon,
    email: merged.email,
    uwagi: merged.uwagi
  })
  const updated = getKontrahent(id)
  if (!updated) {
    throw new AppError('INTERNAL', 'Nie udało się odczytać zaktualizowanego kontrahenta')
  }
  return updated
}

export function deactivateKontrahent(id: number): void {
  const result = stmts().deactivate.run(id)
  if (result.changes === 0) {
    throw new AppError('NOT_FOUND', `Kontrahent o id ${id} nie istnieje`)
  }
}
