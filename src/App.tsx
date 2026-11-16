// Guscio dell'app: tema, router, barra in basso, toast, checkout.
import { BookOpen, CalendarDays, Refrigerator, ShoppingBasket, User } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { INGREDIENT_BY_ID } from '@/content/ingredients'
import { expiringSoon } from '@/domain/pantry'
import { CookMode } from '@/features/recipes/CookMode'
import { FridgeScreen } from '@/features/fridge/FridgeScreen'
import { useToday } from '@/features/hooks'
import { Onboarding } from '@/features/onboarding/Onboarding'
import { PlanScreen } from '@/features/plan/PlanScreen'
import { DemoCheckout } from '@/features/premium/DemoCheckout'
import { PremiumScreen } from '@/features/premium/PremiumScreen'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { RecipeScreen } from '@/features/recipes/RecipeScreen'
import { RecipesScreen } from '@/features/recipes/RecipesScreen'
import { ShoppingScreen } from '@/features/shopping/ShoppingScreen'
import { toast, useToasts } from '@/lib/feedback'
import { handleCheckoutReturn, refreshSubscription } from '@/providers/payments'
import { PACKS } from '@/domain/plans'
import type { PackId } from '@/domain/types'
import { href, type Route, useRoute } from '@/lib/router'
import { isPremium, useApp } from '@/store/app'
import { cx } from '@/ui/kit'

function useTheme() {
  const theme = useApp((s) => s.theme)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#15120f' : '#fff8ef')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}

/** All'avvio: conferma un pagamento appena fatto su Stripe e aggiorna lo stato dell'abbonamento. */
function usePayments() {
  useEffect(() => {
    handleCheckoutReturn()
      .then((product) => {
        if (!product) return refreshSubscription()
        const [kind, id] = product.split(':')
        toast(kind === 'pack' ? `Pacchetto ${PACKS[id as PackId]?.name ?? ''} sbloccato. Grazie!` : 'Premium attivo. Grazie!', '★')
      })
      .catch(() => toast('Pagamento non ancora confermato. Riapri l’app tra poco: se hai pagato, si attiverà da solo.', '⚠️'))
  }, [])
}

/** Avviso all'apertura (Premium): cosa scade oggi o domani. */
function useExpiryAlert() {
  const today = useToday()
  useEffect(() => {
    const s = useApp.getState()
    if (!s.alertsEnabled || !isPremium(s) || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const key = `svuotafrigo-alert-${today}`
    if (localStorage.getItem(key)) return
    const soon = expiringSoon(s.pantry, today, 1)
    if (!soon.length) return
    localStorage.setItem(key, '1')
    new Notification('SvuotaFrigo', { body: `Da usare subito: ${soon.map((p) => INGREDIENT_BY_ID[p.ingredientId]?.name).join(', ')}`, icon: './icon.svg' })
  }, [today])
}

const TABS: { route: Route; label: string; Icon: typeof Refrigerator; match: Route['name'][] }[] = [
  { route: { name: 'frigo' }, label: 'Frigo', Icon: Refrigerator, match: ['frigo'] },
  { route: { name: 'ricette' }, label: 'Ricette', Icon: BookOpen, match: ['ricette', 'ricetta'] },
  { route: { name: 'piano' }, label: 'Piano', Icon: CalendarDays, match: ['piano'] },
  { route: { name: 'spesa' }, label: 'Spesa', Icon: ShoppingBasket, match: ['spesa'] },
  { route: { name: 'profilo' }, label: 'Profilo', Icon: User, match: ['profilo', 'premium'] },
]

function BottomNav({ route }: { route: Route }) {
  const shopping = useApp((s) => s.shopping.filter((x) => !x.checked).length)
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl" aria-label="Navigazione">
      <div className="mx-auto grid h-[72px] max-w-lg grid-cols-5">
        {TABS.map(({ route: r, label, Icon, match }) => {
          const on = match.includes(route.name)
          return (
            <a key={label} href={href(r)} aria-current={on ? 'page' : undefined} className="press relative flex flex-col items-center justify-center gap-1">
              {on && <motion.span layoutId="tab" className="absolute top-2 h-9 w-14 rounded-full bg-tomato-soft" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <Icon size={22} className={cx('relative', on ? 'text-tomato' : 'text-muted')} strokeWidth={on ? 2.4 : 2} />
              <span className={cx('relative text-[11px] font-semibold', on ? 'text-tomato' : 'text-muted')}>{label}</span>
              {label === 'Spesa' && shopping > 0 && <span className="absolute right-[22%] top-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-tomato px-1 text-[10px] font-bold text-white">{shopping}</span>}
            </a>
          )
        })}
      </div>
    </nav>
  )
}

function Toaster() {
  const toasts = useToasts((s) => s.toasts)
  const drop = useToasts((s) => s.drop)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper shadow-2xl">
            {t.emoji && <span className="text-lg">{t.emoji}</span>}
            <span className="flex-1">{t.text}</span>
            {t.action && <button onClick={() => { t.action!.run(); drop(t.id) }} className="font-bold text-butter">{t.action.label}</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'frigo': return <FridgeScreen />
    case 'ricette': return <RecipesScreen initialTab={route.tab} />
    case 'ricetta': return <RecipeScreen id={route.id} />
    case 'piano': return <PlanScreen />
    case 'spesa': return <ShoppingScreen />
    case 'profilo': return <ProfileScreen />
    case 'premium': return <PremiumScreen from={route.from} />
    default: return null
  }
}

export function App() {
  useTheme()
  useExpiryAlert()
  usePayments()
  const onboarded = useApp((s) => s.onboarded)
  const route = useRoute()

  if (!onboarded) return (<><Onboarding /><Toaster /></>)
  if (route.name === 'cucina') return (<><CookMode id={route.id} /><Toaster /></>)

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-lg px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)]">
        <motion.div key={route.name + ('id' in route ? route.id : '')} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          <Screen route={route} />
        </motion.div>
      </main>
      <BottomNav route={route} />
      <DemoCheckout />
      <Toaster />
    </>
  )
}
