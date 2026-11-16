// Tipi del dominio di SvuotaFrigo.

/** Corsie del supermercato: ordinano la lista della spesa e la dispensa. */
export type Aisle =
  | 'frutta-verdura'
  | 'carne-pesce'
  | 'latticini'
  | 'uova-salumi'
  | 'pane-pasta'
  | 'dispensa'
  | 'surgelati'
  | 'spezie'
  | 'bevande'

/** Dove si conserva un ingrediente. */
export type Storage = 'frigo' | 'freezer' | 'dispensa'

export type Unit = 'g' | 'ml' | 'pz' | 'cucchiai' | 'q.b.'

export interface Ingredient {
  id: string
  name: string
  /** forme alternative per la ricerca e il riconoscimento (plurali, sinonimi) */
  aliases?: string[]
  emoji: string
  aisle: Aisle
  storage: Storage
  /** giorni tipici di conservazione una volta aperto/acquistato */
  shelfDays: number
  /** sempre in casa: sale, olio, acqua… non serve averli nel frigo per cucinare */
  staple?: boolean
  /** prezzo medio indicativo in € per la quantità tipica, per stimare lo spreco evitato */
  avgPrice: number
  /** peso medio in grammi di una confezione/unità tipica, per stimare i kg salvati */
  avgGrams: number
  /** variante di un altro ingrediente: nelle ricette conta come quello (es. rucola → insalata) */
  as?: string
  /** escluso da queste diete */
  notFor?: Diet[]
  /** allergeni contenuti */
  allergens?: Allergen[]
}

export type Diet = 'vegetariano' | 'vegano' | 'senza-glutine' | 'senza-lattosio'
export type Allergen = 'glutine' | 'lattosio' | 'uova' | 'frutta-secca' | 'pesce' | 'crostacei' | 'soia' | 'sedano' | 'arachidi'

export type Course = 'primo' | 'secondo' | 'piatto-unico' | 'contorno' | 'antipasto' | 'dolce' | 'colazione'
export type Difficulty = 1 | 2 | 3

export interface RecipeIngredient {
  id: string
  /** quantità per le porzioni base della ricetta */
  qty?: number
  unit?: Unit
  /** se manca, la ricetta si fa lo stesso */
  optional?: boolean
}

export interface RecipeStep {
  text: string
  /** timer suggerito per il passo, in minuti */
  timer?: number
}

export interface Recipe {
  id: string
  name: string
  /** frase breve, sotto il titolo */
  hook: string
  course: Course
  /** minuti totali */
  minutes: number
  difficulty: Difficulty
  servings: number
  /** kcal per porzione, indicative */
  kcal: number
  /** emoji di copertina (composizione grafica della card) */
  emoji: string[]
  /** due colori della copertina */
  palette: [string, string]
  region?: string
  tags?: string[]
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  /** contenuto a pagamento: incluso in Premium o in un pacchetto */
  pack?: PackId
}

export type PackId = 'dolci' | 'regionali' | 'fit' | 'mare' | 'verde' | 'veloci' | 'mondo' | 'street' | 'feste' | 'bimbi' | 'settimana' | 'forno'

/** Un ingrediente presente in casa. */
export interface PantryItem {
  ingredientId: string
  /** ISO date (yyyy-mm-dd) di aggiunta */
  addedAt: string
  /** ISO date di scadenza stimata o impostata */
  expiresAt: string
  /** quantità indicativa, testo libero ("mezza confezione") */
  note?: string
}

export interface ShoppingItem {
  ingredientId: string
  checked: boolean
  /** ricette per cui serve */
  forRecipes: string[]
}

export interface CookedEntry {
  recipeId: string
  /** ISO datetime */
  at: string
  /** ingredienti del frigo consumati */
  used: string[]
  /** stima € e grammi di cibo salvato (ingredienti in scadenza usati) */
  savedEuro: number
  savedGrams: number
}

export type PlanId = 'free' | 'premium-month' | 'premium-year'

export interface MealPlanDay {
  /** ISO date */
  date: string
  recipeId: string | null
  done: boolean
}
