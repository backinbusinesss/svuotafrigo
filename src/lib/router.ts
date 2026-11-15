// Router minimo basato sull'hash (#/ricetta/carbonara): funziona su qualsiasi hosting statico.
import { useEffect, useState } from 'react'

export type Route =
  | { name: 'frigo' }
  | { name: 'ricette'; tab?: string }
  | { name: 'ricetta'; id: string }
  | { name: 'cucina'; id: string }
  | { name: 'piano' }
  | { name: 'spesa' }
  | { name: 'profilo' }
  | { name: 'premium'; from?: string }

export function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const q = new URLSearchParams(query)
  switch (parts[0]) {
    case 'ricette': return { name: 'ricette', tab: q.get('tab') ?? undefined }
    case 'ricetta': return parts[1] ? { name: 'ricetta', id: parts[1] } : { name: 'ricette' }
    case 'cucina': return parts[1] ? { name: 'cucina', id: parts[1] } : { name: 'ricette' }
    case 'piano': return { name: 'piano' }
    case 'spesa': return { name: 'spesa' }
    case 'profilo': return { name: 'profilo' }
    case 'premium': return { name: 'premium', from: q.get('da') ?? undefined }
    default: return { name: 'frigo' }
  }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'frigo': return '#/'
    case 'ricette': return r.tab ? `#/ricette?tab=${r.tab}` : '#/ricette'
    case 'ricetta': return `#/ricetta/${r.id}`
    case 'cucina': return `#/cucina/${r.id}`
    case 'premium': return r.from ? `#/premium?da=${r.from}` : '#/premium'
    default: return `#/${r.name}`
  }
}

export const go = (r: Route) => { location.hash = href(r) }
export const back = () => (history.length > 1 ? history.back() : go({ name: 'frigo' }))

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(location.hash))
  useEffect(() => {
    const on = () => {
      setRoute(parse(location.hash))
      window.scrollTo({ top: 0 })
    }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return route
}
