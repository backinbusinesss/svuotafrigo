/**
 * Collegamento al worker (worker/). L'indirizzo arriva da VITE_API_URL al momento della build.
 * All'avvio l'app chiede /config: foto e pagamenti reali si attivano solo se il worker
 * ha le chiavi; altrimenti restano in modalità dimostrativa, dichiarata all'utente.
 */
import { create } from 'zustand'

export const API_URL = ((import.meta.env.VITE_API_URL || import.meta.env.VITE_VISION_URL) as string | undefined)?.replace(/\/$/, '') || ''

export interface ApiConfig { vision: boolean; payments: boolean }

export const useApiConfig = create<ApiConfig & { loaded: boolean }>(() => ({ vision: false, payments: false, loaded: !API_URL }))

let loading: Promise<ApiConfig> | null = null
export function loadApiConfig(): Promise<ApiConfig> {
  if (!API_URL) return Promise.resolve({ vision: false, payments: false })
  loading ??= fetch(`${API_URL}/config`)
    .then((r) => (r.ok ? (r.json() as Promise<ApiConfig>) : { vision: false, payments: false }))
    .catch(() => ({ vision: false, payments: false }))
    .then((c) => {
      useApiConfig.setState({ ...c, loaded: true })
      return c
    })
  return loading
}

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code)
  }
}

export async function api<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new ApiError('network', 0)
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new ApiError(data.error ?? 'http', res.status)
  return data
}
