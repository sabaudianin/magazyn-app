import { useCallback, useEffect, useState } from 'react'
import type { DokumentListItem, DokumentTyp } from '@shared/types/dokument'
import { parseIpcError } from '@shared/utils/ipcError'

interface UseDokumentyOptions {
  typ?: DokumentTyp
  dataOd?: string
  dataDo?: string
  search?: string
}

interface UseDokumentyResult {
  dokumenty: DokumentListItem[]
  setDokumenty: React.Dispatch<React.SetStateAction<DokumentListItem[]>>
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDokumenty(options: UseDokumentyOptions = {}): UseDokumentyResult {
  const { typ, dataOd, dataDo, search } = options
  const [dokumenty, setDokumenty] = useState<DokumentListItem[]>([])
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
        const data = await window.api.dokumenty.list({ typ, dataOd, dataDo, search })
        if (!cancelled) setDokumenty(data)
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
  }, [typ, dataOd, dataDo, search, reloadToken])

  return { dokumenty, setDokumenty, loading, error, refetch }
}
