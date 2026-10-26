import { Bar } from "@/components/wire/Wire"
import { useLocName } from "@/store/useViewStore"
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import { motion } from "motion/react"
import { ContextMenu } from "@/components/ios/ContextMenu"
import { roleColor } from "@/lib/roleColor"
import { Popover } from "@/components/ios/Popover"
import { ListRow } from "@/components/ios/list"
import type { Location } from "@/data/locations"
import { useStructure } from "@/store/useViewStore"
import { cn } from "@/lib/utils"
import {
  NOW_MIN,
  nextShiftDay,
  scheduledToday,
  shiftRange,
  useClock,
  useTimeClockStore,
  type ClockStatus,
} from "@/store/useTimeClockStore"

// ---------------------------------------------------------------------------
// Layout. Everything is absolutely positioned inside the sheet, per state.
//   out        → map + heading + editable form + the purple Confirm button
//   in / break → map + heading with read-only subtitles + shift progress + actions
// The sheet is a different height in each, and animates between them.
// ---------------------------------------------------------------------------

const LAYOUT = {
  // The map is +60px taller than before; everything below it, and the sheet itself, moved down with it.
  out: { height: 663, map: 352, dot: 206, heading: 364, card: 404, button: 590, buttonH: 46 },
  live: { height: 530, map: 260, dot: 160, heading: 272, progress: 376, tiles: 422 },
} as const

export const sheetHeightFor = (status: ClockStatus) => (status === "out" ? LAYOUT.out.height : LAYOUT.live.height)

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

/**
 * Figma "iOS Grouped List" inside a glass sheet: not white — a `fills-vibrant/tertiary`
 * layer that darkens the sheet ~7%. A plain 7% black fill (a real hard-light blend can't see
 * through the sheet's own backdrop-filter and came out far too dark).
 *
 * The CALLER positions it — don't add `relative` here, it would override `absolute`.
 */
function FillCard({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className={`overflow-hidden bg-black/[0.07] ${className ?? ""}`} style={{ borderRadius: 26, ...style }}>
      {children}
    </div>
  )
}

/** Time as Figma's pill: ios/fills/tertiary, 11×6 padding, full radius, 17/22. */
const TimePill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-[rgba(118,118,128,0.12)] px-[11px] py-[6px] text-[17px] font-normal leading-[22px] tracking-[-0.43px] text-[#2c2935]">
    {children}
  </span>
)

const toMinutes = (t: string) => {
  const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return 0
  return (Number(m[1]) % 12) * 60 + Number(m[2]) + (m[3].toUpperCase() === "PM" ? 720 : 0)
}

/** Shift progress: a simple bar, start time left and end time right. */
function ShiftProgress({ shift, top }: { shift: string; top: number }) {
  const wire = useStructure()
  const [start, end] = shiftRange(shift)
  const a = toMinutes(start)
  const b = toMinutes(end)
  const pct = Math.min(1, Math.max(0, (NOW_MIN - a) / Math.max(1, b - a)))
  return (
    <div className="absolute inset-x-4" style={{ top }}>
      <div
        role="progressbar"
        aria-label="Shift progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct * 100)}
        className="h-[6px] overflow-hidden rounded-[3px] bg-[rgba(120,120,120,0.2)]"
      >
        <div className="h-full rounded-[3px] bg-[#8f55e5]" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="mt-[6px] flex justify-between text-[15px] font-[510] leading-5 tracking-[-0.24px] text-[#5a5666]">
        {wire ? (
          <>
            <Bar w={52} h={10} className="mt-[5px]" />
            <Bar w={52} h={10} className="mt-[5px]" />
          </>
        ) : (
          <>
            <span>{start}</span>
            <span>{end}</span>
          </>
        )}
      </div>
    </div>
  )
}

/** Brand-purple tinted actions: soft fill, deeper purple icon + label (readable at 13pt). */
const ACTION_FILL = "rgba(143,85,229,0.14)"
const ACTION_INK = "#7440d1"
/** Clock out is the risky action, so it's gray and sits on the left, farthest from the thumb. */
const MUTED_FILL = "rgba(120,120,128,0.16)"
const MUTED_INK = "#6b6b73"

/** A glyph recolored via its alpha (the Figma SVGs are single-color). */
const Glyph = ({ src, color = ACTION_INK }: { src: string; color?: string }) => (
  <span
    aria-hidden
    className="relative block size-6"
    style={{
      backgroundColor: color,
      maskImage: `url(${src})`,
      WebkitMaskImage: `url(${src})`,
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
    }}
  />
)

type Tile = { icon: string; label: string; onClick: () => void; muted?: boolean; /** Two taps: the first arms it (it grows and turns primary), the second confirms. */ confirm?: string }

const PRIMARY = "#8f55e5"
const TILE_SPRING = { type: "spring" as const, stiffness: 420, damping: 38 }

/**
 * Figma's action tiles: 68pt tall, 16pt radius — purple, so they read as actions.
 * A tile with `confirm` is a two-step action: the first tap makes it span the whole row in the primary
 * color (the others fold away), the second tap does it. Tapping anywhere else puts it back.
 */
function ActionTiles({ top, tiles }: { top: number; tiles: Tile[] }) {
  const [armed, setArmed] = useState<string | null>(null)
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!armed) return
    const off = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-armed]")) setArmed(null)
    }
    document.addEventListener("pointerdown", off)
    return () => document.removeEventListener("pointerdown", off)
  }, [armed])

  return (
    <div ref={row} className="absolute inset-x-4 flex" style={{ top }}>
      {tiles.map((t, i) => {
        const on = armed === t.label
        const folded = armed !== null && !on
        const ink = on ? "#ffffff" : t.muted ? MUTED_INK : ACTION_INK
        return (
          <motion.button
            key={t.label}
            data-armed={on ? "" : undefined}
            aria-label={on && t.confirm ? t.confirm : t.label}
            onClick={() => (t.confirm && !on ? setArmed(t.label) : t.onClick())}
            initial={false}
            animate={{
              flexGrow: folded ? 0 : 1,
              marginLeft: i === 0 ? 0 : folded ? 0 : 12,
              opacity: folded ? 0 : 1,
              backgroundColor: on ? PRIMARY : t.muted ? MUTED_FILL : ACTION_FILL,
            }}
            transition={TILE_SPRING}
            style={{ flexBasis: 0, minWidth: 0, pointerEvents: folded ? "none" : undefined }}
            className="relative flex h-[68px] flex-col items-center gap-[2px] overflow-hidden rounded-[16px] py-3 active:opacity-60"
          >
            <Glyph src={t.icon} color={ink} />
            <span className="relative whitespace-nowrap text-[13px] font-[590] leading-[18px] tracking-[-0.43px]" style={{ color: ink }}>
              {on && t.confirm ? t.confirm : t.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}


/** Role as a tag: a colored dot (stable per role) + the role name. The tag opens the role menu. */
function RoleTag({ role, onClick }: { role: string; onClick: (e: MouseEvent<HTMLElement>) => void }) {
  const dot = roleColor(role)
  return (
    <button
      onClick={onClick}
      aria-haspopup="menu"
      aria-label={`Role: ${role}`}
      className="inline-flex items-center gap-[7px] rounded-full bg-[rgba(118,118,128,0.12)] py-[3px] pl-[10px] pr-3 text-[17px] font-normal leading-[22px] tracking-[-0.43px] text-[#2c2935] active:opacity-60"
    >
      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
      {role}
    </button>
  )
}

/** A block that fades in when its state mounts. Holds no glass, so opacity is safe here. */
const Fade = ({ children }: { children: ReactNode }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
    {children}
  </motion.div>
)

// ---------------------------------------------------------------------------
// The widget
// ---------------------------------------------------------------------------

/**
 * Body of the Time Clock half sheet. It reads and writes the shared clock state
 * (`useTimeClockStore`), so the sheet, the bottom accessory and its text always agree.
 *
 *   out    → choose location / role, then Confirm Clock in
 *   in     → "Clocked in at …", details as read-only subtitles, progress, break / meal / clock out
 *   break  → "On a 10 min break", End break / Clock out
 *
 * `close(then)` collapses the sheet into the accessory and runs `then` after.
 */
export function TimeClockContent({ loc, close, onChangeLocation }: { loc: Location; close: (then?: () => void) => void; /** Several locations: the Location row goes back to the location step instead of changing the app's location. */ onChangeLocation?: () => void }) {
  const locName = useLocName()
  const st = useClock(loc)
  const wire = useStructure()
  const clock = useTimeClockStore()

  const { shift, role: defaultRole, roles } = loc.employee.timeClock
  const role = st.role ?? defaultRole
  const live = st.status !== "out"
  // Only one location a day: elsewhere you can see the next shift but not clock in.
  const today = scheduledToday(loc)
  const L = live ? LAYOUT.live : LAYOUT.out

  // Which pull-down is open, and the element it grows from.
  const [menu, setMenu] = useState<{ kind: "role"; anchor: HTMLElement } | null>(null)
  const open = (kind: "role") => (e: MouseEvent<HTMLElement>) => setMenu({ kind, anchor: e.currentTarget })
  const closeMenu = () => setMenu(null)

  const heading =
    st.status === "out" ? (today ? "Ready to clock in" : "Not scheduled today") : st.status === "break" ? `On a ${st.breakKind}` : wire ? "Clocked in" : `Clocked in at ${st.clockedInAt}`

  const subtitles =
    st.status === "break"
      ? [...(wire ? [] : [`Back at ${st.breakEndsAt}`]), locName(loc), role]
      : [locName(loc), ...(wire ? [] : [shift]), role]

  const clockOut: Tile = { icon: "/phone/tile-clock-out.svg", label: "Clock out", confirm: "Confirm clock out", muted: true, onClick: () => close(() => clock.clockOut(loc.id)) }
  const tiles: Tile[] =
    st.status === "break"
      ? [clockOut, { icon: "/phone/tile-break.svg", label: "End break", onClick: () => clock.endBreak(loc.id) }]
      : [
          clockOut,
          { icon: "/phone/tile-break.svg", label: "10 min break", onClick: () => clock.startBreak(loc.id, "10 min break", 10) },
          { icon: "/phone/meal.svg", label: "30 min meal", onClick: () => clock.startBreak(loc.id, "30 min meal", 30) },
        ]

  return (
    <>
      {/* Map: real Apple Maps render (MapKit snapshot, 780×400), cropped to fill. */}
      <motion.div
        className={cn("absolute inset-x-0 top-0 overflow-hidden", wire ? "bg-[#e9e8ec]" : "bg-[#e9e6df]")}
        animate={{ height: L.map }}
        transition={{ type: "spring", stiffness: 420, damping: 40 }}
      >
        {!wire && <img src="/phone/map.png" alt="" draggable={false} className="size-full object-cover" />}
        {/* Business name, pointing at the location dot. Scale only — no opacity on the glass's ancestors. */}
        <motion.div
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 30, delay: 0.25 }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: L.map - L.dot + 14, transformOrigin: "bottom center" }}
        >
          <Popover arrow="down">
            <span className="block whitespace-nowrap text-[15px] font-[590] leading-5 tracking-[-0.43px] text-[#1a1a1a]">
              {locName(loc)}
            </span>
          </Popover>
        </motion.div>
        <span
          className="absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-[#8f55e5] shadow-[0_1px_6px_rgba(0,0,0,0.3)]"
          style={{ top: L.dot }}
        />
      </motion.div>

      {/* Heading (+ read-only details once clocked in). */}
      <Fade key={`head-${st.status}`}>
        <div className="absolute inset-x-4" style={{ top: L.heading }}>
          <h3 className="text-[22px] font-[590] leading-7 tracking-[-0.26px] text-[#1a1a1a]">{heading}</h3>
          {live && (
            <div className="mt-[2px] text-[15px] leading-5 tracking-[-0.24px] text-[#5a5666]">
              {subtitles.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
      </Fade>

      {live ? (
        <Fade key={`live-${st.status}`}>
          <ShiftProgress shift={shift} top={LAYOUT.live.progress} />
          <ActionTiles top={LAYOUT.live.tiles} tiles={tiles} />
        </Fade>
      ) : (
        <Fade key="out">
          <FillCard className="absolute inset-x-4" style={{ top: LAYOUT.out.card }}>
            <ListRow compact first divider="border-black/[0.09]" chevron={onChangeLocation ? "updown" : undefined} onClick={onChangeLocation} title="Location" trailing={<span className="text-[#2c2935]">{locName(loc)}</span>} />
            <ListRow compact divider="border-black/[0.09]" title={today ? "Shift" : "Next shift"} trailing={wire ? <Bar w={90} h={12} /> : <TimePill>{today ? shift : `${nextShiftDay(loc)} ${shift}`}</TimePill>} />
            <ListRow compact divider="border-black/[0.09]" title="Role" trailing={<RoleTag role={role} onClick={open("role")} />} />
            {/* The location PIN lives here, where someone needs it to clock in, not on a card in Settings. */}
            <ListRow compact divider="border-black/[0.09]" title="PIN" trailing={wire ? <Bar w={56} h={12} /> : <TimePill>{loc.profile.pin}</TimePill>} />
          </FillCard>

          <button
            onClick={() => clock.clockIn(loc.id, role)}
            disabled={!today}
            style={{ top: LAYOUT.out.button, height: LAYOUT.out.buttonH }}
            className="absolute inset-x-4 rounded-full bg-[#8f55e5] text-[17px] font-[590] tracking-[-0.43px] text-white active:opacity-80 disabled:bg-[rgba(120,120,128,0.2)] disabled:text-[#8e8e93] disabled:active:opacity-100"
          >
            {today ? "Confirm Clock in" : "No shift to clock in to"}
          </button>
        </Fade>
      )}

      <ContextMenu
        anchor={menu?.kind === "role" ? menu.anchor : null}
        items={roles.map((r) => ({ id: r, label: r }))}
        selectedId={role}
        onSelect={(r) => clock.setRole(loc.id, r, st)}
        onClose={closeMenu}
      />
    </>
  )
}
