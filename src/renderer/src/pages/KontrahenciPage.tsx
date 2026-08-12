import { useState } from 'react'
import { useKontrahenci } from '../hooks/useKontrahenci'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import KontrahentForm from '../components/kontrahenci/KontrahentForm'
import type { Kontrahent } from '@shared/types/kontrahent'
import { parseIpcError } from '@shared/utils/ipcError'

const SEARCH_DEBOUNCE_MS = 300

function KontrahenciPage(): React.JSX.Element {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)
  // undefined = formularz zamknięty, null = nowy kontrahent, Kontrahent = edycja
  const [editing, setEditing] = useState<Kontrahent | null | undefined>(undefined)
  const [actionError, setActionError] = useState<string | null>(null)
  const { kontrahenci, loading, error, refetch } = useKontrahenci({
    search: debouncedSearch || undefined
  })

  const handleDeactivate = async (id: number): Promise<void> => {
    if (!window.confirm('Dezaktywować tego kontrahenta?')) return
    setActionError(null)
    try {
      await window.api.kontrahenci.deactivate(id)
      refetch()
    } catch (err) {
      setActionError(parseIpcError(err).message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Kontrahenci</h2>
        <button
          className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
          onClick={() => setEditing(null)}
        >
          Dodaj nowego
        </button>
      </div>

      <input
        className="mt-4 w-full max-w-sm rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="Szukaj po nazwie, NIP, miejscowości…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {actionError && <p className="mt-2 text-sm text-red-600">{actionError}</p>}

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Nazwa</th>
            <th className="py-2">Miejscowość</th>
            <th className="py-2">NIP</th>
            <th className="py-2">Telefon</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="py-4 text-slate-400" colSpan={5}>
                Ładowanie…
              </td>
            </tr>
          ) : kontrahenci.length === 0 ? (
            <tr>
              <td className="py-4 text-slate-400" colSpan={5}>
                Brak kontrahentów.
              </td>
            </tr>
          ) : (
            kontrahenci.map((k) => (
              <tr key={k.id} className="border-b border-slate-100">
                <td className="py-2">{k.nazwa}</td>
                <td className="py-2">{k.miejscowosc ?? '—'}</td>
                <td className="py-2">{k.nip ?? '—'}</td>
                <td className="py-2">{k.telefon ?? '—'}</td>
                <td className="py-2 text-right">
                  <button
                    className="mr-3 text-slate-600 hover:underline"
                    onClick={() => setEditing(k)}
                  >
                    Edytuj
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeactivate(k.id)}
                  >
                    Dezaktywuj
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editing !== undefined && (
        <KontrahentForm
          initial={editing}
          onCancel={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            refetch()
          }}
        />
      )}
    </div>
  )
}

export default KontrahenciPage
