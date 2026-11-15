// Modalità cucina: un passo alla volta, testo grande, timer, schermo sempre acceso.
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { RECIPE_BY_ID } from '@/content/recipes'
import { buzz, ding, toast } from '@/lib/feedback'
import { back, go } from '@/lib/router'
import { useApp } from '@/store/app'
import { Button, cx } from '@/ui/kit'

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const take = async () => {
      try { lock = await navigator.wakeLock?.request('screen') } catch { /* non supportato */ }
    }
    take()
    const onVis = () => document.visibilityState === 'visible' && take()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])
}

function Timer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const endAt = useRef(0)
  useEffect(() => { setLeft(minutes * 60); setRunning(false) }, [minutes])
  useEffect(() => {
    if (!running) return
    endAt.current = Date.now() + left * 1000
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(s)
      if (s === 0) {
        setRunning(false)
        ding()
        buzz([300, 120, 300, 120, 300])
        toast('Tempo scaduto!', '⏰')
      }
    }, 250)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  const pct = 1 - left / (minutes * 60)
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="mt-8 flex items-center gap-4 rounded-3xl bg-white/10 p-3 pr-5">
      <button onClick={() => { setRunning((r) => !r); buzz(10) }} aria-label={running ? 'Pausa' : 'Avvia timer'}
        className="press relative grid h-16 w-16 shrink-0 place-items-center rounded-full bg-butter text-[#1d1a16]">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="none" stroke="rgba(0,0,0,.15)" strokeWidth="5" /><circle cx="32" cy="32" r="29" fill="none" stroke="#1d1a16" strokeWidth="5" strokeDasharray={182} strokeDashoffset={182 * (1 - pct)} strokeLinecap="round" /></svg>
        {running ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className="font-display text-4xl font-extrabold tabular-nums">{mm}:{ss}</div>
        <div className="text-sm opacity-70">{left === 0 ? 'Fatto!' : running ? 'Timer in corso' : 'Tocca per avviare'}</div>
      </div>
      <button onClick={() => { setRunning(false); setLeft(minutes * 60) }} aria-label="Azzera" className="press grid h-10 w-10 place-items-center rounded-full bg-white/10"><RotateCcw size={18} /></button>
    </div>
  )
}

export function CookMode({ id }: { id: string }) {
  const recipe = RECIPE_BY_ID[id]
  const cook = useApp((s) => s.cook)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  useWakeLock()
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  })
  if (!recipe) return null
  const steps = recipe.steps
  const last = i === steps.length - 1
  const next = () => { if (i < steps.length - 1) { setDir(1); setI(i + 1); buzz(8) } }
  const prev = () => { if (i > 0) { setDir(-1); setI(i - 1); buzz(8) } }
  const step = steps[i]
  const [a, b] = recipe.palette

  return (
    <div className="fixed inset-0 z-[60] flex flex-col text-white" style={{ background: `radial-gradient(130% 80% at 10% 0%, ${a}, ${b} 55%, #120d0a)` }}>
      <div className="flex items-center gap-3 px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button onClick={back} aria-label="Esci" className="press grid h-10 w-10 place-items-center rounded-full bg-black/25"><X size={20} /></button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold">{recipe.name}</div>
          <div className="text-xs opacity-75">Passo {i + 1} di {steps.length}</div>
        </div>
        <span className="text-3xl">{recipe.emoji[0]}</span>
      </div>
      <div className="mx-4 mt-3 flex gap-1">
        {steps.map((_, k) => <div key={k} className={cx('h-1 flex-1 rounded-full transition-colors', k <= i ? 'bg-white' : 'bg-white/25')} />)}
      </div>

      <div className="relative flex-1 overflow-hidden" onClick={(e) => (e.clientX > innerWidth / 2 ? next() : prev())}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={i} custom={dir} className="absolute inset-0 flex flex-col justify-center px-6"
            initial={{ x: dir * 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -dir * 60, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div className="font-display text-7xl font-extrabold opacity-30">{i + 1}</div>
            <p className="mt-2 font-display text-[28px] font-bold leading-snug sm:text-4xl">{step.text}</p>
            {step.timer && <div onClick={(e) => e.stopPropagation()}><Timer minutes={step.timer} /></div>}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3 px-4 pb-[max(18px,env(safe-area-inset-bottom))]">
        <button onClick={prev} disabled={i === 0} aria-label="Passo precedente" className="press grid h-14 w-14 place-items-center rounded-full bg-black/25 disabled:opacity-30"><ChevronLeft size={26} /></button>
        {last ? (
          <Button size="lg" variant="butter" className="flex-1" onClick={() => { cook(recipe.id); buzz([20, 60, 40]); toast('Ricetta completata! Ingredienti tolti dal frigo.', '🎉'); go({ name: 'frigo' }) }}>Finito, buon appetito!</Button>
        ) : (
          <Button size="lg" className="flex-1 bg-white text-[#1d1a16] shadow-none" onClick={next}>Avanti <ChevronRight size={20} /></Button>
        )}
      </div>
    </div>
  )
}
