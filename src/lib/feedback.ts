// Toast, vibrazione e suono: piccoli feedback che rendono l'app "viva".
import { create } from 'zustand'

interface Toast { id: number; text: string; emoji?: string; action?: { label: string; run(): void } }

export const useToasts = create<{ toasts: Toast[]; push(t: Omit<Toast, 'id'>): void; drop(id: number): void }>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Date.now() + Math.random()
    set({ toasts: [...get().toasts.slice(-2), { ...t, id }] })
    setTimeout(() => get().drop(id), 3800)
  },
  drop: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = (text: string, emoji?: string, action?: Toast['action']) => useToasts.getState().push({ text, emoji, action })

export function buzz(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern) } catch { /* non supportato */ }
}

/** Il "ding" del timer, generato al volo: nessun file audio da scaricare. */
export function ding() {
  try {
    const ctx = new AudioContext()
    const notes = [880, 1175, 1568]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = f
      const t = ctx.currentTime + i * 0.18
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.55)
    })
  } catch { /* audio non disponibile */ }
}
