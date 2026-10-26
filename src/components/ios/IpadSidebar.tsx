import { useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { IconBoltFilled, IconChevronDown, IconLayoutSidebar, IconMapPin, IconSelector } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { Initials, SELF_TINT } from "@/components/ios/list"
import { TABS, type TabId } from "@/components/ios/TabBar"
import { SPRING_FAST } from "@/lib/motion"
import { nextShiftAt, shortLocationName, type Location } from "@/data/locations"
import { LocationBadges, useCounts } from "@/components/LocationBadges"
import { useUserTypeStore } from "@/store/useUserTypeStore"
import { ANON, useLocName, useStructure } from "@/store/useViewStore"
import { cn } from "@/lib/utils"

const BRAND = "#8f55e5"

/** Sidebar width, including the 8pt of air around the panel. */
export const SIDEBAR_W = 260
/** The pane beside the sidebar slides with the same spring. */
export const SIDEBAR_SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }

function Mask({ src, color, size }: { src: string; color: string; size: number }) {
  return (
    <span
      aria-hidden
      className="block shrink-0"
      style={{ width: size, height: size, backgroundColor: color, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }}
    />
  )
}

/** The glass button that shows and hides the sidebar: in the sidebar's header while it's open, in the toolbar once it's closed. */
export function SidebarToggle({ open, onClick, className }: { open: boolean; onClick: () => void; className?: string }) {
  return (
    <LiquidGlass mode="small" radius={999} className={cn("flex size-11 shrink-0 items-center justify-center", className)}>
      <button onClick={onClick} aria-label={open ? "Hide sidebar" : "Show sidebar"} aria-expanded={open} className="flex size-9 items-center justify-center rounded-full text-[#141414]">
        <IconLayoutSidebar size={24} stroke={1.75} />
      </button>
    </LiquidGlass>
  )
}

const row = "relative flex h-11 w-full items-center gap-3 rounded-full px-3 text-left text-[17px] leading-[22px] tracking-[-0.43px] text-black active:opacity-60"

const kMoney = (n: number) => `$${Math.round(n / 1000)}K`

/** One location in the sidebar's Locations list: its name over the labor share, and the day's sales. Also what the overview grows out of. */
export function SidebarLocationBody({ l }: { l: Location }) {
  const wire = useStructure()
  const locName = useLocName()
  const employee = useUserTypeStore((s) => s.type) === "employee"
  const counts = useCounts([l])
  // The second line says something about the location, with what is waiting there at its end: unread messages and requests.
  const next = nextShiftAt(l.id)
  const sub = wire ? (
    <span aria-hidden className="block h-2 w-[45%] rounded-full bg-[#dedde4]" />
  ) : employee ? (
    <span className="truncate">{next ? `Next ${next}` : "No shifts this week"}</span>
  ) : (
    <span className="flex items-center gap-[6px]">
      <span aria-hidden className="size-[7px] rounded-full" style={{ backgroundColor: l.laborPct < 15 ? "#12a53b" : "#d0161f" }} />
      {l.laborPct}% labor
    </span>
  )
  return (
    <span className="flex w-full items-center gap-2 text-left tracking-[-0.43px]">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[17px] leading-[22px] text-black">{wire ? locName(l) : shortLocationName(l)}</span>
        <span className="flex items-center justify-between gap-2 text-[13px] leading-[16px] text-[#7f7f7f]">
          {sub}
          <LocationBadges {...counts} />
        </span>
      </span>
      {wire ? <span aria-hidden className="block h-3 w-9 shrink-0 rounded-full bg-[#dedde4]" /> : !employee && <span className="shrink-0 text-[17px] font-[590] leading-[22px] text-black">{kMoney(l.sales)}</span>}
    </span>
  )
}

/**
 * Apple's sidebar, for iPad: a frosted panel down the leading edge with the app's destinations, the toggle in its
 * header, and (here, for parity with Android's rail) the avatar on top, then the tabs, the assistant's chats and the locations.
 * Hidden, it leaves only the toggle in the toolbar. The app's content pane slides over to make room (see IosHome).
 */
export function IpadSidebar({
  tabs,
  tab,
  onTab,
  dots,
  open,
  onToggle,
  onProfile,
  chats,
  locations,
  more,
}: {
  tabs: readonly TabId[]
  /** Null while a page opened from More is showing. */
  tab: TabId | null
  onTab: (t: TabId) => void
  dots?: Partial<Record<TabId, boolean>>
  open: boolean
  onToggle: () => void
  onProfile: () => void
  /** New chat, at the foot of the sidebar. Not for employees (no assistant). */
  chats?: { onNew: () => void }
  /** The location switcher, first in the list: a row naming the current location that opens a menu (anchored to it). Not for a single location. */
  locations?: { title: string; open: boolean; onOpen: (el: HTMLElement) => void }
  /** The rest of what the app provides, in a drop-down under the tabs that collapses and expands. */
  more?: { items: { id: string; label: string; icon: ReactNode; current?: boolean }[]; onSelect: (id: string) => void }
}) {
  const wire = useStructure()
  const [moreOpen, setMoreOpen] = useState(true)
  const shown = tabs.map((id) => TABS.find((t) => t.id === id)!)
  return (
    <motion.aside
      aria-label="Sidebar"
      aria-hidden={!open}
      inert={!open}
      initial={false}
      // Hidden once it has closed, so nothing in it can be tabbed to, hit, or pointed at by a note.
      animate={open ? { width: SIDEBAR_W, visibility: "visible" } : { width: 0, transitionEnd: { visibility: "hidden" } }}
      transition={SIDEBAR_SPRING}
      className="absolute inset-y-0 left-0 z-30 overflow-hidden"
    >
      <div
        data-anno="sidebar"
        className="absolute bottom-2 left-2 top-2 flex flex-col rounded-[30px] bg-white/70 px-3 pb-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.07),0_10px_30px_rgba(20,20,40,0.08)] backdrop-blur-2xl"
        style={{ width: SIDEBAR_W - 16, paddingTop: "calc(var(--safe-top) - 8px)" }}
      >
        <div className="flex h-11 items-center justify-end gap-2">
          <SidebarToggle open={open} onClick={onToggle} />
        </div>
        <nav className="mt-3 flex flex-col gap-1 border-t border-black/[0.08] pt-3">
          {locations && (
            <button onClick={(e) => locations.onOpen(e.currentTarget)} aria-haspopup="menu" aria-expanded={locations.open} data-anno="sidebar-locations" className={row}>
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <IconMapPin size={24} stroke={1.75} color={BRAND} className="shrink-0" />
                <span className="truncate font-[590]">{locations.title}</span>
              </span>
              <IconSelector size={17} stroke={2.5} className="shrink-0 text-[#4e4e4e]" />
            </button>
          )}
          {shown.map((t) => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => onTab(t.id)} aria-current={active ? "page" : undefined} aria-label={dots?.[t.id] ? `${t.label}, unread` : t.label} className={row}>
                {active && <motion.span layoutId="sidebar-selection" transition={SPRING_FAST.snappy} className="absolute inset-0 rounded-full bg-[#787880]/[0.2]" />}
                <span className="relative flex items-center gap-3">
                  <span className="relative">
                    <Mask src={active ? t.fill : t.icon} color={BRAND} size={24} />
                    {dots?.[t.id] && <span aria-hidden data-unread-dot className="absolute -right-[2px] top-0 size-[9px] rounded-full bg-[#ff3b30] ring-[1.5px] ring-white/80" />}
                  </span>
                  <span className={active ? "font-[590]" : undefined}>{t.label}</span>
                </span>
              </button>
            )
          })}
          {more && (
            <div data-anno="sidebar-more">
              <button onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className={cn(row, "text-[#a09ead]")}>
                <span className="flex-1 text-[15px] font-[510] tracking-[-0.24px]">More</span>
                <IconChevronDown size={18} stroke={2} className={cn("shrink-0 transition-transform duration-200", !moreOpen && "-rotate-90")} />
              </button>
              <motion.div initial={false} animate={moreOpen ? { height: "auto", visibility: "visible" } : { height: 0, transitionEnd: { visibility: "hidden" } }} transition={SIDEBAR_SPRING} className="overflow-hidden" inert={!moreOpen}>
                {more.items.map((m) => (
                  <button key={m.id} onClick={() => more.onSelect(m.id)} aria-current={m.current ? "page" : undefined} className={row}>
                    {m.current && <motion.span layoutId="sidebar-selection" transition={SPRING_FAST.snappy} className="absolute inset-0 rounded-full bg-[#787880]/[0.2]" />}
                    <span className="relative flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center text-[#8f55e5]">{m.icon}</span>
                      <span className={m.current ? "font-[590]" : undefined}>{m.label}</span>
                    </span>
                  </button>
                ))}
              </motion.div>
            </div>
          )}
        </nav>
        {/* The foot of the sidebar: New chat, and the avatar (Settings) at the very bottom. */}
        <div className="mt-auto flex flex-col gap-2 pt-3">
          {chats && (
            <button onClick={chats.onNew} className="flex h-11 shrink-0 items-center justify-center gap-[6px] rounded-full bg-[#8f55e5] px-5 text-[15px] font-[590] tracking-[-0.24px] text-white shadow-[0_6px_16px_rgba(143,85,229,0.3),0_2px_4px_rgba(0,0,0,0.1)] active:opacity-85">
              <IconBoltFilled size={18} />
              New chat
            </button>
          )}
          <button onClick={onProfile} aria-haspopup="dialog" aria-label="Profile and settings" data-anno="profile" className={cn(row, "h-12 gap-2 px-1")}>
            {wire ? <Initials name={ANON.name} size={36} tint={SELF_TINT} /> : <img src="/phone/avatar.jpg" alt="" className="size-9 rounded-full object-cover" />}
            <span className="truncate font-[590]">{ANON.name}</span>
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
