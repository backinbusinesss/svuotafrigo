import { describe, expect, it } from 'vitest'
import { monthKey, monthlySpending, receiptsLeft } from '@/domain/receipts'
import type { Receipt } from '@/domain/types'

const r = (id: string, date: string, total: number | null, items: Receipt['items']): Receipt => ({ id, date, store: null, total, items })

describe('scontrino furbo', () => {
  it('1 scontrino gratis al mese, che riparte il mese dopo', () => {
    expect(receiptsLeft({ month: '', used: 0 }, '2026-11-17')).toBe(1)
    expect(receiptsLeft({ month: '2026-11', used: 1 }, '2026-11-30')).toBe(0)
    expect(receiptsLeft({ month: '2026-11', used: 1 }, '2026-12-01')).toBe(1)
  })

  it('riepilogo del mese: totale e spesa per reparto', () => {
    const list = [
      r('a', '2026-11-03', 20, [{ id: 'latte', price: 1.5 }, { id: 'zucchine', price: 2 }, { id: 'pomodori', price: 3 }]),
      r('b', '2026-11-10', null, [{ id: 'petto-pollo', price: 6 }, { id: 'uova', price: null }]),
      r('c', '2026-10-28', 99, [{ id: 'latte', price: 1 }]),
    ]
    const s = monthlySpending(list, '2026-11-17')
    expect(s.receipts).toBe(2)
    expect(s.total).toBe(26)
    expect(s.byAisle[0]).toEqual({ aisle: 'carne-pesce', amount: 6 })
    expect(s.byAisle.find((x) => x.aisle === 'frutta-verdura')?.amount).toBe(5)
    expect(monthKey('2026-11-17')).toBe('2026-11')
  })
})
