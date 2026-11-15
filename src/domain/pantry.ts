// Il frigo: scadenze e stato di freschezza.
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { addDays, daysBetween } from './dates'
import type { PantryItem } from './types'

export type Freshness = 'scaduto' | 'oggi' | 'presto' | 'ok' | 'lunga'

export function newPantryItem(ingredientId: string, today: string, expiresAt?: string): PantryItem {
  const ing = INGREDIENT_BY_ID[ingredientId]
  if (!ing) throw new Error(`Ingrediente sconosciuto: ${ingredientId}`)
  return { ingredientId, addedAt: today, expiresAt: expiresAt ?? addDays(today, ing.shelfDays) }
}

export const daysLeft = (item: PantryItem, today: string) => daysBetween(today, item.expiresAt)

export function freshness(item: PantryItem, today: string): Freshness {
  const d = daysLeft(item, today)
  if (d < 0) return 'scaduto'
  if (d === 0) return 'oggi'
  if (d <= 2) return 'presto'
  if (d <= 14) return 'ok'
  return 'lunga'
}

/** Da usare per primi: scaduti esclusi, ordinati per scadenza. */
export function expiringSoon(items: PantryItem[], today: string, withinDays = 3): PantryItem[] {
  return items
    .filter((it) => {
      const d = daysLeft(it, today)
      return d >= 0 && d <= withinDays
    })
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
}

export function sortPantry(items: PantryItem[]): PantryItem[] {
  return [...items].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
}

/** Ricerca ingredienti per nome o alias, senza accenti né maiuscole. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function searchIngredients(query: string, limit = 12) {
  const q = normalize(query)
  if (!q) return []
  const scored: { id: string; score: number }[] = []
  for (const ing of Object.values(INGREDIENT_BY_ID)) {
    const names = [ing.name, ...(ing.aliases ?? [])].map(normalize)
    let best = -1
    for (const n of names) {
      if (n === q) best = Math.max(best, 100)
      else if (n.startsWith(q)) best = Math.max(best, 80 - n.length / 10)
      else if (n.split(/\s+/).some((w) => w.startsWith(q))) best = Math.max(best, 60)
      else if (n.includes(q)) best = Math.max(best, 40)
    }
    if (best >= 0) scored.push({ id: ing.id, score: best - (ing.staple ? 5 : 0) })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => INGREDIENT_BY_ID[s.id])
}

/** Trova l'ingrediente da un testo libero (es. etichetta del riconoscimento foto). */
export function matchIngredient(label: string) {
  const [first] = searchIngredients(label, 1)
  return first ?? null
}
