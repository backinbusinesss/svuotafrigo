// Dati derivati dallo store, calcolati una volta per render.
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { RECIPES } from '@/content/recipes'
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
  return useMemo(
    () => matchAll(RECIPES, pantry, { profile: { diets, allergies }, access, today, includeLocked }),
    [pantry, diets, allergies, access, today, includeLocked],
  )
}
