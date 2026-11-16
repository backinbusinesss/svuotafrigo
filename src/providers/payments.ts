/**
 * PRESA DEI PAGAMENTI.
 *
 * Se il worker ha STRIPE_SECRET_KEY (vedi /config), i pagamenti sono reali con Stripe Checkout:
 *   1. checkout() chiede al worker una sessione (importi decisi dal server, da domain/plans.ts)
 *   2. l'utente paga sulla pagina sicura di Stripe e torna su /app/?checkout=ok&session_id=…
 *   3. handleCheckoutReturn() verifica la sessione col worker e attiva Premium o il pacchetto
 *   4. a ogni avvio refreshSubscription() rilegge lo stato da Stripe (rinnovo, disdetta, fine prova)
 *   Disdetta e metodo di pagamento si gestiscono nel portale clienti Stripe (openBillingPortal).
 *
 * Altrimenti resta il gateway dimostrativo: finestra finta, nessun addebito, dichiarato all'utente.
 *
 * Se l'app finirà negli store, gli acquisti digitali devono passare da Google Play / App Store
 * (es. RevenueCat): si cambia il gateway, non le schermate.
 */
import { create } from 'zustand'
import { PACKS, PLANS } from '@/domain/plans'
import type { PackId, PlanId } from '@/domain/types'
import { useApp } from '@/store/app'
import { api, loadApiConfig } from './api'

export type Product = { kind: 'plan'; id: Exclude<PlanId, 'free'> } | { kind: 'pack'; id: PackId }
export type CheckoutResult = 'success' | 'cancelled' | 'redirect'

export interface Entitlement {
  product: string
  customerId: string | null
  subscriptionId: string | null
  status: string
  trialEnd: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

/** Stato della finestra di pagamento demo (la disegna <DemoCheckout/>). */
export const useCheckoutUi = create<{
  pending: { product: Product; trial: boolean; resolve(r: CheckoutResult): void } | null
  open(p: { product: Product; trial: boolean; resolve(r: CheckoutResult): void }): void
  close(r: CheckoutResult): void
}>((set, get) => ({
  pending: null,
  open: (p) => set({ pending: p }),
  close: (r) => {
    get().pending?.resolve(r)
    set({ pending: null })
  },
}))

const returnUrl = () => `${location.origin}${location.pathname}`

export async function checkout(product: Product): Promise<CheckoutResult> {
  const app = useApp.getState()
  // la prova gratuita vale una volta sola: se hai già avuto Premium, niente prova
  const trial = product.kind === 'plan' && !app.subscription.trialEndsAt && !app.subscription.stripeSubscriptionId
  const { payments } = await loadApiConfig()

  if (payments) {
    const { url } = await api<{ url: string }>('/checkout', { product, trial, returnUrl: returnUrl() })
    location.assign(url)
    return 'redirect'
  }

  const result = await new Promise<CheckoutResult>((resolve) => useCheckoutUi.getState().open({ product, trial, resolve }))
  if (result === 'success') {
    if (product.kind === 'plan') app.activatePlan(product.id, trial)
    else app.buyPack(product.id)
  }
  return result
}

function applyEntitlement(e: Entitlement) {
  const app = useApp.getState()
  const [kind, id] = e.product.split(':')
  if (kind === 'pack' && id in PACKS) {
    app.buyPack(id as PackId)
    return
  }
  if (kind === 'plan' && id in PLANS) {
    const active = e.status === 'active' || e.status === 'trialing'
    if (!active) {
      app.setSubscription({ plan: 'free', trialEndsAt: app.subscription.trialEndsAt, stripeCustomerId: e.customerId ?? undefined })
      return
    }
    app.setSubscription({
      plan: id as Exclude<PlanId, 'free'>,
      trialEndsAt: e.trialEnd ?? app.subscription.trialEndsAt,
      renewsAt: e.periodEnd ?? undefined,
      cancelAtPeriodEnd: e.cancelAtPeriodEnd,
      stripeSubscriptionId: e.subscriptionId ?? undefined,
      stripeCustomerId: e.customerId ?? undefined,
    })
  }
}

/** Al ritorno da Stripe: verifica la sessione e attiva l'acquisto. Ritorna il prodotto attivato. */
export async function handleCheckoutReturn(): Promise<string | null> {
  const q = new URLSearchParams(location.search)
  const sessionId = q.get('checkout') === 'ok' ? q.get('session_id') : null
  if (!sessionId) return null
  const e = await api<Entitlement>('/verify', { sessionId })
  applyEntitlement(e)
  // tolti solo dopo la conferma: se la verifica fallisce, riaprendo l'app si riprova
  history.replaceState(null, '', `${location.pathname}${location.hash}`)
  return e.product
}

/** All'avvio: rilegge lo stato dell'abbonamento Stripe (rinnovato, disdetto, scaduto). */
export async function refreshSubscription() {
  const id = useApp.getState().subscription.stripeSubscriptionId
  if (!id) return
  const { payments } = await loadApiConfig()
  if (!payments) return
  try {
    applyEntitlement(await api<Entitlement>('/entitlement', { subscriptionId: id }))
  } catch {
    /* offline: resta lo stato salvato */
  }
}

/** Disdetta: con Stripe apre il portale clienti; in demo torna subito al piano gratuito. */
export async function cancelSubscription(): Promise<'portal' | 'cancelled'> {
  const customerId = useApp.getState().subscription.stripeCustomerId
  const { payments } = await loadApiConfig()
  if (payments && customerId) {
    const { url } = await api<{ url: string }>('/portal', { customerId, returnUrl: returnUrl() })
    location.assign(url)
    return 'portal'
  }
  useApp.getState().cancelPlan()
  return 'cancelled'
}

export function productLabel(p: Product) {
  return p.kind === 'plan' ? PLANS[p.id].name : `Pacchetto ${PACKS[p.id].name}`
}

export function productPrice(p: Product) {
  return p.kind === 'plan' ? PLANS[p.id].priceCents : PACKS[p.id].priceCents
}
