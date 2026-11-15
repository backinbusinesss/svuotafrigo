// "Scansiona il frigo": una foto, l'IA riconosce gli ingredienti, l'utente conferma.
import { Camera, ImagePlus, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { FREE_LIMITS } from '@/domain/plans'
import { buzz, toast } from '@/lib/feedback'
import { go } from '@/lib/router'
import { SCAN_ERRORS, ScanError, scanPhoto, type ScanResult } from '@/providers/vision'
import { useApp } from '@/store/app'
import { Button, cx, PremiumBadge, Sheet } from '@/ui/kit'
import { usePremium } from '../hooks'

type Phase = { k: 'intro' } | { k: 'scanning'; preview: string } | { k: 'result'; preview: string; res: ScanResult } | { k: 'error'; msg: string }

export function ScanSheet({ open, onClose }: { open: boolean; onClose(): void }) {
  const premium = usePremium()
  const scansUsed = useApp((s) => s.scansUsed)
  const consumeScan = useApp((s) => s.consumeScan)
  const addToPantry = useApp((s) => s.addToPantry)
  const [phase, setPhase] = useState<Phase>({ k: 'intro' })
  const [picked, setPicked] = useState<string[]>([])
  const input = useRef<HTMLInputElement>(null)
  const freeLeft = Math.max(0, FREE_LIMITS.scans - scansUsed)
  const canScan = premium || freeLeft > 0

  const close = () => {
    onClose()
    setTimeout(() => setPhase({ k: 'intro' }), 300)
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const preview = URL.createObjectURL(file)
    setPhase({ k: 'scanning', preview })
    try {
      const res = await scanPhoto(file)
      if (!premium) consumeScan()
      buzz([10, 40, 10])
      setPicked(res.items.map((x) => x.id))
      setPhase({ k: 'result', preview, res })
    } catch (e) {
      setPhase({ k: 'error', msg: SCAN_ERRORS[e instanceof ScanError ? e.code : 'network'] ?? SCAN_ERRORS.network })
    }
  }

  const confirm = () => {
    addToPantry(picked)
    toast(`${picked.length} ingredienti aggiunti dalla foto`, '📸')
    close()
  }

  return (
    <Sheet open={open} onClose={close} title={<span className="flex items-center gap-2">Scansiona il frigo <PremiumBadge /></span>} tall>
      <input ref={input} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />

      {phase.k === 'intro' && (
        <div className="flex flex-col items-center text-center">
          <div className="relative my-4 grid h-40 w-40 place-items-center rounded-[36px] bg-gradient-to-br from-butter to-tomato text-7xl shadow-xl">
            🧊
            <motion.div className="absolute inset-x-4 h-1 rounded-full bg-white/90 shadow-[0_0_20px_white]" animate={{ top: ['18%', '82%', '18%'] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <h4 className="font-display text-2xl font-bold">Una foto. Zero digitazione.</h4>
          <p className="mt-2 max-w-sm text-muted">Apri il frigo, scatta, e riconosciamo gli ingredienti per te. Tu confermi con un tocco.</p>
          {canScan ? (
            <div className="mt-6 grid w-full gap-2">
              <Button size="lg" block onClick={() => input.current?.click()}><Camera size={20} /> Scatta una foto</Button>
              {!premium && <p className="text-xs text-muted">Hai {freeLeft} scansione gratuita di prova.</p>}
            </div>
          ) : (
            <div className="mt-6 grid w-full gap-2">
              <Button size="lg" variant="butter" block onClick={() => { close(); go({ name: 'premium', from: 'scan' }) }}><Sparkles size={18} /> Sblocca con Premium</Button>
              <p className="text-xs text-muted">Hai usato la scansione di prova. Con Premium sono illimitate.</p>
            </div>
          )}
          <p className="mt-5 text-xs text-faint">La foto viene usata solo per riconoscere gli ingredienti e non viene conservata.</p>
        </div>
      )}

      {phase.k === 'scanning' && (
        <div className="flex flex-col items-center">
          <div className="relative mt-2 w-full overflow-hidden rounded-3xl">
            <img src={phase.preview} alt="La tua foto" className="max-h-[50vh] w-full object-cover" />
            <motion.div className="absolute inset-x-0 h-1.5 bg-butter shadow-[0_0_30px_8px_var(--butter)]" animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <p className="mt-5 font-display text-lg font-bold">Sto guardando nel tuo frigo…</p>
        </div>
      )}

      {phase.k === 'result' && (
        <div>
          {phase.res.demo && (
            <div className="mb-3 rounded-2xl bg-butter-soft p-3 text-sm">
              <b>Modalità dimostrativa.</b> Il riconoscimento reale si attiva collegando il servizio foto: questo è un risultato d'esempio.
            </div>
          )}
          <div className="mb-4 flex items-center gap-3">
            <img src={phase.preview} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <div>
              <div className="font-display text-lg font-bold">Trovati {phase.res.items.length} ingredienti</div>
              <div className="text-sm text-muted">Togli quelli sbagliati, poi aggiungi.</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {phase.res.items.map(({ id, confidence }) => {
              const on = picked.includes(id)
              const ing = INGREDIENT_BY_ID[id]
              return (
                <button key={id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== id) : [...p, id]))}
                  className={cx('press inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium', on ? 'border-basil bg-basil-soft' : 'border-line bg-card opacity-60 line-through')}>
                  <span>{ing.emoji}</span>{ing.name}{confidence === 'media' && <span className="text-xs text-muted">?</span>}
                </button>
              )
            })}
          </div>
          {phase.res.unknown.length > 0 && <p className="mt-3 text-xs text-muted">Visti ma non in catalogo: {phase.res.unknown.join(', ')}.</p>}
          <div className="mt-6 grid gap-2">
            <Button size="lg" block onClick={confirm} disabled={!picked.length}>Aggiungi {picked.length} al frigo</Button>
            <Button variant="ghost" block onClick={() => input.current?.click()}><ImagePlus size={18} /> Un'altra foto</Button>
          </div>
        </div>
      )}

      {phase.k === 'error' && (
        <div className="py-8 text-center">
          <div className="text-5xl">😕</div>
          <p className="mt-3 font-semibold">{phase.msg}</p>
          <Button className="mt-5" onClick={() => setPhase({ k: 'intro' })}>Riprova</Button>
        </div>
      )}
    </Sheet>
  )
}
