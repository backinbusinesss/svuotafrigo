import { Clock, Heart, Leaf } from 'lucide-react'
import type { RecipeMatch } from '@/domain/matching'
import { href } from '@/lib/router'
import { useApp } from '@/store/app'
import { cx, RecipeCover } from '@/ui/kit'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { PACKS } from '@/domain/plans'

function MatchBadge({ m }: { m: RecipeMatch }) {
  if (m.locked && m.recipe.pack) {
    const p = PACKS[m.recipe.pack]
    return <span className="rounded-full bg-butter px-2.5 py-1 text-xs font-bold text-[#1d1a16]">{p.emoji} {p.name}</span>
  }
  if (m.kind === 'pronta') return <span className="rounded-full bg-basil px-2.5 py-1 text-xs font-bold text-white">✓ Hai tutto</span>
  if (m.missing.length) return <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#1d1a16]">Manca{m.missing.length > 1 ? 'no' : ''} {m.missing.length}</span>
  return null
}

/** Card grande (carosello) o compatta (lista). */
export function RecipeCard({ m, variant = 'grid' }: { m: RecipeMatch; variant?: 'grid' | 'row' | 'wide' }) {
  const fav = useApp((s) => s.favorites.includes(m.recipe.id))
  const r = m.recipe
  const rescue = m.rescues.length > 0 && !m.locked

  if (variant === 'row') {
    return (
      <a href={href({ name: 'ricetta', id: r.id })} className="press card flex items-center gap-3 p-2.5 pr-4">
        <RecipeCover recipe={r} size="sm" locked={m.locked} className="h-[72px] w-[72px] shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display font-bold">{r.name}</div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><Clock size={12} />{r.minutes}′</span>
            {m.kind === 'pronta' && !m.locked ? <span className="font-semibold text-basil">hai tutto</span>
              : m.missing.length ? <span>mancano: {m.missing.slice(0, 2).map((id) => INGREDIENT_BY_ID[id]?.name.toLowerCase()).join(', ')}{m.missing.length > 2 ? '…' : ''}</span> : null}
          </div>
          {rescue && <div className="mt-1 text-xs font-semibold text-tomato">♻ salva {m.rescues.map((id) => INGREDIENT_BY_ID[id]?.emoji).join(' ')}</div>}
        </div>
        {fav && <Heart size={16} className="shrink-0 fill-tomato text-tomato" />}
      </a>
    )
  }

  return (
    <a href={href({ name: 'ricetta', id: r.id })} className={cx('press card group block overflow-hidden', variant === 'wide' && 'w-[78vw] max-w-[300px] shrink-0 snap-start')}>
      <div className="relative">
        <RecipeCover recipe={r} locked={m.locked} className={cx(variant === 'wide' ? 'h-44' : 'h-36')} />
        <div className="absolute left-2.5 top-2.5"><MatchBadge m={m} /></div>
        {fav && <Heart size={18} className="absolute right-3 top-3 fill-white text-white drop-shadow" />}
        {rescue && (
          <div className="absolute bottom-2.5 left-2.5 rounded-full bg-tomato px-2.5 py-1 text-xs font-bold text-white shadow">
            ♻ salva {m.rescues.map((id) => INGREDIENT_BY_ID[id]?.emoji).join('')}
          </div>
        )}
      </div>
      <div className="p-3.5">
        <div className="line-clamp-2 font-display text-[17px] font-bold leading-tight">{r.name}</div>
        <div className="mt-1 line-clamp-1 text-[13px] text-muted">{r.hook}</div>
        <div className="mt-2.5 flex items-center gap-3 text-xs font-medium text-muted">
          <span className="inline-flex items-center gap-1"><Clock size={13} />{r.minutes} min</span>
          <span>{'●'.repeat(r.difficulty)}<span className="opacity-30">{'●'.repeat(3 - r.difficulty)}</span></span>
          {r.tags?.some((t) => t === 'vegano' || t === 'vegetariano') && <Leaf size={13} className="text-basil" />}
          {r.region && <span className="truncate">{r.region}</span>}
        </div>
      </div>
    </a>
  )
}
