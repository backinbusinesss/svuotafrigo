// Finestra di pagamento DIMOSTRATIVA: nessun dato di carta viene chiesto né inviato.
// Con Stripe collegato questa finestra sparisce (vedi src/providers/payments.ts).
import { CreditCard, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { euro, TRIAL_DAYS } from '@/domain/plans'
import { productLabel, productPrice, useCheckoutUi } from '@/providers/payments'
import { Button, Sheet } from '@/ui/kit'

export function DemoCheckout() {
  const pending = useCheckoutUi((s) => s.pending)
  const close = useCheckoutUi((s) => s.close)
  const [paying, setPaying] = useState(false)
  if (!pending) return <Sheet open={false} onClose={() => {}}>{null}</Sheet>
  const price = productPrice(pending.product)
  const isPlan = pending.product.kind === 'plan'

  const pay = () => {
    setPaying(true)
    setTimeout(() => { setPaying(false); close('success') }, 900)
  }

  return (
    <Sheet open onClose={() => close('cancelled')} title="Conferma acquisto">
      <div className="mb-4 rounded-2xl bg-butter-soft p-3 text-sm">
        <b>Pagamento dimostrativo.</b> Nessun addebito e nessun dato della carta richiesto: serve a provare il flusso.
      </div>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{productLabel(pending.product)}</span>
          <span className="font-display text-lg font-bold">{euro(price)}</span>
        </div>
        {isPlan && pending.trial && (
          <div className="mt-2 flex items-center justify-between text-sm text-basil">
            <span>Oggi, prova di {TRIAL_DAYS} giorni</span><b>{euro(0)}</b>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line p-3 text-sm text-muted">
        <CreditCard size={20} /> Metodo di pagamento: <b className="text-ink">Demo</b>
      </div>
      <Button size="lg" block className="mt-5" onClick={pay} disabled={paying}>
        {paying ? 'Attendi…' : isPlan && pending.trial ? 'Inizia la prova gratuita' : `Paga ${euro(price)}`}
      </Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint"><ShieldCheck size={14} /> Con Stripe i pagamenti saranno gestiti in modo sicuro da Stripe.</p>
    </Sheet>
  )
}
