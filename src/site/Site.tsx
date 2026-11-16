// Sito di presentazione: tutto porta a "Apri l'app gratis".
import { LegalLinks } from './Legal'
import { ArrowRight, BarChart3, Bell, BookOpen, CalendarDays, Camera, Check, ChefHat, Clock, ShoppingBasket, Sparkles, Timer, WifiOff } from 'lucide-react'
import { motion } from 'motion/react'
import { type ReactNode, useEffect } from 'react'
import { INGREDIENT_BY_ID, INGREDIENTS } from '@/content/ingredients'
import { RECIPE_BY_ID, RECIPES } from '@/content/recipes'
import { euro, PACKS, PLANS, TRIAL_DAYS } from '@/domain/plans'
import type { PackId } from '@/domain/types'
import { cx, RecipeCover } from '@/ui/kit'

const APP = './app/'
const FREE_COUNT = RECIPES.filter((r) => !r.pack).length

function useSystemTheme() {
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light' }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
}

function Cta({ children = 'Apri l\'app gratis', big, className }: { children?: ReactNode; big?: boolean; className?: string }) {
  return (
    <a href={APP} className={cx('press inline-flex items-center justify-center gap-2 rounded-full bg-tomato font-semibold text-white shadow-[0_14px_30px_-12px_var(--tomato)] hover:brightness-105', big ? 'h-14 px-7 text-[17px]' : 'h-11 px-5 text-[15px]', className)}>
      {children} <ArrowRight size={big ? 20 : 18} />
    </a>
  )
}

const Reveal = ({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}>
    {children}
  </motion.div>
)

/** Mockup del telefono con una schermata "frigo" fatta con i componenti veri. */
function PhoneMock() {
  const items = [
    { id: 'latte', label: 'scade domani', hot: true },
    { id: 'spinaci', label: 'scade oggi', hot: true },
    { id: 'zucchine', label: 'tra 2 giorni', hot: false },
  ]
  const r1 = RECIPE_BY_ID['frittata-verdure']
  const r2 = RECIPE_BY_ID['torta-salata']
  return (
    <div className="relative mx-auto w-[300px]">
      <div className="rounded-[46px] bg-[#1d1a16] p-3 shadow-[0_50px_100px_-30px_rgba(120,40,10,.55)]">
        <div className="relative overflow-hidden rounded-[36px] bg-paper px-4 pb-6 pt-9">
          <div className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-[#1d1a16]" />
          <p className="text-[11px] font-medium text-muted">Buonasera, Giulia 👋</p>
          <p className="mt-0.5 font-display text-[22px] font-extrabold leading-tight">Hai <span className="text-tomato">3</span> cose da salvare.</p>
          <div className="card mt-3 overflow-hidden">
            {items.map((x) => (
              <div key={x.id} className="flex items-center gap-2 border-b border-line px-3 py-2 last:border-0">
                <span className="text-lg">{INGREDIENT_BY_ID[x.id].emoji}</span>
                <span className="flex-1 text-[13px] font-medium">{INGREDIENT_BY_ID[x.id].name}</span>
                <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold', x.hot ? 'bg-tomato text-white' : 'bg-tomato-soft text-tomato-ink')}>{x.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-display text-[15px] font-bold">Ricette salva-spreco</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[r1, r2].map((r) => (
              <div key={r.id} className="card overflow-hidden">
                <RecipeCover recipe={r} size="sm" className="h-20" />
                <div className="p-2"><div className="line-clamp-1 text-[12px] font-bold">{r.name}</div><div className="text-[10px] text-muted">{r.minutes} min · hai tutto</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <motion.div className="card absolute -left-12 top-28 flex items-center gap-2 px-3 py-2 text-sm font-semibold" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <span className="text-xl">♻</span> 4,30 € salvati
      </motion.div>
      <motion.div className="card absolute -right-10 bottom-24 flex items-center gap-2 px-3 py-2 text-sm font-semibold" animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <span className="text-xl">⏱</span> 08:24
      </motion.div>
      <span className="magnet absolute -right-6 -top-6 rotate-6 rounded-2xl bg-butter px-3 py-1 text-xl text-[#1d1a16] shadow-lg">zero sprechi!</span>
    </div>
  )
}

const FEATURES = [
  { Icon: Clock, title: 'Sai cosa scade', text: 'Ogni ingrediente ha la sua scadenza stimata. In cima trovi sempre cosa usare per primo.', tone: 'bg-tomato-soft text-tomato-ink', span: 'md:col-span-2' },
  { Icon: BookOpen, title: `${RECIPES.length} ricette italiane`, text: 'Dalla carbonara alla ribollita, ordinate per quello che hai già.', tone: 'bg-butter-soft', span: '' },
  { Icon: ChefHat, title: 'Cucina passo passo', text: 'Testo grande, timer con avviso, schermo sempre acceso.', tone: 'bg-basil-soft text-basil', span: '' },
  { Icon: ShoppingBasket, title: 'Spesa per corsia', text: 'Mancano 2 ingredienti? Un tocco e sono in lista, ordinati come al supermercato.', tone: 'bg-paper-2', span: '' },
  { Icon: WifiOff, title: 'Anche offline', text: 'Si installa come app e funziona senza rete. I tuoi dati restano sul telefono.', tone: 'bg-paper-2', span: '' },
]

const PREMIUM = [
  { Icon: Camera, title: 'Scansiona il frigo', text: 'Una foto e gli ingredienti sono riconosciuti.' },
  { Icon: CalendarDays, title: 'Piano della settimana', text: '7 cene che usano prima ciò che scade, con la spesa pronta.' },
  { Icon: Bell, title: 'Avvisi di scadenza', text: 'Ti avvisa prima che qualcosa vada buttato.' },
  { Icon: BarChart3, title: 'Statistiche complete', text: 'Euro e chili salvati, mese dopo mese.' },
]

const FAQ = [
  ['È gratis?', `Sì. Frigo, ${FREE_COUNT} ricette, modalità cucina e lista della spesa sono gratis, senza limiti di tempo. Premium aggiunge funzioni extra e costa ${euro(PLANS['premium-month'].priceCents)} al mese o ${euro(PLANS['premium-year'].priceCents)} all'anno, con ${TRIAL_DAYS} giorni di prova.`],
  ['Devo registrarmi?', 'No. Apri l\'app e inizi. I dati restano sul tuo telefono.'],
  ['Funziona su iPhone e Android?', 'Sì, nel browser. Puoi aggiungerla alla schermata Home e si apre come un\'app.'],
  ['Come fa a sapere quando scade una cosa?', `Ogni ingrediente ha una durata tipica di conservazione: la usiamo per stimare la scadenza, e tu puoi correggerla in un tocco. Il catalogo conta ${INGREDIENTS.length} ingredienti.`],
  ['Posso disdire Premium?', 'Quando vuoi, dal profilo. I pacchetti di ricette comprati singolarmente restano tuoi.'],
] as const

export function Site() {
  useSystemTheme()
  const marquee = [...RECIPES.filter((r) => !r.pack).slice(0, 14), ...RECIPES.filter((r) => r.pack).slice(0, 6)]

  return (
    <div className="overflow-x-hidden">
      {/* ——— Navigazione ——— */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <a href="./" className="flex items-center gap-2.5 font-display text-lg font-extrabold"><img src="./icon.svg" alt="" className="h-8 w-8" />SvuotaFrigo</a>
          <nav className="ml-auto hidden items-center gap-1 text-sm font-medium text-muted md:flex">
            <a href="#come" className="rounded-full px-3 py-2 hover:text-ink">Come funziona</a>
            <a href="#ricette" className="rounded-full px-3 py-2 hover:text-ink">Ricette</a>
            <a href="#prezzi" className="rounded-full px-3 py-2 hover:text-ink">Prezzi</a>
            <a href="#faq" className="rounded-full px-3 py-2 hover:text-ink">Domande</a>
          </nav>
          <Cta className="ml-auto md:ml-2">Apri l'app</Cta>
        </div>
      </header>

      {/* ——— Hero ——— */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: 'radial-gradient(60% 50% at 80% 10%, var(--butter-soft), transparent), radial-gradient(50% 50% at 0% 60%, var(--tomato-soft), transparent)' }} />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium">
              <span className="rounded-full bg-basil px-2 py-0.5 text-xs font-bold text-white">Gratis</span> Ricette dal tuo frigo, in italiano
            </span>
            <h1 className="mt-5 font-display text-[clamp(44px,7vw,84px)] font-extrabold leading-[0.95] tracking-[-0.045em]">
              Quello che hai in frigo <span className="relative inline-block text-tomato">diventa cena.<svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden><path d="M2 9c70-7 180-8 296-2" stroke="var(--butter)" strokeWidth="6" fill="none" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">Segna cosa c'è in casa: SvuotaFrigo ti dice cosa cucinare, partendo da quello che sta per scadere. Meno sprechi, meno spesa, zero “cosa mangiamo stasera?”.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Cta big />
              <a href="#come" className="press inline-flex h-14 items-center rounded-full border border-line bg-card px-6 font-semibold">Come funziona</a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['Nessuna registrazione', 'Funziona offline', 'iPhone, Android, PC'].map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={16} className="text-basil" />{t}</li>)}
            </ul>
          </div>
          <Reveal><PhoneMock /></Reveal>
        </div>
      </section>

      {/* ——— Come funziona ——— */}
      <section id="come" className="border-y border-line bg-paper-2 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><p className="magnet text-2xl text-tomato">facilissimo</p><h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Tre tocchi, la cena è decisa.</h2></Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ['1', '🧊', 'Dici cosa hai', 'Tocchi gli ingredienti, o scatti una foto al frigo con Premium. La scadenza la stimiamo noi.'],
              ['2', '♻', 'Scopri cosa cucinare', 'Le ricette che usano ciò che scade prima salgono in cima. Vedi subito se hai tutto.'],
              ['3', '👩‍🍳', 'Cucini e risparmi', 'Passo passo con i timer. Alla fine togliamo dal frigo ciò che hai usato e contiamo cosa hai salvato.'],
            ].map(([n, e, t, d], i) => (
              <Reveal key={n} delay={i * 0.1} className="card relative p-7">
                <span className="absolute right-6 top-5 font-display text-6xl font-extrabold text-line">{n}</span>
                <div className="text-4xl">{e}</div>
                <h3 className="mt-4 font-display text-2xl font-bold">{t}</h3>
                <p className="mt-2 text-muted">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Funzioni (bento) ——— */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight md:text-5xl">Tutto quello che serve in cucina. Gratis.</h2></Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ Icon, title, text, tone, span }, i) => (
              <Reveal key={title} delay={i * 0.05} className={cx('card p-7', span)}>
                <span className={cx('grid h-12 w-12 place-items-center rounded-2xl', tone)}><Icon size={22} /></span>
                <h3 className="mt-5 font-display text-2xl font-bold">{title}</h3>
                <p className="mt-2 text-muted">{text}</p>
              </Reveal>
            ))}
            <Reveal delay={0.25} className="card flex flex-col justify-between bg-ink p-7 text-paper">
              <Timer size={28} className="text-butter" />
              <div>
                <div className="font-display text-5xl font-extrabold">{FREE_COUNT}</div>
                <div className="text-paper/70">ricette gratis, più {Object.keys(PACKS).length} pacchetti speciali</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ——— Ricette ——— */}
      <section id="ricette" className="overflow-hidden bg-paper-2 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Dalla carbonara alla ribollita.</h2><p className="mt-2 max-w-xl text-muted">Ricette italiane vere, scritte per chi ha poco tempo e un frigo da svuotare.</p></Reveal>
        </div>
        <div className="mt-10 flex w-max gap-4 [animation:marquee_60s_linear_infinite] hover:[animation-play-state:paused]">
          {[...marquee, ...marquee].map((r, i) => (
            <div key={`${r.id}-${i}`} className="card w-56 shrink-0 overflow-hidden">
              <RecipeCover recipe={r} className="h-36" />
              <div className="p-3.5"><div className="line-clamp-1 font-display font-bold">{r.name}</div><div className="text-xs text-muted">{r.minutes} min{r.region ? ` · ${r.region}` : ''}{r.pack ? ` · ${PACKS[r.pack].emoji}` : ''}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Prezzi ——— */}
      <section id="prezzi" className="py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center"><h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Gratis per sempre. Premium se vuoi di più.</h2></Reveal>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal className="card p-8">
              <h3 className="font-display text-2xl font-bold">Gratis</h3>
              <div className="mt-2 font-display text-5xl font-extrabold">0 €</div>
              <ul className="mt-6 grid gap-3">
                {['Frigo con scadenze', `${FREE_COUNT} ricette`, 'Modalità cucina con timer', 'Lista della spesa per corsia', 'Statistiche degli ultimi 7 giorni', '1 scansione foto di prova'].map((t) => <li key={t} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-basil" />{t}</li>)}
              </ul>
              <a href={APP} className="press mt-8 flex h-12 items-center justify-center rounded-full border border-line font-semibold">Inizia gratis</a>
            </Reveal>
            <Reveal delay={0.1} className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-butter via-[#ffb547] to-tomato p-8 text-[#1d1a16] shadow-xl">
              <span className="absolute right-6 top-6 rounded-full bg-[#1d1a16] px-3 py-1 text-xs font-bold text-white">{TRIAL_DAYS} giorni gratis</span>
              <h3 className="flex items-center gap-2 font-display text-2xl font-bold"><Sparkles size={22} /> Premium</h3>
              <div className="mt-2 font-display text-5xl font-extrabold">{euro(PLANS['premium-year'].monthlyCents)}<span className="text-lg font-semibold">/mese</span></div>
              <div className="text-sm font-medium opacity-80">{euro(PLANS['premium-year'].priceCents)} all'anno, oppure {euro(PLANS['premium-month'].priceCents)} al mese</div>
              <ul className="mt-6 grid gap-3">
                {['Tutto il piano gratuito', ...PREMIUM.map((p) => p.title), 'Tutti i pacchetti di ricette', 'Porzioni fino a 12 persone'].map((t) => <li key={t} className="flex gap-2 font-medium"><Check size={18} className="mt-0.5 shrink-0" />{t}</li>)}
              </ul>
              <a href={`${APP}#/premium`} className="press mt-8 flex h-12 items-center justify-center rounded-full bg-[#1d1a16] font-semibold text-white">Prova Premium gratis</a>
            </Reveal>
          </div>
          <Reveal className="mx-auto mt-6 grid max-w-4xl gap-3 md:grid-cols-3">
            {(Object.keys(PACKS) as PackId[]).map((id) => (
              <div key={id} className="card flex items-center gap-3 p-4">
                <span className="text-3xl">{PACKS[id].emoji}</span>
                <span className="flex-1"><b className="block font-display">{PACKS[id].name}</b><span className="text-sm text-muted">pacchetto singolo</span></span>
                <b>{euro(PACKS[id].priceCents)}</b>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ——— FAQ ——— */}
      <section id="faq" className="border-t border-line bg-paper-2 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.4fr]">
          <Reveal><h2 className="font-display text-4xl font-extrabold tracking-tight md:text-5xl">Domande frequenti</h2></Reveal>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">{q}<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line transition-transform group-open:rotate-45">+</span></summary>
                <p className="mt-3 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ——— CTA finale ——— */}
      <section className="px-5 py-20">
        <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center text-paper">
          <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(50% 60% at 50% 120%, var(--tomato), transparent)' }} />
          <div className="relative">
            <div className="text-5xl">🧊🍝</div>
            <h2 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Stasera si cucina con quello che c'è.</h2>
            <p className="mx-auto mt-3 max-w-md text-paper/70">Gratis, senza registrazione. Ci metti meno a provarla che a leggere questa frase.</p>
            <Cta big className="mt-8">Apri SvuotaFrigo</Cta>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line py-10 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5">
          <span className="flex items-center gap-2"><img src="./icon.svg" alt="" className="h-6 w-6" /> SvuotaFrigo © {new Date().getFullYear()}</span>
          <span>Un'app <a className="font-semibold text-ink underline" href="https://backinbusinesss.github.io/carlarcade/" target="_blank" rel="noopener">CarlArcade</a> by <a className="font-semibold text-ink underline" href="https://carlhost.com" target="_blank" rel="noopener">Carlhost</a></span>
          <div className="flex w-full flex-wrap justify-between gap-3 border-t border-line pt-4 text-xs">
            <span>CarlHost di Ulivi Nicolò · Via Ventisette Novembre 1, Parabiago (MI) · P.IVA IT14943820960</span>
            <LegalLinks />
          </div>
        </div>
      </footer>
    </div>
  )
}
