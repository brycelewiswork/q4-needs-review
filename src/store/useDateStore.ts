import { create } from "zustand"
import { DEMO_TODAY, addDays } from "@/lib/dates"

export type TimeView = "day" | "period"

/**
 * The one date the app is looking at, shared by Shifts and Time. It's a single day; each page
 * reads it at its own zoom (Shifts: the week around it, Time: that day or its pay period).
 * Shown as the subtitle under the location title. Not persisted: a reload goes back to today.
 */
type State = {
  date: Date
  setDate: (d: Date) => void
  shiftDays: (n: number) => void
  /** Time's Day / Pay period choice lives here so the subtitle can name the right range. */
  timeView: TimeView
  setTimeView: (v: TimeView) => void
}

export const useDateStore = create<State>()((set) => ({
  date: DEMO_TODAY,
  setDate: (date) => set({ date }),
  shiftDays: (n) => set((s) => ({ date: addDays(s.date, n) })),
  timeView: "day",
  setTimeView: (timeView) => set({ timeView }),
}))
