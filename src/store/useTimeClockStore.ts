import { create } from "zustand"
import type { Location } from "@/data/locations"

export type ClockStatus = "out" | "in" | "break"

export type ClockState = {
  status: ClockStatus
  /** "9:41 AM" — when they clocked in. */
  clockedInAt?: string
  /** Role chosen for this shift (falls back to the location's default). */
  role?: string
  breakKind?: string
  breakEndsAt?: string
}

/** The prototype's clock. Matches the 9:41 in the status bar; nothing ticks. */
export const NOW_MIN = 9 * 60 + 41

export const fmtTime = (mins: number) => {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}
export const NOW_LABEL = fmtTime(NOW_MIN)

/** "8:30 AM – 2:00 PM" → ["8:30 AM", "2:00 PM"] */
export const shiftRange = (shift: string): [string, string] => {
  const [a, b] = shift.split(/\s[–-]\s/)
  return [a, b ?? a]
}

type Actions = {
  byLocation: Record<string, ClockState>
  clockIn: (locId: string, role: string) => void
  clockOut: (locId: string) => void
  startBreak: (locId: string, kind: string, minutes: number) => void
  endBreak: (locId: string) => void
  setRole: (locId: string, role: string, base: ClockState) => void
}

/**
 * Time-clock state, per location. A location starts from its seed (see `seedClock`)
 * and is overwritten the first time anything changes. Not persisted: a reload resets.
 */
export const useTimeClockStore = create<Actions>()((set) => ({
  byLocation: {},
  clockIn: (locId, role) =>
    set((s) => ({ byLocation: { ...s.byLocation, [locId]: { status: "in", clockedInAt: NOW_LABEL, role } } })),
  clockOut: (locId) => set((s) => ({ byLocation: { ...s.byLocation, [locId]: { status: "out" } } })),
  startBreak: (locId, kind, minutes) =>
    set((s) => {
      const cur = s.byLocation[locId]
      return {
        byLocation: {
          ...s.byLocation,
          [locId]: { ...cur, status: "break", breakKind: kind, breakEndsAt: fmtTime(NOW_MIN + minutes) },
        },
      }
    }),
  endBreak: (locId) =>
    set((s) => {
      const cur = s.byLocation[locId]
      return { byLocation: { ...s.byLocation, [locId]: { ...cur, status: "in", breakKind: undefined, breakEndsAt: undefined } } }
    }),
  setRole: (locId, role, base) =>
    set((s) => ({ byLocation: { ...s.byLocation, [locId]: { ...(s.byLocation[locId] ?? base), role } } })),
}))

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Is the person scheduled at this location today? (Only one location a day — see `USER_SCHEDULE`.) */
export const scheduledToday = (loc: Location) => loc.employee.week[loc.employee.todayIndex] !== null

/** The next shift at this location after today (wrapping into next week): "Mon". Its hours are `timeClock.shift`. */
export function nextShiftDay(loc: Location): string {
  const { week, todayIndex } = loc.employee
  for (let k = 1; k <= 7; k++) {
    const i = (todayIndex + k) % 7
    if (week[i]) return DAY_NAMES[i]
  }
  return ""
}

/** Where a location starts: clocked in from the shift start, unless its data says it isn't. */
export const seedClock = (loc: Location): ClockState =>
  !scheduledToday(loc) || loc.employee.accessory.title === "Not clocked in"
    ? { status: "out" }
    : { status: "in", clockedInAt: shiftRange(loc.employee.timeClock.shift)[0] }

export function useClock(loc: Location): ClockState {
  const stored = useTimeClockStore((s) => s.byLocation[loc.id])
  return stored ?? seedClock(loc)
}

/** The bottom accessory's text, derived from the clock — so it always agrees with the sheet. */
export function accessoryFor(loc: Location, st: ClockState): { title: string; subtitle: string } {
  const [start, end] = shiftRange(loc.employee.timeClock.shift)
  if (st.status === "break") return { title: "On break", subtitle: `Back at ${st.breakEndsAt}` }
  if (st.status === "in") return { title: "On the clock", subtitle: `Off at ${end}` }
  if (!scheduledToday(loc)) return { title: "No shift today", subtitle: `Next shift ${nextShiftDay(loc)} at ${start}` }
  return { title: "Not clocked in", subtitle: `Shift starts at ${start}` }
}

/**
 * The location the time clock screen is for. Home has no location, so someone with several picks one first
 * (and skips the step if they're already clocked in somewhere). It belongs to the clock, not to the app's location.
 */
export const useClockTargetStore = create<{ id: string | null; set: (id: string | null) => void }>((set) => ({ id: null, set: (id) => set({ id }) }))
