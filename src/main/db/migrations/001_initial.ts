import type { Migration } from './types'

const migration: Migration = {
  version: 1,
  name: 'initial_schema',
  sql: `
CREATE TABLE Kontrahenci (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nazwa TEXT NOT NULL,
  ulica TEXT,
  kod_pocztowy TEXT,
  miejscowosc TEXT,
  kraj TEXT NOT NULL DEFAULT 'Polska',
  nip TEXT,
  telefon TEXT,
  email TEXT,
  uwagi TEXT,
  aktywny INTEGER NOT NULL DEFAULT 1,
  utworzono TEXT NOT NULL DEFAULT (datetime('now')),
  zaktualizowano TEXT
);

CREATE TABLE Dokumenty (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  typ TEXT NOT NULL CHECK(typ IN ('PZ','WZ')),
  numer TEXT NOT NULL UNIQUE,
  data_dokumentu TEXT NOT NULL,
  nadawca_id INTEGER NOT NULL REFERENCES Kontrahenci(id),
  odbiorca_id INTEGER NOT NULL REFERENCES Kontrahenci(id),
  dokumenty_towarzyszace TEXT,
  pdf_karta_path TEXT,
  pdf_cmr_path TEXT,
  excel_zapisano INTEGER NOT NULL DEFAULT 0,
  utworzono TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE PozycjeDokumentu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dokument_id INTEGER NOT NULL REFERENCES Dokumenty(id) ON DELETE CASCADE,
  lp INTEGER NOT NULL,
  opis TEXT NOT NULL,
  ilosc REAL NOT NULL,
  jednostka TEXT NOT NULL DEFAULT 'szt',
  waga REAL
);

CREATE TABLE Liczniki (
  typ TEXT NOT NULL,
  rok INTEGER NOT NULL,
  wartosc INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (typ, rok)
);

CREATE INDEX idx_dokumenty_nadawca ON Dokumenty(nadawca_id);
CREATE INDEX idx_dokumenty_odbiorca ON Dokumenty(odbiorca_id);
CREATE INDEX idx_pozycje_dokument ON PozycjeDokumentu(dokument_id);
`
}

export default migration
