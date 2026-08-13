import { useCallback, useEffect, useState } from 'react'
import type { Kontrahent, ListKontrahenciOptions } from '@shared/types/kontrahent'
import { parseIpcError } from '@shared/utils/ipcError'

interface UseKontrahenciOptions extends ListKontrahenciOptions {
  // Pozwala odroczyć pobieranie (np. dopóki dropdown pickera nie zostanie otwarty).
  enabled?: boolean
}

interface UseKontrahenciResult {
  kontrahenci: Kontrahent[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useKontrahenci(options: UseKontrahenciOptions = {}): UseKontrahenciResult {
  const { search, includeInactive, enabled = true } = options
  const [kontrahenci, setKontrahenci] = useState<Kontrahent[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const refetch = useCallback(() => setReloadToken((t) => t + 1), [])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    async function load(): Promise<void> {
      setLoading(true)
      setError(null)
      try {
        const data = await window.api.kontrahenci.list({ search, includeInactive })
        if (!cancelled) setKontrahenci(data)
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
  }, [search, includeInactive, enabled, reloadToken])

  return { kontrahenci, loading, error, refetch }
}
