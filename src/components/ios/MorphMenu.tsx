import { useEffect, useLayoutEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { SPRING_FAST } from "@/lib/motion"
import { useOverlayRoot } from "@/components/ios/HalfSheet"

export type MorphItem = { id: string; label: string; icon?: ReactNode }

const W = 236
const ROW = 44
const PAD = 6
const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }

/**
 * A menu that grows out of the button that opened it, rather than popping up beside it: the button's own shape (its
 * place and size) stretches into the menu's, and the items fade in once there's room. It's anchored to the button's
 * right edge and opens down, or up if there isn't room. Tapping outside, or Escape, folds it back into the button.
 * The caller hides the button itself while this is open, so it reads as one thing changing shape.
 */
export function MorphMenu({
  anchor,
  items,
  onSelect,
  onClose,
}: {
  /** The button it grows from. `null` = closed. */
  anchor: HTMLElement | null
  items: MorphItem[]
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const root = useOverlayRoot()
  const [from, setFrom] = useState<{ right: number; top?: number; bottom?: number; w: number; h: number; up: boolean } | null>(null)
  const H = items.length * ROW + PAD * 2

  useLayoutEffect(() => {
    if (!anchor || !root) return setFrom(null)
    const a = anchor.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    const s = r.width / root.offsetWidth // the phone frame is scaled; position in local px
    const w = a.width / s
    const h = a.height / s
    const right = (r.right - a.right) / s
    const room = (r.bottom - a.top) / s
    // Grows down from the button's top, or up from its bottom when the menu wouldn't fit below.
    if (room >= H + 90) setFrom({ right, top: (a.top - r.top) / s, w, h, up: false })
    else setFrom({ right, bottom: (r.bottom - a.bottom) / s, w, h, up: true })
  }, [anchor, root, H])

  useEffect(() => {
    if (!anchor) return
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
      {anchor && from && (
        <div className="pointer-events-auto absolute inset-0 z-50" onPointerDown={onClose}>
          <motion.div
            role="menu"
            initial={{ width: from.w, height: from.h, borderRadius: from.h / 2, backgroundColor: "rgb(242,242,243)", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            animate={{ width: W, height: H, borderRadius: 22, backgroundColor: "rgb(255,255,255)", boxShadow: "0 18px 44px rgba(20,20,40,0.22), 0 2px 8px rgba(20,20,40,0.12)" }}
            exit={{ width: from.w, height: from.h, borderRadius: from.h / 2, backgroundColor: "rgb(242,242,243)", boxShadow: "0 0 0 rgba(0,0,0,0)", transition: { ...SPRING, duration: 0.22 } }}
            transition={SPRING}
            style={{ right: from.right, top: from.top, bottom: from.bottom }}
            className="absolute overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              transition={{ duration: 0.16, delay: 0.08 }}
              className="py-[6px]"
              style={{ width: W }}
            >
              {items.map((it) => (
                <button
                  key={it.id}
                  role="menuitem"
                  onClick={() => {
                    onSelect(it.id)
                    window.setTimeout(onClose, 120)
                  }}
                  className="flex h-11 w-full items-center justify-between gap-3 px-5 text-left text-[16px] tracking-[-0.43px] text-black active:bg-black/5"
                >
                  <span className="truncate">{it.label}</span>
                  {it.icon && <span className="flex shrink-0 items-center">{it.icon}</span>}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    root,
  )
}
