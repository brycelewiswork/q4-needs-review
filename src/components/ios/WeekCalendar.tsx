import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Squircle } from "@/components/squircle"
import { USER_SCHEDULE } from "@/data/locations"
import { BASE_MONDAY, DEMO_TODAY, MONTHS, WEEKDAYS_SHORT, addDays, mondayOf, sameDay, weekdayIndex, weeksFromBase } from "@/lib/dates"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { useDateStore } from "@/store/useDateStore"
import { useViewStore } from "@/store/useViewStore"

/** Weeks you can scroll through, either side of the demo week. */
const SPAN = 26

// Vertical rhythm (px). The weekday headings sit at the top and never move; the dates hang below them.
const LETTERS_TOP = 10 // space above the headings
const LETTER_H = 16
const NUMBER_TOP = LETTERS_TOP + LETTER_H + 4 // where every number starts, collapsed or expanded
const PILL_UP = NUMBER_TOP // the collapsed pill reaches up over the heading, to the top of the widget

/**
 * The calendar widget: a row of seven days you can swipe sideways a week at a time, the chosen day lifted
 * into a squircle with its weekday heading, and the date written underneath, centered. Tap the widget and
 * it BECOMES the month, in place: it grows downward over the content below (which doesn't move), gaining
 * a glass background, while the week's dates turn into the month's rows under the same weekday headings.
 * It reads and writes the shared date, so Shifts and Time always agree. Swiping to another week keeps
 * the same weekday selected.
 */
function WeekStrip({ label, workingDots }: { label: string; /** Shifts: a dot under each day the person is scheduled to work. */ workingDots?: boolean }) {
  const date = useDateStore((s) => s.date)
  const setDate = useDateStore((s) => s.setDate)
  const scroller = useRef<HTMLDivElement>(null)
  const settle = useRef<number | undefined>(undefined)
  const first = useRef(true)
  const jump = useRef(false) // set when the month picks a date: the strip is hidden, so it should snap, not glide
  const week = weeksFromBase(date)
  const day = weekdayIndex(date)
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1))
  const [dir, setDir] = useState(1) // which way the month carousel last moved: +1 forward, -1 back
  const widget = useRef<HTMLDivElement>(null)

  // Keep the strip on the week that holds the date (also when it was changed somewhere else).
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const left = (week + SPAN) * el.clientWidth
    if (Math.abs(el.scrollLeft - left) > 1) el.scrollTo({ left, behavior: first.current || jump.current ? "auto" : "smooth" })
    jump.current = false
    first.current = false
  }, [week])

  // A finger scrolls the strip natively. A mouse can't, so drag it by hand and snap to a week on release.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    let down = false
    let moved = false
    let startX = 0
    let startLeft = 0
    let samples: { t: number; x: number }[] = []
    const scale = () => el.getBoundingClientRect().width / el.offsetWidth || 1

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      down = true
      moved = false
      startX = e.clientX
      startLeft = el.scrollLeft
      samples = [{ t: performance.now(), x: e.clientX }]
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - startX
      if (!moved && Math.abs(dx) < 5) return
      if (!moved) {
        moved = true
        el.style.scrollSnapType = "none" // snapping would fight the drag
        el.style.cursor = "grabbing"
      }
      el.scrollLeft = startLeft - dx / scale()
      samples.push({ t: performance.now(), x: e.clientX })
      if (samples.length > 6) samples.shift()
    }
    const onUp = () => {
      if (!down) return
      down = false
      if (!moved) return
      const a = samples[0]
      const b = samples[samples.length - 1]
      const v = b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 / scale() : 0 // px/s, + = dragged right
      const w = el.clientWidth
      const idx = Math.max(0, Math.min(SPAN * 2, Math.round((el.scrollLeft - v * 0.2) / w)))
      el.scrollTo({ left: idx * w, behavior: "smooth" })
      window.setTimeout(() => {
        el.style.scrollSnapType = ""
        el.style.cursor = ""
      }, 450)
    }
    // A drag that moved shouldn't also tap the day it ended on.
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation()
        e.preventDefault()
        moved = false
      }
    }
    el.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    el.addEventListener("click", onClick, true)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      el.removeEventListener("click", onClick, true)
    }
  }, [])

  const onScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = scroller.current
      if (!el) return
      const idx = Math.round(el.scrollLeft / el.clientWidth) - SPAN
      if (idx !== week) setDate(addDays(addDays(BASE_MONDAY, idx * 7), day))
    }, 120)
  }

  // Layout: the widget's footprint in the page never changes; only the panel behind it grows over what's below.
  const dotH = workingDots ? 11 : 0
  const stripH = NUMBER_TOP + 22 + dotH + 10
  const labelH = 8 + 22 // gap + the label line
  const rowH = 4 + 22 + dotH + 4 + 4 // pill (4 + number + dot + 4) plus a 4px gap
  const rows = 6 // always six: the widget is the same size every month, and short months show the next month's first days in grey
  const gridTop = NUMBER_TOP - 4
  const gridH = rows * rowH
  const openH = gridTop + gridH + labelH + 12
  const fullH = openH // the glass is always this size and just revealed
  const [panelOn, setPanelOn] = useState(false)
  const closedH = stripH + labelH
  const first0 = mondayOf(month)

  const go = (delta: number) => {
    setDir(delta)
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }
  const show = () => {
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1))
    setPanelOn(true)
    setOpen(true)
  }
  const toggle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-day], [data-month-nav]")) return
    if (open) setOpen(false)
    else show()
  }
  const pick = (d: Date) => {
    if (open) jump.current = true
    setDate(d)
    if (open) setOpen(false)
  }

  // Tap outside, or Escape, puts it back.
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => {
      if (!widget.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.stopImmediatePropagation()
      setOpen(false)
    }
    document.addEventListener("pointerdown", off)
    window.addEventListener("keydown", key, true)
    return () => {
      document.removeEventListener("pointerdown", off)
      window.removeEventListener("keydown", key, true)
    }
  }, [open])

  const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }

  return (
    // The wrapper keeps the collapsed footprint (the page below never moves); it sits above its siblings so the grown panel covers them.
    <div className="relative z-30 pb-3" style={{ height: closedH + 12 }} onClick={toggle} ref={widget}>
      {/* The new background. Its shadow is a plain box that grows (cheap)... */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{
          height: open ? openH : closedH,
          borderRadius: open ? 30 : 0,
          boxShadow: open ? "0 10px 40px rgba(0,0,0,0.14)" : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={SPRING}
        className="pointer-events-none absolute -inset-x-2 top-0 z-0"
      />
      {/* ...and the glass itself is always full size and only REVEALED with clip-path, so nothing re-lays-out or re-blurs per frame. */}
      <motion.div
        aria-hidden
        initial={false}
        // Closing retracts the glass all the way up (to nothing), not just back to the strip's height: stopping at the strip left a
        // frosted band that then vanished in a single frame when the panel was hidden.
        animate={{ clipPath: `inset(0px 0px ${fullH - (open ? openH : 0)}px 0px round ${open ? 30 : 0}px)` }}
        transition={SPRING}
        onAnimationComplete={() => {
          if (!open) setPanelOn(false)
        }}
        style={{
          height: fullH,
          visibility: panelOn ? "visible" : "hidden",
          pointerEvents: open ? "auto" : "none", // while open it catches taps meant for what it covers
          backgroundColor: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          willChange: "clip-path",
        }}
        className="absolute -inset-x-2 top-0 z-0"
      />

      <div className="relative z-10" style={{ height: stripH }}>
        {/* Weekday headings: fixed, shared by the strip and the month. */}
        <div className="pointer-events-none absolute inset-x-0 z-10 flex justify-between tracking-[-0.43px]" style={{ top: LETTERS_TOP }}>
          {WEEKDAYS_SHORT.map((n, i) => (
            <span key={n + i} className={cn("w-11 text-center text-[13px] transition-colors duration-200", !open && i === day ? "text-[#5a5666]" : "text-[#7f7f7f]")} style={{ height: LETTER_H, lineHeight: `${LETTER_H}px` }}>
              {n[0]}
            </span>
          ))}
        </div>

        {/* The swipeable week strip. */}
        <motion.div
          ref={scroller}
          onScroll={onScroll}
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.12 }}
          style={{ paddingTop: NUMBER_TOP, pointerEvents: open ? "none" : undefined }}
          className="absolute -inset-x-4 top-0 flex cursor-grab select-none snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {Array.from({ length: SPAN * 2 + 1 }, (_, w) => w - SPAN).map((wk) => (
            <div key={wk} className="flex w-full shrink-0 snap-center justify-between px-4">
              {WEEKDAYS_SHORT.map((n, i) => {
                const d = addDays(BASE_MONDAY, wk * 7 + i)
                const on = sameDay(d, date)
                return (
                  <button key={n} data-day onClick={() => pick(d)} aria-pressed={on} aria-label={`${WEEKDAYS_SHORT[i]} ${d.getDate()}`} className="tracking-[-0.43px]">
                    {/* The selected day sits in a squircle that reaches up over its heading; every cell has the same box so nothing shifts. */}
                    <Squircle
                      as="span"
                      cornerRadius={18}
                      className={cn("flex w-11 flex-col items-center gap-1 pb-[10px] transition-colors duration-200", on ? "bg-[rgba(120,120,128,0.16)]" : "bg-transparent")}
                      style={{ marginTop: -PILL_UP, paddingTop: PILL_UP }}
                    >
                      <span className={cn("text-[17px] leading-[22px] transition-colors duration-200", on ? "font-[590] text-black" : "font-[510] text-[#8e8e93]")}>{d.getDate()}</span>
                      {workingDots && <span aria-hidden className={cn("size-[7px] rounded-full", USER_SCHEDULE[i] ? "bg-[#8f55e5]" : "bg-transparent")} />}
                    </Squircle>
                  </button>
                )
              })}
            </div>
          ))}
        </motion.div>

        {/* The month: its rows grow out of the week's row, under the same headings. Moving between months is a carousel. */}
        <motion.div
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.16, delay: open ? 0.06 : 0 }}
          onPanEnd={(_, info) => {
            if (!open || Math.abs(info.offset.x) < 40 || Math.abs(info.offset.y) > Math.abs(info.offset.x)) return
            go(info.offset.x < 0 ? 1 : -1) // drag left → next month
          }}
          style={{ top: gridTop, height: gridH, pointerEvents: open ? undefined : "none", touchAction: "pan-y" }}
          className="absolute -inset-x-2 overflow-hidden px-2"
        >
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={`${month.getFullYear()}-${month.getMonth()}`}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: `${d * 105}%`, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: `${d * -105}%`, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
              className="flex w-full flex-col"
            >
              {Array.from({ length: rows }, (_, r) => (
                <div key={r} className="flex justify-between" style={{ height: rowH }}>
                  {Array.from({ length: 7 }, (_, c) => {
                    const d = addDays(first0, r * 7 + c)
                    const inMonth = d.getMonth() === month.getMonth()
                    const on = sameDay(d, date)
                    return (
                      <button key={c} data-day onClick={() => pick(d)} tabIndex={open ? 0 : -1} aria-pressed={on} aria-label={`${WEEKDAYS_SHORT[c]} ${d.getDate()}`} className="tracking-[-0.43px]">
                        <Squircle as="span" cornerRadius={14} className={cn("flex w-11 flex-col items-center gap-1 py-1 transition-colors duration-200", on ? "bg-[rgba(120,120,128,0.16)]" : "bg-transparent")}>
                          <span className={cn("text-[17px] leading-[22px]", on ? "font-[590] text-black" : "font-[510]", !on && (sameDay(d, DEMO_TODAY) ? "text-[#8f55e5]" : inMonth ? "text-[#8e8e93]" : "text-[#c7c7cc]"))}>{d.getDate()}</span>
                          {workingDots && <span aria-hidden className={cn("size-[7px] rounded-full", USER_SCHEDULE[weekdayIndex(d)] ? "bg-[#8f55e5]" : "bg-transparent")} />}
                        </Squircle>
                      </button>
                    )
                  })}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* The label rides the bottom edge: the date when closed, the month (with arrows) when open. */}
      <motion.div
        initial={false}
        animate={{ top: open ? gridTop + gridH + 8 : stripH + 8 }}
        transition={SPRING}
        className="absolute inset-x-0 z-10 flex items-center justify-center gap-1 tracking-[-0.43px]"
      >
        {open && (
          <button data-month-nav aria-label="Previous month" onClick={() => go(-1)} className="absolute left-1 flex size-8 items-center justify-center rounded-full text-[#8f55e5] active:bg-black/5">
            <IconChevronLeft size={22} stroke={2} />
          </button>
        )}
        <p className="flex items-center gap-1 text-center text-[17px] font-[590] leading-[22px] text-[#747182]">
          {open ? MONTHS[month.getMonth()] : label}
          <IconChevronDown size={16} stroke={2.5} className={cn("transition-transform duration-200", open && "rotate-180")} />
        </p>
        {open && (
          <button data-month-nav aria-label="Next month" onClick={() => go(1)} className="absolute right-1 flex size-8 items-center justify-center rounded-full text-[#8f55e5] active:bg-black/5">
            <IconChevronRight size={22} stroke={2} />
          </button>
        )}
      </motion.div>
    </div>
  )
}

/**
 * The whole month, always showing: what a tablet has the room for instead of a week strip. Same shared date as the
 * strip, so Shifts and Time still agree; the arrows page between months.
 */
function MonthCalendar({ workingDots }: { workingDots?: boolean }) {
  const date = useDateStore((s) => s.date)
  const setDate = useDateStore((s) => s.setDate)
  const [month, setMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1))
  // Follow the date when it's changed somewhere else.
  useEffect(() => {
    setMonth((m) => (m.getFullYear() === date.getFullYear() && m.getMonth() === date.getMonth() ? m : new Date(date.getFullYear(), date.getMonth(), 1)))
  }, [date])
  const first = mondayOf(month)
  const lead = weekdayIndex(month)
  const rows = Math.ceil((lead + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7)
  const go = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  return (
    <div className="pb-3 pt-1 tracking-[-0.43px]">
      <div className="flex items-center justify-between pb-2">
        <button aria-label="Previous month" onClick={() => go(-1)} className="flex size-8 items-center justify-center rounded-full text-[#8f55e5] active:bg-black/5">
          <IconChevronLeft size={22} stroke={2} />
        </button>
        <p className="text-[17px] font-[590] leading-[22px] text-[#747182]">{`${MONTHS[month.getMonth()]} ${month.getFullYear()}`}</p>
        <button aria-label="Next month" onClick={() => go(1)} className="flex size-8 items-center justify-center rounded-full text-[#8f55e5] active:bg-black/5">
          <IconChevronRight size={22} stroke={2} />
        </button>
      </div>
      <div className="flex justify-between pb-1">
        {WEEKDAYS_SHORT.map((n, i) => (
          <span key={n + i} className="w-11 text-center text-[13px] leading-4 text-[#7f7f7f]">{n[0]}</span>
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex justify-between">
          {Array.from({ length: 7 }, (_, c) => {
            const d = addDays(first, r * 7 + c)
            const inMonth = d.getMonth() === month.getMonth()
            const on = sameDay(d, date)
            return (
              <button key={c} onClick={() => setDate(d)} aria-pressed={on} aria-label={`${WEEKDAYS_SHORT[c]} ${d.getDate()}`}>
                <Squircle as="span" cornerRadius={14} className={cn("flex w-11 flex-col items-center gap-1 py-1 transition-colors duration-200", on ? "bg-[rgba(120,120,128,0.16)]" : "bg-transparent")}>
                  <span className={cn("text-[17px] leading-[22px]", on ? "font-[590] text-black" : "font-[510]", !on && (sameDay(d, DEMO_TODAY) ? "text-[#8f55e5]" : inMonth ? "text-[#8e8e93]" : "text-[#c7c7cc]"))}>{d.getDate()}</span>
                  {workingDots && <span aria-hidden className={cn("size-[7px] rounded-full", USER_SCHEDULE[c] ? "bg-[#8f55e5]" : "bg-transparent")} />}
                </Squircle>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** The calendar for Shifts and Time: a week strip that expands to the month on a phone, the month itself on a tablet. */
export function WeekCalendar(props: { label: string; workingDots?: boolean }) {
  const tablet = useViewStore((s) => s.device === "tablet")
  return tablet ? <MonthCalendar workingDots={props.workingDots} /> : <WeekStrip {...props} />
}
