import { useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { IconBellFilled, IconBellRinging, IconFlag, IconFlagFilled, IconLogin2, IconLogout2, IconChevronDown, IconMapPin, IconMessageCircle, IconPencil, IconPlayerStopFilled, IconSparkles, IconX, IconCheck } from "@tabler/icons-react"
import { agoLabel, agentPlan, hasPlan, rolesOf, urgencyOf, type DetailLines, type ReviewItem, type ReviewProperty, type ReviewUrgency } from "@/data/needsReview"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { MorphMenu } from "@/components/ios/MorphMenu"
import { RowMenu } from "@/components/ios/RowMenu"
import { roleColor } from "@/lib/roleColor"
import { useVersionStore } from "@/store/useVersionStore"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { Initials } from "@/components/ios/list"

/** Width of each swipe action, and how far the row slides to show all three. */
const ACTION_W = 76
const REVEAL = ACTION_W * 3
/** Dragged this far, the row is dismissed on release (a full swipe, like Mail's). */
const FULL_SWIPE = REVEAL + 70
/** How long a leaving row takes to slide off, before the gap it leaves closes (seconds). */
const SLIDE_OUT = 0.34
const SNAP = { type: "spring" as const, ...SPRING_FAST.snappy }

/** Whole class names, so Tailwind sees them. */
const CLAMP: Record<DetailLines, string> = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" }

/** Text classes for a row: version A, and version B, a step down (title and text both 14, small 12). */
const TEXT = {
  a: { title: "text-[17px] leading-[22px]", small: "text-[13px] leading-[18px]", body: "text-[15px] leading-5" },
  b: { title: "text-[14px] leading-[19px]", small: "text-[12px] leading-4", body: "text-[14px] leading-[19px]" },
}

const URGENCY: Record<ReviewUrgency, { label: string; chip: string }> = {
  high: { label: "High urgency", chip: "bg-[#fdeaea] text-[#e00000]" },
  medium: { label: "Medium urgency", chip: "bg-[#fdf0e2] text-[#b8620a]" },
  low: { label: "Low urgency", chip: "bg-black/5 text-[#7f7f7f]" },
}

/** The properties a row shows beneath its description, the ones turned on in View Options: role, location, urgency. */
function RowProperties({ item, show, small }: { item: ReviewItem; show: Record<ReviewProperty, boolean>; small?: boolean }) {
  const on = show.role || show.location || show.urgency
  const roles = [...new Set(rolesOf(item))]
  const urgency = URGENCY[urgencyOf(item)]
  return (
    <motion.span
      initial={false}
      animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }}
      transition={SNAP}
      className="block overflow-hidden"
      aria-hidden={!on}
    >
      <span className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 pt-[5px] text-[#8e8e93]", small ? "text-[12px] leading-4" : "text-[13px] leading-[18px]")}>
        {show.role &&
          roles.map((r) => (
            <span key={r} className="flex items-center gap-[5px]">
              <span aria-hidden className="size-[8px] rounded-full" style={{ backgroundColor: roleColor(r) }} />
              {r}
            </span>
          ))}
        {show.location && (
          <span className="flex items-center gap-[3px]">
            <IconMapPin size={13} stroke={2} />
            {item.location}
          </span>
        )}
        {show.urgency && <span className={cn("rounded-full px-2 font-[510]", small ? "text-[11px] leading-4" : "text-[12px] leading-[18px]", urgency.chip)}>{urgency.label}</span>}
      </span>
    </motion.span>
  )
}

/**
 * The avatar's slot at the left of a row. Showing or hiding the photos (the "..." menu) animates it: the avatar fades and
 * the slot's width closes up, so the text slides left to fill it (and back).
 */
export function AvatarSlot({ show, people, gray }: { show: boolean; people: string[]; /** Desaturated, for a row that's stepped back. */ gray?: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={{ width: show ? 40 : 0, marginRight: show ? 12 : 0, opacity: show ? 1 : 0 }}
      transition={SNAP}
      aria-hidden
      className={cn("flex shrink-0 overflow-hidden transition-[filter] duration-200", gray && "grayscale")}
    >
      <ReviewAvatar people={people} />
    </motion.span>
  )
}

/** A progress ring in the gutter, in place of the unread dot while the agent works; a filled check once it's done. */
function ProgressWheel({ progress, done, color, left = -1 }: { progress: number; done: boolean; color: string; /** Distance from the left edge of the row, in px. */ left?: number }) {
  const r = 5.5
  const c = 2 * Math.PI * r
  return (
    <span aria-hidden style={{ left }} className="absolute top-[23px] flex size-[14px] items-center justify-center">
      <motion.svg width="14" height="14" viewBox="0 0 14 14" className="absolute inset-0" animate={done ? { rotate: 0 } : { rotate: 360 }} transition={done ? { duration: 0 } : { duration: 1.1, repeat: Infinity, ease: "linear" }}>
        <circle cx="7" cy="7" r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="2" />
        <motion.circle
          cx="7"
          cy="7"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: "50% 50%" }}
        />
      </motion.svg>
      {done && (
        <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
          <IconCheck size={10} stroke={3.5} />
        </motion.span>
      )}
    </span>
  )
}

/**
 * Who the row is about. One person is one avatar; two (a swap or trade) are layered on a 45° diagonal, each smaller
 * so the pair fills the same square, the second in front.
 */
export function ReviewAvatar({ people }: { people: string[] }) {
  if (people.length < 2) return <Initials name={people[0]} size={40} />
  return (
    <span aria-hidden className="relative size-10 shrink-0">
      <span className="absolute left-0 top-0"><Initials name={people[0]} size={26} /></span>
      <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-white"><Initials name={people[1]} size={26} /></span>
    </span>
  )
}

/**
 * A missed clock-out as a vertical timeline in a light gray box: a purple tile for clocking in with the role under it, a
 * bar down to a gap that fades out in dots, and the expected clock-out. Markers and line sit in the left column.
 */
function ClockoutTimeline({ clockedIn, expectedOut, role, small }: { clockedIn: string; expectedOut: string; role: string; small?: boolean }) {
  const big = small ? "text-[14px] leading-5" : "text-[15px] leading-5"
  const sub = small ? "text-[12px] leading-4" : "text-[13px] leading-4"
  return (
    <div className="rounded-2xl bg-[#f3f2f6] p-3 tracking-[-0.31px]">
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#8f55e5] text-white">
          <IconLogin2 size={15} stroke={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block font-[510] text-black", big)}>Clocked in</span>
          <span className={cn("block text-[#8e8e93]", sub)}>{role}</span>
        </span>
        <span className={cn("text-[#2c2935]", big)}>{clockedIn}</span>
      </div>
      {/* The line, in the marker column (24px wide, so its center is 12px in). */}
      <div aria-hidden className="flex w-6 flex-col items-center py-[2px]">
        <span className="h-5 w-1 rounded-full bg-[#8f55e5]" />
        <span className="mt-[5px] h-[10px] w-1 rounded-full bg-[#a2a2a2]" />
        <span className="mt-[5px] size-[6px] rounded-full bg-[#a2a2a2]" />
        <span className="mt-[4px] size-[3px] rounded-full bg-[#a2a2a2]" />
      </div>
      <div className="mt-[2px] flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a06df0] to-[#7a3fd0] text-white">
          <IconLogout2 size={15} stroke={2} />
        </span>
        <span className={cn("min-w-0 flex-1 font-[510] text-black", big)}>Expected clock-out</span>
        <span className={cn("text-[#2c2935]", big)}>{expectedOut}</span>
      </div>
    </div>
  )
}

/** Everything known about a row, as the expanded row and the long-press card both show it: the facts (or the clock-out timeline) and the assistant's note. */
function RowContext({ item, t, small }: { item: ReviewItem; t: { body: string }; small?: boolean }) {
  return (
    <>
      {item.data.kind === "clockout" ? (
        <ClockoutTimeline {...item.data} small={small} />
      ) : (
        <dl className="flex flex-col gap-[6px] rounded-2xl bg-[#f3f2f6] px-3 py-[10px]">
          {item.facts.map(([label, value]) => (
            <div key={label} className={cn("flex items-baseline justify-between gap-4", t.body)}>
              <dt className="text-[#8e8e93]">{label}</dt>
              <dd className="text-right text-black">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {/* The assistant's read on it, under the facts so they stay together: one caption. */}
      <aside className="mt-2 flex items-start gap-[7px] rounded-2xl bg-[#f1ecfc] px-3 py-[10px]">
        <IconSparkles size={16} stroke={2} className="mt-[2px] shrink-0 text-[#6b3fc4]" />
        <p className={cn("text-[#4a2f86]", t.body)}>{item.context}</p>
      </aside>
    </>
  )
}

/**
 * Message the person, then either a plain Approve (the fix is already planned) or, when there's no plan, solve it by hand or hand it
 * to the agent. In a row they sit side by side, the main action last at the right where a thumb lands. `stacked` (the long-press
 * card) puts them in a column, full width, the main action on top.
 */
function RowButtons({ item, names, accent, main, onRun, onApprove, stacked }: { item: ReviewItem; names: string; accent: string; main: string; onRun: () => void; onApprove: () => void; stacked?: boolean }) {
  const plan = hasPlan(item)
  const gray = "flex items-center justify-center whitespace-nowrap rounded-full bg-black/5 text-[15px] font-[590] text-black active:opacity-60"
  const primary = "flex items-center justify-center gap-[6px] whitespace-nowrap rounded-full text-[15px] font-[590] text-white active:opacity-80"
  const mainButton = (cls: string) =>
    plan ? (
      <button onClick={onApprove} style={{ backgroundColor: accent }} className={cn(primary, cls)}>
        Approve
      </button>
    ) : (
      <button onClick={onRun} style={{ backgroundColor: accent }} className={cn(primary, cls)}>
        <IconSparkles size={16} stroke={2} />
        {main}
      </button>
    )
  if (stacked) {
    // Liquid glass, one pill per button, full width: the main action tinted in the tab's color.
    const glass = "flex h-full w-full items-center justify-center gap-[6px] whitespace-nowrap rounded-full text-[15px] font-[590] active:opacity-70"
    return (
      <div className="flex flex-col gap-2">
        <LiquidGlass mode="small" accent={accent} radius={999} className="flex h-11 w-full items-center justify-center">
          <button onClick={plan ? onApprove : onRun} className={cn(glass, "text-white")}>
            {!plan && <IconSparkles size={16} stroke={2} />}
            {plan ? "Approve" : main}
          </button>
        </LiquidGlass>
        {!plan && (
          <LiquidGlass mode="small" radius={999} className="flex h-11 w-full items-center justify-center">
            <button aria-haspopup="dialog" className={cn(glass, "text-black")}>
              Solve manually
            </button>
          </LiquidGlass>
        )}
        <LiquidGlass mode="small" radius={999} className="flex h-11 w-full items-center justify-center">
          <button className={cn(glass, "text-black")}>
            <IconMessageCircle size={18} stroke={1.75} />
            Message {names}
          </button>
        </LiquidGlass>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <button aria-label={`Message ${names}`} className={cn(gray, "size-10 shrink-0")}>
        <IconMessageCircle size={20} stroke={1.75} />
      </button>
      {plan ? (
        mainButton("h-10 flex-1 px-3")
      ) : (
        <>
          <button aria-haspopup="dialog" className={cn(gray, "h-10 flex-1 px-3")}>
            Solve manually
          </button>
          {mainButton("h-10 flex-[1.5] px-3")}
        </>
      )}
    </div>
  )
}

/**
 * One thing that needs review, in two states. Minimized: the title, when it came in, and the first line of detail.
 * Tapped: the full detail, the facts behind it, why it's here, and the actions. Open and closed is the page's to
 * hold (one row open at a time), so this is controlled.
 *
 * Swipe it left for Remind, Important and Dismiss; swiping all the way dismisses. Mount it inside AnimatePresence so
 * a dismissed row slides off and closes up.
 */
export function ReviewRow({
  item,
  accent,
  photos,
  properties,
  detailLines,
  dimmed = false,
  unread,
  open,
  important,
  reminded,
  agent,
  onToggle,
  onRun,
  onStop,
  onApprove,
  onImportant,
  onRemind,
  onDismiss,
}: {
  item: ReviewItem
  /** The main action's color: the current tab's. */
  accent: string
  /** Show the avatar at the left. */
  photos: boolean
  /** Which properties show beneath the description. */
  properties: Record<ReviewProperty, boolean>
  /** The most lines of description shown while the row is minimized. */
  detailLines: DetailLines
  /** Another row is open: this one steps back, its avatar desaturated and its text and buttons lighter. */
  dimmed?: boolean
  /** Show the blue dot. */
  unread: boolean
  open: boolean
  /** Marked important: an orange flag by the time. */
  important: boolean
  /** A reminder is set: a bell by the time. */
  reminded: boolean
  /** The agent is working on it (or has finished): shown in place of the unread dot and the detail line. */
  agent?: { step: number; done: boolean; steps: string[]; doneText: string }
  onToggle: () => void
  /** The main action: hand it to the agent. */
  onRun: () => void
  /** B: the stop button the row's button becomes while the assistant works, to undo the hand-off. */
  onStop: () => void
  /** The plain Approve, for an item that already has a plan. */
  onApprove: () => void
  onImportant: () => void
  onRemind: () => void
  onDismiss: () => void
}) {
  // Version B: one button on the right of every row in place of the buttons under the expanded row, and the type a step down.
  const b = useVersionStore((v) => v.version) === "b"
  const t = TEXT[b ? "b" : "a"]
  const main = agentPlan(item).label
  // B ends the description with the time, always shown: when the text is longer than the line limit, the text is cut with an
  // ellipsis to leave room for it. A hidden copy of the line measures how much fits.
  const detail = useRef<HTMLSpanElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const [cut, setCut] = useState<number | null>(null)
  // The chevron on B's button morphs the button into a menu of the ways to deal with the row; the pill itself hides while it's open.
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const pill = useRef<HTMLDivElement>(null)
  // A: pressing and holding a row opens it as a big context menu (RowMenu). `pressing` is the squeeze while the finger is down,
  // `held` stops the tap that follows the press from also expanding the row.
  const rowEl = useRef<HTMLLIElement>(null)
  const [rowMenu, setRowMenu] = useState<HTMLElement | null>(null)
  const [pressing, setPressing] = useState(false)
  const pressTimer = useRef<number | undefined>(undefined)
  const pressAt = useRef<{ x: number; y: number } | null>(null)
  const held = useRef(false)
  const cancelPress = () => {
    window.clearTimeout(pressTimer.current)
    pressAt.current = null
    setPressing(false)
  }
  const startPress = (e: React.PointerEvent) => {
    if (b || agent || rowMenu) return
    pressAt.current = { x: e.clientX, y: e.clientY }
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressing(true), 140)
    pressTimer.current = window.setTimeout(() => {
      held.current = true
      setPressing(false)
      setRowMenu(rowEl.current)
      window.setTimeout(() => (held.current = false), 400)
    }, 450)
  }
  const movePress = (e: React.PointerEvent) => {
    const at = pressAt.current
    if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > 8) cancelPress()
  }
  const ago = agoLabel(item.created)
  useLayoutEffect(() => {
    const wrap = detail.current
    const el = probe.current
    if (!b || !wrap || !el) return
    const fit = () => {
      // The line is swapped for the assistant's progress while it works: nothing to measure then (and a detached node reads as 0).
      if (!el.isConnected || !wrap.isConnected) return
      const limit = detailLines * parseFloat(getComputedStyle(el).lineHeight) + 1
      if (Number.isNaN(limit)) return
      el.textContent = `${item.detail} ${ago}`
      if (el.scrollHeight <= limit) return setCut(null)
      let lo = 0
      let hi = item.detail.length
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2)
        el.textContent = `${item.detail.slice(0, mid).trimEnd()}… ${ago}`
        if (el.scrollHeight <= limit) lo = mid
        else hi = mid - 1
      }
      setCut(lo)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [b, item.detail, ago, detailLines, !!agent])
  const names = item.people.map((n) => n.split(" ")[0]).join(" and ")
  const x = useMotionValue(0)
  // Hidden until the row moves, so no edge of them shows past the row at rest.
  const actionsOpacity = useTransform(x, [0, -6], [0, 1])
  const [revealed, setRevealed] = useState(false)
  // A drag ends in a click on the row: ignore it.
  const dragged = useRef(false)
  const settle = (to: number) => {
    setRevealed(to !== 0)
    animate(x, to, SNAP)
  }
  const actions = [
    { id: "remind", label: reminded ? "Reminder set" : "Remind me", color: "#5e5ce6", icon: <IconBellRinging size={22} stroke={1.75} />, run: onRemind },
    { id: "important", label: important ? "Not important" : "Important", color: "#ff9500", icon: important ? <IconFlagFilled size={22} /> : <IconFlag size={22} stroke={1.75} />, run: onImportant },
    { id: "dismiss", label: "Dismiss", color: "#8e8e93", icon: <IconX size={22} stroke={2} />, run: onDismiss },
  ]

  return (
    <motion.li
      ref={rowEl}
      // Leaving: the row slides all the way off to the left first (SLIDE_OUT), and only then does the space it held close up.
      exit={{ height: 0, opacity: 0, transition: { height: { delay: SLIDE_OUT, duration: 0.3, ease: [0.32, 0.72, 0, 1] }, opacity: { delay: SLIDE_OUT + 0.05, duration: 0.2 } } }}
      // B: the row runs 16px out into the page margin, so the unread dot lives there and the avatar sits at the page's 16px edge. Its
      // hairline is drawn inset (below), not as a border, so it still starts at the avatar.
      className={cn("group relative overflow-hidden", b ? "-ml-4" : "border-b border-black/[0.09] last:border-b-0")}
    >
      {b && <span aria-hidden className="absolute bottom-0 left-4 right-0 z-10 h-px bg-black/[0.09] group-last:hidden" />}
      {/* Behind the row: revealed as it slides left. */}
      {/* Behind the row. They stay out of sight while it slides away. */}
      <motion.div exit={{ opacity: 0, transition: { duration: 0.04 } }} className="absolute inset-y-0 right-0 flex">
      <motion.div style={{ opacity: actionsOpacity }} className="flex" inert={!revealed}>
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              if (a.id === "dismiss") return a.run()
              a.run()
              settle(0)
            }}
            style={{ width: ACTION_W, backgroundColor: a.color }}
            className="flex flex-col items-center justify-center gap-1 px-1 text-center text-[13px] font-[510] leading-4 tracking-[-0.08px] text-white active:opacity-80"
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </motion.div>
      </motion.div>

      <motion.div
        drag={agent ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -(REVEAL + 140), right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        exit={{ x: "-100%", transition: { duration: SLIDE_OUT, ease: [0.4, 0, 0.9, 0.6] } }}
        onDragStart={() => {
          dragged.current = true
          cancelPress()
        }}
        onDragEnd={(_, info) => {
          setTimeout(() => (dragged.current = false), 60)
          const at = x.get()
          if (at < -FULL_SWIPE) onDismiss()
          else if (at < -REVEAL / 2 || info.velocity.x < -500) settle(-REVEAL)
          else settle(0)
        }}
        animate={{ scale: pressing ? 0.97 : 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onPointerDown={startPress}
        onPointerMove={movePress}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        className={cn("relative touch-pan-y bg-white transition-opacity duration-200", b ? "pl-4" : "pl-5", dimmed && "opacity-50", rowMenu && "invisible")}
      >
        {/* The gutter at the title's line: the unread dot (it fades once the row has been opened), or, while the agent works on it, a progress wheel. */}
        <span
          aria-hidden
          className={cn("absolute rounded-full bg-[#007aff] transition-opacity duration-200", b ? "left-1 top-7 size-2" : "left-0 top-[25px] size-[10px]", unread && !agent ? "opacity-100" : "opacity-0")}
        />
        {agent && !b && <ProgressWheel progress={agent.done ? 1 : (agent.step + 0.5) / agent.steps.length} done={agent.done} color={accent} left={b ? 1 : -1} />}
        <div className={b ? "flex items-center" : undefined}>
        <button
          onClick={() => {
            if (dragged.current || held.current) return
            // A row that's swiped open closes first.
            if (x.get() < -4) return settle(0)
            onToggle()
          }}
          aria-expanded={open}
          aria-label={unread ? `Unread, ${item.title}` : undefined}
          className={cn("py-3 text-left tracking-[-0.43px] active:opacity-60", b ? "min-w-0 flex-1" : "block w-full")}
        >
          <span className="flex items-start">
          <AvatarSlot show={photos} people={item.people ?? [item.title]} gray={dimmed} />
          <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className={cn("font-[590] text-black", t.title)}>{item.title}</span>
            <span className={cn("flex shrink-0 items-center gap-[5px] text-[#7f7f7f]", t.small)}>
              {important && <IconFlagFilled size={13} className="text-[#ff9500]" aria-label="Important" />}
              {reminded && <IconBellFilled size={13} className="text-[#5e5ce6]" aria-label="Reminder set" />}
              {/* B puts the time at the end of the description instead, as a relative age. */}
              {!b && item.when}
            </span>
          </span>
          {agent ? (
            // The second line is the agent's progress: the step it's on, then what it did, in the same gray as the description.
            <span className={cn("relative mt-px block h-5 overflow-hidden", b ? "text-[14px] leading-5" : "text-[15px] leading-5")} aria-live="polite">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={agent.done ? "done" : agent.step}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-1 whitespace-nowrap text-[#8e8e93]"
                >
                  {agent.done ? <IconCheck size={15} stroke={2.5} /> : <IconSparkles size={14} stroke={2} />}
                  {agent.done ? agent.doneText : `${agent.steps[agent.step]}…`}
                </motion.span>
              </AnimatePresence>
            </span>
          ) : (
            <span className="relative mt-px block">
              <span ref={detail} className={cn("block text-[#8e8e93]", t.body, !b && !open && CLAMP[detailLines])}>
                {b && !open && cut !== null ? `${item.detail.slice(0, cut).trimEnd()}…` : item.detail}
                {b && <span className="whitespace-nowrap text-[#b9b8c1]">{" "}{ago}</span>}
              </span>
              {b && <span ref={probe} aria-hidden className={cn("invisible absolute inset-x-0 top-0 block text-[#8e8e93]", t.body)} />}
            </span>
          )}
          <RowProperties item={item} show={properties} small={b} />
          </span>
          </span>
        </button>
        {/* B: the one button for the row, at its right, light gray, in a slot that's the same width on every row. It's split: the label does the main thing (a plain Approve when the fix is planned, otherwise it hands the item off to the assistant; the accessible name says what it will do), and the chevron after the divider opens the other ways. Handing off morphs the button down to a small round one that stays through the work: a stop button (undo) with a ring filling as the assistant goes, then a check when it's done, until the row moves on. */}
        {b && (
          <div className="ml-3 flex h-8 w-24 shrink-0 items-center justify-end">
            <motion.div
              ref={pill}
              initial={false}
              animate={{ width: agent ? 32 : 96, backgroundColor: agent?.done ? accent : "rgba(0,0,0,0.05)" }}
              transition={SNAP}
              style={{ opacity: menuAnchor ? 0 : 1 }}
              className="relative h-8 shrink-0 overflow-hidden rounded-full text-[13px] font-[590] text-black"
            >
              {/* At rest: label | chevron. Fades out as the button shrinks. */}
              <motion.div
                initial={false}
                animate={{ opacity: agent ? 0 : 1 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-y-0 right-0 flex w-24"
                style={{ pointerEvents: agent ? "none" : "auto" }}
                inert={!!agent}
              >
                <button
                  onClick={hasPlan(item) ? onApprove : onRun}
                  aria-label={hasPlan(item) ? undefined : `Hand off: ${main}`}
                  className="flex flex-1 items-center justify-center whitespace-nowrap pl-1 active:bg-black/5"
                >
                  {hasPlan(item) ? "Approve" : "Hand off"}
                </button>
                <span aria-hidden className="my-2 w-px bg-black/10" />
                <button onClick={() => setMenuAnchor(pill.current)} aria-label="More ways to handle this" aria-haspopup="menu" className="flex w-7 items-center justify-center active:bg-black/5">
                  <IconChevronDown size={14} stroke={2.5} />
                </button>
              </motion.div>
              {/* Working: a stop button whose outline is the progress (the ring fills as the assistant goes), while the row's second line narrates the step. Done: a check, and the line says what was done. */}
              <motion.div initial={false} animate={{ opacity: agent ? 1 : 0 }} transition={{ duration: 0.15, delay: agent ? 0.1 : 0 }} className="absolute inset-y-0 right-0 flex w-8 items-center justify-center" style={{ pointerEvents: agent && !agent.done ? "auto" : "none" }}>
                {agent && (
                  <button onClick={onStop} disabled={agent.done} aria-label={agent.done ? "Done" : "Stop"} className="relative flex size-8 items-center justify-center rounded-full">
                    {!agent.done && (
                      <svg width="32" height="32" viewBox="0 0 32 32" className="absolute inset-0 -rotate-90" aria-hidden>
                        <circle cx="16" cy="16" r="15" fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="2" />
                        <motion.circle
                          cx="16"
                          cy="16"
                          r="15"
                          fill="none"
                          stroke={accent}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 15}
                          initial={false}
                          animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - (agent.step + 0.5) / agent.steps.length) }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>
                    )}
                    {agent.done ? (
                      <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 420, damping: 16 }} className="flex text-white">
                        <IconCheck size={16} stroke={3} />
                      </motion.span>
                    ) : (
                      <IconPlayerStopFilled size={11} style={{ color: accent }} />
                    )}
                  </button>
                )}
              </motion.div>
            </motion.div>
          </div>
          )}
        </div>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={SNAP}
          className="overflow-hidden"
          aria-hidden={!open}
          inert={!open}
        >
          {/* B: the expanded context lines up with the text, under it and not under the avatar (40px + its 12px gap, closing up with the avatar when the photos are off). */}
          <motion.div initial={false} animate={{ paddingLeft: b && photos ? 52 : 0 }} transition={SNAP} className="pb-4 tracking-[-0.43px]">
            <RowContext item={item} t={t} small={b} />
            {!b && (
              <div className="mt-3">
                <RowButtons item={item} names={names} accent={accent} main={main} onRun={onRun} onApprove={onApprove} />
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
      <RowMenu
        anchor={rowMenu}
        onClose={() => setRowMenu(null)}
        // The row, as it was, at the top of the card; then all its context; then the main buttons along the bottom.
        preview={
          <span className="flex items-start pb-3">
            <AvatarSlot show={photos} people={item.people ?? [item.title]} />
            <span className="min-w-0 flex-1 tracking-[-0.43px]">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-[590] text-[17px] leading-[22px] text-black">{item.title}</span>
                <span className="shrink-0 text-[13px] leading-[18px] text-[#7f7f7f]">{item.when}</span>
              </span>
              <span className="mt-px block text-[15px] leading-5 text-[#8e8e93]">{item.detail}</span>
            </span>
          </span>
        }
        content={
          <div className="pb-4 tracking-[-0.43px]">
            <RowContext item={item} t={TEXT.a} />
          </div>
        }
        footer={(close) => (
          <RowButtons
            stacked
            item={item}
            names={names}
            accent={accent}
            main={main}
            onRun={() => {
              onRun()
              close()
            }}
            onApprove={() => {
              onApprove()
              close()
            }}
          />
        )}
      />
      <MorphMenu
        anchor={menuAnchor}
        // The same options the buttons under the expanded row used to be: message them, solve it by hand, or the main action.
        items={[
          { id: "message", label: `Message ${names}`, icon: <IconMessageCircle size={20} stroke={1.75} /> },
          ...(hasPlan(item) ? [] : [{ id: "manual", label: "Solve manually", icon: <IconPencil size={20} stroke={1.75} /> }]),
          { id: "main", label: hasPlan(item) ? "Approve" : main, icon: hasPlan(item) ? undefined : <IconSparkles size={18} stroke={2} /> },
        ]}
        onSelect={(id) => id === "main" && (hasPlan(item) ? onApprove() : onRun())}
        onClose={() => setMenuAnchor(null)}
      />
    </motion.li>
  )
}
