// Lista della spesa per corsia. "Ho fatto la spesa" sposta tutto nel frigo con le scadenze giuste.
import { Check, PackageCheck, Plus, Share2, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { AISLE_LABELS, INGREDIENT_BY_ID } from '@/content/ingredients'
import { getRecipe, useRecipes } from '@/content/catalog'
import { groupByAisle } from '@/domain/planner'
import type { Aisle } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { useApp } from '@/store/app'
import { Button, cx, Empty } from '@/ui/kit'
import { AddSheet } from '../fridge/AddSheet'

const ORDER = Object.keys(AISLE_LABELS) as Aisle[]

export function ShoppingScreen() {
  const list = useApp((s) => s.shopping)
  // i nomi delle ricette dei pacchetti arrivano col loro chunk
  useRecipes(list.some((s) => s.forRecipes.some((id) => !getRecipe(id))))
  const toggle = useApp((s) => s.toggleShopping)
  const remove = useApp((s) => s.removeShopping)
  const moveChecked = useApp((s) => s.moveCheckedToPantry)
  const clear = useApp((s) => s.clearShopping)
  const [adding, setAdding] = useState(false)
  const groups = groupByAisle(list)
  const checked = list.filter((x) => x.checked).length

  const share = async () => {
    const text = ORDER.filter((a) => groups.has(a))
      .map((a) => `${AISLE_LABELS[a].emoji} ${AISLE_LABELS[a].label}\n${groups.get(a)!.map((s) => `${s.checked ? '☑' : '☐'} ${INGREDIENT_BY_ID[s.ingredientId].name}`).join('\n')}`)
      .join('\n\n')
    const full = `Lista della spesa\n\n${text}\n\nDa SvuotaFrigo`
    try {
      if (navigator.share) await navigator.share({ title: 'Lista della spesa', text: full })
      else { await navigator.clipboard.writeText(full); toast('Lista copiata', '📋') }
    } catch { /* annullato */ }
  }

  return (
    <div className="pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px] font-extrabold tracking-tight">Spesa</h1>
          <p className="text-sm text-muted">{list.length ? `${list.length - checked} da prendere · ${checked} nel carrello` : 'Solo quello che serve davvero.'}</p>
        </div>
        <div className="mt-2 flex gap-1">
          {list.length > 0 && <button onClick={share} aria-label="Condividi la lista" className="press grid h-10 w-10 place-items-center rounded-full bg-paper-2"><Share2 size={18} /></button>}
          <button onClick={() => setAdding(true)} aria-label="Aggiungi" className="press grid h-10 w-10 place-items-center rounded-full bg-tomato text-white"><Plus size={20} /></button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <Empty emoji="🛒" title="La lista è vuota" text="Aggiungi i mancanti da una ricetta, genera il piano della settimana, o aggiungi a mano." action={<Button onClick={() => setAdding(true)}><Plus size={18} /> Aggiungi</Button>} />
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          {ORDER.filter((a) => groups.has(a)).map((a) => (
            <section key={a}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{AISLE_LABELS[a].emoji} {AISLE_LABELS[a].label}</h2>
              <ul className="card overflow-hidden">
                <AnimatePresence initial={false}>
                  {groups.get(a)!.map((s) => {
                    const ing = INGREDIENT_BY_ID[s.ingredientId]
                    return (
                      <motion.li key={s.ingredientId} layout exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-0">
                        <button onClick={() => { toggle(s.ingredientId); buzz(8) }} aria-label={s.checked ? 'Togli dal carrello' : 'Metti nel carrello'}
                          className={cx('press grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2', s.checked ? 'border-basil bg-basil text-white' : 'border-line')}>
                          {s.checked && <Check size={16} strokeWidth={3} />}
                        </button>
                        <span className="text-2xl">{ing.emoji}</span>
                        <span className="min-w-0 flex-1">
                          <span className={cx('block font-medium', s.checked && 'text-faint line-through')}>{ing.name}</span>
                          {s.forRecipes.length > 0 && <span className="block truncate text-xs text-muted">per {s.forRecipes.map((id) => getRecipe(id)?.name).filter(Boolean).join(', ')}</span>}
                        </span>
                        <button onClick={() => remove(s.ingredientId)} aria-label="Elimina" className="press grid h-8 w-8 place-items-center rounded-full text-faint hover:bg-paper-2"><X size={16} /></button>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            </section>
          ))}

          <div className="grid gap-2">
            <Button size="lg" variant="basil" disabled={!checked} onClick={() => { const n = moveChecked(); buzz([10, 40, 10]); toast(`${n} prodotti messi in frigo con la scadenza stimata`, '🧊') }}>
              <PackageCheck size={20} /> Ho fatto la spesa ({checked})
            </Button>
            <Button variant="ghost" onClick={() => { if (confirm('Svuotare tutta la lista?')) clear() }}><Trash2 size={16} /> Svuota lista</Button>
          </div>
        </div>
      )}
      <AddSheet open={adding} onClose={() => setAdding(false)} mode="shopping" />
    </div>
  )
}
