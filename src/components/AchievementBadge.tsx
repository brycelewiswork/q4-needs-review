import { cn } from "@/lib/utils"

/** The kinds of achievement and how many times you've earned each. The same for everyone, for now. */
export const ACHIEVEMENTS: { name: string; blurb: string; count: number; tone: "bronze" | "purple" }[] = [
  { name: "Perfect attendance", blurb: "Worked every scheduled shift in a month", count: 3, tone: "bronze" },
  { name: "Team player", blurb: "Picked up a shift for a teammate", count: 5, tone: "purple" },
  { name: "Early bird", blurb: "Clocked in early for ten shifts in a row", count: 2, tone: "purple" },
  { name: "Top rated", blurb: "A five-star shift rating from a manager", count: 1, tone: "purple" },
]
/** More earned than fit in the row. */
export const ACHIEVEMENTS_MORE = 3

const TONES = {
  bronze: { fill: "#d9884a", ink: "#8a4a1a", star: "#2a1a10" },
  purple: { fill: "#7a3fd6", ink: "#ddf21a", star: "#1d0f3a" },
  grey: { fill: "#e7e6dc", ink: "#2c2935", star: "#2c2935" },
} as const

/** A hexagon badge with its count. `empty` is the structure cut: just the shape. */
export function AchievementBadge({ value, tone = "purple", empty, size = 54, className }: { value: string | number; tone?: keyof typeof TONES; empty?: boolean; size?: number; className?: string }) {
  const t = TONES[tone]
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className={cn("shrink-0", className)}>
      <polygon points="50,4 92,27 92,73 50,96 8,73 8,27" fill={empty ? "#dedde4" : t.fill} stroke={tone === "grey" && !empty ? "#cfcdbf" : "none"} strokeWidth="2" strokeLinejoin="round" />
      {!empty && (
        <>
          {tone !== "grey" && <polygon points="50,14 53,22 61,22 55,27 57,35 50,30 43,35 45,27 39,22 47,22" fill={t.star} />}
          <text x="50" y={tone === "grey" ? 60 : 72} textAnchor="middle" fontSize={tone === "grey" ? 30 : 46} fontWeight={900} fill={t.ink} fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
            {value}
          </text>
        </>
      )}
    </svg>
  )
}
