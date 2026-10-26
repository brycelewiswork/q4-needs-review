/** Calendar helpers for the shared date. Weeks run Monday to Sunday; no years are shown anywhere. */
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** The demo's Monday. Pay periods are two weeks long and start on a Monday from here. */
export const BASE_MONDAY = new Date(2026, 9, 12)
/** "Today" in the prototype: Wednesday, matching the rest of the demo data. */
export const DEMO_TODAY = new Date(2026, 9, 14)

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
/** Monday = 0 … Sunday = 6 */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7
export const mondayOf = (d: Date) => addDays(d, -weekdayIndex(d))
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000)
/** Whole weeks between the demo's first week and the week containing `d`. */
export const weeksFromBase = (d: Date) => Math.floor(dayDiff(mondayOf(d), BASE_MONDAY) / 7)
export const payPeriodOf = (d: Date): [Date, Date] => {
  const start = addDays(BASE_MONDAY, Math.floor(dayDiff(d, BASE_MONDAY) / 14) * 14)
  return [start, addDays(start, 13)]
}

/** "October 12 – 18", or "October 26 – November 1" across a month boundary. */
export function rangeLabel(a: Date, b: Date) {
  return `${MONTHS[a.getMonth()]} ${a.getDate()} – ${a.getMonth() === b.getMonth() ? "" : `${MONTHS[b.getMonth()]} `}${b.getDate()}`
}
/** "Wednesday, October 14" */
export const dayLabel = (d: Date) => `${WEEKDAYS[weekdayIndex(d)]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
