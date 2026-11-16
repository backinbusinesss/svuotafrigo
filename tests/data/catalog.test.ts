// Controlli sul catalogo: ogni ricetta usa ingredienti esistenti, nessun id duplicato,
// passi e timer sensati. Si lancia anche da solo con `npm run check-data`.
import { INGREDIENTS, INGREDIENT_BY_ID } from '@/content/ingredients'
import { RECIPES } from '@/content/recipes'
import { parseIngredients } from '@/content/recipe-dsl'
import { PACKS } from '@/domain/plans'

describe('ingredienti', () => {
  it('hanno id unici', () => {
    const ids = INGREDIENTS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('hanno dati plausibili', () => {
    for (const i of INGREDIENTS) {
      expect(i.shelfDays, i.id).toBeGreaterThan(0)
      expect(i.avgPrice, i.id).toBeGreaterThanOrEqual(0)
      expect(i.emoji.length, i.id).toBeGreaterThan(0)
    }
  })
  it('gli alias non si sovrappongono tra ingredienti diversi', () => {
    const seen = new Map<string, string>()
    for (const i of INGREDIENTS) {
      for (const a of [i.name, ...(i.aliases ?? [])].map((s) => s.toLowerCase())) {
        expect(seen.get(a) ?? i.id, `"${a}" usato da ${seen.get(a)} e ${i.id}`).toBe(i.id)
        seen.set(a, i.id)
      }
    }
  })
})

describe('ricette', () => {
  it('sono almeno 250 e hanno id unici', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(250)
    const ids = RECIPES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('usano solo ingredienti del catalogo, senza doppioni', () => {
    for (const r of RECIPES) {
      const ids = r.ingredients.map((x) => x.id)
      for (const id of ids) expect(INGREDIENT_BY_ID[id], `${r.id}: ingrediente "${id}" sconosciuto`).toBeDefined()
      expect(new Set(ids).size, `${r.id}: ingrediente ripetuto`).toBe(ids.length)
    }
  })
  it('hanno passi, tempi e copertina', () => {
    for (const r of RECIPES) {
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(2)
      expect(r.minutes, r.id).toBeGreaterThan(0)
      expect(r.emoji.length, r.id).toBeGreaterThan(0)
      for (const s of r.steps) {
        expect(s.text, r.id).not.toMatch(/\[\d+'\]/)
        if (s.timer) expect(s.timer, r.id).toBeLessThanOrEqual(r.minutes)
      }
    }
  })
  it('ogni pacchetto ha almeno 6 ricette, e ci sono ricette gratis per ogni portata principale', () => {
    for (const p of Object.keys(PACKS)) {
      expect(RECIPES.filter((r) => r.pack === p).length, p).toBeGreaterThanOrEqual(6)
    }
    for (const c of ['primo', 'secondo', 'piatto-unico', 'contorno', 'colazione']) {
      expect(RECIPES.filter((r) => r.course === c && !r.pack).length, c).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('mini-linguaggio delle ricette', () => {
  it('legge quantità, unità e facoltativi', () => {
    expect(parseIngredients('pasta 200g, uova 3pz, sale, basilico?, latte 0.5ml, olio qb')).toEqual([
      { id: 'pasta', qty: 200, unit: 'g' },
      { id: 'uova', qty: 3, unit: 'pz' },
      { id: 'sale' },
      { id: 'basilico', optional: true },
      { id: 'latte', qty: 0.5, unit: 'ml' },
      { id: 'olio', unit: 'q.b.' },
    ])
  })
  it('rifiuta quantità scritte male', () => {
    expect(() => parseIngredients('pasta duecento')).toThrow()
  })
})

describe('varianti', () => {
  it('puntano a un ingrediente base esistente, e le ricette usano solo ingredienti base', () => {
    for (const i of INGREDIENTS) {
      if (!i.as) continue
      expect(INGREDIENT_BY_ID[i.as], `${i.id} → ${i.as}`).toBeDefined()
      expect(INGREDIENT_BY_ID[i.as].as, `${i.id} → ${i.as} è a sua volta una variante`).toBeUndefined()
    }
    for (const r of RECIPES) for (const x of r.ingredients) expect(INGREDIENT_BY_ID[x.id]?.as, `${r.id} usa la variante ${x.id}`).toBeUndefined()
  })
})
