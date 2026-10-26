import { create } from "zustand"

/** A shift added from the Add shift sheet. Hours are decimal (13.5 = 1:30 pm). */
export type AddedShift = { who: string; role: string; start: number; end: number; open?: boolean; mine?: boolean }

/** `locationId:YYYY-MM-DD` — added shifts are per location and per day. */
export const shiftKey = (locId: string, d: Date) =>
  `${locId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

type State = {
  added: Record<string, AddedShift[]>
  add: (locId: string, d: Date, s: AddedShift) => void
}

/** Shifts the user adds on top of the demo schedule. Not persisted: a reload clears them. */
export const useShiftsStore = create<State>()((set) => ({
  added: {},
  add: (locId, d, s) =>
    set((st) => {
      const k = shiftKey(locId, d)
      return { added: { ...st.added, [k]: [...(st.added[k] ?? []), s] } }
    }),
}))
