# SvuotaFrigo

**Quello che hai in frigo diventa cena.** Segni cosa c'è in casa, l'app ti dice cosa cucinare partendo da ciò che sta per scadere. Un'app [CarlArcade](https://backinbusinesss.github.io/carlarcade/) by Carlhost.

- **Sito:** `/` — presentazione, prezzi, FAQ
- **App (PWA installabile, funziona offline):** `/app/`
- **Note legali:** `/privacy.html`, `/cookie.html`, `/termini.html` (testi in [`src/site/Legal.tsx`](src/site/Legal.tsx), prezzi presi da `plans.ts`)

## Cosa fa

| Schermata | Gratis | Premium |
|---|---|---|
| **Frigo** | ingredienti con scadenza stimata, "da usare subito", ricette salva-spreco, impatto (€, kg, serie) | — |
| **Aggiungi** | ricerca istantanea senza accenti, per corsia | **scansione foto** con Claude (1 prova gratis) |
| **Ricette** | 500 ricette gratis + 575 in 12 pacchetti, tab Pronte / Quasi / Tutte / Preferite, filtri, ricerca | tutti i 12 pacchetti inclusi |
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

### Pagamenti veri (Stripe) e scansione foto (Claude)

Tutto passa dal worker già online: **https://svuotafrigo-api.ulivinic.workers.dev** (cartella [`worker/`](worker/), Cloudflare).
L'app chiede `/config` all'avvio e usa le funzioni reali **solo se il worker ha le chiavi**; altrimenti resta in modalità dimostrativa e lo dice all'utente. Oggi: `{"vision":false,"payments":false}`.

Per attivarle bastano le chiavi (una volta sola, dalla cartella `worker`):

```bash
npx wrangler secret put STRIPE_SECRET_KEY     # sk_test_… per provare, sk_live_… per incassare
npx wrangler secret put ANTHROPIC_API_KEY     # per la scansione foto
```

Non serve ricompilare l'app né creare prodotti in Stripe: importi e nomi arrivano da `src/domain/plans.ts`.
Per la disdetta dal profilo attiva il **portale clienti** in Stripe (Impostazioni → Billing → Portale clienti).

Come funziona ([`src/providers/payments.ts`](src/providers/payments.ts), [`worker/src/stripe.ts`](worker/src/stripe.ts)):
1. `/checkout` crea una sessione Stripe Checkout (abbonamento con 7 giorni di prova, oppure pagamento singolo per i pacchetti)
2. l'utente paga sulla pagina sicura di Stripe e torna su `/app/?checkout=ok&session_id=…`
3. `/verify` conferma il pagamento lato server e l'app attiva Premium o il pacchetto
4. a ogni avvio `/entitlement` rilegge lo stato dell'abbonamento (rinnovo, disdetta, fine prova)

> Limite attuale: gli acquisti sono legati al dispositivo (nessun account). Per ritrovarli su un altro telefono servirà un login.
> Se l'app finirà negli store, gli acquisti digitali devono passare da Google Play / App Store.

La scansione usa `claude-opus-5-5` con output strutturato (solo id del catalogo), effort `low` e fallback automatico se la richiesta viene rifiutata.

## Sviluppo

Serve Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173 (sito) e /app/
npm test           # 32 test: catalogo, abbinamento, piano, impatto, store, pagamenti
npm run build      # typecheck + build in dist/
```

## Struttura

```
src/
├── content/        592 ingredienti (194 varianti come rucola o spaghetti, che nelle ricette contano come l'ingrediente base) e 1075 ricette, con un mini-linguaggio compatto
├── domain/         logica pura e testata: scadenze, abbinamento, piano, impatto, prezzi
├── store/          stato persistente (localStorage) con zustand
├── providers/      worker API, pagamenti (Stripe o demo), riconoscimento foto (Claude o demo)
├── features/       schermate: fridge, recipes, plan, shopping, profile, premium, onboarding
├── ui/             componenti condivisi
├── site/           sito di presentazione
└── styles/         Tailwind 4 + token di design (chiaro e scuro)
worker/             Cloudflare Worker: scansione foto (Claude) e pagamenti (Stripe)
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
