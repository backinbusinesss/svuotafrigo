import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// Pagine: il sito di presentazione (/), la web app (/app/) e le note legali (privacy, cookie, termini).
// base relativa: funziona su GitHub Pages (/svuotafrigo/) e su un dominio proprio.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'src') } },
  build: {
    rollupOptions: {
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        cookie: resolve(import.meta.dirname, 'cookie.html'),
        termini: resolve(import.meta.dirname, 'termini.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
