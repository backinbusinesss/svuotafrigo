// Stato dell'app, salvato nel browser (localStorage). Nessun dato lascia il dispositivo.
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { INGREDIENT_BY_ID, recipeIdOf } from '@/content/ingredients'
import { RECIPE_BY_ID } from '@/content/recipes'
import { addDays, todayISO, toISODate } from '@/domain/dates'
import { rescueValue } from '@/domain/impact'
import type { Access } from '@/domain/matching'
import { newPantryItem } from '@/domain/pantry'
import { mergeShopping } from '@/domain/planner'
import { TRIAL_DAYS } from '@/domain/plans'
import type { Allergen, CookedEntry, Diet, MealPlanDay, PackId, PantryItem, PlanId, ShoppingItem } from '@/domain/types'

export type Theme = 'system' | 'light' | 'dark'

export interface Subscription {
  plan: PlanId
  /** ISO date di fine prova, se in prova (resta salvata: la prova vale una volta) */
  trialEndsAt?: string
  renewsAt?: string
  /** disdetto: resta attivo fino a renewsAt */
  cancelAtPeriodEnd?: boolean
  /** riferimenti Stripe, per rileggere lo stato e aprire il portale clienti */
  stripeSubscriptionId?: string
  stripeCustomerId?: string
}

interface State {
  onboarded: boolean
  name: string
  household: number
  diets: Diet[]
  allergies: Allergen[]
  theme: Theme
  pantry: PantryItem[]
  shopping: ShoppingItem[]
  favorites: string[]
  cooked: CookedEntry[]
  mealPlan: MealPlanDay[]
  subscription: Subscription
  packs: PackId[]
  scansUsed: number
  alertsEnabled: boolean
}

interface Actions {
  finishOnboarding(p: { name: string; household: number; diets: Diet[]; allergies: Allergen[]; starter: string[] }): void
  updateProfile(p: Partial<Pick<State, 'name' | 'household' | 'diets' | 'allergies' | 'theme' | 'alertsEnabled'>>): void
  addToPantry(ids: string[], expiresAt?: string): void
  setExpiry(ingredientId: string, expiresAt: string): void
  removeFromPantry(ingredientId: string): void
  clearExpired(): number
  toggleFavorite(recipeId: string): void
  addToShopping(ids: string[], recipeId?: string): void
  toggleShopping(ingredientId: string): void
  removeShopping(ingredientId: string): void
  /** sposta nel frigo le voci spuntate e le toglie dalla lista */
  moveCheckedToPantry(): number
  clearShopping(): void
  cook(recipeId: string): CookedEntry
  setMealPlan(days: MealPlanDay[], shopping: ShoppingItem[]): void
  markPlanDone(date: string): void
  activatePlan(plan: PlanId, withTrial: boolean): void
  cancelPlan(): void
  setSubscription(sub: Subscription): void
  buyPack(pack: PackId): void
  consumeScan(): void
  resetAll(): void
}

const initial: State = {
  onboarded: false,
  name: '',
  household: 2,
  diets: [],
  allergies: [],
  theme: 'system',
  pantry: [],
  shopping: [],
  favorites: [],
  cooked: [],
  mealPlan: [],
  subscription: { plan: 'free' },
  packs: [],
  scansUsed: 0,
  alertsEnabled: false,
}

const nowLocal = () => {
  const d = new Date()
  return `${toISODate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const useApp = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      finishOnboarding: ({ name, household, diets, allergies, starter }) => {
        const today = todayISO()
        set({
          onboarded: true,
          name: name.trim(),
          household,
          diets,
          allergies,
          pantry: starter.map((id) => newPantryItem(id, today)),
        })
      },

      updateProfile: (p) => set(p),

      addToPantry: (ids, expiresAt) => {
        const today = todayISO()
        const current = get().pantry
        const next = [...current]
        for (const id of ids) {
          const item = newPantryItem(id, today, expiresAt)
          const i = next.findIndex((p) => p.ingredientId === id)
          // ricomprato: vale la scadenza nuova
          if (i >= 0) next[i] = item
          else next.push(item)
        }
        set({ pantry: next })
      },

      setExpiry: (ingredientId, expiresAt) =>
        set({ pantry: get().pantry.map((p) => (p.ingredientId === ingredientId ? { ...p, expiresAt } : p)) }),

      removeFromPantry: (ingredientId) => set({ pantry: get().pantry.filter((p) => p.ingredientId !== ingredientId) }),

      clearExpired: () => {
        const today = todayISO()
        const before = get().pantry.length
        const pantry = get().pantry.filter((p) => p.expiresAt >= today)
        set({ pantry })
        return before - pantry.length
      },

      toggleFavorite: (recipeId) => {
        const f = get().favorites
        set({ favorites: f.includes(recipeId) ? f.filter((x) => x !== recipeId) : [recipeId, ...f] })
      },

      addToShopping: (ids, recipeId) =>
        set({
          shopping: mergeShopping(get().shopping, ids.map((ingredientId) => ({ ingredientId, checked: false, forRecipes: recipeId ? [recipeId] : [] }))),
        }),

      toggleShopping: (ingredientId) =>
        set({ shopping: get().shopping.map((s) => (s.ingredientId === ingredientId ? { ...s, checked: !s.checked } : s)) }),

      removeShopping: (ingredientId) => set({ shopping: get().shopping.filter((s) => s.ingredientId !== ingredientId) }),

      moveCheckedToPantry: () => {
        const checked = get().shopping.filter((s) => s.checked).map((s) => s.ingredientId)
        if (!checked.length) return 0
        get().addToPantry(checked)
        set({ shopping: get().shopping.filter((s) => !s.checked) })
        return checked.length
      },

      clearShopping: () => set({ shopping: [] }),

      cook: (recipeId) => {
        const recipe = RECIPE_BY_ID[recipeId]
        const today = todayISO()
        // Escono dal frigo solo i freschi deperibili (zucchine, latte, carne…) e ciò che
        // scadeva a breve. Uova, formaggi stagionati, pasta, cipolle di solito avanzano.
        const consumedByCooking = (p: PantryItem, day: string) =>
          recipe.ingredients.some((x) => x.id === recipeIdOf(p.ingredientId)) &&
          ((INGREDIENT_BY_ID[p.ingredientId]?.shelfDays ?? 99) <= 10 || p.expiresAt <= addDays(day, 3))
        const usedItems = get().pantry.filter((p) => recipe.ingredients.some((x) => x.id === recipeIdOf(p.ingredientId)))
        const { savedEuro, savedGrams } = rescueValue(usedItems, today)
        const entry: CookedEntry = { recipeId, at: nowLocal(), used: usedItems.map((p) => p.ingredientId), savedEuro, savedGrams }
        set({
          cooked: [entry, ...get().cooked],
          pantry: get().pantry.filter((p) => !consumedByCooking(p, today)),
          mealPlan: get().mealPlan.map((d) => (d.recipeId === recipeId && !d.done ? { ...d, done: true } : d)),
        })
        return entry
      },

      setMealPlan: (days, shopping) => set({ mealPlan: days, shopping: mergeShopping(get().shopping, shopping) }),

      markPlanDone: (date) => set({ mealPlan: get().mealPlan.map((d) => (d.date === date ? { ...d, done: !d.done } : d)) }),

      activatePlan: (plan, withTrial) => {
        const today = todayISO()
        const period = plan === 'premium-year' ? 365 : 30
        set({
          subscription: withTrial
            ? { plan, trialEndsAt: addDays(today, TRIAL_DAYS), renewsAt: addDays(today, TRIAL_DAYS) }
            : { plan, renewsAt: addDays(today, period) },
        })
      },

      // la data di fine prova resta: la prova gratuita non si ripete
      cancelPlan: () => set({ subscription: { plan: 'free', trialEndsAt: get().subscription.trialEndsAt } }),

      setSubscription: (subscription) => set({ subscription }),

      buyPack: (pack) => set({ packs: [...new Set([...get().packs, pack])] }),

      consumeScan: () => set({ scansUsed: get().scansUsed + 1 }),

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'svuotafrigo-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
)

export const isPremium = (s: Pick<State, 'subscription'>) => s.subscription.plan !== 'free'
export const accessOf = (s: Pick<State, 'subscription' | 'packs'>): Access => ({ premium: isPremium(s), packs: s.packs })
