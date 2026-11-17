// "Scontrino furbo": foto dello scontrino → prodotti in dispensa con scadenza stimata + quanto hai speso.
import { ReceiptText, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { AISLE_LABELS, INGREDIENT_BY_ID } from '@/content/ingredients'
import { euro } from '@/domain/plans'
import { monthlySpending, receiptsLeft } from '@/domain/receipts'
import { buzz, toast } from '@/lib/feedback'
import { go } from '@/lib/router'
import { SCAN_ERRORS, ScanError, scanReceipt, type ReceiptResult } from '@/providers/vision'
import { useApp } from '@/store/app'
import { Button, cx, PremiumBadge, Sheet } from '@/ui/kit'
import { usePremium, useToday } from '../hooks'

type Phase = { k: 'intro' } | { k: 'scanning'; preview: string } | { k: 'result'; preview: string; res: ReceiptResult } | { k: 'error'; msg: string }

const eur = (n: number) => euro(Math.round(n * 100))
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

export function ReceiptSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const premium = usePremium()
  const today = useToday()
  const quota = useApp((s) => s.receiptQuota)
  const receipts = useApp((s) => s.receipts)
  const saveReceipt = useApp((s) => s.saveReceipt)
  const consumeReceipt = useApp((s) => s.consumeReceipt)
  const addToPantry = useApp((s) => s.addToPantry)
  const [phase, setPhase] = useState<Phase>({ k: 'intro' })
  const [picked, setPicked] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const freeLeft = receiptsLeft(quota, today)
  const canScan = premium || freeLeft > 0
  const spending = monthlySpending(receipts, today)
  const monthName = MONTHS[Number(today.slice(5, 7)) - 1]

  const close = () => {
    onClose()
    setTimeout(() => setPhase({ k: 'intro' }), 300)
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPhase({ k: 'scanning', preview })
    try {
      const res = await scanReceipt(file)
      // la quota gratuita conta solo le letture vere, non la modalità dimostrativa
      if (!premium && !res.demo) consumeReceipt()
      buzz([10, 40, 10])
      setPicked(res.items.map((x) => x.id))
      setPhase({ k: 'result', preview, res })
    } catch (e) {
      setPhase({ k: 'error', msg: SCAN_ERRORS[e instanceof ScanError ? e.code : 'network'] ?? SCAN_ERRORS.network })
    }
  }

  const confirm = (res: ReceiptResult) => {
    const items = res.items.filter((x) => picked.includes(x.id))
    addToPantry(items.map((x) => x.id))
    saveReceipt({ id: `${Date.now()}`, date: today, store: res.store, total: res.total, items })
    toast(`${items.length} prodotti in dispensa, con la scadenza stimata`, '🧾')
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={<span className="flex items-center gap-2">Scontrino furbo <PremiumBadge /></span>} tall>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />

      {phase.k === 'intro' && (
        <div className="flex flex-col items-center text-center">
          <div className="relative my-4 grid h-40 w-32 place-items-center overflow-hidden rounded-[28px] bg-gradient-to-b from-card to-butter-soft text-6xl shadow-xl ring-1 ring-line">
            🧾
            <motion.div className="absolute inset-x-3 h-1 rounded-full bg-basil/80 shadow-[0_0_16px_var(--basil)]" animate={{ top: ['12%', '88%', '12%'] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <h4 className="font-display text-2xl font-bold">Fai la spesa, scatta lo scontrino.</h4>
          <p className="mt-2 max-w-sm text-muted">Leggiamo i prodotti, li mettiamo in dispensa con la scadenza stimata e ti diciamo quanto spendi per reparto.</p>
          {canScan ? (
            <div className="mt-6 grid w-full gap-2">
              <Button size="lg" block onClick={() => input.current?.click()}><ReceiptText size={20} /> Fotografa lo scontrino</Button>
              {!premium && <p className="text-xs text-muted">Hai {freeLeft} scontrino gratis questo mese. Con Premium sono illimitati.</p>}
            </div>
          ) : (
            <div className="mt-6 grid w-full gap-2">
              <Button size="lg" variant="butter" block onClick={() => { close(); go({ name: 'premium', from: 'receipt' }) }}><Sparkles size={18} /> Sblocca con Premium</Button>
              <p className="text-xs text-muted">Hai usato lo scontrino gratis di {monthName}. Il prossimo si sblocca il mese prossimo, oppure subito con Premium.</p>
            </div>
          )}

          {spending.receipts > 0 && (
            <div className="mt-6 w-full rounded-3xl border border-line bg-card p-4 text-left">
              <div className="flex items-baseline justify-between">
                <b className="font-display">La spesa di {monthName}</b>
                <span className="font-display text-xl font-extrabold">{eur(spending.total)}</span>
              </div>
              <p className="text-xs text-muted">{spending.receipts} {spending.receipts === 1 ? 'scontrino' : 'scontrini'}</p>
              <div className="mt-3 grid gap-2">
                {spending.byAisle.map(({ aisle, amount }) => {
                  const max = spending.byAisle[0].amount || 1
                  return (
                    <div key={aisle} className="text-sm">
                      <div className="flex justify-between"><span>{AISLE_LABELS[aisle].emoji} {AISLE_LABELS[aisle].label}</span><span className="tabular-nums">{eur(amount)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-basil" style={{ width: `${(amount / max) * 100}%` }} /></div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <p className="mt-5 text-xs text-faint">La foto serve solo a leggere lo scontrino e non viene conservata. Prezzi e scadenze restano sul tuo telefono.</p>
        </div>
      )}

      {phase.k === 'scanning' && (
        <div className="flex flex-col items-center">
          <div className="relative mt-2 w-full overflow-hidden rounded-3xl">
            <img src={phase.preview} alt="Il tuo scontrino" className="max-h-[50vh] w-full object-cover" />
            <motion.div className="absolute inset-x-0 h-1.5 bg-basil shadow-[0_0_30px_8px_var(--basil)]" animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <p className="mt-5 font-display text-lg font-bold">Sto leggendo lo scontrino…</p>
        </div>
      )}

      {phase.k === 'result' && (
        <div>
          {phase.res.demo && (
            <div className="mb-3 rounded-2xl bg-butter-soft p-3 text-sm">
              <b>Modalità dimostrativa.</b> La lettura reale si attiva collegando il servizio foto: questo è uno scontrino d'esempio e non consuma la quota.
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <img src={phase.preview} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-bold">{phase.res.store ?? 'Scontrino'}</div>
              <div className="text-sm text-muted">{phase.res.items.length} prodotti alimentari{phase.res.total != null && <> · totale {eur(phase.res.total)}</>}</div>
            </div>
          </div>
          <div className="grid gap-1.5">
            {phase.res.items.map(({ id, price }) => {
              const on = picked.includes(id)
              const ing = INGREDIENT_BY_ID[id]
              return (
                <button key={id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== id) : [...p, id]))}
                  className={cx('press flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm', on ? 'border-basil bg-basil-soft' : 'border-line bg-card opacity-60')}>
                  <span className="text-lg">{ing.emoji}</span>
                  <span className={cx('flex-1 font-medium', !on && 'line-through')}>{ing.name}</span>
                  {ing.shelfDays <= 30 && <span className="text-xs text-muted">scade ~{ing.shelfDays} gg</span>}
                  {price != null && <span className="w-16 text-right tabular-nums">{eur(price)}</span>}
                </button>
              )
            })}
          </div>
          {phase.res.unknown.length > 0 && <p className="mt-3 text-xs text-muted">Letti ma non in catalogo: {phase.res.unknown.join(', ')}.</p>}
          <div className="mt-6 grid gap-2">
            <Button size="lg" block onClick={() => confirm(phase.res)} disabled={!picked.length}>Metti {picked.length} in dispensa</Button>
            <Button variant="ghost" block onClick={() => setPhase({ k: 'intro' })}>Annulla</Button>
          </div>
        </div>
      )}

      {phase.k === 'error' && (
        <div className="py-8 text-center">
          <div className="text-5xl">😕</div>
          <p className="mt-3 font-semibold">{phase.msg}</p>
          <Button className="mt-5" onClick={() => setPhase({ k: 'intro' })}>Riprova</Button>
        </div>
      )}
    </Sheet>
  )
}
