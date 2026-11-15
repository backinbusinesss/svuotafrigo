// Ricettario: filtri per "cosa posso fare adesso", ricerca, pacchetti.
import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PACKS } from '@/domain/plans'
import { normalize } from '@/domain/pantry'
import type { Course, PackId } from '@/domain/types'
import { go } from '@/lib/router'
import { useApp } from '@/store/app'
import { cx, Empty, SectionTitle } from '@/ui/kit'
import { useAccess, useMatches } from '../hooks'
import { RecipeCard } from './RecipeCard'

const TABS = [
  { id: 'pronte', label: 'Pronte', emoji: '✅' },
  { id: 'quasi', label: 'Quasi', emoji: '🛒' },
  { id: 'tutte', label: 'Tutte', emoji: '📖' },
  { id: 'preferite', label: 'Preferite', emoji: '❤️' },
] as const
type Tab = (typeof TABS)[number]['id']

const COURSES: { id: Course | 'all'; label: string }[] = [
  { id: 'all', label: 'Tutto' },
  { id: 'primo', label: 'Primi' },
  { id: 'secondo', label: 'Secondi' },
  { id: 'piatto-unico', label: 'Piatti unici' },
  { id: 'contorno', label: 'Contorni' },
  { id: 'antipasto', label: 'Antipasti' },
  { id: 'colazione', label: 'Colazione' },
  { id: 'dolce', label: 'Dolci' },
]

const QUICK = [
  { id: 'veloce', label: '⚡ ≤ 20 min' },
  { id: 'veg', label: '🌱 Vegetariano' },
  { id: 'facile', label: '👌 Facile' },
] as const

export function RecipesScreen({ initialTab }: { initialTab?: string }) {
  const [tab, setTab] = useState<Tab>((TABS.find((t) => t.id === initialTab)?.id ?? 'pronte') as Tab)
  const [course, setCourse] = useState<Course | 'all'>('all')
  const [quick, setQuick] = useState<string[]>([])
  const [q, setQ] = useState('')
  const favorites = useApp((s) => s.favorites)
  const access = useAccess()
  const all = useMatches(true)

  const counts = useMemo(() => ({
    pronte: all.filter((m) => m.kind === 'pronta' && !m.locked).length,
    quasi: all.filter((m) => m.kind === 'quasi' && !m.locked).length,
  }), [all])

  const list = useMemo(() => {
    const nq = normalize(q)
    return all.filter((m) => {
      const r = m.recipe
      if (tab === 'pronte' && (m.kind !== 'pronta' || m.locked)) return false
      if (tab === 'quasi' && (m.kind !== 'quasi' || m.locked)) return false
      if (tab === 'preferite' && !favorites.includes(r.id)) return false
      if (course !== 'all' && r.course !== course) return false
      if (quick.includes('veloce') && r.minutes > 20) return false
      if (quick.includes('veg') && !r.tags?.some((t) => t === 'vegetariano' || t === 'vegano')) return false
      if (quick.includes('facile') && r.difficulty > 1) return false
      if (nq && !normalize(`${r.name} ${r.hook} ${r.region ?? ''} ${(r.tags ?? []).join(' ')}`).includes(nq)) return false
      return true
    })
  }, [all, tab, course, quick, q, favorites])

  const lockedPacks = (Object.keys(PACKS) as PackId[]).filter((p) => !access.premium && !access.packs.includes(p))

  return (
    <div className="pt-6">
      <h1 className="font-display text-[34px] font-extrabold tracking-tight">Ricette</h1>
      <p className="text-sm text-muted">Ordinate per quello che hai e per cosa scade prima.</p>

      <label className="relative mt-4 block">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca: carbonara, veloce, Sicilia…"
          className="h-12 w-full rounded-2xl border border-line bg-card pl-11 pr-4 text-[15px] outline-none focus:border-ink" />
      </label>

      <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-paper-2 p-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cx('press relative rounded-xl py-2 text-[13px] font-semibold', tab === t.id ? 'bg-card shadow-sm' : 'text-muted')}>
            {t.label}
            {(t.id === 'pronte' || t.id === 'quasi') && counts[t.id] > 0 && (
              <span className={cx('ml-1 rounded-full px-1.5 text-[11px]', t.id === 'pronte' ? 'bg-basil text-white' : 'bg-butter text-[#1d1a16]')}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <SlidersHorizontal size={18} className="mt-2 shrink-0 text-muted" />
        {QUICK.map((f) => (
          <button key={f.id} onClick={() => setQuick((x) => (x.includes(f.id) ? x.filter((y) => y !== f.id) : [...x, f.id]))}
            className={cx('press shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium', quick.includes(f.id) ? 'border-ink bg-ink text-paper' : 'border-line bg-card')}>
            {f.label}
          </button>
        ))}
        {COURSES.map((c) => (
          <button key={c.id} onClick={() => setCourse(c.id)}
            className={cx('press shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium', course === c.id ? 'border-tomato bg-tomato-soft text-tomato-ink' : 'border-line bg-card')}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {list.map((m) => <RecipeCard key={m.recipe.id} m={m} />)}
      </div>
      {!list.length && (
        <div className="mt-2">
          {tab === 'pronte' ? (
            <Empty emoji="🥄" title="Ancora nessuna ricetta completa" text="Guarda le ricette a cui mancano 1-2 ingredienti, o aggiungi altro al frigo." />
          ) : tab === 'preferite' ? (
            <Empty emoji="❤️" title="Nessuna preferita" text="Tocca il cuore in una ricetta per ritrovarla qui." />
          ) : (
            <Empty emoji="🔎" title="Nessun risultato" text="Prova a togliere qualche filtro." />
          )}
        </div>
      )}

      {lockedPacks.length > 0 && (
        <>
          <SectionTitle hand="nuove ricette!">Pacchetti</SectionTitle>
          <div className="grid gap-3">
            {lockedPacks.map((p) => (
              <button key={p} onClick={() => go({ name: 'premium', from: `pack-${p}` })} className="press card flex items-center gap-4 p-4 text-left">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-butter-soft text-3xl">{PACKS[p].emoji}</span>
                <span className="min-w-0 flex-1">
                  <b className="font-display text-lg">{PACKS[p].name}</b>
                  <span className="line-clamp-2 block text-sm text-muted">{PACKS[p].description}</span>
                </span>
                <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-sm font-bold text-paper">{(PACKS[p].priceCents / 100).toFixed(2).replace('.', ',')} €</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
