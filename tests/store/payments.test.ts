// I pagamenti Stripe: ritorno da Checkout e aggiornamento dello stato, con il worker simulato.
import { useApp } from '@/store/app'

vi.stubEnv('VITE_API_URL', 'https://api.test')

type Handler = (path: string, body: unknown) => unknown
function mockWorker(handler: Handler, config = { vision: false, payments: true }) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname
    const data = path === '/config' ? config : handler(path, init?.body ? JSON.parse(String(init.body)) : null)
    return new Response(JSON.stringify(data), { status: 200 })
  }))
}

async function freshPayments() {
  vi.resetModules()
  return import('@/providers/payments')
}

beforeEach(() => {
  useApp.getState().resetAll()
  history.replaceState(null, '', '/app/')
})

describe('pagamenti Stripe', () => {
  it('al ritorno da Checkout attiva Premium con i dati di Stripe e pulisce l\'indirizzo', async () => {
    history.replaceState(null, '', '/app/?checkout=ok&session_id=cs_test_123#/premium')
    mockWorker((path, body) => {
      expect(path).toBe('/verify')
      expect(body).toEqual({ sessionId: 'cs_test_123' })
      return { product: 'plan:premium-year', customerId: 'cus_1', subscriptionId: 'sub_1', status: 'trialing', trialEnd: '2026-11-23', periodEnd: '2026-11-23', cancelAtPeriodEnd: false }
    })
    const { handleCheckoutReturn } = await freshPayments()
    // lo store viene ricaricato con i moduli: usiamo quello nuovo
    const { useApp: store } = await import('@/store/app')
    expect(await handleCheckoutReturn()).toBe('plan:premium-year')
    expect(store.getState().subscription).toMatchObject({ plan: 'premium-year', stripeSubscriptionId: 'sub_1', stripeCustomerId: 'cus_1', renewsAt: '2026-11-23' })
    expect(location.search).toBe('')
    expect(location.hash).toBe('#/premium')
  })

  it('sblocca un pacchetto pagato', async () => {
    history.replaceState(null, '', '/app/?checkout=ok&session_id=cs_test_9')
    mockWorker(() => ({ product: 'pack:dolci', customerId: 'cus_2', subscriptionId: null, status: 'paid', trialEnd: null, periodEnd: null, cancelAtPeriodEnd: false }))
    const { handleCheckoutReturn } = await freshPayments()
    const { useApp: store } = await import('@/store/app')
    await handleCheckoutReturn()
    expect(store.getState().packs).toEqual(['dolci'])
  })

  it('all\'avvio torna al piano gratuito se l\'abbonamento è scaduto', async () => {
    mockWorker(() => ({ product: 'plan:premium-month', customerId: 'cus_3', subscriptionId: 'sub_3', status: 'canceled', trialEnd: null, periodEnd: '2026-10-01', cancelAtPeriodEnd: false }))
    const { refreshSubscription } = await freshPayments()
    const { useApp: store } = await import('@/store/app')
    store.getState().setSubscription({ plan: 'premium-month', stripeSubscriptionId: 'sub_3', stripeCustomerId: 'cus_3', trialEndsAt: '2026-01-08' })
    await refreshSubscription()
    expect(store.getState().subscription.plan).toBe('free')
    // la prova già usata resta segnata
    expect(store.getState().subscription.trialEndsAt).toBe('2026-01-08')
  })

  it('senza chiave Stripe nel worker resta la modalità dimostrativa', async () => {
    mockWorker(() => { throw new Error('non deve chiamare il worker') }, { vision: false, payments: false })
    const { checkout, useCheckoutUi } = await freshPayments()
    const p = checkout({ kind: 'pack', id: 'fit' })
    await vi.waitFor(() => expect(useCheckoutUi.getState().pending).not.toBeNull())
    useCheckoutUi.getState().close('cancelled')
    expect(await p).toBe('cancelled')
  })
})
