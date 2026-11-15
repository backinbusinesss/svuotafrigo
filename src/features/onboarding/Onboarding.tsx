// Primo avvio in 4 passi: benvenuto, chi sei, come mangi, cosa hai in frigo. Meno di un minuto.
import { ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { STARTER_IDS } from '@/content/ingredients'
import type { Allergen, Diet } from '@/domain/types'
import { buzz } from '@/lib/feedback'
import { useApp } from '@/store/app'
import { Button, cx, IngredientChip } from '@/ui/kit'
import { ALLERGENS, DIETS } from '../profile/ProfileScreen'

const FLOAT = ['🥕', '🧀', '🍅', '🥚', '🥦', '🍋', '🧅', '🥛']

export function Onboarding() {
  const finish = useApp((s) => s.finishOnboarding)
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [household, setHousehold] = useState(2)
  const [diets, setDiets] = useState<Diet[]>([])
  const [allergies, setAllergies] = useState<Allergen[]>([])
  const [starter, setStarter] = useState<string[]>([])
  const next = () => { buzz(8); setStep((s) => s + 1) }
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => <div key={i} className={cx('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-tomato' : 'bg-line')} />)}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
          {step === 0 && (
            <div className="flex flex-1 flex-col justify-center text-center">
              <div className="relative mx-auto mb-8 h-56 w-44">
                <div className="absolute inset-0 rounded-[34px] bg-gradient-to-b from-[#f4f1ec] to-[#dcd6cc] shadow-2xl dark:from-[#3a332c] dark:to-[#26211c]" />
                <div className="absolute inset-x-3 top-3 h-[38%] rounded-[24px] border-2 border-black/5 bg-white/50 dark:bg-white/5" />
                <div className="absolute inset-x-3 bottom-3 top-[45%] rounded-[24px] border-2 border-black/5 bg-white/50 dark:bg-white/5" />
                <div className="absolute right-5 top-[20%] h-10 w-1.5 rounded-full bg-black/15" />
                <div className="absolute right-5 top-[55%] h-14 w-1.5 rounded-full bg-black/15" />
                {FLOAT.map((e, i) => (
                  <motion.span key={e} className="absolute text-3xl" style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
                    animate={{ y: [0, -10, 0], rotate: [0, i % 2 ? 8 : -8, 0] }} transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.2 }}>
                    {e}
                  </motion.span>
                ))}
              </div>
              <span className="magnet mx-auto text-2xl text-tomato">ciao!</span>
              <h1 className="mt-1 font-display text-[40px] font-extrabold leading-[1] tracking-tight">Quello che hai<br />diventa cena.</h1>
              <p className="mx-auto mt-4 max-w-xs text-muted">Dimmi cosa c'è in frigo: ti dico cosa cucinare, partendo da quello che sta per scadere.</p>
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 pt-10">
              <h2 className="font-display text-3xl font-extrabold">Come ti chiami?</h2>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Il tuo nome (facoltativo)"
                className="mt-5 h-14 w-full rounded-2xl border border-line bg-card px-4 text-lg outline-none focus:border-ink" />
              <h2 className="mt-10 font-display text-2xl font-extrabold">Per quante persone cucini?</h2>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} onClick={() => setHousehold(n)} className={cx('press aspect-square rounded-2xl text-xl font-bold', household === n ? 'bg-ink text-paper' : 'border border-line bg-card')}>{n}</button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 pt-10">
              <h2 className="font-display text-3xl font-extrabold">Come mangi?</h2>
              <p className="mt-1 text-muted">Ti mostriamo solo ricette adatte. Puoi cambiarlo quando vuoi.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {DIETS.map((d) => (
                  <button key={d.id} onClick={() => setDiets(toggle(diets, d.id))} className={cx('press flex items-center gap-2 rounded-2xl border p-4 text-left font-semibold', diets.includes(d.id) ? 'border-basil bg-basil-soft' : 'border-line bg-card')}>
                    <span className="text-2xl">{d.emoji}</span>{d.label}
                  </button>
                ))}
              </div>
              <h3 className="mt-8 font-display text-xl font-bold">Allergie?</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <button key={a.id} onClick={() => setAllergies(toggle(allergies, a.id))} className={cx('press rounded-full border px-3.5 py-2 text-sm font-medium', allergies.includes(a.id) ? 'border-tomato bg-tomato text-white' : 'border-line bg-card')}>{a.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 pt-10">
              <h2 className="font-display text-3xl font-extrabold">Cosa hai adesso?</h2>
              <p className="mt-1 text-muted">Tocca quello che vedi in frigo. Il resto lo aggiungi dopo, anche con una foto.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {STARTER_IDS.map((id) => <IngredientChip key={id} id={id} active={starter.includes(id)} onClick={() => { buzz(6); setStarter(toggle(starter, id)) }} />)}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-6">
        {step < 3 ? (
          <Button size="lg" block onClick={next}>{step === 0 ? 'Iniziamo' : 'Avanti'} <ArrowRight size={20} /></Button>
        ) : (
          <Button size="lg" block onClick={() => { buzz([10, 40, 20]); finish({ name, household, diets, allergies, starter }) }}>
            {starter.length ? `Vedi cosa cucinare con ${starter.length} ingredienti` : 'Entra nell\'app'}
          </Button>
        )}
        {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-3 w-full py-2 text-sm text-muted">Indietro</button>}
      </div>
    </div>
  )
}
