/**
 * PRESA DEL RICONOSCIMENTO FOTO.
 *
 * Con VITE_VISION_URL impostato, la foto (ridotta a 1280 px) va al worker in /worker,
 * che la passa a Claude e restituisce gli ingredienti riconosciuti.
 * Senza, l'app resta in modalità dimostrativa e lo dice chiaramente all'utente.
 */
import { INGREDIENT_BY_ID } from '@/content/ingredients'

export interface ScanResult {
  items: { id: string; confidence: 'alta' | 'media' }[]
  unknown: string[]
  demo: boolean
}

const ENDPOINT = (import.meta.env.VITE_VISION_URL as string | undefined)?.replace(/\/$/, '')
export const VISION_IS_DEMO = !ENDPOINT

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
  if (!ENDPOINT) {
    // Modalità dimostrativa: un risultato d'esempio, segnalato come tale nell'interfaccia.
    await new Promise((r) => setTimeout(r, 1600))
    const sample = ['uova', 'latte', 'zucchine', 'pomodori', 'mozzarella', 'carote', 'yogurt', 'limone']
    return { items: sample.map((id, i) => ({ id, confidence: i < 6 ? 'alta' : 'media' })), unknown: [], demo: true }
  }
  const image = await fileToJpegBase64(file)
  const res = await fetch(`${ENDPOINT}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, mediaType: 'image/jpeg' }),
  })
  if (!res.ok) {
    const { error } = (await res.json().catch(() => ({ error: 'network' }))) as { error?: string }
    throw new ScanError(error ?? 'network')
  }
  const data = (await res.json()) as Omit<ScanResult, 'demo'>
  // difesa in profondità: teniamo solo id che esistono davvero nel catalogo
  return { items: data.items.filter((x) => INGREDIENT_BY_ID[x.id]), unknown: data.unknown ?? [], demo: false }
}

export const SCAN_ERRORS: Record<string, string> = {
  busy: 'Troppe richieste in questo momento. Riprova tra poco.',
  refused: 'Non siamo riusciti ad analizzare questa foto. Provane un\'altra.',
  image_too_large: 'La foto è troppo grande.',
  network: 'Connessione assente. Riprova quando sei online.',
}
