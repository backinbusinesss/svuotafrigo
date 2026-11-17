// Tutto il ricettario caricato insieme. Solo per test e script: l'app usa catalog.ts.
import type { Recipe } from '@/domain/types'
import { PACK_RECIPES } from './pack-recipes'
import { BASE_RECIPES } from './recipes'

export const RECIPES: Recipe[] = [...BASE_RECIPES, ...PACK_RECIPES]
export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((x) => [x.id, x]))
