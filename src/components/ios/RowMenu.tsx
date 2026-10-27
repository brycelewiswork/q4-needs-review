import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { SPRING_FAST } from "@/lib/motion"
import { useOverlayRoot } from "@/components/ios/HalfSheet"

const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }

/**
 * What a long press on a row opens: the row itself morphs into a big context menu over a scrim. The row's own box (its place and
 * size) grows into a card with the row at the top, then all of its context (the facts or timeline and the assistant's note), and the
 * main actions pinned along the bottom, all on the one white surface. The page behind dims and blurs. If it's more than fits, the context scrolls inside the card
 * and the buttons stay put. Tapping the scrim, or Escape, folds it back into the row, which the caller hides while this is open so it
 * reads as one thing changing shape.
 */
export function RowMenu({
  anchor,
  preview,
  content,
  footer,
  onClose,
}: {
  /** The row it grows from. `null` = closed. */
  anchor: HTMLElement | null
  /** The row, as it was: the top of the card. */
  preview: ReactNode
  /** Everything known about it, under the row. Scrolls when long. */
  content: ReactNode
  /** The buttons along the bottom; given a way to close the card. */
  footer: (close: () => void) => ReactNode
  onClose: () => void
}) {
  const root = useOverlayRoot()
  // Step one: where the row is. Step two (once a hidden copy of the card at that width has been laid out): how tall the card wants to be.
  const [base, setBase] = useState<{ left: number; top: number; w: number; h: number } | null>(null)
  const [box, setBox] = useState<{ to: number; H: number } | null>(null)
  const measure = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    setBox(null)
    if (!anchor || !root) return setBase(null)
    const a = anchor.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    const s = r.width / root.offsetWidth // the phone frame is scaled; work in local px
    setBase({ left: (a.left - r.left) / s, top: (a.top - r.top) / s, w: a.width / s, h: a.height / s })
  }, [anchor, root])

  useLayoutEffect(() => {
    if (!base || !root || !measure.current) return
    const screen = root.offsetHeight
    const want = measure.current.offsetHeight
    // Capped to the screen, the rest scrolling. It stays where the row is if it fits there, else slides just far enough to.
    const H = Math.min(want, screen - 120 - 36)
    setBox({ H, to: Math.max(96, Math.min(base.top - 8, screen - 36 - H)) })
  }, [base, root, preview, content])

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
    <>
      {/* A hidden copy of the card, only to measure it. */}
      {anchor && base && (
        <div aria-hidden inert ref={measure} style={{ width: base.w }} className="invisible pointer-events-none absolute left-0 top-0 -z-10">
          <div className="px-4 pt-[14px]">
            {preview}
            {content}
          </div>
          <div className="px-4 pb-4 pt-1">{footer(() => {})}</div>
        </div>
      )}
      <AnimatePresence>
        {anchor && base && box && (
          <div className="pointer-events-auto absolute inset-0 z-50">
            <motion.div
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[6px]"
              onPointerDown={onClose}
            />
            <motion.div
              role="dialog"
              initial={{ top: base.top, height: base.h, borderRadius: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" }}
              animate={{ top: box.to, height: box.H, borderRadius: 26, boxShadow: "0 24px 60px rgba(10,10,30,0.35), 0 4px 14px rgba(10,10,30,0.18)" }}
              exit={{ top: base.top, height: base.h, borderRadius: 0, boxShadow: "0 0 0 rgba(0,0,0,0)", transition: { ...SPRING, duration: 0.24 } }}
              transition={SPRING}
              style={{ left: base.left, width: base.w }}
              className="absolute flex flex-col overflow-hidden bg-white"
            >
              <div className="[scrollbar-width:none] min-h-0 flex-1 overflow-y-auto px-4 pt-[14px] [&::-webkit-scrollbar]:hidden">
                {preview}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.08 } }}
                  transition={{ duration: 0.16, delay: 0.1 }}
                >
                  {content}
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ duration: 0.16, delay: 0.1 }}
                className="flex-none px-4 pb-4 pt-1"
              >
                {footer(onClose)}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    root,
  )
}
