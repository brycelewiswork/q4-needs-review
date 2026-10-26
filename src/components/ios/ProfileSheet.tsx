import { Bar, BarLines } from "@/components/wire/Wire"
import { ANON, useStructure } from "@/store/useViewStore"
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, animate, motion, useMotionValue } from "motion/react"
import { IconCheck, IconCreditCard, IconPencil } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { IconStarFilled } from "@tabler/icons-react"
import { Card, Chevron } from "@/components/ios/list"
import { ACHIEVEMENTS, ACHIEVEMENTS_MORE, AchievementBadge } from "@/components/AchievementBadge"
import { PAGES, type PageId } from "@/components/ios/ProfilePages"
import { SearchBar } from "@/components/ios/SearchBar"
import { Sheet } from "@/components/ios/Sheet"
import { EASE, SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import type { Location } from "@/data/locations"

const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }
const GAP = 12
const PLUS_JAKARTA = '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif'


// ---------------------------------------------------------------------------
// Carousel pages
// ---------------------------------------------------------------------------

/** Shoutouts: the card is the quote. A label, the words large and dark, who said it in the brand purple, and giant faint quotation marks framing it. */
function ShoutoutCard({ loc, onOpen }: { loc: Location; onOpen: () => void }) {
  const s = loc.profile.shoutout
  const wire = useStructure()
  // The marks are big and mostly transparent: texture, not text.
  const mark = "pointer-events-none absolute select-none font-[Georgia,'Times_New_Roman',serif] text-[120px] font-bold leading-none text-[#8f55e5]/[0.16]"
  return (
    <button onClick={onOpen} aria-label="Open shoutouts" className="block w-full text-left active:opacity-80">
    <Card className="relative flex h-[228px] flex-col overflow-hidden p-5 tracking-[-0.43px]">
      <span aria-hidden className={`${mark} -left-1 top-[18px]`}>“</span>
      <span aria-hidden className={`${mark} -bottom-[52px] right-1`}>”</span>
      <p className="relative text-[13px] font-[590] leading-[18px] text-[#747182]">Shoutouts</p>
      <div className="relative flex min-h-0 flex-1 flex-col justify-center gap-3 px-2">
        {wire ? (
          <>
            <BarLines lines={3} className="py-0" />
            <Bar w={80} h={10} className="self-end" />
          </>
        ) : (
          <>
            <p className="line-clamp-6 text-[17px] font-[510] leading-[22px] text-[#2c2935]">{s.quote.replace(/^[“"]\s*|\s*[”"]$/g, "")}</p>
            <p className="text-right text-[15px] font-[590] leading-5 text-[#7440d1]">{s.author}</p>
          </>
        )}
      </div>
    </Card>
    </button>
  )
}

function AchievementsCard({ onOpen }: { onOpen: () => void }) {
  const wire = useStructure()
  return (
    <button onClick={onOpen} aria-label="Open achievements" className="block w-full text-left active:opacity-80">
      <Card className="flex h-[228px] flex-col overflow-hidden p-4 tracking-[-0.43px]">
        <p className="text-[14px] leading-5 text-[#2c2935]">Achievements</p>
        <div className="flex flex-1 items-center justify-between">
          {ACHIEVEMENTS.map((a) => (
            <AchievementBadge key={a.name} value={a.count} tone={a.tone} empty={wire} size={56} />
          ))}
          <AchievementBadge value={`${ACHIEVEMENTS_MORE}+`} tone="grey" empty={wire} size={56} />
        </div>
        <div className="flex h-11 items-center justify-between border-t border-black/10 pt-1 text-[#8f55e5]">
          {wire ? <Bar w={120} h={12} /> : <span className="text-[17px] font-[590] leading-[22px]">See all achievements</span>}
          <Chevron />
        </div>
      </Card>
    </button>
  )
}

function StatsCard({ loc, onOpen }: { loc: Location; onOpen: () => void }) {
  const s = loc.profile.stats
  const wire = useStructure()
  const Stat = ({ value, label }: { value: ReactNode; label: string }) => (
    <div>
      {wire ? <Bar w={44} h={14} className="mb-[3px] mt-[3px]" /> : <div className="text-[18px] font-[590] leading-5 text-[#2c2935]">{value}</div>}
      <p className="text-[14px] leading-5 text-[#747182]">{label}</p>
    </div>
  )
  return (
    <button onClick={onOpen} aria-label="Open stats" className="block w-full text-left active:opacity-80">
    <Card className="flex h-[228px] flex-col gap-1 overflow-hidden p-4 tracking-[-0.43px]">
      <p className="text-[14px] leading-5 text-[#2c2935]">Stats</p>
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col justify-between">
          <Stat value={s.onTime} label="On-time rate" />
          <Stat value={s.shifts} label="Shifts worked" />
          <Stat value={s.hours} label="Hours/week" />
        </div>
        <div className="flex flex-1 flex-col justify-between">
          <Stat
            value={
              <span className="flex items-center gap-[2px]">
                <span className="flex items-baseline gap-[2px]">
                  {s.rating}
                  <span className="text-[15px] text-[#928fa0]">/5</span>
                </span>
                <IconStarFilled size={12} />
              </span>
            }
            label="Avg shift rating"
          />
          <Stat value={s.missedClockOuts} label="Missed clock-outs" />
          <Stat value={s.noShows} label="No-shows" />
        </div>
      </div>
    </Card>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Carousel: drag or flick either way, tap a dot, or use ←/→ when focused.
// ---------------------------------------------------------------------------

function Carousel({ pages }: { pages: { key: string; label: string; node: ReactNode }[] }) {
  const [page, setPage] = useState(0)
  const dragged = useRef(false) // a swipe must not also count as a tap on the card under the finger
  const x = useMotionValue(0)
  const frame = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const last = pages.length - 1

  useLayoutEffect(() => {
    setWidth(frame.current?.offsetWidth ?? 0)
  }, [])

  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(last, to))
      setPage(next)
      animate(x, -next * (width + GAP), SPRING)
    },
    [last, x, width],
  )

  return (
    <div>
      <div
        ref={frame}
        role="group"
        aria-roledescription="carousel"
        aria-label={pages[page].label}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(page + 1)
          if (e.key === "ArrowLeft") go(page - 1)
        }}
        // Clip sideways so neighbours don't peek in; leave the bottom open for the cards' shadows.
        className="[overflow-x:clip] pb-8 -mb-8 outline-none"
      >
        <motion.div
          drag="x"
          dragDirectionLock
          dragElastic={0.14}
          dragMomentum={false}
          dragConstraints={{ left: -last * (width + GAP), right: 0 }}
          style={{ x, gap: GAP }}
          onDragStart={() => {
            dragged.current = true
          }}
          onDragEnd={(_, info) => {
            window.setTimeout(() => {
              dragged.current = false
            }, 0)
            const swipe = info.offset.x + info.velocity.x * 0.2
            const threshold = width / 4
            go(swipe < -threshold ? page + 1 : swipe > threshold ? page - 1 : page)
          }}
          className="flex cursor-grab active:cursor-grabbing"
        >
          {pages.map((p, i) => (
            <div
              key={p.key}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${pages.length}`}
              onClickCapture={(e) => {
                if (dragged.current) {
                  e.stopPropagation()
                  e.preventDefault()
                }
              }}
              className="w-full shrink-0"
            >
              {p.node}
            </div>
          ))}
        </motion.div>
      </div>

      <div className="flex h-11 items-center justify-center">
        <div className="flex gap-2 rounded-full px-3 py-2">
          {pages.map((p, i) => (
            <button
              key={p.key}
              aria-label={`Page ${i + 1}: ${p.label}`}
              aria-current={i === page}
              onClick={() => go(i)}
              className="-m-[6px] p-[6px]"
            >
              <span
                className="block size-2 rounded-full transition-colors duration-200"
                style={{ backgroundColor: i === page ? "#1a1a1a" : "#ccccd0" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Settings rows
// ---------------------------------------------------------------------------

type Row = { /** An exported SVG path, or an icon element. */ icon: string | ReactNode; label: string; trailing?: string; page: PageId }

function RowGroup({ rows, onOpen }: { rows: Row[]; onOpen: (p: PageId) => void }) {
  return (
    <Card className="overflow-hidden">
      {rows.map((r, i) => (
        <button key={r.label} onClick={() => onOpen(r.page)} className="flex h-[52px] w-full items-center pr-4 text-left active:bg-black/[0.04]">
          <span className="flex size-[52px] shrink-0 items-center justify-center pr-2">
            {typeof r.icon === "string" ? <img src={r.icon} alt="" className="size-5" /> : r.icon}
          </span>
          <span className={cn("flex h-full min-w-0 flex-1 items-center gap-4 tracking-[-0.43px]", i > 0 && "border-t border-[#ebebeb]")}>
            <span className="flex-1 truncate text-[17px] leading-[22px] text-[#2c2935]">{r.label}</span>
            {r.trailing && <span className="text-[17px] leading-[22px] text-[#5a5666]">{r.trailing}</span>}
            <Chevron />
          </span>
        </button>
      ))}
    </Card>
  )
}

const ACCOUNT_ROWS: Row[] = [
  { icon: "/phone/row-location.svg", label: "Locations", page: "locations" },
  { icon: "/phone/row-calendar.svg", label: "Calendar Sync", trailing: "Not Connected", page: "calendar" },
  { icon: "/phone/row-lock.svg", label: "Password & Security", page: "security" },
  { icon: "/phone/row-help.svg", label: "Support", page: "support" },
]

const BILLING_ROWS: Row[] = [
  { icon: <IconCreditCard size={20} stroke={1.75} color="#8F55E5" />, label: "Billing", trailing: "Plus · Monthly", page: "billing" },
  { icon: "/phone/row-bell.svg", label: "Notifications & Alerts", page: "notifications" },
]

const ACTIONS = [
  { icon: "/phone/act-safety.svg", label: "Health Insurance" },
  { icon: "/phone/act-gift.svg", label: "Refer for $100" },
  { icon: "/phone/act-money.svg", label: "Cash out" },
]

// ---------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------

function Root({ loc, onOpen }: { loc: Location; onOpen: (p: PageId) => void }) {
  const wire = useStructure()

  const pages = [
    { key: "stats", label: "Stats", node: <StatsCard loc={loc} onOpen={() => onOpen("stats")} /> },
    { key: "achievements", label: "Achievements", node: <AchievementsCard onOpen={() => onOpen("achievements")} /> },
    { key: "shoutouts", label: "Shoutouts", node: <ShoutoutCard loc={loc} onOpen={() => onOpen("shoutouts")} /> },
  ]

  return (
      <div className="flex flex-col gap-4">
        <Card className="py-1">
          <button onClick={() => onOpen("account")} className="flex h-[68px] w-full items-center px-4 text-left active:bg-black/[0.04]">
            <div className="flex size-[68px] shrink-0 items-center justify-center pr-2">
              <div
                className="flex size-[60px] items-center justify-center rounded-full bg-gradient-to-b from-[#beacff] to-[#937ee2] text-[30px] font-bold tracking-[-0.54px] text-white"
                style={{ fontFamily: PLUS_JAKARTA }}
              >
                {wire ? "FL" : "BL"}
              </div>
            </div>
            <div className="min-w-0 flex-1 pl-2 tracking-[-0.43px]">
              <p className="text-[17px] leading-[22px] text-[#2c2935]">{wire ? ANON.name : "Bryce Lewis"}</p>
              <p className="truncate text-[15px] leading-5 text-[#5a5666]">{wire ? ANON.email : "blewis@joinhomebase.com"}</p>
            </div>
            <Chevron />
          </button>
        </Card>

        <Carousel key={loc.id} pages={pages} />

        <RowGroup rows={BILLING_ROWS} onOpen={onOpen} />

        <RowGroup rows={ACCOUNT_ROWS} onOpen={onOpen} />

        <div className="flex gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-[3px] rounded-full bg-white px-[17px] py-2 active:bg-black/[0.04]"
            >
              <img src={a.icon} alt="" className="size-5" />
              <span className="whitespace-nowrap text-[11px] font-[510] tracking-[-0.43px] text-[#8f55e5]">{wire && a.label.startsWith("Refer") ? "Refer a friend" : a.label}</span>
            </button>
          ))}
        </div>

        {/* Footer: the logo, small, then the version and legal links as quiet subtext. */}
        <div className="flex flex-col items-center gap-3 pb-4 pt-6">
          <img src="/phone/logo-h.png" alt="Homebase" className="h-7 w-auto" />
          <p className="flex items-center gap-2 text-[13px] leading-[18px] tracking-[-0.08px] text-[#928fa0]">
            <span>Version 5.22 (5271)</span>
            <span aria-hidden>•</span>
            <button className="active:opacity-60">Terms &amp; privacy</button>
          </p>
        </div>

      </div>
  )
}

type Dir = "push" | "pop"

// Push: the new page slides in from the right while the old page slides fully off
// to the left. Pop is the exact reverse. Either way a page always travels a full
// screen width, so nothing stops short and then pops out of existence.
const PAGE_VARIANTS = {
  enter: (d: Dir) => ({ x: d === "push" ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (d: Dir) => ({ x: d === "push" ? "-100%" : "100%" }),
}

/**
 * The Settings sheet with iOS push navigation: rows push a page in from the
 * right, the back button pops it.
 */
export function ProfileSheet({ loc, inline, onClose }: { loc: Location; /** Fill the content pane (iPad) instead of rising as a sheet. */ inline?: boolean; onClose: () => void }) {
  const [nav, setNav] = useState<{ page: PageId | null; dir: Dir; arg?: string }>({ page: null, dir: "push" })
  const { page, dir, arg } = nav
  const [editing, setEditing] = useState(false)
  // The Team page's search, whose field is pinned to the bottom of the sheet (Figma "iOS Toolbar", bottom, search).
  const [teamQuery, setTeamQuery] = useState("")
  const go = (next: { page: PageId | null; dir: Dir; arg?: string }) => {
    setEditing(false)
    setTeamQuery("")
    setNav(next)
  }
  const Page = page ? PAGES[page].Component : null

  return (
    <Sheet
      inline={inline}
      title={page ? PAGES[page].title : "Settings"}
      onClose={onClose}
      onBack={page ? () => go({ page: page === "personal" || page === "experience" || page === "education" || page === "certifications" || page === "tax" || page === "bank" ? "account" : null, dir: "pop" }) : undefined}
      action={
        page && PAGES[page].action === "edit" ? (
          <LiquidGlass mode="small" accent="#8f55e5" radius={999} className="absolute right-4 top-4 flex size-11 items-center justify-center">
            <button
              onClick={() => setEditing((e) => !e)}
              aria-label={editing ? "Done editing" : "Edit"}
              className="flex size-9 items-center justify-center rounded-full text-white"
            >
              {editing ? <IconCheck size={24} stroke={2.25} /> : <IconPencil size={22} stroke={2} />}
            </button>
          </LiquidGlass>
        ) : undefined
      }
      resetKey={page ?? "root"}
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: page === "team" ? { strength: 16, steps: 5, height: 130 } : false }}
      footer={page === "team" ? <SearchBar value={teamQuery} onChange={setTeamQuery} placeholder="Search your team…" /> : undefined}
    >
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={page ? `${page}:${arg ?? ""}` : "root"}
          custom={dir}
          variants={PAGE_VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: EASE.apple }}
          // Full sheet width INCLUDING the 16px side padding, so -100% / 100% is genuinely
          // off-screen. Opaque, so the page underneath never shows through mid-slide.
          className="relative min-h-full bg-[#f3f2f6] px-4"
        >
          {Page ? (
            <Page loc={loc} editing={editing} arg={arg} query={teamQuery} onOpen={(p, a) => go({ page: p, dir: "push", arg: a })} />
          ) : (
            <Root loc={loc} onOpen={(p) => go({ page: p, dir: "push" })} />
          )}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  )
}
