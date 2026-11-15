# SvuotaFrigo

**Quello che hai in frigo diventa cena.** Segni cosa c'è in casa, l'app ti dice cosa cucinare partendo da ciò che sta per scadere. Un'app [CarlArcade](https://backinbusinesss.github.io/carlarcade/) by Carlhost.

- **Sito:** `/` — presentazione, prezzi, FAQ
- **App (PWA installabile, funziona offline):** `/app/`

## Cosa fa

| Schermata | Gratis | Premium |
|---|---|---|
| **Frigo** | ingredienti con scadenza stimata, "da usare subito", ricette salva-spreco, impatto (€, kg, serie) | — |
| **Aggiungi** | ricerca istantanea senza accenti, per corsia | **scansione foto** con Claude (1 prova gratis) |
| **Ricette** | 63 ricette gratis + 22 nei pacchetti, tab Pronte / Quasi / Tutte / Preferite, filtri, ricerca | pacchetti Dolci, Giro d'Italia, Fit inclusi |
| **Ricetta** | cosa hai e cosa manca, porzioni fino a 4, "aggiungi mancanti alla spesa", "Fatta!" | porzioni fino a 12 |
| **Cucina** | passo passo a schermo intero, timer con suono e vibrazione, schermo sempre acceso | — |
| **Spesa** | per corsia, condivisione, "Ho fatto la spesa" sposta tutto in frigo | — |
| **Piano** | anteprima reale (sfocata) del piano | **7 cene** che usano prima ciò che scade + spesa automatica |
| **Profilo** | dieta, allergie, tema, 9 traguardi, statistiche 7 giorni | statistiche complete, **avvisi di scadenza** |

## Come si guadagna

Definito in [`src/domain/plans.ts`](src/domain/plans.ts) (unica fonte dei prezzi):

- **Premium** 3,99 €/mese o 29,99 €/anno (−37%), **7 giorni di prova** (una volta sola)
- **Pacchetti singoli** a vita: Dolci 1,99 €, Giro d'Italia 2,99 €, Fit 1,99 €
- Paywall nei momenti giusti: scansione foto, piano, porzioni oltre 4, statistiche, ricette dei pacchetti (visibili col lucchetto)

### Collegare i pagamenti veri

Oggi i pagamenti sono **dimostrativi** (nessun addebito, nessun dato carta). Tutto passa da [`src/providers/payments.ts`](src/providers/payments.ts): sostituisci `demoGateway` con un gateway Stripe. Il commento in cima al file spiega i 4 passi (Checkout Session `subscription` con `trial_period_days: 7` per Premium, `payment` per i pacchetti, webhook che salva l'acquisto). Se l'app finirà negli store, gli acquisti digitali devono passare da Google Play / App Store (es. con RevenueCat): cambia il gateway, non le schermate.

> Con i pagamenti veri servirà anche un account utente (per ritrovare gli acquisti su altri dispositivi). Oggi tutti i dati restano nel browser.

### Collegare la scansione foto

Il riconoscimento usa **Claude** tramite un piccolo server ([`worker/`](worker/)) che tiene la chiave API al sicuro:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

Poi crea `.env` nella cartella principale con `VITE_VISION_URL=https://svuotafrigo-vision.<tuo-account>.workers.dev` (o il segreto `VITE_VISION_URL` nel repository GitHub per il deploy) e ricompila. Senza URL l'app mostra un risultato d'esempio, segnalato come dimostrativo.

Il worker usa il modello `claude-opus-5-5` con output strutturato (solo id del catalogo), effort `low` e fallback automatico se la richiesta viene rifiutata. Aggiorna `ALLOWED_ORIGIN` in `worker/wrangler.toml` con il dominio dell'app.

## Sviluppo

Serve Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173 (sito) e /app/
npm test           # 28 test: catalogo, abbinamento, piano, impatto, store
npm run build      # typecheck + build in dist/
```

## Struttura

```
src/
├── content/        115 ingredienti e 85 ricette, con un mini-linguaggio compatto
├── domain/         logica pura e testata: scadenze, abbinamento, piano, impatto, prezzi
├── store/          stato persistente (localStorage) con zustand
├── providers/      prese: pagamenti (demo/Stripe), riconoscimento foto (demo/worker)
├── features/       schermate: fridge, recipes, plan, shopping, profile, premium, onboarding
├── ui/             componenti condivisi
├── site/           sito di presentazione
└── styles/         Tailwind 4 + token di design (chiaro e scuro)
worker/             Cloudflare Worker per la scansione foto (Claude)
tests/              vitest
```

### Aggiungere una ricetta

In [`src/content/recipes.ts`](src/content/recipes.ts):

```ts
r({ id: 'pasta-limone', name: 'Pasta al limone', hook: 'Fresca in 15 minuti.', course: 'primo', min: 15, kcal: 520, emoji: '🍝🍋🧈',
  ing: 'pasta 200g, limone 1pz, burro 30g, parmigiano 40g, pepe, prezzemolo?',
  steps: ['Cuoci la pasta [9\'].', 'Manteca con burro, scorza e succo di limone e parmigiano.'] }),
```

`?` = facoltativo, `[9']` = timer di 9 minuti. Gli id degli ingredienti sono in `ingredients.ts`. `npm test` controlla che tutto torni (ingredienti esistenti, tempi coerenti con i timer, nessun doppione).
