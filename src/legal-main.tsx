import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Legal, type LegalDoc } from './site/Legal'
import './styles/base.css'

// privacy.html, cookie.html e termini.html condividono questo ingresso: il documento arriva da <body data-doc>.
const doc = (document.body.dataset.doc ?? 'privacy') as LegalDoc

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Legal doc={doc} />
  </StrictMode>,
)
