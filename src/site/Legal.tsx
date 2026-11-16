// Note legali del sito: privacy, cookie, termini e condizioni di vendita.
// Prezzi e durata della prova arrivano da domain/plans.ts, così restano sempre allineati all'app.
import type { ReactNode } from 'react'
import { PACKS, PLANS, TRIAL_DAYS, FREE_LIMITS, euro } from '@/domain/plans'

export type LegalDoc = 'privacy' | 'cookie' | 'termini'

const UPDATED = '16 novembre 2026'
const EMAIL = 'admin@carlhost.com'
const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>

const OWNER = (
  <>
    <strong>CarlHost di Ulivi Nicolò</strong>, Via Ventisette Novembre 1, 20015 Parabiago (MI), P.IVA IT14943820960, email e
    PEC <Mail />
  </>
)

const TITLES: Record<LegalDoc, string> = {
  privacy: 'Informativa sulla privacy',
  cookie: 'Cookie policy',
  termini: 'Termini d’uso e condizioni di vendita',
}

const packList = Object.values(PACKS).map((p) => `${p.name} ${euro(p.priceCents)}`).join(', ')

function Privacy() {
  return (
    <>
      <p>
        <strong>In breve:</strong> SvuotaFrigo funziona senza account. Frigo, ricette, piano e spesa restano sul tuo telefono.
        Escono dal dispositivo solo le foto che scegli di scansionare e i dati necessari ai pagamenti.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>{OWNER}.</p>

      <h2>2. Quali dati trattiamo e perché</h2>
      <ul>
        <li>
          <strong>Dati dell’app</strong> (ingredienti, scadenze, preferiti, dieta, allergie, statistiche, stato dell’abbonamento):
          salvati solo nella memoria del browser (localStorage) del tuo dispositivo. Non li riceviamo. Le preferenze su dieta e
          allergie servono solo a filtrare le ricette sul telefono e non vengono mai inviate.
        </li>
        <li>
          <strong>Foto del frigo</strong> (solo se usi “Scansiona”): la foto passa dal nostro server (Cloudflare) ad Anthropic, che
          con il modello Claude riconosce gli ingredienti e restituisce un elenco. Non salviamo la foto. Anthropic non la usa per
          addestrare i suoi modelli e la conserva solo per il tempo limitato previsto dai suoi termini per sicurezza e prevenzione
          degli abusi. Evita di fotografare persone o documenti. Base giuridica: esecuzione del servizio che richiedi (art. 6.1.b
          GDPR).
        </li>
        <li>
          <strong>Pagamenti</strong>: li gestisce Stripe. Carta, nome, email e indirizzo di fatturazione li inserisci sulla pagina
          sicura di Stripe; noi non vediamo i dati della carta. Riceviamo da Stripe l’esito, l’identificativo del cliente e
          dell’abbonamento e l’email per la ricevuta. Base giuridica: contratto (art. 6.1.b) e obblighi fiscali (art. 6.1.c).
        </li>
        <li>
          <strong>Dati tecnici</strong>: il sito è ospitato su GitHub Pages e il server dell’app su Cloudflare. Possono registrare
          indirizzo IP e dati del browser per farli funzionare e proteggerli da abusi. Base giuridica: legittimo interesse (art.
          6.1.f).
        </li>
        <li>
          <strong>Email</strong>: se ci scrivi, usiamo indirizzo e messaggio solo per risponderti.
        </li>
      </ul>
      <p>Non facciamo pubblicità, profilazione o vendita di dati. Non usiamo strumenti di statistica che ti identificano.</p>

      <h2>3. Per quanto tempo</h2>
      <ul>
        <li>Dati dell’app: finché non li cancelli (Profilo → Cancella tutti i dati, o cancellando i dati del sito dal browser).</li>
        <li>Dati di pagamento e fatture: 10 anni, come richiesto dalla legge fiscale.</li>
        <li>Email: il tempo necessario a gestire la richiesta, al massimo 24 mesi.</li>
      </ul>

      <h2>4. Fornitori e trasferimenti fuori dall’UE</h2>
      <p>
        Usiamo come responsabili o fornitori: Stripe Payments Europe Ltd. (pagamenti), Cloudflare, Inc. (server dell’app),
        Anthropic PBC (riconoscimento foto), GitHub, Inc. (hosting del sito). Alcuni hanno sede negli Stati Uniti: i
        trasferimenti avvengono sulla base del Data Privacy Framework UE-USA o delle clausole contrattuali standard della
        Commissione europea.
      </p>

      <h2>5. I tuoi diritti</h2>
      <p>
        Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opporti al trattamento (artt. 15-22 GDPR)
        scrivendo a <Mail />. Rispondiamo entro 30 giorni. Puoi proporre reclamo al{' '}
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener">Garante per la protezione dei dati personali</a>.
      </p>

      <h2>6. Minori</h2>
      <p>Gli acquisti sono riservati ai maggiorenni. Chi ha meno di 14 anni può usare l’app solo con un genitore.</p>

      <h2>7. Modifiche</h2>
      <p>Se cambia qualcosa (per esempio quando arriveranno gli account) aggiorniamo questa pagina e la data in alto.</p>
    </>
  )
}

function Cookie() {
  return (
    <>
      <p>
        <strong>SvuotaFrigo non usa cookie di profilazione né di statistica.</strong> Per questo non trovi un banner: non serve
        il tuo consenso.
      </p>

      <h2>Cosa salviamo sul tuo dispositivo</h2>
      <ul>
        <li>
          <strong>localStorage</strong> (<code>svuotafrigo-v1</code>): il tuo frigo, le ricette preferite, le impostazioni e lo
          stato di Premium. È indispensabile per far funzionare l’app senza account.
        </li>
        <li>
          <strong>Cache del service worker</strong>: copia di pagine e immagini dell’app per usarla anche offline.
        </li>
      </ul>
      <p>
        Sono strumenti tecnici necessari (art. 122 del Codice privacy e Linee guida del Garante del 10 giugno 2021). Puoi
        cancellarli in qualsiasi momento dalle impostazioni del browser o da Profilo → Cancella tutti i dati.
      </p>

      <h2>Pagamenti</h2>
      <p>
        Quando acquisti passi su Stripe, che sulla propria pagina usa cookie tecnici e antifrode. Sono descritti nella cookie
        policy di Stripe.
      </p>

      <h2>Contatti</h2>
      <p>{OWNER}.</p>
    </>
  )
}

function Termini() {
  const m = PLANS['premium-month']
  const y = PLANS['premium-year']
  return (
    <>
      <p>
        Questi termini regolano l’uso di SvuotaFrigo (sito e app) e gli acquisti al suo interno. Ti chiediamo di leggerli prima
        di acquistare.
      </p>

      <h2>1. Chi vende</h2>
      <p>{OWNER}.</p>

      <h2>2. Il servizio</h2>
      <p>
        SvuotaFrigo suggerisce ricette a partire dagli ingredienti che segni, stima le scadenze, prepara piani settimanali e liste
        della spesa. Si usa gratis, senza registrazione. Il piano gratuito include {FREE_LIMITS.scans} scansione foto di prova,
        porzioni fino a {FREE_LIMITS.servings} e statistiche degli ultimi {FREE_LIMITS.statsDays} giorni.
      </p>

      <h2>3. Sicurezza alimentare</h2>
      <p>
        Le scadenze sono <strong>stime indicative</strong>: fa fede sempre la data sulla confezione, insieme a vista e olfatto. I
        filtri per dieta e allergie aiutano ma non sostituiscono la lettura delle etichette. Il riconoscimento foto può sbagliare:
        controlla gli ingredienti aggiunti. Valori nutrizionali e tempi sono approssimativi. In caso di allergie o esigenze
        mediche segui le indicazioni del tuo medico.
      </p>

      <h2>4. Premium e pacchetti: prezzi</h2>
      <ul>
        <li>
          <strong>Premium mensile</strong> {euro(m.priceCents)} al mese, <strong>Premium annuale</strong> {euro(y.priceCents)}{' '}
          all’anno. Rinnovo automatico alla fine di ogni periodo, finché non disdici.
        </li>
        <li>
          <strong>Prova gratuita di {TRIAL_DAYS} giorni</strong>, una sola volta per dispositivo. Se non disdici entro la fine
          della prova, parte il primo addebito del piano scelto.
        </li>
        <li>
          <strong>Pacchetti di ricette</strong> con pagamento singolo, tuoi per sempre su quel dispositivo: {packList}.
        </li>
      </ul>
      <p>I prezzi sono in euro e sono prezzi finali. Prima di pagare vedi il totale sulla pagina di Stripe.</p>

      <h2>5. Pagamento e conclusione del contratto</h2>
      <p>
        Paghi con i metodi offerti da Stripe. Il contratto si conclude quando Stripe conferma il pagamento (o l’avvio della prova)
        e l’app attiva Premium o il pacchetto. Ricevi la ricevuta all’email che indichi su Stripe: conservala, serve per
        recuperare gli acquisti.
      </p>

      <h2>6. Disdetta</h2>
      <p>
        Puoi disdire quando vuoi da Profilo → Gestisci o disdici, oppure scrivendo a <Mail />. Premium resta attivo fino alla
        fine del periodo già pagato e poi non si rinnova. Se disdici durante la prova non paghi nulla.
      </p>

      <h2>7. Diritto di recesso e rimborsi</h2>
      <p>
        Se sei un consumatore hai <strong>14 giorni</strong> dal primo pagamento di un abbonamento o dall’acquisto di un pacchetto
        per cambiare idea, senza dover spiegare il motivo. Scrivi a <Mail /> indicando l’email usata su Stripe: ti rimborsiamo per
        intero entro 14 giorni, con lo stesso metodo di pagamento. I rinnovi successivi non sono rimborsabili, ma puoi sempre
        disdire per i periodi futuri. Restano salvi i diritti di garanzia previsti dal Codice del Consumo.
      </p>

      <h2>8. Acquisti legati al dispositivo</h2>
      <p>
        Oggi l’app non ha account: Premium e pacchetti sono legati al browser in cui li acquisti. Se cambi telefono o cancelli i
        dati del browser, scrivici con la ricevuta di Stripe e li riattiviamo.
      </p>

      <h2>9. Funzioni dimostrative</h2>
      <p>
        Se il server di pagamento o di riconoscimento foto non è attivo, l’app lo dice e mostra una simulazione: in quel caso non
        avviene alcun addebito reale.
      </p>

      <h2>10. Uso corretto e contenuti</h2>
      <p>
        Non è consentito usare l’app per scopi illeciti, aggirare i limiti del piano gratuito o copiare ricette e grafiche per
        ripubblicarle. Ricette, testi, nome e logo di SvuotaFrigo appartengono a Carlhost.
      </p>

      <h2>11. Disponibilità e responsabilità</h2>
      <p>
        Facciamo il possibile perché l’app funzioni sempre, ma possono esserci interruzioni per manutenzione o problemi dei
        fornitori. Nei limiti consentiti dalla legge non rispondiamo di danni indiretti; non sono limitati i diritti del
        consumatore né la responsabilità per dolo o colpa grave.
      </p>

      <h2>12. Modifiche</h2>
      <p>
        Possiamo aggiornare questi termini o i prezzi. Le modifiche di prezzo valgono per gli abbonamenti dal rinnovo successivo e
        te le comunichiamo prima, così puoi disdire.
      </p>

      <h2>13. Legge applicabile e reclami</h2>
      <p>
        Si applica la legge italiana. Per i consumatori è competente il foro del luogo di residenza. Per qualsiasi reclamo scrivi a{' '}
        <Mail />: rispondiamo entro 14 giorni.
      </p>
    </>
  )
}

const BODY: Record<LegalDoc, () => ReactNode> = { privacy: Privacy, cookie: Cookie, termini: Termini }

export function Legal({ doc }: { doc: LegalDoc }) {
  const Body = BODY[doc]
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-line/60">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-5">
          <a href="./" className="flex items-center gap-2.5 font-display text-lg font-extrabold">
            <img src="./icon.svg" alt="" className="h-8 w-8" />
            SvuotaFrigo
          </a>
          <a href="./app/" className="ml-auto rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">Apri l’app</a>
        </div>
      </header>
      <main className="legal mx-auto max-w-3xl px-5 pb-20 pt-10">
        <p className="text-xs font-bold uppercase tracking-widest text-tomato">Note legali</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">{TITLES[doc]}</h1>
        <p className="mt-2 text-sm text-muted">Ultimo aggiornamento: {UPDATED}</p>
        <nav className="mt-5 flex flex-wrap gap-2 text-sm" aria-label="Note legali">
          {(Object.keys(TITLES) as LegalDoc[]).map((d) => (
            <a key={d} href={`./${d}.html`} aria-current={d === doc ? 'page' : undefined}
              className={d === doc ? 'rounded-full bg-ink px-3.5 py-1.5 font-semibold text-paper' : 'rounded-full border border-line px-3.5 py-1.5 text-muted hover:text-ink'}>
              {d === 'privacy' ? 'Privacy' : d === 'cookie' ? 'Cookie' : 'Termini e vendita'}
            </a>
          ))}
        </nav>
        <article className="mt-8">
          <Body />
        </article>
      </main>
      <LegalFooter />
    </div>
  )
}

/** Riga con i link legali, usata anche nel footer del sito. */
export function LegalLinks({ base = './', className = '' }: { base?: string; className?: string }) {
  return (
    <span className={`flex flex-wrap gap-x-4 gap-y-1 ${className}`}>
      <a className="hover:text-ink" href={`${base}privacy.html`}>Privacy</a>
      <a className="hover:text-ink" href={`${base}cookie.html`}>Cookie</a>
      <a className="hover:text-ink" href={`${base}termini.html`}>Termini e condizioni di vendita</a>
    </span>
  )
}

function LegalFooter() {
  return (
    <footer className="border-t border-line py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-3xl flex-wrap justify-between gap-3 px-5">
        <span>© {new Date().getFullYear()} CarlHost di Ulivi Nicolò · P.IVA IT14943820960</span>
        <LegalLinks />
      </div>
    </footer>
  )
}
