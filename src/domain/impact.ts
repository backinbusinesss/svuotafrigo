// Impatto anti-spreco e traguardi. Sono STIME: le mostriamo sempre come tali.
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { addDays, daysBetween } from './dates'
import { daysLeft } from './pantry'
import type { CookedEntry, PantryItem } from './types'

/**
 * Quanto cibo "salvi" cucinando: conta solo gli ingredienti che scadevano entro 3 giorni,
 * valutati come metà confezione (in media non si butta tutto).
 */
export function rescueValue(used: PantryItem[], today: string) {
  let savedEuro = 0
  let savedGrams = 0
  for (const p of used) {
    if (daysLeft(p, today) > 3) continue
    const ing = INGREDIENT_BY_ID[p.ingredientId]
    if (!ing || ing.staple) continue
    savedEuro += ing.avgPrice / 2
    savedGrams += ing.avgGrams / 2
  }
  return { savedEuro: Math.round(savedEuro * 100) / 100, savedGrams: Math.round(savedGrams) }
}

export function totals(cooked: CookedEntry[], sinceISO?: string) {
  const list = sinceISO ? cooked.filter((c) => c.at.slice(0, 10) >= sinceISO) : cooked
  return {
    meals: list.length,
    euro: Math.round(list.reduce((s, c) => s + c.savedEuro, 0) * 100) / 100,
    grams: list.reduce((s, c) => s + c.savedGrams, 0),
  }
}

/** Giorni consecutivi (fino a oggi o ieri) in cui hai cucinato almeno una ricetta. */
export function streak(cooked: CookedEntry[], today: string): number {
  const days = new Set(cooked.map((c) => c.at.slice(0, 10)))
  let n = 0
  let cursor = today
  // la serie resta viva fino a fine giornata: se oggi non hai ancora cucinato, si parte da ieri
  if (!days.has(cursor)) cursor = addDays(cursor, -1)
  while (days.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

export interface Badge {
  id: string
  emoji: string
  name: string
  text: string
  earned: boolean
  progress: number
}

export function badges(cooked: CookedEntry[], today: string): Badge[] {
  const t = totals(cooked)
  const distinct = new Set(cooked.map((c) => c.recipeId)).size
  const usedIngredients = new Set(cooked.flatMap((c) => c.used)).size
  const s = streak(cooked, today)
  const lastWeek = cooked.filter((c) => daysBetween(c.at.slice(0, 10), today) <= 6).length
  const mk = (id: string, emoji: string, name: string, text: string, value: number, goal: number): Badge =>
    ({ id, emoji, name, text, earned: value >= goal, progress: Math.min(1, value / goal) })
  return [
    mk('primo-piatto', '🍳', 'Primo piatto', 'Cucina la tua prima ricetta', t.meals, 1),
    mk('salvatore', '🦸', 'Salvatore di avanzi', 'Salva cibo per 10 €', t.euro, 10),
    mk('chilo', '⚖️', 'Un chilo in meno', 'Salva 1 kg di cibo dalla pattumiera', t.grams, 1000),
    mk('serie-3', '🔥', 'In serie', 'Cucina 3 giorni di fila', s, 3),
    mk('serie-7', '🏆', 'Settimana perfetta', 'Cucina 7 giorni di fila', s, 7),
    mk('esploratore', '🧭', 'Esploratore', 'Prova 10 ricette diverse', distinct, 10),
    mk('dispensa', '🧺', 'Mani in pasta', 'Usa 25 ingredienti diversi', usedIngredients, 25),
    mk('settimana', '📅', 'Ritmo giusto', 'Cucina 5 volte in una settimana', lastWeek, 5),
    mk('cinquanta', '👨‍🍳', 'Chef di casa', 'Cucina 50 ricette', t.meals, 50),
  ]
}

export const formatKg = (g: number) =>
  g >= 1000 ? `${(g / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })} kg` : `${g} g`
