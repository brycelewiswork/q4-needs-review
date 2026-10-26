import { createContext, useContext, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { useDashboardStore } from "@/store/useDashboardStore"
import { cn } from "@/lib/utils"

/** The owner and manager Home dashboard's widgets: what can be removed, and added back from the plus. */
export const DASH_WIDGETS = [
  { id: "sales", label: "Total Sales", blurb: "Today's sales at a glance, with a note on how the team is doing." },
  { id: "locations", label: "Locations", blurb: "Sales and labor for each of your locations, with a tap into any one of them." },
  { id: "status", label: "Status", blurb: "Who is on the clock right now, hour by hour, against the plan." },
  { id: "week", label: "My Week", blurb: "The hours you work this week, day by day." },
  { id: "review", label: "Needs Review", blurb: "Timesheets and requests that are waiting on your decision." },
  { id: "tasks", label: "Task Manager", blurb: "What is due next on your task list, tagged by location." },
  { id: "log", label: "Manager Log", blurb: "The latest notes in the manager log from across your team." },
  { id: "events", label: "Events", blurb: "Upcoming events at your locations, soonest first." },
] as const

type WidgetId = (typeof DASH_WIDGETS)[number]["id"]

/**
 * `active`: this is the person's own Home dashboard, where removed widgets stay out (a location's own view, which draws the same
 * widgets, always shows them all). `editing`: Customize Dashboard is on, so widgets jiggle and carry a remove button.
 */
export const DashboardEditContext = createContext({ active: false, editing: false })

// The jiggle is a CSS animation, added once: it keeps running through re-renders, and runs on the compositor so it stays smooth.
if (typeof document !== "undefined" && !document.getElementById("dash-jiggle")) {
  const style = document.createElement("style")
  style.id = "dash-jiggle"
  style.textContent = `@keyframes dash-jiggle { 0%, 100% { transform: rotate(-1.1deg) translate(0.4px, -0.4px) } 50% { transform: rotate(1.1deg) translate(-0.4px, 0.4px) } }`
  document.head.appendChild(style)
}

const hash = (s: string) => [...s].reduce((n, c) => n + c.charCodeAt(0), 0)

/** One widget of the dashboard: gone when removed, and while editing it jiggles with a minus at its top left. */
export function DashboardWidget({ id, skip, children, className }: { id: (typeof DASH_WIDGETS)[number]["id"]; /** The widget has nothing to show here (Locations with one location): no remove button either. */ skip?: boolean; children: ReactNode; className?: string }) {
  const { active, editing } = useContext(DashboardEditContext)
  const hidden = useDashboardStore((s) => s.hidden.includes(id))
  const hide = useDashboardStore((s) => s.hide)
  const label = DASH_WIDGETS.find((w) => w.id === id)!.label
  if (skip) return null
  // Each widget wobbles on its own beat, so the screen doesn't move as one.
  const beat = 0.3 + (hash(id) % 5) * 0.025
  const offset = -(hash(id) % 7) * 0.04
  return (
    <AnimatePresence initial={false}>
      {!(active && hidden) && (
        <motion.div key={id} initial={false} exit={{ opacity: 0, scale: 0.92, height: 0 }} transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }} className={cn("relative", className)}>
          <div style={editing ? { animation: `dash-jiggle ${beat}s ease-in-out ${offset}s infinite` } : undefined}>
            {/* Taps go to the remove button, not through to the widget. */}
            <div className={editing ? "pointer-events-none select-none" : undefined} inert={editing}>
              {children}
            </div>
          </div>
          {editing && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              onClick={() => hide(id)}
              aria-label={`Remove ${label}`}
              className="absolute -left-2 -top-2 z-10 flex size-[26px] items-center justify-center rounded-full bg-[#5a5a5f] text-white shadow-[0_2px_6px_rgba(0,0,0,0.25)] active:opacity-80"
            >
              <IconMinus size={16} stroke={3} />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A small drawing of a widget, enough to tell which one it is: its title over skeleton shapes. */
export function WidgetPreview({ id, android, className }: { id: WidgetId; android?: boolean; className?: string }) {
  const label = DASH_WIDGETS.find((w) => w.id === id)!.label
  const sk = android ? "bg-m-skeleton" : "bg-[#dedde4]"
  const bar = (w: string, h = 8) => <span aria-hidden className={cn("block rounded-full", sk)} style={{ width: w, height: h }} />
  const dot = (n = 14) => <span aria-hidden className={cn("block shrink-0 rounded-full", sk)} style={{ width: n, height: n }} />
  const rows = (n: number, lead = true) => (
    <div className="flex flex-col gap-3">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          {lead && dot(22)}
          <div className="flex flex-1 flex-col gap-[6px]">
            {bar(`${70 - i * 8}%`, 8)}
            {bar("40%", 6)}
          </div>
          {bar("14%", 8)}
        </div>
      ))}
    </div>
  )
  const body =
    id === "sales" ? (
      <div className="flex flex-col gap-3 pt-1">
        {bar("46%", 26)}
        {bar("90%")}
        {bar("62%")}
      </div>
    ) : id === "status" ? (
      <div className="flex flex-col gap-3 pt-1">
        <div className="flex gap-3">{[0, 1, 2, 3, 4].map((i) => <span key={i} aria-hidden className={cn("block h-5 flex-1 rounded-full", sk)} />)}</div>
        <div className="flex gap-3">{[0, 1, 2, 3, 4].map((i) => <span key={i} aria-hidden className={cn("block h-3 flex-1 rounded-full", sk)} />)}</div>
        {bar("55%")}
      </div>
    ) : id === "week" ? (
      <div className="flex h-[88px] items-end justify-between gap-2 pt-1">
        {[52, 30, 72, 44, 60, 24, 38].map((h, i) => <span key={i} aria-hidden className={cn("block flex-1 rounded-[4px]", sk)} style={{ height: h }} />)}
      </div>
    ) : id === "locations" ? (
      rows(3)
    ) : id === "events" ? (
      rows(3, false)
    ) : (
      rows(id === "log" ? 2 : 3)
    )
  return (
    <div className={cn("rounded-[22px] p-4 text-left tracking-[-0.43px]", android ? "bg-m-container" : "bg-white shadow-[0_2px_14px_rgba(0,0,0,0.06)]", className)}>
      <p className={cn("pb-3 text-[17px] font-[590] leading-[22px]", android ? "text-m-on-surface" : "text-black")}>{label}</p>
      {body}
    </div>
  )
}

/**
 * The Add Widgets screen, shared by both platforms: a big heading, a preview of the chosen widget with a line on what it shows,
 * and the widgets that were removed in a list below it. Tapping a row previews it; its plus puts it back on the dashboard.
 */
export function AddWidgetsBody({ multi, android }: { multi: boolean; android?: boolean }) {
  const hidden = useDashboardStore((s) => s.hidden)
  const show = useDashboardStore((s) => s.show)
  const rows = DASH_WIDGETS.filter((w) => hidden.includes(w.id) && (multi || w.id !== "locations"))
  const [picked, setPicked] = useState<WidgetId | null>(null)
  const current = rows.find((w) => w.id === picked) ?? rows[0]
  const [next] = rows.filter((w) => w.id !== current?.id)
  const ink = android ? "text-m-on-surface" : "text-black"
  const quiet = android ? "text-m-variant" : "text-[#7f7f7f]"
  return (
    <div className={cn("flex flex-col items-center px-6 pb-12 tracking-[-0.43px]", android ? "pt-2" : "pt-[84px]")}>
      <h1 className={cn("text-center text-[32px] font-bold leading-[38px] text-balance", ink)}>Add a Widget to Your Home</h1>
      {current ? (
        <>
          <div className="relative mt-8 flex w-full justify-center">
            {/* The next widget peeks out behind, as a hint that there is more below. */}
            {next && (
              <div aria-hidden className="absolute bottom-0 right-[2%] top-6 w-[58%] overflow-hidden rounded-[22px] opacity-60">
                <WidgetPreview id={next.id} android={android} />
              </div>
            )}
            <WidgetPreview key={current.id} id={current.id} android={android} className="relative w-[72%] max-w-[300px]" />
          </div>
          <p className={cn("mt-6 max-w-[320px] text-center text-[17px] leading-[24px]", quiet)}>{current.blurb}</p>
          <div className={cn("mt-6 h-px w-full", android ? "bg-m-divider" : "bg-black/[0.08]")} />
          <div className={cn("mt-6 w-full overflow-hidden rounded-[22px]", android ? "bg-m-container" : "bg-white")}>
            {rows.map((w, i) => (
              <div key={w.id} className={cn("flex items-center gap-3 pl-4 pr-3", i > 0 && (android ? "border-t border-m-divider" : "border-t border-[#ebebeb]"))}>
                <button onClick={() => setPicked(w.id)} aria-pressed={w.id === current.id} className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center py-2 text-left">
                  <span className={cn("truncate text-[17px] leading-[22px]", w.id === current.id ? "font-[590]" : "", ink)}>{w.label}</span>
                </button>
                <button onClick={() => { setPicked(null); show(w.id) }} aria-label={`Add ${w.label}`} className={cn("flex size-9 shrink-0 items-center justify-center rounded-full active:opacity-80", android ? "bg-m-primary text-m-on-primary" : "bg-[#8f55e5] text-white")}>
                  <IconPlus size={20} stroke={2.5} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className={cn("pt-10 text-center text-[17px] leading-[22px]", quiet)}>Everything is already on your dashboard.</p>
      )}
    </div>
  )
}
