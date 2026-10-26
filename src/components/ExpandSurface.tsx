import { useCallback, useEffect, useRef, type ReactNode } from "react"
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { cn } from "@/lib/utils"

/** Where the surface grows from, in screen points: the gap to each screen edge, plus the origin's width. */
export type Box = { top: number; left: number; right: number; bottom: number; width: number }

/** An element's box inside its phone screen (whatever the page's scale), for ExpandSurface to grow from. */
export function boxOf(el: Element): Box | null {
  const screen = el.closest<HTMLElement>(".ios-screen, .android-screen")
  if (!screen) return null
  const s = screen.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const k = s.width / screen.offsetWidth || 1
  return { top: (r.top - s.top) / k, left: (r.left - s.left) / k, right: (s.right - r.right) / k, bottom: (s.bottom - r.bottom) / k, width: r.width / k }
}

/** The toolbar's frosted background with a slight bottom line, fading in with the scroll position. */
function FrostedBar({ scrollY, visibility }: { scrollY: MotionValue<number>; visibility: MotionValue<"visible" | "hidden"> }) {
  const opacity = useTransform(scrollY, [30, 70], [0, 1])
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 border-b-[0.5px] border-black/[0.14] bg-[#f3f2f6]/70"
      style={{ height: "calc(var(--safe-top) + 54px)", opacity, visibility, backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)" }}
    />
  )
}

// Opening is a touch slower than closing: it is the moment the eye is following.
const OPEN = { type: "spring" as const, stiffness: 270, damping: 34 }
const CLOSE = { type: "spring" as const, stiffness: 420, damping: 40 }

/**
 * A container transform: a row grows into a full page and shrinks back into the same row. One progress value `p`
 * (0 = the row, 1 = the page) drives everything, so opening, closing and the content cross-fade can't disagree.
 *
 * The page is laid out at full size the whole time and only REVEALED with clip-path (nothing re-lays-out per frame,
 * and it never distorts). The row's own look is kept as `clone`, sitting where the row sat, and fades out as the page
 * content fades in. Glass (the close button) stays outside the clipped layer, and moves by scale only.
 */
export function ExpandSurface({
  from,
  clone,
  cardClass,
  pageClass,
  button,
  onClosed,
  toolbar,
  frostedToolbar,
  z = 31,
  children,
}: {
  from: Box
  /** The row's content, drawn at the row's place while it is still a row. */
  clone: ReactNode
  /** Background of the row (what the surface starts as). */
  cardClass: string
  /** Background of the page (what it ends as). */
  pageClass: string
  /** The close button, given the function that closes (and animates back into the row). */
  button: (close: () => void) => ReactNode
  /** Fires once it has shrunk back into the row. */
  onClosed: () => void
  /** Something drawn in the toolbar row over the page (e.g. a title that appears on scroll); given the page's scroll position. */
  toolbar?: (scrollY: MotionValue<number>) => ReactNode
  /** A frosted background and hairline behind the toolbar row that fade in with the scroll (as the toolbar title does). */
  frostedToolbar?: boolean
  z?: number
  /** The page. A function gets the scroll position, for effects that follow it. */
  children: ReactNode | ((scrollY: MotionValue<number>) => ReactNode)
}) {
  const p = useMotionValue(0)
  const closing = useRef(false)
  const scrollY = useMotionValue(0)
  const lift = useMotionValue(1) // how much of the shadow shows (see below)

  useEffect(() => {
    const c = animate(p, 1, OPEN)
    return () => c.stop()
  }, [p])

  const close = useCallback(() => {
    if (closing.current) return
    closing.current = true
    animate(lift, 0, { duration: 0.12, ease: "easeOut" })
    animate(p, 0, { ...CLOSE, onComplete: onClosed })
  }, [p, lift, onClosed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      e.stopImmediatePropagation()
      close()
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [close])

  const clip = useTransform(p, (v) => {
    const t = 1 - v
    const r = Math.sin(Math.PI * Math.min(1, Math.max(0, v))) * 22 // soft corners mid-flight, square at both ends
    return `inset(${from.top * t}px ${from.right * t}px ${from.bottom * t}px ${from.left * t}px round ${r}px)`
  })
  // A shadow around the whole growing shape, so its edge reads against the page. It is a drop-shadow on a wrapper (a plain
  // box-shadow would be clipped away with the shape), and goes away once the page fills the screen.
  // `lift` is how much of it shows: 1 while opening and open, and it drops to 0 within a moment of the close starting, so the
  // shrinking shape is not hauling a shadow back into the row.
  const shadow = useTransform([p, lift], ([v, k]: number[]) => {
    if (v > 0.995 || k < 0.01) return "none"
    const mix = (c: string) => `color-mix(in srgb, ${c} ${k * 100}%, transparent)`
    return `drop-shadow(0 ${12 * k}px ${28 * k}px ${mix("var(--expand-shadow, rgba(20,20,40,0.24))")}) drop-shadow(0 ${2 * k}px ${6 * k}px ${mix("var(--expand-shadow-near, rgba(20,20,40,0.14))")})`
  })
  const pageBg = useTransform(p, [0.1, 0.6], [0, 1])
  const cloneOpacity = useTransform(p, [0, 0.3], [1, 0])
  const pageOpacity = useTransform(p, [0.3, 0.75], [0, 1])
  const buttonScale = useTransform(p, [0.35, 1], [0.6, 1])
  const buttonVisibility = useTransform(p, (v) => (v > 0.35 ? "visible" : "hidden"))
  const expandedVisibility = useTransform(p, (v) => (v > 0.97 ? "visible" : "hidden"))

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: z }}>
      <motion.div className="pointer-events-none absolute inset-0" style={{ filter: shadow }}>
      <motion.div className="pointer-events-auto absolute inset-0 overflow-hidden" style={{ clipPath: clip }}>
        <div className={cn("absolute inset-0", cardClass)} />
        <motion.div className={cn("absolute inset-0", pageClass)} style={{ opacity: pageBg }} />
        <motion.div className="absolute" style={{ top: from.top, left: from.left, width: from.width, opacity: cloneOpacity }}>
          {clone}
        </motion.div>
        <motion.div
          className="[scrollbar-width:none] absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{ opacity: pageOpacity }}
          onScroll={(e) => scrollY.set(e.currentTarget.scrollTop)}
        >
          {typeof children === "function" ? children(scrollY) : children}
        </motion.div>
      </motion.div>
      </motion.div>
      {/* Outside the clip: backdrop blur can't see through a clipped ancestor. Shown once the page is fully open. */}
      {frostedToolbar && <FrostedBar scrollY={scrollY} visibility={expandedVisibility} />}
      {toolbar && (
        <motion.div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: "var(--safe-top)", opacity: pageOpacity }}>
          {toolbar(scrollY)}
        </motion.div>
      )}
      {/* Outside the clip and never faded: glass can't refract through an opacity or clip-path ancestor. */}
      <motion.div className="pointer-events-auto absolute left-4 z-20" style={{ top: "var(--safe-top)", scale: buttonScale, visibility: buttonVisibility }}>
        {button(close)}
      </motion.div>
    </div>
  )
}
