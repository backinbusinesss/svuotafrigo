/**
 * SvuotaFrigo API (Cloudflare Worker): riconoscimento foto con Claude e pagamenti con Stripe.
 *
 * GET  /config  → { vision: bool, payments: bool }  (l'app usa le funzioni reali solo se configurate)
 * POST /scan    { image: "<base64 jpeg>", mediaType?: "image/jpeg" } → { items: [{ id, confidence }], unknown: [string] }
 * POST /receipt { image, mediaType? } → { store, total, items: [{ id, price }], unknown: [string] }  (foto di uno scontrino)
 * POST /checkout, /verify, /entitlement, /portal  → vedi stripe.ts
 *
 * Le chiavi restano qui, sul server: l'app non le vede mai.
 *   wrangler secret put ANTHROPIC_API_KEY
 *   wrangler secret put STRIPE_SECRET_KEY
 */
import Anthropic from '@anthropic-ai/sdk'
import { INGREDIENTS } from '../../src/content/ingredients'
import { handleStripe, StripeError } from './stripe'

interface Env {
  ANTHROPIC_API_KEY?: string
  STRIPE_SECRET_KEY?: string
  /** origini ammesse, separate da virgola (es. "https://backinbusinesss.github.io,https://svuotafrigo.carlarcade.com") */
  ALLOWED_ORIGIN: string
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type MediaType = (typeof MEDIA_TYPES)[number]

// Catalogo stabile → prompt di sistema identico a ogni richiesta → cache del prompt efficace.
const CATALOG = INGREDIENTS.filter((i) => !i.staple)
  .map((i) => `${i.id}: ${[i.name, ...(i.aliases ?? [])].join(', ')}`)
  .join('\n')

const SYSTEM = `Sei il riconoscitore di ingredienti di SvuotaFrigo, un'app italiana che suggerisce ricette con quello che c'è in frigo.
Ricevi la foto di un frigorifero, di una dispensa o di una spesa appena fatta. Elenca gli alimenti che vedi davvero, collegandoli agli id del catalogo qui sotto.

Regole:
- Usa solo id presenti nel catalogo. Se vedi un alimento che non ha un id, scrivilo in italiano in "unknown".
- Non indovinare il contenuto di confezioni chiuse e anonime: inseriscile solo se l'etichetta o la forma le rende riconoscibili.
- confidence "alta" se l'alimento è chiaramente visibile, "media" se è probabile ma parzialmente nascosto o ambiguo.
- Ogni id al massimo una volta. Ignora bevande, condimenti di base e oggetti non alimentari.

Catalogo (id: nomi):
${CATALOG}`

const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: CATALOG_IDS() },
          confidence: { type: 'string', enum: ['alta', 'media'] },
        },
        required: ['id', 'confidence'],
        additionalProperties: false,
      },
    },
    unknown: { type: 'array', items: { type: 'string' } },
  },
  required: ['items', 'unknown'],
  additionalProperties: false,
}

const RECEIPT_SYSTEM = `Sei il lettore di scontrini di SvuotaFrigo, un'app italiana anti-spreco.
Ricevi la foto di uno scontrino della spesa (supermercato, mercato, alimentari). Leggi le righe e collega ogni prodotto alimentare all'id del catalogo qui sotto.

Regole:
- Le righe degli scontrini sono abbreviate (es. "MOZZ.FIOR.LATTE 125G", "ZUCCH.CHIARE KG"): interpretale come farebbe un cassiere.
- Usa solo id presenti nel catalogo. Prodotti alimentari senza id vanno in "unknown", in italiano e per esteso.
- Ignora righe non alimentari (detersivi, sacchetti, igiene), sconti, totali parziali, resto e metodo di pagamento.
- "price" è il prezzo pagato per quella riga in euro (numero, punto decimale), null se illeggibile. Se lo stesso id compare più volte, una sola voce con la somma.
- "store" è il nome del negozio se leggibile, altrimenti null. "total" è il totale dello scontrino in euro, null se illeggibile.

Catalogo (id: nomi):
${CATALOG}`

const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    store: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    total: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', enum: CATALOG_IDS() },
          price: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        },
        required: ['id', 'price'],
        additionalProperties: false,
      },
    },
    unknown: { type: 'array', items: { type: 'string' } },
  },
  required: ['store', 'total', 'items', 'unknown'],
  additionalProperties: false,
}

const TASKS = {
  '/scan': { system: SYSTEM, schema: SCHEMA, ask: 'Quali ingredienti vedi?' },
  '/receipt': { system: RECEIPT_SYSTEM, schema: RECEIPT_SCHEMA, ask: 'Leggi questo scontrino.' },
} as const

function CATALOG_IDS() {
  return INGREDIENTS.filter((i) => !i.staple).map((i) => i.id)
}

const client = (env: Env) => new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
const origins = (env: Env) => env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = origins(env)
  const ok = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req.headers.get('Origin'), env)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h })
    const url = new URL(req.url)
    if (req.method === 'GET' && url.pathname === '/config') {
      return json({ vision: !!env.ANTHROPIC_API_KEY, payments: !!env.STRIPE_SECRET_KEY }, 200, h)
    }
    if (req.method !== 'POST') return json({ error: 'not_found' }, 404, h)

    if (['/checkout', '/verify', '/entitlement', '/portal'].includes(url.pathname)) {
      if (!env.STRIPE_SECRET_KEY) return json({ error: 'payments_not_configured' }, 503, h)
      try {
        const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
        const r = await handleStripe(url.pathname, body, env.STRIPE_SECRET_KEY, origins(env))
        return json(r.body, r.status, h)
      } catch (err) {
        if (err instanceof StripeError) return json({ error: 'stripe', message: err.message }, err.status >= 500 ? 502 : 400, h)
        return json({ error: 'internal' }, 500, h)
      }
    }

    const task = url.pathname === '/scan' || url.pathname === '/receipt' ? TASKS[url.pathname] : null
    if (!task) return json({ error: 'not_found' }, 404, h)
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'vision_not_configured' }, 503, h)

    let body: { image?: string; mediaType?: string }
    try {
      body = await req.json()
    } catch {
      return json({ error: 'bad_json' }, 400, h)
    }
    const mediaType = (MEDIA_TYPES as readonly string[]).includes(body.mediaType ?? 'image/jpeg')
      ? ((body.mediaType ?? 'image/jpeg') as MediaType)
      : null
    if (!body.image || !mediaType) return json({ error: 'bad_image' }, 400, h)
    if ((body.image.length * 3) / 4 > MAX_IMAGE_BYTES) return json({ error: 'image_too_large' }, 413, h)

    try {
      const response = await client(env).beta.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        // se il modello declina la richiesta, l'API ripete in automatico su un modello di riserva
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: task.schema } },
        system: [{ type: 'text', text: task.system, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
              { type: 'text', text: task.ask },
            ],
          },
        ],
      })

      if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422, h)
      if (response.stop_reason === 'max_tokens') return json({ error: 'truncated' }, 502, h)

      const text = response.content.find((b) => b.type === 'text')
      if (!text || text.type !== 'text') return json({ error: 'empty' }, 502, h)
      return json(JSON.parse(text.text), 200, h)
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429, h)
      if (err instanceof Anthropic.BadRequestError) return json({ error: 'bad_request' }, 400, h)
      if (err instanceof Anthropic.APIError) return json({ error: 'upstream', status: err.status }, 502, h)
      return json({ error: 'internal' }, 500, h)
    }
  },
}
