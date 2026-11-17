// Scontrino furbo: quote mensili e riepilogo della spesa per reparto.
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { FREE_LIMITS } from './plans'
import type { Aisle, Receipt } from './types'

/** "2026-11-17" → "2026-11" */
export const monthKey = (isoDate: string) => isoDate.slice(0, 7)

/** Scontrini gratis rimasti nel mese di `today` (la quota riparte ogni mese). */
export function receiptsLeft(quota: { month: string; used: number }, today: string): number {
  const used = quota.month === monthKey(today) ? quota.used : 0
  return Math.max(0, FREE_LIMITS.receiptsPerMonth - used)
}

export interface Spending {
  /** totale speso nel mese: somma dei totali degli scontrini (o delle righe, se il totale manca) */
  total: number
  receipts: number
  /** spesa alimentare per reparto, dalla più alta */
  byAisle: { aisle: Aisle; amount: number }[]
}

export function receiptTotal(r: Receipt): number {
  if (r.total != null) return r.total
  return r.items.reduce((sum, it) => sum + (it.price ?? 0), 0)
}

/** Riepilogo della spesa nel mese di `today`. */
export function monthlySpending(receipts: Receipt[], today: string): Spending {
  const month = monthKey(today)
  const mine = receipts.filter((r) => monthKey(r.date) === month)
  const map = new Map<Aisle, number>()
  for (const r of mine) {
    for (const it of r.items) {
      const aisle = INGREDIENT_BY_ID[it.id]?.aisle
      if (!aisle || it.price == null) continue
      map.set(aisle, (map.get(aisle) ?? 0) + it.price)
    }
  }
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    total: round(mine.reduce((s, r) => s + receiptTotal(r), 0)),
    receipts: mine.length,
    byAisle: [...map].map(([aisle, amount]) => ({ aisle, amount: round(amount) })).sort((a, b) => b.amount - a.amount),
  }
}
