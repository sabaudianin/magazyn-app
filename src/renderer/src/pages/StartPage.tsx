import { useEffect, useState } from 'react'
import type { PingResponse } from '@shared/types/ipc'

function StartPage(): React.JSX.Element {
  const [ping, setPing] = useState<PingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.app
      .ping()
      .then(setPing)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  return (
    <div>
      <h2 className="text-xl font-semibold">Magazyn</h2>
      <p className="mt-2 text-sm text-slate-500">
        Aplikacja do obsługi przyjęć i wydań z magazynu.
      </p>
      <div className="mt-4 rounded border border-slate-200 bg-white p-4 text-sm">
        {error ? (
          <span className="text-red-600">Błąd IPC: {error}</span>
        ) : ping ? (
          <span className="text-green-700">
            IPC OK: {ping.message} ({ping.timestamp})
          </span>
        ) : (
          <span className="text-slate-400">Sprawdzanie połączenia IPC…</span>
        )}
      </div>
    </div>
  )
}

export default StartPage
