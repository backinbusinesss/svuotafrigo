// Paywall: piani, prova gratuita, pacchetti singoli. Prezzi da domain/plans.ts.
import { BarChart3, Bell, BookOpen, CalendarDays, Camera, Check, ReceiptText, Users } from 'lucide-react'
import { useState } from 'react'
import { PACKS, PLANS, PREMIUM_FEATURES, TRIAL_DAYS, euro } from '@/domain/plans'
import type { PackId } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { go, href } from '@/lib/router'
import { checkout } from '@/providers/payments'
import { useApp } from '@/store/app'
import { Button, cx, TopBar } from '@/ui/kit'
import { usePremium } from '../hooks'

const ICONS = { camera: Camera, receipt: ReceiptText, calendar: CalendarDays, book: BookOpen, bell: Bell, chart: BarChart3, users: Users }

const HEADLINES: Record<string, string> = {
  scan: 'Scansiona il frigo con una foto.',
  piano: 'Il piano della settimana, già fatto.',
  porzioni: 'Cucina per tutta la famiglia.',
}

export function PremiumScreen({ from }: { from?: string }) {
  const premium = usePremium()
  const sub = useApp((s) => s.subscription)
  const packs = useApp((s) => s.packs)
  const [plan, setPlan] = useState<'premium-year' | 'premium-month'>('premium-year')
  const trialAvailable = !sub.trialEndsAt
  const year = PLANS['premium-year']
  const month = PLANS['premium-month']
  const fromPack = from?.startsWith('pack-') ? (from.slice(5) as PackId) : null

  const buy = async () => {
    const r = await checkout({ kind: 'plan', id: plan })
    if (r === 'success') {
      buzz([20, 60, 20])
      toast(trialAvailable ? `Premium attivo: ${TRIAL_DAYS} giorni gratis` : 'Premium attivo. Grazie!', '★')
      go({ name: 'frigo' })
    }
  }

  const buyPack = async (id: PackId) => {
    const r = await checkout({ kind: 'pack', id })
    if (r === 'success') { buzz([20, 60, 20]); toast(`Pacchetto ${PACKS[id].name} sbloccato`, PACKS[id].emoji); go({ name: 'ricette', tab: 'tutte' }) }
  }

  if (premium) {
    return (
      <div>
        <TopBar title="Premium" />
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-butter to-tomato p-6 text-[#1d1a16]">
            <div className="text-4xl">★</div>
            <h1 className="mt-2 font-display text-3xl font-extrabold">Sei Premium</h1>
            <p className="mt-1 text-sm">{PLANS[sub.plan].name}{sub.trialEndsAt && sub.renewsAt === sub.trialEndsAt ? ` · prova gratuita fino al ${new Date(sub.trialEndsAt).toLocaleDateString('it-IT')}` : sub.renewsAt ? ` · si rinnova il ${new Date(sub.renewsAt).toLocaleDateString('it-IT')}` : ''}</p>
          </div>
          <ul className="grid gap-3 p-5">
            {PREMIUM_FEATURES.map((f) => <li key={f.title} className="flex gap-3"><Check size={18} className="mt-0.5 shrink-0 text-basil" /><span><b>{f.title}</b> — <span className="text-muted">{f.text}</span></span></li>)}
          </ul>
        </div>
        <a href={href({ name: 'profilo' })} className="mt-4 block text-center text-sm text-muted underline">Gestisci abbonamento nel profilo</a>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <TopBar />
      <div className="relative -mx-4 -mt-16 overflow-hidden bg-gradient-to-b from-butter via-[#ffb547] to-tomato px-6 pb-10 pt-20 text-center text-[#1d1a16]">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1.4px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
        <div className="relative">
          <div className="mx-auto mb-3 flex w-fit gap-2 text-4xl"><span className="-rotate-12">🥕</span><span className="-translate-y-2">🧀</span><span className="rotate-12">🍅</span></div>
          <h1 className="font-display text-[34px] font-extrabold leading-[1.02] tracking-tight">{HEADLINES[from ?? ''] ?? 'Non buttare più niente.'}</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] font-medium opacity-80">SvuotaFrigo Premium pianifica, scansiona e ti avvisa. Tu cucini e risparmi.</p>
        </div>
      </div>

      <ul className="relative z-10 -mt-5 grid gap-2.5">
        {PREMIUM_FEATURES.map((f) => {
          const Icon = ICONS[f.icon]
          return (
            <li key={f.title} className="card flex items-center gap-3.5 p-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-butter-soft text-ink"><Icon size={20} /></span>
              <span><b className="block font-display">{f.title}</b><span className="text-sm text-muted">{f.text}</span></span>
            </li>
          )
        })}
      </ul>

      {/* ——— Piani ——— */}
      <div className="mt-6 grid gap-2.5" role="radiogroup" aria-label="Scegli il piano">
        {[year, month].map((p) => {
          const on = plan === p.id
          return (
            <button key={p.id} role="radio" aria-checked={on} onClick={() => setPlan(p.id as typeof plan)}
              className={cx('press relative flex items-center gap-3 rounded-3xl border-2 p-4 text-left', on ? 'border-tomato bg-tomato-soft' : 'border-line bg-card')}>
              <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-tomato bg-tomato text-white' : 'border-line')}>{on && <Check size={14} strokeWidth={3} />}</span>
              <span className="flex-1">
                <b className="block font-display text-lg">{p.period === 'anno' ? 'Annuale' : 'Mensile'}</b>
                <span className="text-sm text-muted">{p.period === 'anno' ? `${euro(p.priceCents)} all'anno · ${euro(p.monthlyCents)}/mese` : `${euro(p.priceCents)} al mese`}</span>
              </span>
              {p.badge && <span className="absolute -top-2.5 right-4 rounded-full bg-basil px-2.5 py-0.5 text-xs font-bold text-white">{p.badge}</span>}
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-[calc(80px+env(safe-area-inset-bottom))] z-20 mt-5">
        <Button size="lg" block onClick={buy}>{trialAvailable ? `Prova gratis per ${TRIAL_DAYS} giorni` : 'Attiva Premium'}</Button>
      </div>
      <p className="mt-2 text-center text-xs text-muted">
        {trialAvailable ? `Poi ${plan === 'premium-year' ? `${euro(year.priceCents)}/anno` : `${euro(month.priceCents)}/mese`}. ` : ''}Rinnovo automatico, disdici quando vuoi dal profilo.
      </p>

      {/* ——— Pacchetti ——— */}
      <h2 className="mt-10 font-display text-xl font-bold">Oppure solo un pacchetto</h2>
      <p className="text-sm text-muted">Acquisto singolo, tuo per sempre.</p>
      <div className="mt-3 grid gap-2.5">
        {(Object.keys(PACKS) as PackId[]).map((id) => {
          const p = PACKS[id]
          const owned = packs.includes(id)
          return (
            <div key={id} className={cx('card flex items-center gap-3 p-3.5', fromPack === id && 'ring-2 ring-butter')}>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper-2 text-2xl">{p.emoji}</span>
              <span className="min-w-0 flex-1"><b className="block font-display">{p.name}</b><span className="line-clamp-2 text-xs text-muted">{p.description}</span></span>
              {owned ? <span className="text-sm font-semibold text-basil">Tuo ✓</span>
                : <Button size="sm" variant="ink" onClick={() => buyPack(id)}>{euro(p.priceCents)}</Button>}
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-faint">
        Pagamento sicuro con Stripe. Acquistando accetti i{' '}
        <a className="underline" href="../termini.html" target="_blank" rel="noopener">Termini e condizioni di vendita</a> e
        confermi di aver letto l'<a className="underline" href="../privacy.html" target="_blank" rel="noopener">Informativa privacy</a>.
        Hai 14 giorni per chiedere il rimborso completo.
      </p>
    </div>
  )
}
