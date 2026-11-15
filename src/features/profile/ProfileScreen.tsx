// Profilo: impatto, traguardi, preferenze alimentari, tema, abbonamento, dati.
import { Bell, ChevronRight, Moon, Sparkles, Sun, SunMoon, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { addDays } from '@/domain/dates'
import { badges, formatKg, streak, totals } from '@/domain/impact'
import { FREE_LIMITS, PACKS, PLANS } from '@/domain/plans'
import type { Allergen, Diet } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { go, href } from '@/lib/router'
import { cancelSubscription } from '@/providers/payments'
import { type Theme, useApp } from '@/store/app'
import { Button, cx, PremiumBadge, SectionTitle, Stat } from '@/ui/kit'
import { usePremium, useToday } from '../hooks'

export const DIETS: { id: Diet; label: string; emoji: string }[] = [
  { id: 'vegetariano', label: 'Vegetariano', emoji: '🥕' },
  { id: 'vegano', label: 'Vegano', emoji: '🌱' },
  { id: 'senza-glutine', label: 'Senza glutine', emoji: '🌾' },
  { id: 'senza-lattosio', label: 'Senza lattosio', emoji: '🥛' },
]
export const ALLERGENS: { id: Allergen; label: string }[] = [
  { id: 'frutta-secca', label: 'Frutta a guscio' },
  { id: 'arachidi', label: 'Arachidi' },
  { id: 'uova', label: 'Uova' },
  { id: 'pesce', label: 'Pesce' },
  { id: 'crostacei', label: 'Crostacei' },
  { id: 'soia', label: 'Soia' },
  { id: 'sedano', label: 'Sedano' },
]

export function ProfileScreen() {
  const s = useApp()
  const premium = usePremium()
  const today = useToday()
  const all = totals(s.cooked)
  const statsSince = premium ? undefined : addDays(today, -FREE_LIMITS.statsDays)
  const shown = totals(s.cooked, statsSince)
  const b = useMemo(() => badges(s.cooked, today), [s.cooked, today])
  const st = streak(s.cooked, today)
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const enableAlerts = async () => {
    if (!premium) return go({ name: 'premium', from: 'avvisi' })
    if (!('Notification' in window)) return toast('Il browser non supporta le notifiche', '🔕')
    const p = await Notification.requestPermission()
    s.updateProfile({ alertsEnabled: p === 'granted' })
    toast(p === 'granted' ? 'Ti avviseremo quando apri l\'app e qualcosa sta per scadere' : 'Notifiche non consentite', p === 'granted' ? '🔔' : '🔕')
  }

  return (
    <div className="pt-6">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-butter to-tomato font-display text-2xl font-extrabold text-white">
          {(s.name || 'Tu').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <input value={s.name} onChange={(e) => s.updateProfile({ name: e.target.value })} placeholder="Il tuo nome"
            className="w-full bg-transparent font-display text-2xl font-extrabold outline-none" aria-label="Nome" />
          <div className="text-sm text-muted">{premium ? <PremiumBadge /> : 'Piano gratuito'}</div>
        </div>
      </div>

      {/* ——— Impatto ——— */}
      <div className="card mt-5 overflow-hidden">
        <div className="grid grid-cols-3 gap-3 p-4">
          <Stat value={`${shown.euro.toLocaleString('it-IT', { maximumFractionDigits: 0 })}€`} label="risparmiati" tone="basil" />
          <Stat value={formatKg(shown.grams)} label="non buttati" tone="butter" />
          <Stat value={shown.meals} label="ricette cucinate" tone="tomato" />
        </div>
        {!premium ? (
          <button onClick={() => go({ name: 'premium', from: 'statistiche' })} className="press flex w-full items-center justify-between border-t border-line bg-paper-2 px-4 py-3 text-left text-sm">
            <span>Ultimi {FREE_LIMITS.statsDays} giorni. <b>Storico completo con Premium</b> ({all.meals} ricette in totale)</span><ChevronRight size={18} />
          </button>
        ) : (
          <div className="border-t border-line bg-paper-2 px-4 py-3 text-sm text-muted">Da sempre · serie attuale: {st} {st === 1 ? 'giorno' : 'giorni'} 🔥</div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-faint">Stime basate su prezzi e pesi medi degli ingredienti salvati prima della scadenza.</p>

      {/* ——— Traguardi ——— */}
      <SectionTitle hand={`${b.filter((x) => x.earned).length}/${b.length}`}>Traguardi</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {b.map((x) => (
          <div key={x.id} className={cx('card relative flex flex-col items-center p-3 text-center', !x.earned && 'opacity-60')} title={x.text}>
            <span className={cx('text-3xl', !x.earned && 'grayscale')}>{x.emoji}</span>
            <b className="mt-1 text-[12.5px] leading-tight">{x.name}</b>
            <span className="mt-0.5 text-[11px] leading-tight text-muted">{x.text}</span>
            {!x.earned && <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-paper-2"><div className="h-full rounded-full bg-tomato" style={{ width: `${x.progress * 100}%` }} /></div>}
          </div>
        ))}
      </div>

      {/* ——— Preferenze ——— */}
      <SectionTitle>In cucina</SectionTitle>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Persone in casa</span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} onClick={() => s.updateProfile({ household: n })} className={cx('press grid h-9 w-9 place-items-center rounded-full text-sm font-bold', s.household === n ? 'bg-ink text-paper' : 'bg-paper-2')}>{n}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 font-semibold">Alimentazione</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d.id} onClick={() => s.updateProfile({ diets: toggle(s.diets, d.id) })} aria-pressed={s.diets.includes(d.id)}
              className={cx('press rounded-full border px-3 py-1.5 text-sm font-medium', s.diets.includes(d.id) ? 'border-basil bg-basil text-white' : 'border-line')}>{d.emoji} {d.label}</button>
          ))}
        </div>
        <div className="mt-5 font-semibold">Allergie e intolleranze</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALLERGENS.map((a) => (
            <button key={a.id} onClick={() => s.updateProfile({ allergies: toggle(s.allergies, a.id) })} aria-pressed={s.allergies.includes(a.id)}
              className={cx('press rounded-full border px-3 py-1.5 text-sm font-medium', s.allergies.includes(a.id) ? 'border-tomato bg-tomato text-white' : 'border-line')}>{a.label}</button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Le ricette non adatte spariscono. Controlla sempre le etichette dei prodotti.</p>
      </div>

      {/* ——— App ——— */}
      <SectionTitle>App</SectionTitle>
      <div className="card divide-y divide-line">
        <div className="flex items-center justify-between p-4">
          <span className="font-semibold">Tema</span>
          <div className="flex gap-1 rounded-full bg-paper-2 p-1">
            {([['light', Sun], ['system', SunMoon], ['dark', Moon]] as [Theme, typeof Sun][]).map(([t, Icon]) => (
              <button key={t} onClick={() => s.updateProfile({ theme: t })} aria-label={t} aria-pressed={s.theme === t} className={cx('press grid h-8 w-10 place-items-center rounded-full', s.theme === t && 'bg-card shadow-sm')}><Icon size={16} /></button>
            ))}
          </div>
        </div>
        <button onClick={enableAlerts} className="press flex w-full items-center justify-between p-4 text-left">
          <span className="flex items-center gap-2 font-semibold"><Bell size={18} /> Avvisi di scadenza {!premium && <PremiumBadge />}</span>
          <span className="text-sm text-muted">{s.alertsEnabled ? 'Attivi' : 'Spenti'}</span>
        </button>
      </div>

      {/* ——— Abbonamento ——— */}
      <SectionTitle>Abbonamento</SectionTitle>
      <div className="card p-4">
        {premium ? (
          <>
            <div className="font-semibold">{PLANS[s.subscription.plan].name}</div>
            <div className="text-sm text-muted">{s.subscription.renewsAt ? `Rinnovo il ${new Date(s.subscription.renewsAt).toLocaleDateString('it-IT')}` : ''}</div>
            <Button variant="ghost" size="sm" className="mt-3" onClick={async () => { if (confirm('Disdire Premium?')) { await cancelSubscription(); toast('Abbonamento disdetto', '👋') } }}>Disdici</Button>
          </>
        ) : (
          <a href={href({ name: 'premium' })} className="press flex items-center justify-between">
            <span><b className="font-display">Passa a Premium</b><span className="block text-sm text-muted">Piano settimanale, scansione foto, tutti i pacchetti.</span></span>
            <Sparkles className="text-tomato" />
          </a>
        )}
        {s.packs.length > 0 && <div className="mt-3 text-sm text-muted">Pacchetti: {s.packs.map((p) => `${PACKS[p].emoji} ${PACKS[p].name}`).join(', ')}</div>}
      </div>

      <SectionTitle>Privacy</SectionTitle>
      <div className="card p-4 text-sm text-muted">
        Frigo, ricette e profilo restano solo su questo dispositivo. Nessun account, nessun tracciamento pubblicitario.
        <Button variant="ghost" size="sm" className="mt-3 text-tomato" onClick={() => { if (confirm('Cancellare tutti i dati di SvuotaFrigo da questo dispositivo? Non si può annullare.')) { s.resetAll(); buzz(30); location.hash = '#/' } }}>
          <Trash2 size={15} /> Cancella tutti i dati
        </Button>
      </div>
      <p className="mt-8 text-center text-xs text-faint">SvuotaFrigo · un'app <a className="underline" href="https://backinbusinesss.github.io/carlarcade/" target="_blank" rel="noopener">CarlArcade</a> by Carlhost</p>
    </div>
  )
}
