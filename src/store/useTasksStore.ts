import { create } from "zustand"
import type { Location } from "@/data/locations"

/** Which tasks have been ticked off, shared by the dashboard's Task Manager section and its full page. */
type State = {
  done: Record<string, boolean>
  toggle: (key: string, current: boolean) => void
}

export const useTasksStore = create<State>()((set) => ({
  done: {},
  toggle: (key, current) => set((s) => ({ done: { ...s.done, [key]: !current } })),
}))

export const taskKey = (loc: Location, id: string) => `${loc.id}:${id}`
