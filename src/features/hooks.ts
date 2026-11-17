// Dati derivati dallo store, calcolati una volta per render.
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRecipes } from '@/content/catalog'
import { todayISO } from '@/domain/dates'
import { matchAll } from '@/domain/matching'
import { accessOf, isPremium, useApp } from '@/store/app'

export const useToday = () => todayISO()

export function useAccess() {
  const { subscription, packs } = useApp(useShallow((s) => ({ subscription: s.subscription, packs: s.packs })))
  return useMemo(() => accessOf({ subscription, packs }), [subscription, packs])
}

export const usePremium = () => useApp((s) => isPremium(s))

export function useMatches(includeLocked = false) {
  const { pantry, diets, allergies } = useApp(useShallow((s) => ({ pantry: s.pantry, diets: s.diets, allergies: s.allergies })))
  const access = useAccess()
  const today = useToday()
  // le ricette dei pacchetti si scaricano solo se l'utente le può usare o le vuole vedere
  const recipes = useRecipes(includeLocked || access.premium || access.packs.length > 0)
  return useMemo(
    () => matchAll(recipes, pantry, { profile: { diets, allergies }, access, today, includeLocked }),
    [recipes, pantry, diets, allergies, access, today, includeLocked],
  )
}
