/**
 * SvuotaFrigo — riconoscimento foto del frigo (Cloudflare Worker).
 *
 * POST /scan  { image: "<base64 jpeg>", mediaType?: "image/jpeg" }
 *   → { items: [{ id, confidence }], unknown: [string] }
 *
 * La chiave Anthropic resta qui, sul server: l'app non la vede mai.
 * Configurazione: `wrangler secret put ANTHROPIC_API_KEY` e ALLOWED_ORIGIN in wrangler.toml.
 */
import Anthropic from '@anthropic-ai/sdk'
import { INGREDIENTS } from '../../src/content/ingredients'

interface Env {
  ANTHROPIC_API_KEY: string
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

function CATALOG_IDS() {
  return INGREDIENTS.filter((i) => !i.staple).map((i) => i.id)
}

const client = (env: Env) => new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGIN.split(',').map((s) => s.trim())
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
    if (req.method !== 'POST' || url.pathname !== '/scan') return json({ error: 'not_found' }, 404, h)

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
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.image } },
              { type: 'text', text: 'Quali ingredienti vedi?' },
            ],
          },
        ],
      })

      if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422, h)
      if (response.stop_reason === 'max_tokens') return json({ error: 'truncated' }, 502, h)

      const text = response.content.find((b) => b.type === 'text')
      if (!text || text.type !== 'text') return json({ error: 'empty' }, 502, h)
      const parsed = JSON.parse(text.text) as { items: { id: string; confidence: string }[]; unknown: string[] }
      return json(parsed, 200, h)
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429, h)
      if (err instanceof Anthropic.BadRequestError) return json({ error: 'bad_request' }, 400, h)
      if (err instanceof Anthropic.APIError) return json({ error: 'upstream', status: err.status }, 502, h)
      return json({ error: 'internal' }, 500, h)
    }
  },
}
