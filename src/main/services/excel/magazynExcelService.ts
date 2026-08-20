import { app } from 'electron'
import fs from 'node:fs'
import { join } from 'node:path'
import type Database from 'better-sqlite3'
import ExcelJS from 'exceljs'
import { getDb } from '../../db/connection'
import { AppError } from '../../utils/errors'
import type { Dokument } from '@shared/types/dokument'

const SHEET_NAME = 'Magazyn'
const HEADERS = [
  'Data',
  'Typ',
  'Numer dokumentu',
  'Nadawca',
  'Odbiorca',
  'Opis towaru',
  'Ilość',
  'Jednostka',
  'Waga',
  'Uwagi'
]

function getExcelPath(): string {
  return join(app.getPath('documents'), 'magazyn.xlsx')
}

function isFileLockedError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException)?.code
  return code === 'EBUSY' || code === 'EPERM' || code === 'EACCES'
}

async function loadOrCreateWorkbook(path: string): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()
  if (fs.existsSync(path)) {
    await workbook.xlsx.readFile(path)
  } else {
    const sheet = workbook.addWorksheet(SHEET_NAME)
    sheet.addRow(HEADERS)
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }
  return workbook
}

function getSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const sheet = workbook.getWorksheet(SHEET_NAME)
  if (!sheet) {
    throw new AppError('INTERNAL', `Arkusz ${SHEET_NAME} nie istnieje w pliku magazyn.xlsx`)
  }
  return sheet
}

interface Statements {
  updateExcelZapisano: Database.Statement
}

let statements: Statements | null = null

function stmts(): Statements {
  if (!statements) {
    const db = getDb()
    statements = {
      updateExcelZapisano: db.prepare('UPDATE Dokumenty SET excel_zapisano = 1 WHERE id = ?')
    }
  }
  return statements
}

function markExcelZapisano(dokumentId: number): void {
  stmts().updateExcelZapisano.run(dokumentId)
}

async function doAppend(dokument: Dokument): Promise<void> {
  const path = getExcelPath()

  let workbook: ExcelJS.Workbook
  try {
    workbook = await loadOrCreateWorkbook(path)
  } catch (error) {
    if (isFileLockedError(error)) {
      throw new AppError(
        'EXCEL_FILE_LOCKED',
        'Zamknij plik magazyn.xlsx w LibreOffice Calc i spróbuj ponownie'
      )
    }
    throw error
  }

  const sheet = getSheet(workbook)
  for (const pozycja of dokument.pozycje) {
    sheet.addRow([
      dokument.data,
      dokument.typ,
      dokument.numer,
      dokument.nadawca.nazwa,
      dokument.odbiorca.nazwa,
      pozycja.opis,
      pozycja.ilosc,
      pozycja.jednostka,
      pozycja.waga,
      dokument.dokumentyTowarzyszace
    ])
  }

  // Zapis zawsze najpierw do pliku tymczasowego, dopiero potem atomowy rename na docelową
  // nazwę — jeśli proces zostanie przerwany w trakcie zapisu, magazyn.xlsx pozostaje
  // nienaruszony zamiast się uszkodzić w połowie zapisu.
  const tmpPath = `${path}.tmp`
  try {
    await workbook.xlsx.writeFile(tmpPath)
    fs.renameSync(tmpPath, path)
  } catch (error) {
    fs.rm(tmpPath, { force: true }, () => {})
    if (isFileLockedError(error)) {
      throw new AppError(
        'EXCEL_FILE_LOCKED',
        'Zamknij plik magazyn.xlsx w LibreOffice Calc i spróbuj ponownie'
      )
    }
    throw error
  }

  markExcelZapisano(dokument.id)
}

// Read-modify-write całego workbooka nie jest bezpieczne przy równoległych wywołaniach — kolejne
// zapisy czekają w kolejce (promise chain), zamiast równolegle nadpisywać się nawzajem. Kolejka
// sama nigdy nie odrzuca (błąd pojedynczego zapisu nie blokuje kolejnych), tylko zwrócony `task`
// niesie rzeczywisty wynik danego wywołania.
let queue: Promise<void> = Promise.resolve()

export function appendPozycjeToExcel(dokument: Dokument): Promise<void> {
  const task = queue.then(() => doAppend(dokument))
  queue = task.catch(() => undefined)
  return task
}
