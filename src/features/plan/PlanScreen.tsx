// Piano della settimana (Premium). Chi non è Premium vede un'anteprima vera del suo piano, sfocata.
import { CalendarDays, Check, RefreshCw, ShoppingCart, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { getRecipe, useRecipes } from '@/content/catalog'
import { dayMonth, todayISO, weekdayLong } from '@/domain/dates'
import { planWeek } from '@/domain/planner'
import { buzz, toast } from '@/lib/feedback'
import { go, href } from '@/lib/router'
import { useApp } from '@/store/app'
import { Button, cx, PremiumBadge, RecipeCover } from '@/ui/kit'
import { useAccess, usePremium, useToday } from '../hooks'

export function PlanScreen() {
  const premium = usePremium()
  const access = useAccess()
  const today = useToday()
  const pantry = useApp((s) => s.pantry)
  const diets = useApp((s) => s.diets)
  const allergies = useApp((s) => s.allergies)
  const mealPlan = useApp((s) => s.mealPlan)
  const cooked = useApp((s) => s.cooked)
  const setMealPlan = useApp((s) => s.setMealPlan)
  const markPlanDone = useApp((s) => s.markPlanDone)
  const recipes = useRecipes(true)

  // Anteprima calcolata davvero sul frigo dell'utente: è la promessa concreta del Premium.
  const preview = useMemo(
    () => planWeek({ recipes, pantry, profile: { diets, allergies }, access: { premium: true, packs: [] }, start: today }),
    [recipes, pantry, diets, allergies, today],
  )

  const generate = () => {
    const recent = cooked.slice(0, 10).map((c) => c.recipeId)
    const res = planWeek({ recipes, pantry, profile: { diets, allergies }, access, start: todayISO(), avoid: recent })
    setMealPlan(res.days, res.shopping)
    buzz([10, 30, 10])
    toast(`Piano pronto: ${res.rescued.length} ingredienti salvati, ${res.shopping.length} da comprare`, '📅')
  }

  const current = mealPlan.filter((d) => d.date >= today)

  if (!premium) {
    return (
      <div className="pt-6">
        <h1 className="font-display text-[34px] font-extrabold tracking-tight">Piano della settimana</h1>
        <p className="text-sm text-muted">Sette cene, la spesa già fatta, zero sprechi.</p>
        <div className="relative mt-5">
          <div className="pointer-events-none grid select-none gap-2 blur-[3px]" aria-hidden>
            {preview.days.slice(0, 5).map((d) => {
              const r = getRecipe(d.recipeId!)!
              return (
                <div key={d.date} className="card flex items-center gap-3 p-2.5">
                  <RecipeCover recipe={r} size="sm" className="h-14 w-14 rounded-xl" />
                  <div><div className="text-xs text-muted">{weekdayLong(d.date)}</div><div className="font-display font-bold">{r.name}</div></div>
                </div>
              )
            })}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-paper/70 to-paper px-6 text-center">
            <PremiumBadge />
            <h2 className="mt-3 font-display text-2xl font-extrabold">Il tuo piano è già pronto.</h2>
            <p className="mt-1 text-sm text-muted">Usa {preview.rescued.length} ingredienti in scadenza e ti servono solo {preview.shopping.length} cose dal supermercato.</p>
            <Button size="lg" variant="butter" className="mt-5" onClick={() => go({ name: 'premium', from: 'piano' })}><Sparkles size={18} /> Sbloccalo · 7 giorni gratis</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px] font-extrabold tracking-tight">La tua settimana</h1>
          <p className="text-sm text-muted">Pensata per usare prima ciò che scade.</p>
        </div>
        <PremiumBadge className="mt-3" />
      </div>

      {current.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center p-8 text-center">
          <CalendarDays size={48} className="text-tomato" />
          <h2 className="mt-3 font-display text-xl font-bold">Crea il piano in un tocco</h2>
          <p className="mt-1 text-sm text-muted">Sette cene con quello che hai, più la lista di ciò che manca.</p>
          <Button size="lg" className="mt-5" onClick={generate}><Sparkles size={18} /> Genera il piano</Button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-2.5">
            {current.map((d) => {
              const r = d.recipeId ? getRecipe(d.recipeId) : null
              if (!r) return null
              const isToday = d.date === today
              return (
                <div key={d.date} className={cx('card flex items-center gap-3 p-2.5 pr-3', isToday && 'ring-2 ring-tomato')}>
                  <a href={href({ name: 'ricetta', id: r.id })} className="press flex min-w-0 flex-1 items-center gap-3">
                    <RecipeCover recipe={r} size="sm" className="h-16 w-16 shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <div className={cx('text-xs font-semibold', isToday ? 'text-tomato' : 'text-muted')}>{isToday ? 'Stasera' : `${weekdayLong(d.date)} ${dayMonth(d.date)}`}</div>
                      <div className={cx('truncate font-display font-bold', d.done && 'line-through opacity-50')}>{r.name}</div>
                      <div className="text-xs text-muted">{r.minutes} min · {r.ingredients.filter((x) => !x.optional && !INGREDIENT_BY_ID[x.id].staple).map((x) => INGREDIENT_BY_ID[x.id].emoji).join(' ')}</div>
                    </div>
                  </a>
                  <button onClick={() => { markPlanDone(d.date); buzz(10) }} aria-label="Segna come fatto"
                    className={cx('press grid h-9 w-9 shrink-0 place-items-center rounded-full', d.done ? 'bg-basil text-white' : 'border-2 border-line')}>
                    {d.done && <Check size={16} strokeWidth={3} />}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={generate}><RefreshCw size={16} /> Rigenera</Button>
            <Button variant="ink" onClick={() => go({ name: 'spesa' })}><ShoppingCart size={16} /> Lista spesa</Button>
          </div>
        </>
      )}
    </div>
  )
}
