// Piano della settimana (Premium): sceglie le cene per usare prima ciò che scade,
// variare i piatti e comprare il meno possibile.
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { addDays, fromISODate } from './dates'
import { type Access, fitsProfile, isLocked, matchRecipe, type Profile, requiredIds } from './matching'
import type { MealPlanDay, PantryItem, Recipe, ShoppingItem } from './types'

const DINNER_COURSES = new Set(['primo', 'secondo', 'piatto-unico'])

export interface PlanInput {
  recipes: Recipe[]
  pantry: PantryItem[]
  profile: Profile
  access: Access
  start: string
  days?: number
  /** ricette da non ripetere (cucinate di recente) */
  avoid?: string[]
}

export interface PlanResult {
  days: MealPlanDay[]
  shopping: ShoppingItem[]
  /** ingredienti in scadenza che il piano riesce a usare */
  rescued: string[]
}

export function planWeek({ recipes, pantry, profile, access, start, days = 7, avoid = [] }: PlanInput): PlanResult {
  const pool = recipes.filter((r) => DINNER_COURSES.has(r.course) && fitsProfile(r, profile) && !isLocked(r, access))
  let fridge = [...pantry]
  const chosen: Recipe[] = []
  const usedMain = new Map<string, number>()
  const rescued = new Set<string>()
  const toBuy = new Map<string, Set<string>>()

  for (let d = 0; d < days; d++) {
    const date = addDays(start, d)
    let best: { r: Recipe; score: number } | null = null
    for (const r of pool) {
      if (chosen.includes(r)) continue
      const m = matchRecipe(r, fridge, date, access)
      let score = m.score
      if (avoid.includes(r.id)) score -= 25
      // varietà: penalizza lo stesso ingrediente principale e la stessa portata del giorno prima
      const main = requiredIds(r)[0]
      if (main) score -= (usedMain.get(main) ?? 0) * 18
      const prev = chosen[chosen.length - 1]
      if (prev && prev.course === r.course) score -= 6
      // il weekend permette ricette più lunghe
      const weekend = [0, 6].includes(fromISODate(date).getDay())
      if (!weekend && r.minutes > 40) score -= 10
      if (!best || score > best.score) best = { r, score }
    }
    if (!best) break
    const r = best.r
    chosen.push(r)
    const main = requiredIds(r)[0]
    if (main) usedMain.set(main, (usedMain.get(main) ?? 0) + 1)

    const m = matchRecipe(r, fridge, date, access)
    m.rescues.forEach((id) => rescued.add(id))
    for (const id of m.missing) {
      if (!toBuy.has(id)) toBuy.set(id, new Set())
      toBuy.get(id)!.add(r.id)
    }
    // ciò che la ricetta usa esce dal frigo (gli ingredienti comprati si considerano consumati)
    const usedIds = new Set(m.have)
    fridge = fridge.filter((p) => !usedIds.has(p.ingredientId))
  }

  return {
    days: chosen.map((r, i) => ({ date: addDays(start, i), recipeId: r.id, done: false })),
    shopping: [...toBuy.entries()].map(([ingredientId, rs]) => ({ ingredientId, checked: false, forRecipes: [...rs] })),
    rescued: [...rescued],
  }
}

/** Unisce nuove voci alla lista della spesa senza duplicati. */
export function mergeShopping(list: ShoppingItem[], add: ShoppingItem[]): ShoppingItem[] {
  const out = list.map((x) => ({ ...x, forRecipes: [...x.forRecipes] }))
  for (const item of add) {
    const ex = out.find((x) => x.ingredientId === item.ingredientId)
    if (ex) {
      ex.checked = ex.checked && item.checked
      ex.forRecipes = [...new Set([...ex.forRecipes, ...item.forRecipes])]
    } else out.push({ ...item, forRecipes: [...item.forRecipes] })
  }
  return out
}

/** Lista della spesa raggruppata per corsia del supermercato. */
export function groupByAisle(list: ShoppingItem[]) {
  const groups = new Map<string, ShoppingItem[]>()
  for (const it of list) {
    const aisle = INGREDIENT_BY_ID[it.ingredientId]?.aisle ?? 'dispensa'
    if (!groups.has(aisle)) groups.set(aisle, [])
    groups.get(aisle)!.push(it)
  }
  return groups
}
