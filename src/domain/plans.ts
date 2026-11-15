// Piani, prezzi e pacchetti: l'unica fonte di verità per cosa è gratis e cosa si paga.
import type { PackId, PlanId } from './types'

export const TRIAL_DAYS = 7

export interface Plan {
  id: PlanId
  name: string
  priceCents: number
  period: 'mese' | 'anno' | null
  /** prezzo mensile equivalente, per il confronto */
  monthlyCents: number
  badge?: string
}

export const PLANS: Record<PlanId, Plan> = {
  free: { id: 'free', name: 'Gratis', priceCents: 0, period: null, monthlyCents: 0 },
  'premium-month': { id: 'premium-month', name: 'Premium mensile', priceCents: 399, period: 'mese', monthlyCents: 399 },
  'premium-year': { id: 'premium-year', name: 'Premium annuale', priceCents: 2999, period: 'anno', monthlyCents: 250, badge: 'Risparmi il 37%' },
}

export interface Pack {
  id: PackId
  name: string
  emoji: string
  priceCents: number
  description: string
}

export const PACKS: Record<PackId, Pack> = {
  dolci: { id: 'dolci', name: 'Dolci di casa', emoji: '🍰', priceCents: 199, description: 'Tiramisù, crostata, torta di mele, salame di cioccolato e altri dolci che usano quello che hai.' },
  regionali: { id: 'regionali', name: 'Giro d\'Italia', emoji: '🇮🇹', priceCents: 299, description: 'Cacio e pepe, Norma, ribollita, arancini, genovese: i classici regionali, svuota-frigo.' },
  fit: { id: 'fit', name: 'Fit & proteico', emoji: '💪', priceCents: 199, description: 'Bowl, omelette, overnight oats: ricette leggere ad alto contenuto proteico.' },
}

/** Cosa sblocca Premium, mostrato nella paywall e nel sito. */
export const PREMIUM_FEATURES = [
  { icon: 'camera', title: 'Scansiona il frigo', text: 'Una foto e l\'app riconosce gli ingredienti al posto tuo.' },
  { icon: 'calendar', title: 'Piano della settimana', text: 'Sette cene pensate per usare prima ciò che scade, con la lista della spesa pronta.' },
  { icon: 'book', title: 'Tutti i pacchetti di ricette', text: 'Dolci, Giro d\'Italia e Fit inclusi, più quelli che arriveranno.' },
  { icon: 'bell', title: 'Avvisi di scadenza', text: 'Ti avvisiamo prima che qualcosa vada buttato.' },
  { icon: 'chart', title: 'Statistiche anti-spreco', text: 'Quanti euro e quanti chili hai salvato, mese per mese.' },
  { icon: 'users', title: 'Porzioni per tutta la famiglia', text: 'Ricette scalate fino a 12 persone, senza limiti.' },
] as const

/** Limiti del piano gratuito. */
export const FREE_LIMITS = {
  /** scansioni foto di prova */
  scans: 1,
  /** porzioni massime nella scalatura */
  servings: 4,
  /** giorni di storico nelle statistiche */
  statsDays: 7,
}

export const euro = (cents: number) =>
  (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })
