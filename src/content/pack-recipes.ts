// Ricette dei pacchetti a pagamento, in un file a parte: Vite ne fa un chunk separato
// che l'app scarica solo quando servono (vedi catalog.ts).
import type { Recipe } from '@/domain/types'
import { PACKS_1 } from './packs-1'
import { PACKS_2 } from './packs-2'
import { PACKS_3 } from './packs-3'
import { PACKS_4 } from './packs-4'
import { PACKS_5 } from './packs-5'
import { PACKS_6 } from './packs-6'
import { PACKS_7 } from './packs-7'
import { PACKS_8 } from './packs-8'

export const PACK_RECIPES: Recipe[] = [...PACKS_1, ...PACKS_2, ...PACKS_3, ...PACKS_4, ...PACKS_5, ...PACKS_6, ...PACKS_7, ...PACKS_8]
