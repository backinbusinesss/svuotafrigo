// Mini-linguaggio per scrivere le ricette in poco spazio.
//
// ingredienti: "pasta 320g, uova 4pz, pancetta 150g, pecorino 60g, pepe, basilico?"
//   - id dell'ingrediente (vedi ingredients.ts), poi quantità+unità facoltative
//   - "?" in fondo = facoltativo
// passi: stringhe; "[10']" dentro il testo aggiunge un timer di 10 minuti al passo.
import type { Course, Difficulty, PackId, Recipe, RecipeIngredient, RecipeStep, Unit } from '@/domain/types'

const PALETTES: Record<Course, [string, string]> = {
  primo: ['#ffb547', '#e8442e'],
  secondo: ['#e8442e', '#8a2a1c'],
  'piatto-unico': ['#ff8a3d', '#c2410c'],
  contorno: ['#7cc36b', '#2f7d4f'],
  antipasto: ['#ffd166', '#f4845f'],
  dolce: ['#f7a6c4', '#b5367a'],
  colazione: ['#ffe29a', '#e9a23b'],
}

const UNIT_RE = /^(\d+(?:[.,]\d+)?)(g|ml|pz|cucchiai)?$/

export function parseIngredients(spec: string): RecipeIngredient[] {
  return spec.split(',').map((raw) => {
    let part = raw.trim()
    const optional = part.endsWith('?')
    if (optional) part = part.slice(0, -1).trim()
    const [id, amount] = part.split(/\s+/)
    const out: RecipeIngredient = { id }
    if (amount) {
      if (amount === 'qb') out.unit = 'q.b.'
      else {
        const m = UNIT_RE.exec(amount)
        if (!m) throw new Error(`Quantità non valida "${amount}" in "${raw}"`)
        out.qty = Number(m[1].replace(',', '.'))
        out.unit = (m[2] as Unit | undefined) ?? 'pz'
      }
    }
    if (optional) out.optional = true
    return out
  })
}

export function parseSteps(steps: string[]): RecipeStep[] {
  return steps.map((s) => {
    // con più timer nello stesso passo ("…[6'] poi … [9']") vale la somma
    const timers = [...s.matchAll(/\[(\d+)'\]/g)].map((m) => Number(m[1]))
    const text = s.replace(/\s*\[\d+'\]/g, '').replace(/\s+([.,])/g, '$1').trim()
    return timers.length ? { text, timer: timers.reduce((a, b) => a + b, 0) } : { text }
  })
}

interface Def {
  id: string
  name: string
  hook: string
  course: Course
  min: number
  diff?: Difficulty
  serv?: number
  kcal: number
  emoji: string
  palette?: [string, string]
  region?: string
  tags?: string[]
  pack?: PackId
  ing: string
  steps: string[]
}

export function r(d: Def): Recipe {
  return {
    id: d.id,
    name: d.name,
    hook: d.hook,
    course: d.course,
    minutes: d.min,
    difficulty: d.diff ?? 1,
    servings: d.serv ?? 2,
    kcal: d.kcal,
    emoji: [...new Intl.Segmenter().segment(d.emoji)].map((s) => s.segment).filter((s) => s.trim()),
    palette: d.palette ?? PALETTES[d.course],
    region: d.region,
    tags: d.tags,
    pack: d.pack,
    ingredients: parseIngredients(d.ing),
    steps: parseSteps(d.steps),
  }
}
