import { useLocName } from "@/store/useViewStore"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { IconCheck, IconPlus } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { SPRING_FAST } from "@/lib/motion"
import { COMPANIES, LOCATIONS, nextShiftAt, shortLocationName, type Location } from "@/data/locations"
import { shortMoney } from "@/components/WireBars"
import { LocationBadges, useCounts } from "@/components/LocationBadges"
import { useStructure } from "@/store/useViewStore"
import { useLocationStore } from "@/store/useLocationStore"
import { useUserTypeStore } from "@/store/useUserTypeStore"

/** A location's row in the menu: its name over one line: today's sales and labor share, with what is waiting at the end. Also what its overview grows out of. */
export function LocationMenuRowBody({ l }: { l: Location }) {
  const wire = useStructure()
  const locName = useLocName()
  const employee = useUserTypeStore((s) => s.type) === "employee"
  const counts = useCounts([l])
  // An employee sees their own side of each location, not its numbers: when they next work there, and anything waiting.
  if (employee) {
    const next = nextShiftAt(l.id)
    return (
      <span className="flex w-full items-center gap-3 text-left tracking-[-0.43px]">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[17px] leading-[22px] text-black">{wire ? locName(l) : shortLocationName(l)}</span>
          {wire ? <span aria-hidden className="mt-[5px] block h-2 w-[45%] rounded-full bg-[#dedde4]" /> : <span className="truncate text-[13px] leading-4 text-[#7f7f7f]">{next ? `Next shift ${next}` : "No shifts this week"}</span>}
        </span>
        <LocationBadges {...counts} />
      </span>
    )
  }
  return (
    <span className="flex w-full items-center gap-3 text-left tracking-[-0.43px]">
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[17px] leading-[22px] text-black">{wire ? locName(l) : shortLocationName(l)}</span>
        <span className="flex items-center justify-between gap-2 text-[13px] leading-4 text-[#7f7f7f]">
          {wire ? (
            <span aria-hidden className="mt-[5px] flex items-center gap-2">
              <span className="block h-2 w-8 rounded-full bg-[#dedde4]" />
              <span className="block h-2 w-14 rounded-full bg-[#dedde4]" />
            </span>
          ) : (
            <span className="flex items-center gap-[6px]">
              <span className="font-[590] text-black">{shortMoney(l.sales)}</span>
              <span aria-hidden>·</span>
              <span aria-hidden className="size-[7px] rounded-full" style={{ backgroundColor: l.laborPct < 15 ? "#12a53b" : "#d0161f" }} />
              {l.laborPct}% labor
            </span>
          )}
          <LocationBadges {...counts} />
        </span>
      </span>
    </span>
  )
}

/**
 * iOS context menu for the location title. One menu, one store: whatever is
 * picked here drives every widget on every screen.
 *
 * Mount it as a direct child of the screen; it fills the screen with a
 * dismiss layer and anchors itself under the toolbar title.
 */
export function LocationMenu({ open, onClose, onAddLocation, anchorEl, onPickLocation }: { open: boolean; onClose: () => void; /** Anchor under this element (the iPad sidebar's Locations row) instead of under the toolbar title. */ anchorEl?: HTMLElement | null; /** Also called when a location is picked (the tablet's Home opens that location's view). */ onPickLocation?: (l: Location) => void; /** One location only: the menu offers to add another instead of listing more. */ onAddLocation?: () => void }) {
  const wire = useStructure()
  const locationId = useLocationStore((s) => s.locationId)
  const setLocation = useLocationStore((s) => s.setLocation)
  const single = useUserTypeStore((s) => s.type) === "oam"
  const overlay = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  useLayoutEffect(() => {
    const o = overlay.current
    if (!open || !anchorEl || !o) return setPos(null)
    const a = anchorEl.getBoundingClientRect()
    const r = o.getBoundingClientRect()
    const sc = r.width / o.offsetWidth || 1 // the device frame is scaled; position in local px
    setPos({ left: (a.left - r.left) / sc, top: (a.bottom - r.top) / sc + 6 })
  }, [open, anchorEl])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div ref={overlay} className="absolute inset-0 z-30" onPointerDown={onClose}>
          <motion.div
            role="menu"
            aria-label="Location"
            // No opacity on an ancestor of the glass (it would isolate the backdrop, then snap in at 1).
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8, transition: { duration: 0.12 } }}
            transition={SPRING_FAST.snappy}
            style={anchorEl && pos ? { transformOrigin: "top left", top: pos.top, left: pos.left, width: 340 } : { transformOrigin: "top left", top: "calc(var(--safe-top) + 51px)" }}
            className={anchorEl && pos ? "absolute" : "absolute left-4 w-[calc(100%-32px)] max-w-[420px]"}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <LiquidGlass mode="medium" radius={34} className="py-[10px]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16, delay: 0.04 }}
              >
              {single && (
                <>
                  <div className="flex min-h-[52px] items-center gap-[13px] py-1 pl-[25px] pr-5 tracking-[-0.43px] text-black">
                    <span className="flex w-[18px] shrink-0 justify-center"><IconCheck size={20} stroke={2.5} /></span>
                    <span className="truncate text-[17px] leading-[22px]">{wire ? "Location 1" : LOCATIONS[0].name}</span>
                  </div>
                  {onAddLocation && (
                    <button onClick={() => { onAddLocation(); window.setTimeout(onClose, 120) }} className="mt-1 flex h-11 w-full items-center gap-[13px] border-t border-black/[0.08] pl-[25px] pr-5 text-left tracking-[-0.43px] text-[#8f55e5] active:bg-black/5">
                      <span className="flex w-[18px] shrink-0 justify-center"><IconPlus size={20} stroke={2.5} /></span>
                      <span className="text-[17px] font-[590] leading-[22px]">Add location</span>
                    </button>
                  )}
                </>
              )}
              {!single && COMPANIES.map((c, ci) => (
                <div key={c.name} role="group" aria-label={wire ? `Company ${ci + 1}` : c.name} className={ci > 0 ? "mt-1 border-t border-black/[0.08] pt-1" : undefined}>
                  <div className="px-[25px] pb-0.5 pt-1.5 text-[13px] font-[590] leading-[18px] tracking-[-0.08px] text-[#7f7f7f]">{wire ? `Company ${ci + 1}` : c.name}</div>
                  {c.locations.map((l) => {
                    const selected = l.id === locationId
                    return (
                      <button
                        key={l.id}
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          setLocation(l.id)
                          onPickLocation?.(l)
                          window.setTimeout(onClose, 120)
                        }}
                        className="flex min-h-[52px] w-full items-center gap-[13px] py-1 pl-[25px] pr-5 text-left tracking-[-0.43px] text-black active:bg-black/5"
                      >
                        <span className="flex w-[18px] shrink-0 justify-center">
                          {selected && <IconCheck size={20} stroke={2.5} />}
                        </span>
                        <LocationMenuRowBody l={l} />
                      </button>
                    )
                  })}
                </div>
              ))}
              </motion.div>
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
