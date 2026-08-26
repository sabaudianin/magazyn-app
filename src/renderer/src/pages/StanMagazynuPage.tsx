import { Link } from 'react-router-dom'
import { useStanMagazynowy } from '../hooks/useStanMagazynowy'

// ilosc to REAL w SQLite (ułamkowe jednostki jak kg) — SUM po kilku dokumentach potrafi dać błąd
// zaokrąglenia binarnego (np. 12.300000000000001). Zaokrąglamy do rozsądnej precyzji przed
// wyświetleniem zamiast pokazywać surowy wynik SUM().
function formatIlosc(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}

function StanMagazynuPage(): React.JSX.Element {
  const { pozycje, loading, error, refetch } = useStanMagazynowy()

  return (
    <div>
      <h2 className="text-xl font-semibold">Stan magazynu</h2>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-2 text-sm text-slate-400">Ładowanie…</p>}

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2">Opis towaru</th>
            <th className="py-2">Jednostka</th>
            <th className="py-2">Przyjęto</th>
            <th className="py-2">Wydania</th>
            <th className="py-2">Stan</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {pozycje.map((p) => (
            <tr key={JSON.stringify([p.opis, p.jednostka])} className="border-b border-slate-100">
              <td className="py-2">{p.opis}</td>
              <td className="py-2">{p.jednostka}</td>
              <td className="py-2">{formatIlosc(p.przyjeto)}</td>
              <td className="py-2">{formatIlosc(p.wydano)}</td>
              <td className={`py-2 font-medium ${p.stan < 0 ? 'text-red-600' : ''}`}>
                {formatIlosc(p.stan)}
              </td>
              <td className="py-2 text-right">
                <Link
                  to={`/wydaj?${new URLSearchParams({
                    opis: p.opis,
                    jednostka: p.jednostka,
                    stan: formatIlosc(p.stan)
                  }).toString()}`}
                  className="rounded bg-white px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100"
                >
                  Wydaj
                </Link>
              </td>
            </tr>
          ))}
          {!loading && pozycje.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-center text-slate-400">
                Brak pozycji na magazynie.
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

export default StanMagazynuPage
