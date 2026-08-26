import { useCallback, useEffect, useState } from 'react'
import type { StanMagazynowyItem } from '@shared/types/stanMagazynowy'
import { parseIpcError } from '@shared/utils/ipcError'

interface UseStanMagazynowyResult {
  pozycje: StanMagazynowyItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useStanMagazynowy(): UseStanMagazynowyResult {
  const [pozycje, setPozycje] = useState<StanMagazynowyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false

    async function load(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const data = await window.api.stanMagazynowy.list()
        if (!cancelled) setPozycje(data)
      } catch (err) {
        if (!cancelled) setError(parseIpcError(err).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return { pozycje, loading, error, refetch }
}
