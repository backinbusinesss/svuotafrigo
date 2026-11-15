// Componenti di base condivisi da tutte le schermate.
import { AnimatePresence, motion } from 'motion/react'
import { ChevronLeft, Lock, X } from 'lucide-react'
import { type ButtonHTMLAttributes, type ReactNode, useEffect } from 'react'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { relativeDays } from '@/domain/dates'
import type { Freshness } from '@/domain/pantry'
import type { Recipe } from '@/domain/types'
import { back } from '@/lib/router'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'ink' | 'soft' | 'ghost' | 'basil' | 'butter'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-tomato text-white shadow-[0_8px_20px_-8px_var(--tomato)] hover:brightness-105',
  ink: 'bg-ink text-paper hover:opacity-90',
  soft: 'bg-paper-2 text-ink hover:bg-line/60',
  ghost: 'bg-transparent text-ink border border-line hover:bg-paper-2',
  basil: 'bg-basil text-white shadow-[0_8px_20px_-8px_var(--basil)]',
  butter: 'bg-butter text-[#1d1a16] shadow-[0_8px_20px_-8px_var(--butter)]',
}

export function Button({
  variant = 'primary', size = 'md', block, className, children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean }) {
  return (
    <button
      {...rest}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' && 'h-9 px-4 text-sm',
        size === 'md' && 'h-12 px-5 text-[15px]',
        size === 'lg' && 'h-14 px-6 text-base',
        block && 'w-full',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TopBar({ title, backTo = true, right }: { title?: ReactNode; backTo?: boolean; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-2 flex h-14 items-center gap-2 bg-paper/85 px-4 backdrop-blur-xl">
      {backTo && (
        <button onClick={back} aria-label="Indietro" className="press -ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-paper-2">
          <ChevronLeft size={24} />
        </button>
      )}
      <div className="min-w-0 flex-1 truncate font-display text-lg font-bold">{title}</div>
      {right}
    </header>
  )
}

export function SectionTitle({ children, action, hand }: { children: ReactNode; action?: ReactNode; hand?: string }) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between gap-3">
      <h2 className="font-display text-xl font-bold leading-tight">
        {children}
        {hand && <span className="magnet ml-2 inline-block text-lg font-normal text-tomato">{hand}</span>}
      </h2>
      {action}
    </div>
  )
}

/** Bottom sheet modale, con chiusura su sfondo, Esc e trascinamento. */
export function Sheet({ open, onClose, title, children, tall }: { open: boolean; onClose(): void; title?: ReactNode; children: ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      removeEventListener('keydown', k)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className={cx('relative w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-paper px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-2xl', tall ? 'max-h-[92vh] min-h-[70vh]' : 'max-h-[88vh]')}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose() }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            {title && (
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <button onClick={onClose} aria-label="Chiudi" className="press grid h-9 w-9 place-items-center rounded-full bg-paper-2"><X size={18} /></button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const FRESH: Record<Freshness, { dot: string; label: (d: number) => string; pill: string }> = {
  scaduto: { dot: 'bg-faint', label: (d) => `scaduto ${relativeDays(d)}`, pill: 'bg-paper-2 text-faint line-through' },
  oggi: { dot: 'bg-tomato animate-pulse', label: () => 'scade oggi', pill: 'bg-tomato text-white' },
  presto: { dot: 'bg-tomato', label: (d) => `scade ${relativeDays(d)}`, pill: 'bg-tomato-soft text-tomato-ink' },
  ok: { dot: 'bg-butter', label: (d) => `ancora ${d} giorni`, pill: 'bg-butter-soft text-ink' },
  lunga: { dot: 'bg-basil', label: () => 'a lunga conservazione', pill: 'bg-basil-soft text-basil' },
}
export const freshLabel = (f: Freshness, days: number) => FRESH[f].label(days)
export const freshPill = (f: Freshness) => FRESH[f].pill
export const FreshDot = ({ f }: { f: Freshness }) => <span className={cx('inline-block h-2 w-2 shrink-0 rounded-full', FRESH[f].dot)} />

/** Copertina della ricetta: gradiente + composizione di emoji. Niente foto da scaricare. */
export function RecipeCover({ recipe, className, size = 'md', locked }: { recipe: Recipe; className?: string; size?: 'sm' | 'md' | 'lg'; locked?: boolean }) {
  const [a, b] = recipe.palette
  const [hero, ...rest] = recipe.emoji
  const big = size === 'lg' ? 'text-[110px]' : size === 'md' ? 'text-6xl' : 'text-4xl'
  const small = size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-2xl' : 'text-lg'
  return (
    <div className={cx('relative isolate overflow-hidden', className)} style={{ background: `radial-gradient(120% 90% at 20% 10%, ${a}, ${b})` }}>
      <div className="absolute inset-0 -z-10 opacity-25" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.7) 1.2px, transparent 1.3px)', backgroundSize: '14px 14px' }} />
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/20 blur-xl" />
      <div className="flex h-full w-full items-center justify-center">
        <span className={cx(big, 'drop-shadow-[0_10px_14px_rgba(0,0,0,.25)]')} aria-hidden>{hero}</span>
      </div>
      {rest.map((e, i) => (
        <span key={i} aria-hidden className={cx('absolute drop-shadow-md', small, i === 0 ? 'bottom-[12%] left-[12%] -rotate-12' : 'right-[12%] top-[14%] rotate-12')}>{e}</span>
      ))}
      {locked && (
        <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[1px]">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-[#1d1a16]"><Lock size={20} /></span>
        </div>
      )}
    </div>
  )
}

export function IngredientChip({ id, onClick, active, dim, trailing }: { id: string; onClick?(): void; active?: boolean; dim?: boolean; trailing?: ReactNode }) {
  const ing = INGREDIENT_BY_ID[id]
  if (!ing) return null
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        onClick && 'press',
        active ? 'border-ink bg-ink text-paper' : 'border-line bg-card',
        dim && 'opacity-50',
      )}
    >
      <span aria-hidden>{ing.emoji}</span>
      {ing.name}
      {trailing}
    </Tag>
  )
}

export function Stat({ value, label, tone = 'ink' }: { value: ReactNode; label: string; tone?: 'ink' | 'tomato' | 'basil' | 'butter' }) {
  const color = { ink: 'text-ink', tomato: 'text-tomato', basil: 'text-basil', butter: 'text-[#b8860b] dark:text-butter' }[tone]
  return (
    <div className="min-w-0">
      <div className={cx('font-display text-2xl font-extrabold leading-none tracking-tight', color)}>{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  )
}

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-5xl" aria-hidden>{emoji}</div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export const PremiumBadge = ({ className }: { className?: string }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full bg-butter px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1d1a16]', className)}>
    ★ Premium
  </span>
)
