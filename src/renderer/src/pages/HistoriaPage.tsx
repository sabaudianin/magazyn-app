import { Fragment, useRef, useState } from 'react'
import { useDokumenty } from '../hooks/useDokumenty'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { DokumentTyp } from '@shared/types/dokument'
import type { PdfKind } from '@shared/types/pdf'
import { parseIpcError } from '@shared/utils/ipcError'

type RetryStep = 'pdfKarta' | 'pdfCmr' | 'excel'

const SEARCH_DEBOUNCE_MS = 300

function HistoriaPage(): React.JSX.Element {
  const [typ, setTyp] = useState<'' | DokumentTyp>('')
  const [dataOd, setDataOd] = useState('')
  const [dataDo, setDataDo] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  const { dokumenty, setDokumenty, loading, error, refetch } = useDokumenty({
    typ: typ || undefined,
    dataOd: dataOd || undefined,
    dataDo: dataDo || undefined,
    search: debouncedSearch || undefined
  })

  const [actionError, setActionError] = useState<string | null>(null)
  const [retryingKey, setRetryingKey] = useState<string | null>(null)
  // Ref, nie tylko stan retryingKey — patrz analogiczny komentarz w NowyDokumentPage.tsx: ref
  // blokuje natychmiast, synchronicznie, zanim retryExcel (bez deduplikacji wierszy w
  // magazyn.xlsx) mogłoby zostać wywołane drugi raz przez podwójne kliknięcie.
  const retryLockRef = useRef(false)
  // Kluczowane `${id}:${step}` (nie samym id) — dokument może mieć naraz nieudaną kartę PDF i
  // Excel; ponowienie jednego kroku nie może kasować/nadpisywać komunikatu dla drugiego.
  const [rowMessages, setRowMessages] = useState<
    Record<string, { text: string; severity: 'error' | 'info' }>
  >({})

  const handleRetry = async (id: number, step: RetryStep): Promise<void> => {
    if (retryLockRef.current) return
    const key = `${id}:${step}`
    const retry =
      step === 'pdfKarta'
        ? window.api.dokumenty.retryPdfKarta
        : step === 'pdfCmr'
          ? window.api.dokumenty.retryPdfCmr
          : window.api.dokumenty.retryExcel

    retryLockRef.current = true
    setRetryingKey(key)
    setActionError(null)
    setRowMessages((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    try {
      const updated = await retry(id)
      setDokumenty((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
                ...row,
                pdfKartaPath: updated.pdfKartaPath,
                pdfCmrPath: updated.pdfCmrPath,
                excelZapisano: updated.excelZapisano
              }
            : row
        )
      )
    } catch (err) {
      const parsed = parseIpcError(err)
      const severity = parsed.code === 'CMR_TEMPLATE_NOT_CONFIGURED' ? 'info' : 'error'
      setRowMessages((prev) => ({ ...prev, [key]: { text: parsed.message, severity } }))
    } finally {
      retryLockRef.current = false
      setRetryingKey(null)
    }
  }

  const handleOpen = async (id: number, kind: PdfKind): Promise<void> => {
    setActionError(null)
    try {
      await window.api.pdf.open(id, kind)
    } catch (err) {
      setActionError(parseIpcError(err).message)
    }
  }

  const handleSaveAs = async (id: number, kind: PdfKind): Promise<void> => {
    setActionError(null)
    try {
      await window.api.pdf.saveAs(id, kind)
    } catch (err) {
      setActionError(parseIpcError(err).message)
    }
  }

  const retryDisabled = retryingKey !== null

  function renderPdfCell(id: number, kind: PdfKind, path: string | null): React.JSX.Element {
    const step: RetryStep = kind === 'karta' ? 'pdfKarta' : 'pdfCmr'
    if (path) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleOpen(id, kind)}
            className="text-slate-700 hover:underline"
          >
            Otwórz
          </button>
          <button
            type="button"
            onClick={() => void handleSaveAs(id, kind)}
            className="text-slate-700 hover:underline"
          >
            Zapisz jako
          </button>
        </div>
      )
    }
    // Po ponowieniu, które trafiło na brak skonfigurowanego szablonu CMR (severity 'info'),
    // przycisk znika — ponawianie nie ma sensu, dopóki plik szablonu się nie pojawi.
    if (rowMessages[`${id}:${step}`]?.severity === 'info') {
      return <span className="text-slate-400">—</span>
    }
    return (
      <button
        type="button"
        disabled={retryDisabled}
        onClick={() => void handleRetry(id, step)}
        className="rounded bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {retryingKey === `${id}:${step}` ? 'Ponawiam…' : 'Ponów'}
      </button>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">Historia dokumentów</h2>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm text-slate-700">
          Typ
          <select
            className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
            value={typ}
            onChange={(e) => setTyp(e.target.value as '' | DokumentTyp)}
          >
            <option value="">Wszystkie</option>
            <option value="PZ">PZ — przyjęcie</option>
            <option value="WZ">WZ — wydanie</option>
          </select>
        </label>
        <label className="text-sm text-slate-700">
          Data od
          <input
            type="date"
            className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
            value={dataOd}
            onChange={(e) => setDataOd(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Data do
          <input
            type="date"
            className="mt-1 block rounded border border-slate-300 px-2 py-1 text-sm"
            value={dataDo}
            onChange={(e) => setDataDo(e.target.value)}
          />
        </label>
        <label className="text-sm text-slate-700">
          Szukaj
          <input
            className="mt-1 block w-56 rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Numer, nadawca, odbiorca…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}
      {loading && <p className="mt-2 text-sm text-slate-400">Ładowanie…</p>}

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Numer</th>
            <th className="py-2">Typ</th>
            <th className="py-2">Data</th>
            <th className="py-2">Nadawca</th>
            <th className="py-2">Odbiorca</th>
            <th className="py-2">Karta PDF</th>
            <th className="py-2">CMR</th>
            <th className="py-2">Excel</th>
          </tr>
        </thead>
        <tbody>
          {dokumenty.map((d) => (
            <Fragment key={d.id}>
              <tr className="border-b border-slate-100 align-top">
                <td className="py-2 font-medium">{d.numer}</td>
                <td className="py-2">{d.typ}</td>
                <td className="py-2">{d.data}</td>
                <td className="py-2">{d.nadawcaNazwa}</td>
                <td className="py-2">{d.odbiorcaNazwa}</td>
                <td className="py-2">{renderPdfCell(d.id, 'karta', d.pdfKartaPath)}</td>
                <td className="py-2">{renderPdfCell(d.id, 'cmr', d.pdfCmrPath)}</td>
                <td className="py-2">
                  {d.excelZapisano ? (
                    <span className="text-green-700">✓ zapisano</span>
                  ) : (
                    <button
                      type="button"
                      disabled={retryDisabled}
                      onClick={() => void handleRetry(d.id, 'excel')}
                      className="rounded bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {retryingKey === `${d.id}:excel` ? 'Ponawiam…' : 'Ponów'}
                    </button>
                  )}
                </td>
              </tr>
              {(['pdfKarta', 'pdfCmr', 'excel'] as const)
                .filter((step) => rowMessages[`${d.id}:${step}`])
                .map((step) => {
                  const message = rowMessages[`${d.id}:${step}`]
                  return (
                    <tr key={step} className="border-b border-slate-100">
                      <td
                        colSpan={8}
                        className={`py-1 text-xs ${
                          message.severity === 'error' ? 'text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        {message.text}
                      </td>
                    </tr>
                  )
                })}
            </Fragment>
          ))}
          {!loading && dokumenty.length === 0 && (
            <tr>
              <td colSpan={8} className="py-4 text-center text-slate-400">
                Brak dokumentów spełniających kryteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button
        type="button"
        onClick={refetch}
        className="mt-4 rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
      >
        Odśwież listę
      </button>
    </div>
  )
}

export default HistoriaPage
