import type { Migration } from './types'

const migration: Migration = {
  version: 2,
  name: 'add_numer_rejestracyjny',
  sql: `
ALTER TABLE Dokumenty ADD COLUMN numer_rejestracyjny TEXT;
`
}

export default migration
