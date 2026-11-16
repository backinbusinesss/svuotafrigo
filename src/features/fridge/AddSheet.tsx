// Aggiunta ingredienti: ricerca istantanea + scorciatoie per corsia.
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { AISLE_LABELS, INGREDIENTS } from '@/content/ingredients'
import { searchIngredients } from '@/domain/pantry'
import type { Aisle } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { useApp } from '@/store/app'
import { Button, cx, Sheet } from '@/ui/kit'

export function AddSheet({ open, onClose, mode = 'pantry' }: { open: boolean; onClose(): void; mode?: 'pantry' | 'shopping' }) {
  const [q, setQ] = useState('')
  const [aisle, setAisle] = useState<Aisle>('frutta-verdura')
  const [picked, setPicked] = useState<string[]>([])
  // useShallow: senza, ogni render creerebbe un array nuovo e React andrebbe in loop
  const inPantry = useApp(useShallow((s) => s.pantry.map((p) => p.ingredientId)))
  const inList = useApp(useShallow((s) => s.shopping.map((p) => p.ingredientId)))
  const addToPantry = useApp((s) => s.addToPantry)
  const addToShopping = useApp((s) => s.addToShopping)
  const already = mode === 'pantry' ? inPantry : inList

  const results = useMemo(
    () => (q.trim() ? searchIngredients(q, 24) : INGREDIENTS.filter((i) => i.aisle === aisle && !i.staple)),
    [q, aisle],
  )

  const toggle = (id: string) => {
    buzz(8)
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const confirm = () => {
    if (!picked.length) return
    if (mode === 'pantry') {
      addToPantry(picked)
      toast(`${picked.length} ${picked.length === 1 ? 'ingrediente aggiunto' : 'ingredienti aggiunti'} al frigo`, '🧊')
    } else {
      addToShopping(picked)
      toast(`${picked.length} ${picked.length === 1 ? 'voce aggiunta' : 'voci aggiunte'} alla spesa`, '🛒')
    }
    setPicked([])
    setQ('')
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={mode === 'pantry' ? 'Cosa c\'è in frigo?' : 'Aggiungi alla spesa'} tall>
      <label className="relative mb-3 block">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca: zucchine, grana, pollo…"
          className="h-12 w-full rounded-2xl border border-line bg-card pl-11 pr-4 text-[15px] outline-none focus:border-ink"
        />
      </label>

      {!q.trim() && (
        <ChipRow>
          {(Object.keys(AISLE_LABELS) as Aisle[]).filter((a) => a !== 'spezie').map((a) => (
            <button key={a} data-active={aisle === a || undefined} onClick={(e) => { setAisle(a); e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }} className={cx('press shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium', aisle === a ? 'border-ink bg-ink text-paper' : 'border-line bg-card')}>
              {AISLE_LABELS[a].emoji} {AISLE_LABELS[a].label}
            </button>
          ))}
        </ChipRow>
      )}

      <div className="grid grid-cols-3 gap-2 pb-24 sm:grid-cols-4">
        {results.map((ing) => {
          const on = picked.includes(ing.id)
          const have = already.includes(ing.id)
          return (
            <button
              key={ing.id}
              onClick={() => toggle(ing.id)}
              className={cx('press relative flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-center', on ? 'border-tomato bg-tomato-soft' : 'border-line bg-card')}
            >
              <span className="text-3xl" aria-hidden>{ing.emoji}</span>
              <span className="line-clamp-2 text-[12.5px] font-medium leading-tight">{ing.name}</span>
              {have && !on && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-basil" title="Già presente" />}
              {on && <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-tomato text-white"><Check size={13} strokeWidth={3} /></span>}
            </button>
          )
        })}
        {!results.length && <p className="col-span-full py-8 text-center text-sm text-muted">Nessun ingrediente trovato per “{q}”.</p>}
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-line bg-paper/95 px-5 pb-1 pt-3 backdrop-blur">
        <Button block size="lg" onClick={confirm} disabled={!picked.length}>
          {picked.length ? `Aggiungi ${picked.length}` : 'Seleziona gli ingredienti'}
        </Button>
      </div>
    </Sheet>
  )
}

/** Riga di categorie scorrevole, con frecce ai lati quando c'è altro da vedere. */
function ChipRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
    update()
    el.querySelector('[data-active]')?.scrollIntoView({ inline: 'center', block: 'nearest' })
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener('scroll', update); ro.disconnect() }
  }, [])

  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: 'smooth' })

  const arrow = (dir: 1 | -1) => (
    <div className={cx('pointer-events-none absolute inset-y-0 z-10 flex items-center transition-opacity', dir < 0 ? '-left-5 bg-gradient-to-r pl-3 pr-6' : '-right-5 justify-end bg-gradient-to-l pl-6 pr-3', 'from-paper via-paper/90 to-transparent', (dir < 0 ? edges.left : edges.right) ? 'opacity-100' : 'opacity-0')}>
      <button
        type="button"
        aria-label={dir < 0 ? 'Categorie precedenti' : 'Altre categorie'}
        tabIndex={(dir < 0 ? edges.left : edges.right) ? 0 : -1}
        onClick={() => move(dir)}
        className="press pointer-events-auto grid h-9 w-9 place-items-center rounded-full border border-line bg-card shadow-sm"
      >
        {dir < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </div>
  )

  return (
    <div className="relative mb-3">
      {arrow(-1)}
      <div ref={ref} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto scroll-smooth px-5">
        {children}
      </div>
      {arrow(1)}
    </div>
  )
}
