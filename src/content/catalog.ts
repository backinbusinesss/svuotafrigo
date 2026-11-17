// Il ricettario che l'app vede in un dato momento.
//
// All'avvio ci sono solo le ricette di base (recipes.ts). Le ricette dei pacchetti
// (pack-recipes.ts) sono un chunk a parte che si scarica la prima volta che serve:
// chi ha Premium o un pacchetto, chi apre la lista completa con le ricette bloccate,
// il piano della settimana, o una ricetta che non è tra quelle di base.
// Dopo il primo download il service worker lo tiene in cache, quindi funziona offline.
import { useEffect, useSyncExternalStore } from 'react'
import type { Recipe } from '@/domain/types'
import { BASE_RECIPES } from './recipes'

const index = (list: Recipe[]) => Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, Recipe>

let all: Recipe[] = BASE_RECIPES
let byId = index(all)
let loaded = false
let failed = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

export const getRecipes = () => all
export const getRecipe = (id: string): Recipe | undefined => byId[id]
export const packRecipesLoaded = () => loaded
const settled = () => loaded || failed

/** Scarica le ricette dei pacchetti (una volta sola). */
export function loadPackRecipes(): Promise<void> {
  loading ??= import('./pack-recipes')
    .then(({ PACK_RECIPES }) => {
      const known = new Set(BASE_RECIPES.map((x) => x.id))
      all = [...BASE_RECIPES, ...PACK_RECIPES.filter((x) => !known.has(x.id))]
      byId = index(all)
      loaded = true
      failed = false
      listeners.forEach((fn) => fn())
    })
    .catch((err) => {
      loading = null // offline al primo tentativo: si riprova la volta dopo
      failed = true
      listeners.forEach((fn) => fn())
      throw err
    })
  return loading
}

const ensure = () => { if (!loaded) loadPackRecipes().catch(() => {}) }

/** Le ricette disponibili ora; con `needPacks` scarica anche quelle dei pacchetti. */
export function useRecipes(needPacks: boolean): Recipe[] {
  const list = useSyncExternalStore(subscribe, getRecipes)
  useEffect(() => { if (needPacks) ensure() }, [needPacks])
  return list
}

/** Una ricetta per id; se non è tra quelle di base la scarica. `pending` finché non arriva. */
export function useRecipe(id: string): { recipe: Recipe | undefined; pending: boolean } {
  const recipe = useSyncExternalStore(subscribe, () => byId[id])
  const done = useSyncExternalStore(subscribe, settled)
  useEffect(() => { if (!recipe) ensure() }, [recipe])
  return { recipe, pending: !recipe && !done }
}
