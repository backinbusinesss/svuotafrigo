// Il cuore di SvuotaFrigo: quali ricette puoi fare con quello che hai,
// dando la precedenza a ciò che sta per scadere.
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { daysLeft } from './pantry'
import type { Allergen, Diet, PackId, PantryItem, Recipe } from './types'

export interface Profile {
  diets: Diet[]
  allergies: Allergen[]
}

export interface Access {
  premium: boolean
  packs: PackId[]
}

export type MatchKind = 'pronta' | 'quasi' | 'lontana'

export interface RecipeMatch {
  recipe: Recipe
  kind: MatchKind
  /** 0-100: quanta parte degli ingredienti necessari hai */
  coverage: number
  score: number
  have: string[]
  missing: string[]
  /** ingredienti in scadenza (≤3 giorni) che la ricetta usa */
  rescues: string[]
  locked: boolean
}

const isStaple = (id: string) => !!INGREDIENT_BY_ID[id]?.staple

/** Ingredienti "che contano": non facoltativi e non di base (sale, olio…). */
export function requiredIds(recipe: Recipe): string[] {
  return recipe.ingredients.filter((x) => !x.optional && !isStaple(x.id)).map((x) => x.id)
}

/** Facoltativi utili: contano per il punteggio ma non bloccano la ricetta. */
function optionalIds(recipe: Recipe): string[] {
  return recipe.ingredients.filter((x) => x.optional && !isStaple(x.id)).map((x) => x.id)
}

/** La ricetta rispetta dieta e allergie? (Gli ingredienti facoltativi si possono saltare.) */
export function fitsProfile(recipe: Recipe, profile: Profile): boolean {
  for (const ri of recipe.ingredients) {
    if (ri.optional) continue
    const ing = INGREDIENT_BY_ID[ri.id]
    if (!ing) continue
    if (ing.notFor?.some((d) => profile.diets.includes(d))) return false
    if (ing.allergens?.some((a) => profile.allergies.includes(a))) return false
  }
  return true
}

/** Facoltativi da evitare per il profilo (da segnalare nella ricetta). */
export function optionalConflicts(recipe: Recipe, profile: Profile): string[] {
  return recipe.ingredients
    .filter((ri) => ri.optional)
    .filter((ri) => {
      const ing = INGREDIENT_BY_ID[ri.id]
      return !!ing && (ing.notFor?.some((d) => profile.diets.includes(d)) || ing.allergens?.some((a) => profile.allergies.includes(a)))
    })
    .map((ri) => ri.id)
}

export const isLocked = (recipe: Recipe, access: Access) =>
  !!recipe.pack && !access.premium && !access.packs.includes(recipe.pack)

export function matchRecipe(recipe: Recipe, pantry: PantryItem[], today: string, access: Access): RecipeMatch {
  const inFridge = new Map(pantry.map((p) => [p.ingredientId, p]))
  const req = requiredIds(recipe)
  const have = req.filter((id) => inFridge.has(id))
  const missing = req.filter((id) => !inFridge.has(id))
  const optHave = optionalIds(recipe).filter((id) => inFridge.has(id))

  const used = [...have, ...optHave]
  const rescues = used.filter((id) => {
    const d = daysLeft(inFridge.get(id)!, today)
    return d >= 0 && d <= 3
  })

  // Ricette senza ingredienti obbligatori (solo facoltativi): contano quelli che hai
  const coverage = req.length ? Math.round((have.length / req.length) * 100) : optHave.length ? 100 : 0
  const kind: MatchKind = req.length && missing.length === 0 ? 'pronta'
    : !req.length && optHave.length >= 2 ? 'pronta'
    : missing.length <= 2 && have.length >= 1 ? 'quasi'
    : 'lontana'

  const urgency = rescues.reduce((s, id) => s + (4 - Math.max(0, daysLeft(inFridge.get(id)!, today))) * 6, 0)
  const score = coverage + urgency + optHave.length * 4 - missing.length * 12 - (recipe.minutes > 45 ? 4 : 0)

  return { recipe, kind, coverage, score, have: used, missing, rescues, locked: isLocked(recipe, access) }
}

export interface MatchOptions {
  profile: Profile
  access: Access
  today: string
  /** includi anche le ricette bloccate (mostrate col lucchetto, per invogliare all'acquisto) */
  includeLocked?: boolean
}

export function matchAll(recipes: Recipe[], pantry: PantryItem[], opts: MatchOptions): RecipeMatch[] {
  return recipes
    .filter((r) => fitsProfile(r, opts.profile))
    .map((r) => matchRecipe(r, pantry, opts.today, opts.access))
    .filter((m) => opts.includeLocked || !m.locked)
    .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes)
}

/** Scala le quantità per un numero diverso di porzioni, arrotondando in modo leggibile. */
export function scaleQty(qty: number, from: number, to: number): number {
  const v = (qty * to) / from
  if (v >= 100) return Math.round(v / 10) * 10
  if (v >= 10) return Math.round(v)
  return Math.round(v * 2) / 2
}
