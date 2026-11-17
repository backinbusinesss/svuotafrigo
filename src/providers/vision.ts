/**
 * PRESA DEL RICONOSCIMENTO FOTO.
 *
 * Se il worker (VITE_API_URL) ha la chiave Anthropic, la foto (ridotta a 1280 px) va al worker,
 * che la passa a Claude e restituisce gli ingredienti riconosciuti.
 * Altrimenti l'app resta in modalità dimostrativa e lo dice chiaramente all'utente.
 */
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { ApiError, api, loadApiConfig } from './api'

export interface ScanResult {
  items: { id: string; confidence: 'alta' | 'media' }[]
  unknown: string[]
  demo: boolean
}


/** Ridimensiona e comprime la foto nel browser: meno dati, più veloce, più economico. */
export async function fileToJpegBase64(file: File, maxSide = 1280): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}

export class ScanError extends Error {
  constructor(public code: string) {
    super(code)
  }
}

export async function scanPhoto(file: File): Promise<ScanResult> {
  const { vision } = await loadApiConfig()
  if (!vision) {
    // Modalità dimostrativa: un risultato d'esempio, segnalato come tale nell'interfaccia.
    await new Promise((r) => setTimeout(r, 1600))
    const sample = ['uova', 'latte', 'zucchine', 'pomodori', 'mozzarella', 'carote', 'yogurt', 'limone']
    return { items: sample.map((id, i) => ({ id, confidence: i < 6 ? 'alta' : 'media' })), unknown: [], demo: true }
  }
  const image = await fileToJpegBase64(file)
  let data: Omit<ScanResult, 'demo'>
  try {
    data = await api<Omit<ScanResult, 'demo'>>('/scan', { image, mediaType: 'image/jpeg' })
  } catch (e) {
    throw new ScanError(e instanceof ApiError ? e.code : 'network')
  }
  // difesa in profondità: teniamo solo id che esistono davvero nel catalogo
  return { items: data.items.filter((x) => INGREDIENT_BY_ID[x.id]), unknown: data.unknown ?? [], demo: false }
}

export interface ReceiptResult {
  store: string | null
  total: number | null
  items: { id: string; price: number | null }[]
  unknown: string[]
  demo: boolean
}

/** Legge uno scontrino: prodotti riconosciuti con il prezzo pagato. */
export async function scanReceipt(file: File): Promise<ReceiptResult> {
  const { vision } = await loadApiConfig()
  if (!vision) {
    await new Promise((r) => setTimeout(r, 1600))
    const sample: [string, number][] = [['latte', 1.49], ['uova', 2.39], ['mozzarella', 1.19], ['zucchine', 1.8], ['pomodori', 2.1], ['petto-pollo', 5.9], ['pasta', 0.99], ['yogurt', 1.65]]
    return { store: 'Supermercato (esempio)', total: 17.51, items: sample.map(([id, price]) => ({ id, price })), unknown: ['carta da forno'], demo: true }
  }
  // gli scontrini sono lunghi e stretti: teniamo più risoluzione per leggere le righe
  const image = await fileToJpegBase64(file, 2000)
  let data: Omit<ReceiptResult, 'demo'>
  try {
    data = await api<Omit<ReceiptResult, 'demo'>>('/receipt', { image, mediaType: 'image/jpeg' })
  } catch (e) {
    throw new ScanError(e instanceof ApiError ? e.code : 'network')
  }
  const price = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 1000 ? Math.round(n * 100) / 100 : null)
  const seen = new Set<string>()
  const items = data.items.filter((x) => INGREDIENT_BY_ID[x.id] && !seen.has(x.id) && seen.add(x.id)).map((x) => ({ id: x.id, price: price(x.price) }))
  return { store: data.store?.slice(0, 60) || null, total: price(data.total), items, unknown: data.unknown ?? [], demo: false }
}

export const SCAN_ERRORS: Record<string, string> = {
  busy: 'Troppe richieste in questo momento. Riprova tra poco.',
  refused: 'Non siamo riusciti ad analizzare questa foto. Provane un\'altra.',
  image_too_large: 'La foto è troppo grande.',
  network: 'Connessione assente. Riprova quando sei online.',
}
