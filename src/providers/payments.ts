/**
 * PRESA DEI PAGAMENTI — oggi demo, domani Stripe (o gli acquisti in-app degli store).
 *
 * Le schermate chiamano solo `checkout()` e `cancelSubscription()`. Il gateway demo apre una
 * finestra di pagamento finta (nessun addebito). Per incassare davvero, sostituisci
 * `demoGateway` con un gateway che rispetti `PaymentGateway`:
 *
 *   Stripe (web/PWA):
 *   1. il client chiama il tuo server: POST /api/checkout { product: "premium-year" | "pack:dolci" }
 *   2. il server crea una Stripe Checkout Session:
 *        - abbonamenti: mode "subscription", price del piano, subscription_data.trial_period_days = 7
 *        - pacchetti:   mode "payment", price del pacchetto (acquisto una tantum)
 *   3. il client fa window.location = session.url
 *   4. il webhook `checkout.session.completed` / `customer.subscription.updated` salva
 *      l'acquisto sull'account; al ritorno l'app rilegge piano e pacchetti dal server.
 *
 *   App negli store (Google Play / App Store): gli acquisti digitali devono passare dal loro
 *   sistema di fatturazione (es. RevenueCat come livello unico). Cambia il gateway, non le schermate.
 */
import { create } from 'zustand'
import { PACKS, PLANS } from '@/domain/plans'
import type { PackId, PlanId } from '@/domain/types'
import { useApp } from '@/store/app'

export type Product = { kind: 'plan'; id: Exclude<PlanId, 'free'> } | { kind: 'pack'; id: PackId }
export type CheckoutResult = 'success' | 'cancelled'

export interface PaymentGateway {
  purchase(product: Product, opts: { trialDays: number }): Promise<CheckoutResult>
  cancel(): Promise<void>
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

const demoGateway: PaymentGateway = {
  purchase: (product, { trialDays }) =>
    new Promise((resolve) => useCheckoutUi.getState().open({ product, trial: trialDays > 0, resolve })),
  cancel: async () => {},
}

const gateway: PaymentGateway = demoGateway
export const PAYMENTS_ARE_DEMO = gateway === demoGateway

export async function checkout(product: Product): Promise<CheckoutResult> {
  const app = useApp.getState()
  // la prova gratuita vale una volta sola: se hai già avuto Premium, niente prova
  const trialDays = product.kind === 'plan' && !app.subscription.trialEndsAt ? 7 : 0
  const result = await gateway.purchase(product, { trialDays })
  if (result === 'success') {
    // con un gateway vero questo lo fa il webhook lato server
    if (product.kind === 'plan') app.activatePlan(product.id, trialDays > 0)
    else app.buyPack(product.id)
  }
  return result
}

export async function cancelSubscription() {
  await gateway.cancel()
  useApp.getState().cancelPlan()
}

export function productLabel(p: Product) {
  return p.kind === 'plan' ? PLANS[p.id].name : `Pacchetto ${PACKS[p.id].name}`
}

export function productPrice(p: Product) {
  return p.kind === 'plan' ? PLANS[p.id].priceCents : PACKS[p.id].priceCents
}
