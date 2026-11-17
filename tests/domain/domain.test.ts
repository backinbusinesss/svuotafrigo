import { RECIPE_BY_ID, RECIPES } from '@/content/all-recipes'
import { addDays, daysBetween, relativeDays } from '@/domain/dates'
import { badges, rescueValue, streak, totals } from '@/domain/impact'
import { fitsProfile, matchAll, matchRecipe, scaleQty } from '@/domain/matching'
import { expiringSoon, freshness, newPantryItem, searchIngredients } from '@/domain/pantry'
import { groupByAisle, mergeShopping, planWeek } from '@/domain/planner'
import type { CookedEntry, PantryItem } from '@/domain/types'

const TODAY = '2026-11-16'
const FREE = { premium: false, packs: [] as never[] }
const PREMIUM = { premium: true, packs: [] as never[] }
const NO_PROFILE = { diets: [], allergies: [] }
const fridge = (...ids: string[]): PantryItem[] => ids.map((id) => newPantryItem(id, TODAY))

describe('date', () => {
  it('somma giorni attraverso i mesi e l\'ora legale', () => {
    expect(addDays('2026-10-24', 3)).toBe('2026-10-27')
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02')
    expect(daysBetween('2026-03-28', '2026-03-31')).toBe(3)
  })
  it('parla come una persona', () => {
    expect(relativeDays(0)).toBe('oggi')
    expect(relativeDays(1)).toBe('domani')
    expect(relativeDays(4)).toBe('tra 4 giorni')
    expect(relativeDays(-2)).toBe('2 giorni fa')
  })
})

describe('frigo', () => {
  it('stima la scadenza dalla durata tipica', () => {
    expect(newPantryItem('latte', TODAY).expiresAt).toBe(addDays(TODAY, 5))
  })
  it('classifica la freschezza', () => {
    const it = (d: number) => ({ ingredientId: 'latte', addedAt: TODAY, expiresAt: addDays(TODAY, d) })
    expect(freshness(it(-1), TODAY)).toBe('scaduto')
    expect(freshness(it(0), TODAY)).toBe('oggi')
    expect(freshness(it(2), TODAY)).toBe('presto')
    expect(freshness(it(10), TODAY)).toBe('ok')
    expect(freshness(it(40), TODAY)).toBe('lunga')
  })
  it('mette in cima ciò che scade prima, esclusi gli scaduti', () => {
    const items = [
      { ingredientId: 'latte', addedAt: TODAY, expiresAt: addDays(TODAY, 2) },
      { ingredientId: 'uova', addedAt: TODAY, expiresAt: addDays(TODAY, 1) },
      { ingredientId: 'burro', addedAt: TODAY, expiresAt: addDays(TODAY, -1) },
      { ingredientId: 'riso', addedAt: TODAY, expiresAt: addDays(TODAY, 90) },
    ]
    expect(expiringSoon(items, TODAY).map((x) => x.ingredientId)).toEqual(['uova', 'latte'])
  })
  it('cerca senza accenti, per alias e per inizio parola', () => {
    expect(searchIngredients('pomodoro')[0].id).toBe('pomodori')
    expect(searchIngredients('ciliegini')[0].id).toBe('pomodorini')
    expect(searchIngredients('caffe')[0].id).toBe('caffe')
    expect(searchIngredients('zucch')[0].id).toBe('zucchine')
    expect(searchIngredients('grana')[0].id).toBe('grana')
    expect(searchIngredients('')).toEqual([])
  })
})

describe('abbinamento ricette', () => {
  it('le varianti contano come l’ingrediente base (spaghetti → pasta, guanciale → pancetta)', () => {
    const pantry: PantryItem[] = ['spaghetti', 'guanciale', 'pecorino-romano', 'uova-bio'].map((id) => ({ ingredientId: id, addedAt: TODAY, expiresAt: addDays(TODAY, 2) }))
    const m = matchRecipe(RECIPE_BY_ID.carbonara, pantry, TODAY, FREE)
    expect(m.kind).toBe('pronta')
    expect(m.rescues.length).toBeGreaterThan(0)
  })
  it('la carbonara è pronta con uova, pancetta, pecorino e pasta (sale e pepe si danno per scontati)', () => {
    const m = matchRecipe(RECIPE_BY_ID.carbonara, fridge('pasta', 'uova', 'pancetta', 'pecorino'), TODAY, FREE)
    expect(m.kind).toBe('pronta')
    expect(m.missing).toEqual([])
    expect(m.coverage).toBe(100)
  })
  it('segnala cosa manca', () => {
    const m = matchRecipe(RECIPE_BY_ID.carbonara, fridge('pasta', 'uova'), TODAY, FREE)
    expect(m.kind).toBe('quasi')
    expect(m.missing.sort()).toEqual(['pancetta', 'pecorino'])
  })
  it('premia le ricette che salvano ingredienti in scadenza', () => {
    const items: PantryItem[] = [
      { ingredientId: 'zucchine', addedAt: TODAY, expiresAt: addDays(TODAY, 1) },
      ...fridge('pasta', 'cipolla', 'parmigiano', 'uova'),
    ]
    const res = matchAll(RECIPES, items, { profile: NO_PROFILE, access: FREE, today: TODAY })
    const top = res.slice(0, 5).map((m) => m.recipe.id)
    expect(top.some((id) => ['pasta-zucchine', 'frittata-verdure'].includes(id))).toBe(true)
    expect(res.find((m) => m.recipe.id === 'pasta-zucchine')!.rescues).toContain('zucchine')
  })
  it('rispetta diete e allergie', () => {
    expect(fitsProfile(RECIPE_BY_ID.carbonara, { diets: ['vegetariano'], allergies: [] })).toBe(false)
    expect(fitsProfile(RECIPE_BY_ID['pasta-ceci'], { diets: ['vegano'], allergies: [] })).toBe(true)
    expect(fitsProfile(RECIPE_BY_ID['pasta-gorgonzola-noci'], { diets: [], allergies: ['frutta-secca'] })).toBe(false)
    // il parmigiano nel pomodoro e basilico è facoltativo: la ricetta resta valida per i vegani
    expect(fitsProfile(RECIPE_BY_ID['pomodoro-basilico'], { diets: ['vegano'], allergies: [] })).toBe(true)
  })
  it('nasconde le ricette dei pacchetti a chi non li ha, salvo richiesta', () => {
    const items = fridge('mascarpone', 'uova', 'biscotti', 'caffe')
    const free = matchAll(RECIPES, items, { profile: NO_PROFILE, access: FREE, today: TODAY })
    expect(free.find((m) => m.recipe.id === 'tiramisu')).toBeUndefined()
    const withLocked = matchAll(RECIPES, items, { profile: NO_PROFILE, access: FREE, today: TODAY, includeLocked: true })
    expect(withLocked.find((m) => m.recipe.id === 'tiramisu')!.locked).toBe(true)
    const paid = matchAll(RECIPES, items, { profile: NO_PROFILE, access: { premium: false, packs: ['dolci'] }, today: TODAY })
    expect(paid.find((m) => m.recipe.id === 'tiramisu')!.locked).toBe(false)
  })
  it('scala le porzioni con arrotondamenti leggibili', () => {
    expect(scaleQty(200, 2, 4)).toBe(400)
    expect(scaleQty(3, 2, 3)).toBe(4.5)
    expect(scaleQty(1, 2, 3)).toBe(1.5)
    expect(scaleQty(150, 2, 3)).toBe(230)
  })
})

describe('piano della settimana', () => {
  it('fa 7 cene diverse, usa ciò che scade e prepara la spesa', () => {
    const items: PantryItem[] = [
      { ingredientId: 'spinaci', addedAt: TODAY, expiresAt: addDays(TODAY, 1) },
      { ingredientId: 'petto-pollo', addedAt: TODAY, expiresAt: addDays(TODAY, 2) },
      ...fridge('pasta', 'uova', 'riso', 'parmigiano', 'cipolla', 'passata', 'limone'),
    ]
    const plan = planWeek({ recipes: RECIPES, pantry: items, profile: NO_PROFILE, access: PREMIUM, start: TODAY })
    expect(plan.days).toHaveLength(7)
    expect(new Set(plan.days.map((d) => d.recipeId)).size).toBe(7)
    expect(plan.rescued).toEqual(expect.arrayContaining(['spinaci', 'petto-pollo']))
    for (const s of plan.shopping) expect(items.map((i) => i.ingredientId)).not.toContain(s.ingredientId)
  })
  it('unisce la spesa senza duplicati e la ordina per corsia', () => {
    const a = [{ ingredientId: 'latte', checked: true, forRecipes: ['pancake'] }]
    const b = [{ ingredientId: 'latte', checked: false, forRecipes: ['porridge'] }, { ingredientId: 'mele', checked: false, forRecipes: [] }]
    const merged = mergeShopping(a, b)
    expect(merged).toHaveLength(2)
    expect(merged[0]).toEqual({ ingredientId: 'latte', checked: false, forRecipes: ['pancake', 'porridge'] })
    expect([...groupByAisle(merged).keys()].sort()).toEqual(['frutta-verdura', 'latticini'])
  })
})

describe('impatto', () => {
  it('conta solo gli ingredienti in scadenza', () => {
    const used: PantryItem[] = [
      { ingredientId: 'latte', addedAt: TODAY, expiresAt: addDays(TODAY, 1) },
      { ingredientId: 'riso', addedAt: TODAY, expiresAt: addDays(TODAY, 200) },
    ]
    expect(rescueValue(used, TODAY)).toEqual({ savedEuro: 0.7, savedGrams: 500 })
  })
  it('calcola serie, totali e traguardi', () => {
    const c = (day: string, euro = 1): CookedEntry => ({ recipeId: day, at: `${day}T20:00`, used: ['uova'], savedEuro: euro, savedGrams: 100 })
    const cooked = [c(addDays(TODAY, -1)), c(addDays(TODAY, -2)), c(addDays(TODAY, -3)), c(addDays(TODAY, -5), 8)]
    expect(streak(cooked, TODAY)).toBe(3)
    expect(totals(cooked)).toEqual({ meals: 4, euro: 11, grams: 400 })
    const b = badges(cooked, TODAY)
    expect(b.find((x) => x.id === 'serie-3')!.earned).toBe(true)
    expect(b.find((x) => x.id === 'salvatore')!.earned).toBe(true)
    expect(b.find((x) => x.id === 'serie-7')!.earned).toBe(false)
  })
})
