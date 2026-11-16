/**
 * Pagamenti con Stripe Checkout, senza prezzi da creare a mano nella dashboard:
 * importi e nomi arrivano da src/domain/plans.ts (stessa fonte dell'app), così
 * il client non può decidere quanto pagare.
 *
 *   POST /checkout     { product, trial, returnUrl }  → { url }  (pagina di pagamento Stripe)
 *   POST /verify       { sessionId }                   → acquisto confermato
 *   POST /entitlement  { subscriptionId }              → stato attuale dell'abbonamento
 *   POST /portal       { customerId, returnUrl }       → { url } (gestione/disdetta su Stripe)
 *
 * Richiede il segreto STRIPE_SECRET_KEY (sk_test_… per provare, sk_live_… per incassare).
 */
import { PACKS, PLANS, TRIAL_DAYS } from '../../src/domain/plans'

type Product = { kind: 'plan'; id: 'premium-month' | 'premium-year' } | { kind: 'pack'; id: keyof typeof PACKS }

export interface Entitlement {
  product: string
  customerId: string | null
  subscriptionId: string | null
  status: string
  trialEnd: string | null
  periodEnd: string | null
  cancelAtPeriodEnd: boolean
}

class StripeError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/** Chiamata all'API Stripe con corpo application/x-www-form-urlencoded. */
async function stripe(key: string, method: 'GET' | 'POST', path: string, params: Record<string, string> = {}) {
  const body = new URLSearchParams(params).toString()
  const url = `https://api.stripe.com/v1/${path}${method === 'GET' && body ? `?${body}` : ''}`
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: method === 'POST' ? body : undefined,
  })
  const data = (await res.json()) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!res.ok) throw new StripeError(res.status, data?.error?.message ?? 'stripe_error')
  return data
}

const iso = (unix?: number | null) => (unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null)

function parseProduct(p: unknown): Product | null {
  const x = p as Product | undefined
  if (x?.kind === 'plan' && (x.id === 'premium-month' || x.id === 'premium-year')) return x
  if (x?.kind === 'pack' && x.id in PACKS) return x
  return null
}

/** Accetta solo indirizzi di ritorno delle origini ammesse (niente redirect verso siti terzi). */
function safeReturn(url: unknown, allowed: string[]): string | null {
  try {
    const u = new URL(String(url))
    return allowed.includes(u.origin) ? `${u.origin}${u.pathname}` : null
  } catch {
    return null
  }
}

function subscriptionEntitlement(sub: Record<string, any>, product: string): Entitlement { // eslint-disable-line @typescript-eslint/no-explicit-any
  // dalla versione API 2025-03-31 la fine del periodo sta sulla voce dell'abbonamento
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end
  return {
    product,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
    subscriptionId: sub.id,
    status: sub.status,
    trialEnd: iso(sub.trial_end),
    periodEnd: iso(periodEnd),
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
  }
}

export async function handleStripe(path: string, body: Record<string, unknown>, key: string, allowedOrigins: string[]) {
  switch (path) {
    case '/checkout': {
      const product = parseProduct(body.product)
      const ret = safeReturn(body.returnUrl, allowedOrigins)
      if (!product || !ret) return { status: 400, body: { error: 'bad_request' } }
      const ref = product.kind === 'plan' ? `plan:${product.id}` : `pack:${product.id}`
      const params: Record<string, string> = {
        locale: 'it',
        allow_promotion_codes: 'true',
        'line_items[0][quantity]': '1',
        'line_items[0][price_data][currency]': 'eur',
        'metadata[product]': ref,
        success_url: `${ret}?checkout=ok&session_id={CHECKOUT_SESSION_ID}#/premium`,
        cancel_url: `${ret}#/premium`,
      }
      if (product.kind === 'plan') {
        const plan = PLANS[product.id]
        Object.assign(params, {
          mode: 'subscription',
          'line_items[0][price_data][unit_amount]': String(plan.priceCents),
          'line_items[0][price_data][recurring][interval]': plan.period === 'anno' ? 'year' : 'month',
          'line_items[0][price_data][product_data][name]': `SvuotaFrigo ${plan.name}`,
          'subscription_data[metadata][product]': ref,
        })
        if (body.trial === true) params['subscription_data[trial_period_days]'] = String(TRIAL_DAYS)
      } else {
        const pack = PACKS[product.id]
        Object.assign(params, {
          mode: 'payment',
          customer_creation: 'always',
          'line_items[0][price_data][unit_amount]': String(pack.priceCents),
          'line_items[0][price_data][product_data][name]': `SvuotaFrigo – pacchetto ${pack.name}`,
        })
      }
      const session = await stripe(key, 'POST', 'checkout/sessions', params)
      return { status: 200, body: { url: session.url } }
    }

    case '/verify': {
      const id = String(body.sessionId ?? '')
      if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return { status: 400, body: { error: 'bad_request' } }
      const s = await stripe(key, 'GET', `checkout/sessions/${id}`, { 'expand[]': 'subscription' })
      const product = String(s.metadata?.product ?? '')
      const paid = s.status === 'complete' && (s.payment_status === 'paid' || s.payment_status === 'no_payment_required')
      if (!paid) return { status: 402, body: { error: 'not_paid' } }
      if (s.mode === 'subscription' && s.subscription) return { status: 200, body: subscriptionEntitlement(s.subscription, product) }
      const ent: Entitlement = { product, customerId: s.customer ?? null, subscriptionId: null, status: 'paid', trialEnd: null, periodEnd: null, cancelAtPeriodEnd: false }
      return { status: 200, body: ent }
    }

    case '/entitlement': {
      const id = String(body.subscriptionId ?? '')
      if (!/^sub_[A-Za-z0-9]+$/.test(id)) return { status: 400, body: { error: 'bad_request' } }
      const sub = await stripe(key, 'GET', `subscriptions/${id}`)
      return { status: 200, body: subscriptionEntitlement(sub, String(sub.metadata?.product ?? '')) }
    }

    case '/portal': {
      const customer = String(body.customerId ?? '')
      const ret = safeReturn(body.returnUrl, allowedOrigins)
      if (!/^cus_[A-Za-z0-9]+$/.test(customer) || !ret) return { status: 400, body: { error: 'bad_request' } }
      const p = await stripe(key, 'POST', 'billing_portal/sessions', { customer, return_url: `${ret}#/profilo`, locale: 'it' })
      return { status: 200, body: { url: p.url } }
    }
  }
  return { status: 404, body: { error: 'not_found' } }
}

export { StripeError }
