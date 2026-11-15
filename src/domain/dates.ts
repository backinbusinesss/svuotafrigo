// Date in formato ISO yyyy-mm-dd, sempre nel fuso locale (niente sorprese a mezzanotte UTC).

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = (now = new Date()) => toISODate(now)

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Giorni da a a b (b - a), interi, indipendenti dall'ora legale. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))
  return Math.round(ms / 86_400_000)
}

function ymd(s: string): [number, number, number] {
  const [y, m, d] = s.split('-').map(Number)
  return [y, m - 1, d]
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const WEEKDAYS_LONG = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export const weekdayShort = (iso: string) => WEEKDAYS[fromISODate(iso).getDay()]
export const weekdayLong = (iso: string) => WEEKDAYS_LONG[fromISODate(iso).getDay()]
export const dayMonth = (iso: string) => {
  const d = fromISODate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "oggi", "domani", "tra 3 giorni", "ieri", "3 giorni fa" */
export function relativeDays(n: number): string {
  if (n === 0) return 'oggi'
  if (n === 1) return 'domani'
  if (n === -1) return 'ieri'
  return n > 0 ? `tra ${n} giorni` : `${-n} giorni fa`
}
