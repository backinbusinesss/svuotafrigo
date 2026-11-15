import { addDays, todayISO } from '@/domain/dates'
import { useApp } from '@/store/app'

const today = todayISO()
const item = (ingredientId: string, d: number) => ({ ingredientId, addedAt: today, expiresAt: addDays(today, d) })

beforeEach(() => useApp.getState().resetAll())

describe('store', () => {
  it('cucinare toglie i freschi e ciò che scade, lascia uova e formaggi stagionati', () => {
    useApp.setState({ pantry: [item('spinaci', 0), item('zucchine', 5), item('uova', 14), item('parmigiano', 40), item('cipolla', 25), item('riso', 300)] })
    const entry = useApp.getState().cook('frittata-verdure')
    const left = useApp.getState().pantry.map((p) => p.ingredientId).sort()
    expect(left).toEqual(['cipolla', 'parmigiano', 'riso', 'uova'])
    expect(entry.savedEuro).toBeGreaterThan(0)
    expect(useApp.getState().cooked).toHaveLength(1)
  })

  it('la spesa spuntata finisce in frigo con la scadenza stimata', () => {
    const s = useApp.getState()
    s.addToShopping(['latte', 'mele'], 'pancake')
    s.toggleShopping('latte')
    expect(useApp.getState().moveCheckedToPantry()).toBe(1)
    expect(useApp.getState().pantry.map((p) => p.ingredientId)).toEqual(['latte'])
    expect(useApp.getState().shopping.map((x) => x.ingredientId)).toEqual(['mele'])
  })

  it('la prova gratuita vale una volta sola', () => {
    useApp.getState().activatePlan('premium-year', true)
    expect(useApp.getState().subscription.trialEndsAt).toBe(addDays(today, 7))
    useApp.getState().cancelPlan()
    expect(useApp.getState().subscription.plan).toBe('free')
  })
})
