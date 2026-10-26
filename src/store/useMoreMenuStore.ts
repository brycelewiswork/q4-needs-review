import { create } from "zustand"
import { persist } from "zustand/middleware"

type State = {
  /** The More menu's items, top to bottom, by id. Anything not listed (a new item) goes at the end. */
  order: string[]
  setOrder: (order: string[]) => void
  reset: () => void
}

export const useMoreMenuStore = create<State>()(
  persist(
    (set) => ({
      order: [],
      setOrder: (order) => set({ order }),
      reset: () => set({ order: [] }),
    }),
    { name: "q4-more-menu" },
  ),
)

/** The tabs ("tab:home", ...) come first, always in the order the app gives them: only the rest is the person's to arrange. */
export const isTabItem = (id: string) => id.startsWith("tab:")

/** Puts `items` in the person's order, after the tabs; unknown ones keep their place at the end. */
export function inMenuOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  const rank = (id: string) => {
    const i = order.indexOf(id)
    return i === -1 ? order.length + items.findIndex((x) => x.id === id) : i
  }
  const tabs = items.filter((x) => isTabItem(x.id))
  const rest = items.filter((x) => !isTabItem(x.id)).sort((a, b) => rank(a.id) - rank(b.id))
  return [...tabs, ...rest]
}
