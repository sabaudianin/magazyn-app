// Współrzędne wyznaczone na podstawie warstwy tekstowej resources/templates/cmr-template.pdf
// (standardowy 24-polowy druk CMR/IRU, strona A4 595.28 x 841.89 pt, punkt 0,0 w lewym dolnym
// rogu). Ten sam layout powtarza się identycznie na wszystkich 4 stronach (kopiach) szablonu.

export interface CmrFieldMapping {
  // Preferowane, gdyby kiedyś szablon zmienił się na wypełnialny AcroForm.
  formFieldName?: string
  // Fallback używany obecnie — szablon jest płaski, bez pól formularza.
  position?: { x: number; y: number; fontSize?: number; maxWidth?: number }
}

export type CmrFieldKey =
  | 'nadawca' // pole 1
  | 'odbiorca' // pole 2
  | 'miejscePrzeznaczenia' // pole 3
  | 'miejsceZaladunku' // pole 4
  | 'zalaczoneDokumenty' // pole 5
  | 'wystawiono' // pole 21
  | 'numerCmr' // "CMR No" w nagłówku

export const cmrFieldMappings: Record<CmrFieldKey, CmrFieldMapping> = {
  nadawca: { position: { x: 63, y: 763, fontSize: 9, maxWidth: 220 } },
  odbiorca: { position: { x: 63, y: 697, fontSize: 9, maxWidth: 220 } },
  miejscePrzeznaczenia: { position: { x: 63, y: 632, fontSize: 9, maxWidth: 220 } },
  miejsceZaladunku: { position: { x: 63, y: 590, fontSize: 9, maxWidth: 220 } },
  zalaczoneDokumenty: { position: { x: 63, y: 549, fontSize: 9, maxWidth: 220 } },
  wystawiono: { position: { x: 63, y: 165, fontSize: 9, maxWidth: 220 } },
  numerCmr: { position: { x: 430, y: 763, fontSize: 11 } }
}

// Kolumny tabeli towarów (pola 6-12), y = górna krawędź nagłówka kolumn (top-origin przeliczony
// na współrzędne PDF od dołu strony). opis/ilosc/jednostka/waga to jedyne kolumny, dla których
// mamy dane w Dokument — Cechy i numery (6), Numer statystyczny (10) i Objętość (12) zostają puste.
export const CMR_TABLE = {
  headerY: 511,
  rowHeight: 14,
  fontSize: 8,
  columns: {
    ilosc: { x: 124 },
    jednostka: { x: 190, maxWidth: 66 },
    opis: { x: 258, maxWidth: 76 },
    waga: { x: 391 }
  }
}
