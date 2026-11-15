// Dettaglio ricetta: cosa hai, cosa manca, porzioni, passi, "l'ho cucinata".
import { Check, ChefHat, Clock, Flame, Heart, Lock, Minus, Plus, Share2, ShoppingCart, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { RECIPE_BY_ID } from '@/content/recipes'
import { formatKg } from '@/domain/impact'
import { matchRecipe, optionalConflicts, scaleQty } from '@/domain/matching'
import { FREE_LIMITS, PACKS } from '@/domain/plans'
import type { CookedEntry, RecipeIngredient } from '@/domain/types'
import { buzz, toast } from '@/lib/feedback'
import { go, href } from '@/lib/router'
import { checkout } from '@/providers/payments'
import { useApp } from '@/store/app'
import { Button, cx, RecipeCover, Sheet, TopBar } from '@/ui/kit'
import { useAccess, useToday } from '../hooks'

const COURSE_LABEL: Record<string, string> = { primo: 'Primo', secondo: 'Secondo', 'piatto-unico': 'Piatto unico', contorno: 'Contorno', antipasto: 'Antipasto', dolce: 'Dolce', colazione: 'Colazione' }

function qtyText(ri: RecipeIngredient, base: number, servings: number) {
  if (ri.unit === 'q.b.' || ri.qty == null) return ri.unit === 'q.b.' ? 'q.b.' : ''
  const v = scaleQty(ri.qty, base, servings)
  const n = v.toLocaleString('it-IT')
  if (ri.unit === 'pz') return n
  if (ri.unit === 'cucchiai') return v === 1 ? '1 cucchiaio' : `${n} cucchiai`
  return `${n} ${ri.unit}`
}

export function RecipeScreen({ id }: { id: string }) {
  const recipe = RECIPE_BY_ID[id]
  const pantry = useApp((s) => s.pantry)
  const household = useApp((s) => s.household)
  const diets = useApp((s) => s.diets)
  const allergies = useApp((s) => s.allergies)
  const fav = useApp((s) => s.favorites.includes(id))
  const toggleFavorite = useApp((s) => s.toggleFavorite)
  const addToShopping = useApp((s) => s.addToShopping)
  const cook = useApp((s) => s.cook)
  const access = useAccess()
  const today = useToday()
  const [servings, setServings] = useState(() => Math.min(household, access.premium ? 12 : FREE_LIMITS.servings))
  const [done, setDone] = useState<CookedEntry | null>(null)

  const m = useMemo(() => recipe && matchRecipe(recipe, pantry, today, access), [recipe, pantry, today, access])
  if (!recipe || !m) {
    return <div className="pt-20 text-center"><p>Ricetta non trovata.</p><a className="text-tomato" href={href({ name: 'ricette' })}>Torna alle ricette</a></div>
  }
  const conflicts = optionalConflicts(recipe, { diets, allergies })
  const inFridge = new Set(pantry.map((p) => p.ingredientId))
  const maxServ = access.premium ? 12 : FREE_LIMITS.servings

  const setServ = (n: number) => {
    if (n > maxServ) {
      toast(`Fino a ${FREE_LIMITS.servings} porzioni nel piano gratuito`, '★', { label: 'Premium', run: () => go({ name: 'premium', from: 'porzioni' }) })
      return
    }
    setServings(Math.max(1, n))
    buzz(6)
  }

  const share = async () => {
    const text = `${recipe.name} — ${recipe.hook}\n\nIngredienti:\n${recipe.ingredients.map((ri) => `• ${INGREDIENT_BY_ID[ri.id].name} ${qtyText(ri, recipe.servings, servings)}`).join('\n')}\n\nDa SvuotaFrigo`
    try {
      if (navigator.share) await navigator.share({ title: recipe.name, text })
      else { await navigator.clipboard.writeText(text); toast('Ricetta copiata', '📋') }
    } catch { /* annullato */ }
  }

  const onCooked = () => {
    const entry = cook(recipe.id)
    buzz([20, 60, 20, 60, 40])
    setDone(entry)
  }

  if (m.locked && recipe.pack) {
    const pack = PACKS[recipe.pack]
    return (
      <div>
        <TopBar />
        <RecipeCover recipe={recipe} size="lg" locked className="-mx-4 h-72" />
        <div className="pt-6 text-center">
          <span className="rounded-full bg-butter px-3 py-1 text-sm font-bold text-[#1d1a16]">{pack.emoji} Pacchetto {pack.name}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold">{recipe.name}</h1>
          <p className="mt-1 text-muted">{recipe.hook}</p>
          <div className="card mt-6 p-5 text-left">
            <p className="text-sm">{pack.description}</p>
            <div className="mt-4 grid gap-2">
              <Button size="lg" block onClick={() => checkout({ kind: 'pack', id: pack.id })}><Lock size={18} /> Sblocca il pacchetto · {(pack.priceCents / 100).toFixed(2).replace('.', ',')} €</Button>
              <Button variant="butter" block onClick={() => go({ name: 'premium', from: `pack-${pack.id}` })}>Oppure tutti i pacchetti con Premium</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-28">
      <TopBar
        right={
          <div className="flex gap-1">
            <button onClick={share} aria-label="Condividi" className="press grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2"><Share2 size={20} /></button>
            <button onClick={() => { toggleFavorite(recipe.id); buzz(10) }} aria-label={fav ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'} className="press grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2">
              <Heart size={20} className={cx(fav && 'fill-tomato text-tomato')} />
            </button>
          </div>
        }
      />
      <RecipeCover recipe={recipe} size="lg" className="-mx-4 h-64 sm:rounded-3xl" />

      <div className="pt-5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-paper-2 px-2.5 py-1">{COURSE_LABEL[recipe.course]}</span>
          {recipe.region && <span className="rounded-full bg-paper-2 px-2.5 py-1">📍 {recipe.region}</span>}
          {recipe.tags?.map((t) => <span key={t} className="rounded-full bg-paper-2 px-2.5 py-1">{t}</span>)}
        </div>
        <h1 className="mt-3 font-display text-[32px] font-extrabold leading-[1.05] tracking-tight">{recipe.name}</h1>
        <p className="magnet mt-1 inline-block text-xl text-tomato">{recipe.hook}</p>

        <div className="card mt-5 grid grid-cols-3 divide-x divide-line py-3 text-center">
          <div><Clock size={18} className="mx-auto text-muted" /><div className="mt-1 font-display font-bold">{recipe.minutes} min</div></div>
          <div><ChefHat size={18} className="mx-auto text-muted" /><div className="mt-1 font-display font-bold">{['Facile', 'Media', 'Impegnativa'][recipe.difficulty - 1]}</div></div>
          <div><Flame size={18} className="mx-auto text-muted" /><div className="mt-1 font-display font-bold">{recipe.kcal} kcal</div></div>
        </div>

        {m.rescues.length > 0 && (
          <div className="mt-4 rounded-2xl bg-tomato-soft p-4 text-sm text-tomato-ink">
            <b>♻ Salva-spreco:</b> usa {m.rescues.map((rid) => INGREDIENT_BY_ID[rid].name.toLowerCase()).join(', ')}, che {m.rescues.length > 1 ? 'stanno' : 'sta'} per scadere.
          </div>
        )}

        {/* ——— Ingredienti ——— */}
        <div className="mt-7 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Ingredienti</h2>
          <div className="flex items-center gap-1 rounded-full border border-line bg-card p-1">
            <button aria-label="Meno porzioni" onClick={() => setServ(servings - 1)} className="press grid h-8 w-8 place-items-center rounded-full bg-paper-2"><Minus size={16} /></button>
            <span className="flex min-w-16 items-center justify-center gap-1 text-sm font-bold"><Users size={15} />{servings}</span>
            <button aria-label="Più porzioni" onClick={() => setServ(servings + 1)} className="press grid h-8 w-8 place-items-center rounded-full bg-paper-2"><Plus size={16} /></button>
          </div>
        </div>
        <ul className="card mt-3 overflow-hidden">
          {recipe.ingredients.map((ri) => {
            const ing = INGREDIENT_BY_ID[ri.id]
            const have = inFridge.has(ri.id) || ing.staple
            const conflict = conflicts.includes(ri.id)
            return (
              <li key={ri.id} className={cx('flex items-center gap-3 border-b border-line px-4 py-3 last:border-0', conflict && 'opacity-50')}>
                <span className="text-2xl">{ing.emoji}</span>
                <span className="flex-1">
                  <span className="font-medium">{ing.name}</span>
                  {ri.optional && <span className="ml-1.5 text-xs text-muted">facoltativo</span>}
                  {conflict && <span className="ml-1.5 text-xs text-tomato">da evitare per te</span>}
                </span>
                <span className="text-sm text-muted">{qtyText(ri, recipe.servings, servings)}</span>
                <span className={cx('grid h-6 w-6 place-items-center rounded-full', have ? 'bg-basil text-white' : 'border-2 border-dashed border-line')} title={have ? 'Ce l\'hai' : 'Manca'}>
                  {have && <Check size={14} strokeWidth={3} />}
                </span>
              </li>
            )
          })}
        </ul>
        {m.missing.length > 0 && (
          <Button variant="soft" block className="mt-3" onClick={() => { addToShopping(m.missing, recipe.id); toast(`${m.missing.length} ingredienti nella lista della spesa`, '🛒', { label: 'Apri', run: () => go({ name: 'spesa' }) }) }}>
            <ShoppingCart size={18} /> Aggiungi i {m.missing.length} mancanti alla spesa
          </Button>
        )}

        {/* ——— Procedimento ——— */}
        <h2 className="mt-8 font-display text-xl font-bold">Procedimento</h2>
        <ol className="mt-3 grid gap-3">
          {recipe.steps.map((s, i) => (
            <li key={i} className="card flex gap-4 p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display font-bold text-paper">{i + 1}</span>
              <div className="pt-1">
                <p className="leading-relaxed">{s.text}</p>
                {s.timer && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-butter-soft px-2.5 py-1 text-xs font-semibold"><Clock size={12} /> {s.timer} min</span>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ——— Barra azioni ——— */}
      <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-lg px-4">
        <div className="flex gap-2 rounded-full bg-paper/90 p-1.5 shadow-2xl ring-1 ring-line backdrop-blur-xl">
          <Button variant="ink" className="flex-1" onClick={() => go({ name: 'cucina', id: recipe.id })}><ChefHat size={18} /> Cucina passo passo</Button>
          <Button variant="basil" onClick={onCooked}><Check size={18} strokeWidth={3} /> Fatta!</Button>
        </div>
      </div>

      <Sheet open={!!done} onClose={() => setDone(null)}>
        {done && (
          <div className="py-2 text-center">
            <div className="text-6xl">🎉</div>
            <h3 className="mt-2 font-display text-2xl font-extrabold">Buon appetito!</h3>
            {done.savedEuro > 0 ? (
              <p className="mt-2 text-muted">Hai salvato circa <b className="text-basil">{done.savedEuro.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</b> e <b className="text-basil">{formatKg(done.savedGrams)}</b> di cibo dalla pattumiera.</p>
            ) : (
              <p className="mt-2 text-muted">Ricetta segnata. Abbiamo tolto dal frigo gli ingredienti usati.</p>
            )}
            <p className="mt-1 text-xs text-faint">Stima basata su prezzi e pesi medi.</p>
            <div className="mt-6 grid gap-2">
              <Button block onClick={() => { setDone(null); go({ name: 'frigo' }) }}>Torna al frigo</Button>
              <Button variant="ghost" block onClick={() => { setDone(null); go({ name: 'profilo' }) }}>Vedi i traguardi</Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
