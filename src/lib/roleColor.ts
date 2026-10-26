/**
 * One color per role, the same everywhere a role is color-coded (the Shifts bar, the clock-in role tag).
 * Fixed per role, not hashed, so two roles in the same schedule never end up with near-identical colors.
 */
const ROLE_COLORS: Record<string, string> = {
  "Front desk": "#2f80ed", // blue
  "Floor lead": "#8f55e5", // purple
  Trainer: "#f2994a", // orange
  Maintenance: "#27ae60", // green
  Counter: "#00a3a3", // teal
  Baker: "#eb5757", // red
  Barista: "#a0652a", // brown
  "Shift lead": "#e84393", // pink
  "General manager": "#1d3a6b", // navy
  "Opening manager": "#8aa600", // olive
}

/** For a role we haven't assigned: still distinct from the above, stable per name. */
const FALLBACK = ["#6c5ce7", "#d35400", "#16a085", "#c0392b", "#7f8c8d"]

export const roleColor = (role: string) =>
  ROLE_COLORS[role] ?? FALLBACK[[...role].reduce((n, c) => n + c.charCodeAt(0), 0) % FALLBACK.length]
