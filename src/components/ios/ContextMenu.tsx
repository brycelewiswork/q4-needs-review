import { useEffect, useLayoutEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { IconCheck } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { SPRING_FAST } from "@/lib/motion"
import { useOverlayRoot } from "@/components/ios/HalfSheet"

export type MenuItem = { id: string; label: string; /** Trailing icon, iOS style (action menus). */ icon?: ReactNode }

const ROW = 40
const PAD = 10

/**
 * iOS pull-down context menu. Pops from the tapped element, right-aligned to it,
 * below by default and above when there isn't room. Renders into the nearest
 * overlay layer (see HalfSheet) so it's real glass over the whole screen.
 */
export function ContextMenu({
  anchor,
  items,
  selectedId,
  checked,
  onSelect,
  onClose,
  container,
  align = "right",
}: {
  /** The element that was tapped. `null` = closed. */
  anchor: HTMLElement | null
  items: MenuItem[]
  /** Omit for an ACTION menu (no check column, items can carry trailing icons). */
  selectedId?: string
  /** A checkbox menu: the ids that are checked (any number, none included). Use in place of `selectedId`. */
  checked?: readonly string[]
  /** Which edge of the anchor the menu lines up with. Right (default) suits an anchor on the right of the screen; use left for one on the left. */
  align?: "left" | "right"
  /** Where to render, when not inside a HalfSheet. Must be a screen-sized positioned element. */
  container?: HTMLElement | null
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const overlay = useOverlayRoot()
  const root = container ?? overlay
  const [pos, setPos] = useState<{ right?: number; left?: number; top?: number; bottom?: number; above: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!anchor || !root) return setPos(null)
    const a = anchor.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    const s = r.width / root.offsetWidth // the phone frame is scaled; position in local px
    const menuH = items.length * ROW + PAD * 2
    const below = (r.bottom - a.bottom) / s
    const side = align === "left" ? { left: (a.left - r.left) / s } : { right: (r.right - a.right) / s }
    if (below >= menuH + 12) setPos({ ...side, top: (a.bottom - r.top) / s + 6, above: false })
    else setPos({ ...side, bottom: (r.bottom - a.top) / s + 6, above: true })
  }, [anchor, root, items.length, align])

  useEffect(() => {
    if (!anchor) return
    // Capture + stop, so Escape closes the menu and not the sheet underneath it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [anchor, onClose])

  if (!root) return null
  return createPortal(
    <AnimatePresence>
      {anchor && pos && (
        <div className="pointer-events-auto absolute inset-0 z-50" onPointerDown={onClose}>
          <motion.div
            role="menu"
            // NO opacity on this element: an ancestor with opacity < 1 is a backdrop root, so the
            // glass would refract nothing until opacity hit 1, then snap in. Scale the glass; fade its items.
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.85, transition: { duration: 0.12 } }}
            transition={{ type: "spring", ...SPRING_FAST.snappy }}
            style={{
              right: pos.right,
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              transformOrigin: `${pos.above ? "bottom" : "top"} ${align}`,
            }}
            className="absolute w-max max-w-[calc(100%-32px)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <LiquidGlass mode="medium" radius={34} className="py-[10px]">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16, delay: 0.04 }}
              >
              {items.map((it) => {
                const selected = checked ? checked.includes(it.id) : it.id === selectedId
                const action = selectedId === undefined && !checked
                return (
                  <button
                    key={it.id}
                    role={action ? "menuitem" : checked ? "menuitemcheckbox" : "menuitemradio"}
                    aria-checked={action ? undefined : selected}
                    onClick={() => {
                      onSelect(it.id)
                      window.setTimeout(onClose, 120)
                    }}
                    className={`flex h-10 w-full items-center gap-3 text-left tracking-[-0.43px] text-black active:bg-black/5 ${action ? "pl-5 pr-5" : "pl-[18px] pr-6"}`}
                  >
                    {!action && (
                      <span className="flex w-[18px] shrink-0 justify-center">
                        {selected && <IconCheck size={20} stroke={2.5} />}
                      </span>
                    )}
                    <span className={`truncate text-[17px] leading-[22px] ${action ? "flex-1" : ""}`}>{it.label}</span>
                    {it.icon && <span className="ml-6 flex shrink-0 items-center">{it.icon}</span>}
                  </button>
                )
              })}
              </motion.div>
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  )
}
