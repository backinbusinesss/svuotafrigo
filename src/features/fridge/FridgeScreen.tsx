// Home: il frigo. Prima cosa che vedi: cosa sta per scadere e cosa ci cucini.
import { Camera, Flame, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { AISLE_LABELS, INGREDIENT_BY_ID } from '@/content/ingredients'
import { addDays, dayMonth } from '@/domain/dates'
import { formatKg, streak, totals } from '@/domain/impact'
import { daysLeft, expiringSoon, freshness, sortPantry } from '@/domain/pantry'
import type { Storage } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { href } from '@/lib/router'
import { useApp } from '@/store/app'
import { Button, cx, Empty, FreshDot, freshLabel, freshPill, PremiumBadge, SectionTitle, Sheet, Stat } from '@/ui/kit'
import { useMatches, usePremium, useToday } from '../hooks'
import { RecipeCard } from '../recipes/RecipeCard'
import { AddSheet } from './AddSheet'
import { ReceiptSheet } from './ReceiptSheet'
import { ScanSheet } from './ScanSheet'

const STORAGE: { id: Storage; label: string; emoji: string }[] = [
  { id: 'frigo', label: 'Frigo', emoji: '🧊' },
  { id: 'freezer', label: 'Freezer', emoji: '❄️' },
  { id: 'dispensa', label: 'Dispensa', emoji: '🧺' },
]

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Spuntino notturno' : h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
}

export function FridgeScreen() {
  const name = useApp((s) => s.name)
  const pantry = useApp((s) => s.pantry)
  const cooked = useApp((s) => s.cooked)
  const clearExpired = useApp((s) => s.clearExpired)
  const premium = usePremium()
  const today = useToday()
  const matches = useMatches()
  const [adding, setAdding] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [reading, setReading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [where, setWhere] = useState<Storage>('frigo')

  const expiring = expiringSoon(pantry, today, 3)
  const expired = pantry.filter((p) => daysLeft(p, today) < 0)
  const rescuers = matches.filter((m) => m.rescues.length && m.kind !== 'lontana').slice(0, 8)
  const ready = matches.filter((m) => m.kind === 'pronta').slice(0, 8)
  const month = totals(cooked, addDays(today, -30))
  const s = streak(cooked, today)

  const shelves = useMemo(() => {
    const items = sortPantry(pantry).filter((p) => INGREDIENT_BY_ID[p.ingredientId]?.storage === where)
    return items
  }, [pantry, where])

  return (
    <div>
      {/* ——— Saluto ——— */}
      <header className="pt-6">
        <p className="text-sm font-medium text-muted">{greeting()}{name ? `, ${name}` : ''} 👋</p>
        <h1 className="mt-1 font-display text-[34px] font-extrabold leading-[1.02] tracking-tight">
          {pantry.length === 0 ? 'Il frigo è vuoto.' : expiring.length ? <>Hai <span className="text-tomato">{expiring.length}</span> {expiring.length === 1 ? 'cosa' : 'cose'} da salvare.</> : <>Cosa cuciniamo oggi?</>}
        </h1>
      </header>

      {/* ——— Impatto ——— */}
      <a href={href({ name: 'profilo' })} className="press card mt-5 grid grid-cols-3 gap-3 p-4">
        <Stat value={`${month.euro.toLocaleString('it-IT', { maximumFractionDigits: 0 })}€`} label="salvati in 30 gg" tone="basil" />
        <Stat value={formatKg(month.grams)} label="cibo non buttato" tone="butter" />
        <Stat value={<span className="inline-flex items-center gap-1">{s}<Flame size={20} className={cx(s ? 'fill-tomato text-tomato' : 'text-faint')} /></span>} label="giorni di fila" tone="tomato" />
      </a>

      {/* ——— Azioni rapide ——— */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={() => setAdding(true)} className="press card flex items-center gap-3 p-4 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tomato text-white"><Plus size={22} strokeWidth={2.6} /></span>
          <span><b className="block font-display">Aggiungi</b><span className="text-xs text-muted">a mano</span></span>
        </button>
        <button onClick={() => setScanning(true)} className="press card relative flex items-center gap-3 overflow-hidden p-4 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink text-paper"><Camera size={20} /></span>
          <span><b className="block font-display">Scansiona</b><span className="text-xs text-muted">con una foto</span></span>
          {!premium && <PremiumBadge className="absolute right-2 top-2 scale-90" />}
        </button>
        <button onClick={() => setReading(true)} className="press card relative col-span-2 flex items-center gap-3 overflow-hidden p-4 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-basil text-white"><ReceiptText size={20} /></span>
          <span><b className="block font-display">Scontrino furbo</b><span className="text-xs text-muted">fotografa la spesa: entra in dispensa con le scadenze</span></span>
          {!premium && <PremiumBadge className="absolute right-2 top-2 scale-90" />}
        </button>
      </div>

      {/* ——— Da salvare ——— */}
      {expiring.length > 0 && (
        <>
          <SectionTitle hand="prima che scadano!">Da usare subito</SectionTitle>
          <div className="card overflow-hidden">
            {expiring.map((p) => {
              const ing = INGREDIENT_BY_ID[p.ingredientId]
              const f = freshness(p, today)
              return (
                <button key={p.ingredientId} onClick={() => setEditing(p.ingredientId)} className="press flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0">
                  <span className="text-2xl">{ing.emoji}</span>
                  <span className="flex-1 font-medium">{ing.name}</span>
                  <span className={cx('rounded-full px-2.5 py-1 text-xs font-bold', freshPill(f))}>{freshLabel(f, daysLeft(p, today))}</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      {rescuers.length > 0 && (
        <>
          <SectionTitle action={<a href={href({ name: 'ricette' })} className="text-sm font-semibold text-tomato">Tutte</a>}>Ricette salva-spreco</SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {rescuers.map((m) => <RecipeCard key={m.recipe.id} m={m} variant="wide" />)}
          </div>
        </>
      )}

      {ready.length > 0 && rescuers.length === 0 && (
        <>
          <SectionTitle action={<a href={href({ name: 'ricette' })} className="text-sm font-semibold text-tomato">Tutte</a>}>Puoi cucinarle adesso</SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {ready.map((m) => <RecipeCard key={m.recipe.id} m={m} variant="wide" />)}
          </div>
        </>
      )}

      {/* ——— Il frigo ——— */}
      <SectionTitle action={<span className="text-sm text-muted">{pantry.length} ingredienti</span>}>Nel tuo frigo</SectionTitle>
      <div className="mb-3 flex gap-2">
        {STORAGE.map((st) => (
          <button key={st.id} onClick={() => setWhere(st.id)} className={cx('press flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold', where === st.id ? 'border-ink bg-ink text-paper' : 'border-line bg-card')}>
            {st.emoji} {st.label}
          </button>
        ))}
      </div>

      {pantry.length === 0 ? (
        <Empty emoji="🧊" title="Riempi il frigo" text="Aggiungi quello che hai: ti diciamo subito cosa ci puoi cucinare." action={<Button onClick={() => setAdding(true)}><Plus size={18} /> Aggiungi ingredienti</Button>} />
      ) : shelves.length === 0 ? (
        <p className="card px-4 py-6 text-center text-sm text-muted">Niente qui. Prova un altro scomparto.</p>
      ) : (
        <motion.div layout className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <AnimatePresence>
            {shelves.map((p) => {
              const ing = INGREDIENT_BY_ID[p.ingredientId]
              const f = freshness(p, today)
              return (
                <motion.button layout key={p.ingredientId} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  onClick={() => setEditing(p.ingredientId)}
                  className={cx('press card relative flex flex-col items-center gap-1 px-2 pb-2.5 pt-3 text-center', f === 'scaduto' && 'opacity-50')}>
                  <span className="text-[34px] leading-none">{ing.emoji}</span>
                  <span className="line-clamp-1 text-[12.5px] font-semibold">{ing.name}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted"><FreshDot f={f} />{f === 'lunga' ? 'ok' : dayMonth(p.expiresAt)}</span>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {expired.length > 0 && (
        <button className="press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 text-sm text-muted"
          onClick={() => { const n = clearExpired(); toast(`${n} scaduti tolti dal frigo`, '🗑️') }}>
          <Trash2 size={15} /> Togli {expired.length} {expired.length === 1 ? 'scaduto' : 'scaduti'}
        </button>
      )}

      <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1"><FreshDot f="presto" /> scade a breve</span>
        <span className="inline-flex items-center gap-1"><FreshDot f="ok" /> entro 2 settimane</span>
        <span className="inline-flex items-center gap-1"><FreshDot f="lunga" /> lunga conservazione</span>
      </div>

      <AddSheet open={adding} onClose={() => setAdding(false)} />
      <ScanSheet open={scanning} onClose={() => setScanning(false)} />
      <ReceiptSheet open={reading} onClose={() => setReading(false)} />
      <ItemSheet id={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

/** Dettaglio di un ingrediente: cambia scadenza, usalo, toglilo. */
function ItemSheet({ id, onClose }: { id: string | null; onClose(): void }) {
  const item = useApp((s) => s.pantry.find((p) => p.ingredientId === id))
  const setExpiry = useApp((s) => s.setExpiry)
  const remove = useApp((s) => s.removeFromPantry)
  const today = useToday()
  const matches = useMatches()
  if (!id || !item) return <Sheet open={false} onClose={onClose}>{null}</Sheet>
  const ing = INGREDIENT_BY_ID[id]
  const d = daysLeft(item, today)
  const f = freshness(item, today)
  const uses = matches.filter((m) => m.have.includes(id)).slice(0, 4)
  return (
    <Sheet open={!!id} onClose={onClose}>
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-paper-2 text-4xl">{ing.emoji}</span>
        <div>
          <h3 className="font-display text-2xl font-bold">{ing.name}</h3>
          <span className={cx('mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold', freshPill(f))}>{freshLabel(f, d)}</span>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 text-sm font-semibold">Scadenza</div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 5, 7, 14].map((n) => {
            const iso = addDays(today, n)
            return (
              <button key={n} onClick={() => { setExpiry(id, iso); buzz(8) }} className={cx('press rounded-full border px-3 py-1.5 text-sm', item.expiresAt === iso ? 'border-ink bg-ink text-paper' : 'border-line bg-card')}>
                {n === 0 ? 'oggi' : n === 1 ? 'domani' : `+${n} gg`}
              </button>
            )
          })}
          <input type="date" value={item.expiresAt} min={addDays(today, -30)} onChange={(e) => e.target.value && setExpiry(id, e.target.value)} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm" aria-label="Data di scadenza" />
        </div>
      </div>
      {uses.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-sm font-semibold">Usalo in</div>
          <div className="grid gap-2">{uses.map((m) => <RecipeCard key={m.recipe.id} m={m} variant="row" />)}</div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={() => { remove(id); toast(`${ing.name} tolto dal frigo`, '👋'); onClose() }}><Trash2 size={16} /> Finito / buttato</Button>
        <Button variant="ink" onClick={onClose}>Fatto</Button>
      </div>
      <p className="mt-3 text-center text-xs text-faint">{AISLE_LABELS[ing.aisle].label} · aggiunto il {dayMonth(item.addedAt)}</p>
    </Sheet>
  )
}
