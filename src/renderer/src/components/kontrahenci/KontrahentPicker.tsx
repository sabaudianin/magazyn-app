import { useEffect, useRef, useState } from 'react'
import { useKontrahenci } from '../../hooks/useKontrahenci'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import KontrahentForm from './KontrahentForm'
import type { Kontrahent } from '@shared/types/kontrahent'

interface KontrahentPickerProps {
  label: string
  value: Kontrahent | null
  onChange: (kontrahent: Kontrahent) => void
  error?: string
}

const SEARCH_DEBOUNCE_MS = 300

function KontrahentPicker({
  label,
  value,
  onChange,
  error
}: KontrahentPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const { kontrahenci, loading } = useKontrahenci({
    search: debouncedQuery || undefined,
    enabled: open
  })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (kontrahent: Kontrahent): void => {
    onChange(kontrahent)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm text-slate-700">
        {label} *
        <input
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
          placeholder="Szukaj kontrahenta…"
          value={open ? query : (value?.nazwa ?? '')}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {open && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-slate-200 bg-white text-sm shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-slate-400">Ładowanie…</div>
          ) : kontrahenci.length === 0 ? (
            <div className="px-3 py-2 text-slate-400">Brak wyników.</div>
          ) : (
            kontrahenci.map((k) => (
              <button
                key={k.id}
                type="button"
                className="block w-full px-3 py-2 text-left hover:bg-slate-100"
                onClick={() => handleSelect(k)}
              >
                {k.nazwa}
                {k.miejscowosc && <span className="text-slate-400"> — {k.miejscowosc}</span>}
              </button>
            ))
          )}
          <button
            type="button"
            className="block w-full border-t border-slate-100 px-3 py-2 text-left font-medium text-slate-900 hover:bg-slate-100"
            onClick={() => {
              setAddingNew(true)
              setOpen(false)
            }}
          >
            + Dodaj nowego
          </button>
        </div>
      )}

      {addingNew && (
        <KontrahentForm
          onCancel={() => setAddingNew(false)}
          onSaved={(kontrahent) => {
            setAddingNew(false)
            handleSelect(kontrahent)
          }}
        />
      )}
    </div>
  )
}

export default KontrahentPicker
