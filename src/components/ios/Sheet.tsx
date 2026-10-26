import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"
import { IconChevronLeft, IconX } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { EdgeBlur, type EdgeBlurConfig } from "@/components/ios/EdgeBlur"
import { OverlayRoot } from "@/components/ios/HalfSheet"
import { SPRING_FAST } from "@/lib/motion"

const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }
const DISMISS_DISTANCE = 120 // px dragged down
const DISMISS_VELOCITY = 600 // px/s flick

/**
 * iOS page sheet. Slides up over a 20% scrim, drags down to dismiss (from the
 * grabber/header any time, from the content when it's scrolled to the top),
 * and closes from the X, the scrim, or Escape.
 *
 * Mount conditionally — `{open && <Sheet … />}` — and it animates in on mount
 * and calls `onClose` once it has animated out.
 */
export function Sheet({
  title,
  onClose,
  onBack,
  resetKey,
  action,
  titleSlot,
  closeSide = "right",
  edgeBlur = { top: true },
  footer,
  inline,
  children,
}: {
  title: string
  onClose: () => void
  /** Shows a back button (glass, top left) when set. */
  onBack?: () => void
  /** Put the close (X) on the left (Figma "Requests" style); `action` then sits on the right alongside it. */
  closeSide?: "left" | "right"
  /** Replaces the close (X) button, e.g. an Edit button. The sheet still closes by drag, scrim tap or Escape. */
  action?: ReactNode | ((dismiss: () => void) => ReactNode)
  /** Replaces the drawn title with your own content in the toolbar (e.g. a text field). `title` still names the sheet for screen readers. */
  titleSlot?: ReactNode
  /** Pinned to the bottom of the sheet over the scrolling content (e.g. a search bar). */
  footer?: ReactNode | ((dismiss: () => void) => ReactNode)
  /** Fill the container it is mounted in (the content pane) instead of rising over the screen: no scrim, grabber or rounded top; it slides in from the right. */
  inline?: boolean
  /** Scroll returns to the top whenever this changes (a new page was pushed/popped). */
  resetKey?: string
  /**
   * Scroll-edge blur, top and bottom independently. Default: top on, bottom off.
   * e.g. `{ top: true, bottom: { strength: 14, height: 90 } }`.
   */
  edgeBlur?: EdgeBlurConfig
  /** Rendered edge to edge: the content owns its own horizontal padding (so pages can slide fully off-screen). */
  children: ReactNode
}) {
  // Menus opened from inside the sheet render into its own layer (see ContextMenu).
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Start fully below the screen, then spring up.
  const y = useMotionValue(900)
  const x = useMotionValue("100%")
  const scrim = useTransform(y, [0, 600], [0.2, 0])

  useEffect(() => {
    const controls = inline ? animate(x, "0%", SPRING) : animate(y, 0, SPRING)
    return () => controls.stop()
  }, [y, x, inline])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [resetKey])

  const closing = useRef(false)
  const dismiss = useCallback(() => {
    if (closing.current) return
    closing.current = true
    if (inline) {
      animate(x, "100%", { ...SPRING, onComplete: onClose })
      return
    }
    const h = sheetRef.current?.offsetHeight ?? 800
    animate(y, h + 40, { ...SPRING, onComplete: onClose })
  }, [y, x, inline, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [dismiss])

  // Drag-to-dismiss. One gesture for mouse (pointer events) and touch (touch
  // events, so we can preventDefault the page scroll once the drag has begun).
  useEffect(() => {
    const el = sheetRef.current
    const scroller = scrollRef.current
    if (inline || !el || !scroller) return

    let active = false
    let dragging = false
    let fromHandle = false
    let startX = 0
    let startY = 0
    let samples: { t: number; y: number }[] = []

    const begin = (x: number, yy: number, target: EventTarget | null) => {
      // Something inside has its own drag (a reorderable list's handles): the sheet stays put.
      if (closing.current || (target as HTMLElement | null)?.closest?.("[data-no-sheet-drag]")) return
      active = true
      dragging = false
      startX = x
      startY = yy
      fromHandle = !!(target as HTMLElement | null)?.closest("[data-sheet-handle]")
      samples = [{ t: performance.now(), y: yy }]
    }

    const move = (x: number, yy: number, e: Event) => {
      if (!active) return
      const dy = yy - startY
      const dx = x - startX
      if (!dragging) {
        const vertical = Math.abs(dy) > Math.abs(dx)
        if (dy > 8 && vertical && (fromHandle || scroller.scrollTop <= 0)) {
          dragging = true
        } else {
          if (Math.abs(dx) > 8 && !vertical) active = false // horizontal: the carousel's
          return
        }
      }
      if (e.cancelable) e.preventDefault()
      y.set(Math.max(0, dy - 8)) // minus the activation threshold, so it doesn't jump
      samples.push({ t: performance.now(), y: yy })
      if (samples.length > 6) samples.shift()
    }

    const end = () => {
      if (!active) return
      active = false
      if (!dragging) return
      dragging = false
      const a = samples[0]
      const b = samples[samples.length - 1]
      const velocity = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0
      if (y.get() > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) dismiss()
      else animate(y, 0, SPRING)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return
      begin(e.clientX, e.clientY, e.target)
    }
    const onPointerMove = (e: PointerEvent) => e.pointerType === "mouse" && move(e.clientX, e.clientY, e)
    const onPointerUp = (e: PointerEvent) => e.pointerType === "mouse" && end()
    const onTouchStart = (e: TouchEvent) => begin(e.touches[0].clientX, e.touches[0].clientY, e.target)
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY, e)

    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchmove", onTouchMove, { passive: false })
    el.addEventListener("touchend", end)
    el.addEventListener("touchcancel", end)
    return () => {
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", end)
      el.removeEventListener("touchcancel", end)
    }
  }, [y, inline, dismiss])

  const closeButton = (
    <LiquidGlass
      mode="small"
      radius={999}
      className={`absolute top-4 flex size-11 items-center justify-center ${closeSide === "left" ? "left-4" : "right-4"}`}
    >
      <button onClick={dismiss} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-[#141414]">
        <IconX size={24} stroke={2} />
      </button>
    </LiquidGlass>
  )

  if (inline) {
    return (
      <div ref={setLayer} className="absolute inset-0 z-[45] overflow-hidden">
        <OverlayRoot.Provider value={layer}>
          <motion.div ref={sheetRef} role="dialog" aria-label={title} style={{ x }} className="absolute inset-0 select-none bg-[#f3f2f6]">
            <div
              ref={scrollRef}
              className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
              style={{ paddingTop: "calc(var(--safe-top) + 70px)", paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
            >
              {children}
            </div>
            <EdgeBlur {...edgeBlur} />
            {footer && <div className="absolute inset-x-0 bottom-0 z-10">{typeof footer === "function" ? footer(dismiss) : footer}</div>}
            <div className="absolute inset-x-0 z-20 h-[70px]" style={{ top: "var(--safe-top)" }}>
              {titleSlot ? (
                <div className="absolute inset-x-[72px] top-4 flex h-11 items-center justify-center">{titleSlot}</div>
              ) : (
                <h2 className="pointer-events-none absolute inset-x-0 top-[29px] text-center text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">{title}</h2>
              )}
              {onBack && (
                <LiquidGlass mode="small" radius={999} className="absolute left-4 top-4 flex size-11 items-center justify-center">
                  <button onClick={onBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full text-[#141414]">
                    <IconChevronLeft size={24} stroke={2} />
                  </button>
                </LiquidGlass>
              )}
              {closeSide === "left" ? (
                <>
                  {closeButton}
                  {typeof action === "function" ? action(dismiss) : action}
                </>
              ) : (
                typeof action === "function" ? action(dismiss) : (action ?? closeButton)
              )}
            </div>
          </motion.div>
        </OverlayRoot.Provider>
      </div>
    )
  }

  return (
    <div ref={setLayer} className="absolute inset-0 z-[45]">
      <OverlayRoot.Provider value={layer}>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrim }} onClick={dismiss} />
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ y, top: "var(--safe-top)", boxShadow: "0 15px 37.5px rgba(0,0,0,0.18)" }}
        className="absolute inset-x-0 bottom-0 select-none rounded-t-[38px] bg-[#f3f2f6]"
      >
        {/* The clip only wraps the scroller. Edge blur sits OUTSIDE it: a masked
            backdrop-filter inside an overflow-hidden rounded ancestor loses its mask. */}
        <div className="absolute inset-0 overflow-hidden rounded-t-[38px]">
          <div
            ref={scrollRef}
            className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
            style={{ paddingTop: 70, paddingBottom: "calc(var(--safe-bottom) + 24px)" }}
          >
            {children}
          </div>
        </div>

        {/* Header floats over the content; edge blur softens what scrolls under it. */}
        <EdgeBlur {...edgeBlur} radius={38} />
        {footer && <div className="absolute inset-x-0 bottom-0 z-10">{typeof footer === "function" ? footer(dismiss) : footer}</div>}
        <div data-sheet-handle className="absolute inset-x-0 top-0 z-20 h-[70px] touch-none">
            <div className="flex justify-center pt-[6px]">
              <div className="h-1 w-[60px] rounded-full bg-[#c3c3c6]" />
            </div>
            {titleSlot ? (
              <div className="absolute inset-x-[72px] top-4 flex h-11 items-center justify-center">{titleSlot}</div>
            ) : (
              <h2 className="pointer-events-none absolute inset-x-0 top-[29px] text-center text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">
                {title}
              </h2>
            )}
            {onBack && (
              <LiquidGlass mode="small" radius={999} className="absolute left-4 top-4 flex size-11 items-center justify-center">
                <button onClick={onBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full text-[#141414]">
                  <IconChevronLeft size={24} stroke={2} />
                </button>
              </LiquidGlass>
            )}
            {closeSide === "left" ? (
              <>
                {closeButton}
                {typeof action === "function" ? action(dismiss) : action}
              </>
            ) : (
              (typeof action === "function" ? action(dismiss) : (action ?? closeButton))
            )}
        </div>
      </motion.div>
      </OverlayRoot.Provider>
    </div>
  )
}
