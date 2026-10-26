import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
  /** The Home dashboard's widgets the person has removed, by id (see DASH_WIDGETS). */
  hidden: string[]
  hide: (id: string) => void
  show: (id: string) => void
  reset: () => void
}

export const useDashboardStore = create<State>()(
  persist(
    (set) => ({
      hidden: [],
      hide: (id) => set((s) => (s.hidden.includes(id) ? s : { hidden: [...s.hidden, id] })),
      show: (id) => set((s) => ({ hidden: s.hidden.filter((x) => x !== id) })),
      reset: () => set({ hidden: [] }),
    }),
    { name: "q4-dashboard" },
  ),
)
