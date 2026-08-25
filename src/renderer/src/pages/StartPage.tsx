import { Link } from 'react-router-dom'
import { useKontrahenci } from '../hooks/useKontrahenci'
import { useDokumenty } from '../hooks/useDokumenty'

function StartPage(): React.JSX.Element {
  const { kontrahenci, loading: loadingKontrahenci, error: kontrahenciError } = useKontrahenci()
  const { dokumenty, loading: loadingDokumenty, error: dokumentyError } = useDokumenty()

  const loading = loadingKontrahenci || loadingDokumenty
  const error = kontrahenciError ?? dokumentyError
  const dokumentyPZ = dokumenty.filter((d) => d.typ === 'PZ').length
  const dokumentyWZ = dokumenty.filter((d) => d.typ === 'WZ').length

  return (
    <div>
      <h2 className="text-xl font-semibold">Magazyn</h2>
      <p className="mt-2 text-sm text-slate-500">
        Obsługa przyjęć (PZ) i wydań (WZ) z magazynu — dokumenty, karty PDF, CMR i wpisy do Excela w
        jednym miejscu.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold">{loading ? '—' : kontrahenci.length}</div>
          <div className="text-sm text-slate-500">Aktywnych kontrahentów</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold">{loading ? '—' : dokumentyPZ}</div>
          <div className="text-sm text-slate-500">Dokumentów PZ</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4">
          <div className="text-2xl font-semibold">{loading ? '—' : dokumentyWZ}</div>
          <div className="text-sm text-slate-500">Dokumentów WZ</div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          to="/nowy-dokument"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
        >
          + Nowy dokument
        </Link>
        <Link
          to="/kontrahenci"
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Kontrahenci
        </Link>
        <Link
          to="/historia"
          className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          Historia dokumentów
        </Link>
      </div>
    </div>
  )
}

export default StartPage
