export interface IpcErrorPayload {
  code: string
  message: string
}

/**
 * Handlery main-procesu serializują błędy jako JSON w Error.message (patrz main/ipc/handleIpc.ts).
 * Electron owija tę wiadomość dodatkowym prefiksem przy przejściu przez IPC, więc szukamy
 * ostatniego fragmentu wyglądającego jak JSON zamiast parsować całość.
 */
export function parseIpcError(error: unknown): IpcErrorPayload {
  const raw = error instanceof Error ? error.message : String(error)
  const jsonStart = raw.indexOf('{')
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(raw.slice(jsonStart)) as Partial<IpcErrorPayload>
      if (typeof parsed.code === 'string' && typeof parsed.message === 'string') {
        return { code: parsed.code, message: parsed.message }
      }
    } catch {
      // nie JSON — spadamy do surowej wiadomości poniżej
    }
  }
  return { code: 'UNKNOWN', message: raw }
}
