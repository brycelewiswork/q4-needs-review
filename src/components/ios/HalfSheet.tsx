import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { animate, motion, type MotionValue, useMotionValue, useTransform } from "motion/react"
import { IconX } from "@tabler/icons-react"
import { EdgeBlur, type EdgeBlurConfig } from "@/components/ios/EdgeBlur"
import { LiquidGlass } from "@/components/ui/liquid-glass"

/** The sheet's screen-sized layer. Menus portal into it so they aren't clipped by (or nested in) the sheet surface. */
export const OverlayRoot = createContext<HTMLElement | null>(null)
export const useOverlayRoot = () => useContext(OverlayRoot)

/** Where the morph starts: the expanded bottom accessory (px from the screen edges). */
const FROM = { inset: 28, bottom: 64, height: 48, radius: 24 } as const
/** Figma "Sheet=Half": floating, inset 6px, 390 × 459; 34px top corners, 58px bottom corners (follow the device). */
const TO = { inset: 6, bottom: 6, height: 459, /* default; see `height` prop */ radiusTop: 34, radiusBottom: 58 } as const

const OPEN = { type: "spring" as const, stiffness: 520, damping: 42, mass: 1 }
const CLOSE = { type: "spring" as const, stiffness: 560, damping: 44, mass: 1 }

/** Share of the morph over which the accessory and the sheet surface cross-fade. */
export const HANDOFF = 0.12

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * iOS half sheet that MORPHS out of the bottom accessory.
 *
 * One progress value `p` (0 = the accessory, 1 = the open sheet) drives
 * everything — the surface's rect and corner radius, the scrim, and the two
 * content layers' cross-fade. Opening, closing, and dragging are all just
 * "move p", so the three can never disagree.
 *
 * `collapsed` is the accessory's own content; it sits where it did in the bar
 * and fades out as the sheet's content fades in.
 */
export function HalfSheet({
  progress: p,
  title,
  collapsed,
  onClosed,
  edgeBlur,
  height = TO.height,
  hideTitle,
  variant = "morph",
  children,
}: {
  /** 0 = collapsed into the accessory, 1 = open. Owned by the parent so the accessory can cross-fade with it. */
  progress: MotionValue<number>
  title: string
  collapsed: ReactNode
  /** Fires after the sheet has fully collapsed back into the accessory. */
  onClosed: () => void
  /** Keep `title` for screen readers but don't draw it in the toolbar (the content provides its own heading). */
  hideTitle?: boolean
  /** `morph` grows out of the bottom accessory. `slide` is a normal bottom sheet: it just slides up from the bottom edge at its final size. */
  variant?: "morph" | "slide"
  /** Open height in px (Figma half sheet = 459). */
  height?: number
  /** Scroll-edge blur over the content, top and bottom independently (tint can be turned off per edge). Default: none. */
  edgeBlur?: EdgeBlurConfig
  /** A render prop gets `close(then?)`: plays the collapse into the accessory, then runs `then` (state changes that would otherwise flash mid-collapse). */
  children?: ReactNode | ((close: (then?: () => void) => void) => ReactNode)
}) {
  const slide = variant === "slide"
  const surface = useRef<HTMLDivElement>(null)
  const openHeight = useMotionValue(height)
  useEffect(() => {
    const c = animate(openHeight, height, { type: "spring", stiffness: 420, damping: 40 })
    return () => c.stop()
  }, [height, openHeight])
  const [layer, setLayer] = useState<HTMLDivElement | null>(null)
  const closing = useRef(false)

  useEffect(() => {
    const c = animate(p, 1, OPEN)
    return () => c.stop()
  }, [p])

  const close = useCallback((then?: () => void) => {
    if (closing.current) return
    closing.current = true
    // Unmount the moment it has visually landed on the accessory — not after the spring's long, invisible tail.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      controls.stop()
      p.set(0)
      then?.()
      onClosed()
    }
    const controls = animate(p, 0, { ...CLOSE, onUpdate: (v) => v < 0.004 && finish(), onComplete: finish })
  }, [p, onClosed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])

  // Drag down to dismiss: the finger scrubs p, and release decides which way it settles.
  useEffect(() => {
    const el = surface.current
    if (!el) return
    let active = false
    let dragging = false
    let startY = 0
    let startX = 0
    let samples: { t: number; y: number }[] = []

    const begin = (x: number, y: number) => {
      if (closing.current) return
      active = true
      dragging = false
      startX = x
      startY = y
      samples = [{ t: performance.now(), y }]
    }
    const move = (x: number, y: number, e: Event) => {
      if (!active) return
      const dy = y - startY
      if (!dragging) {
        if (dy > 6 && Math.abs(dy) > Math.abs(x - startX)) dragging = true
        else {
          if (Math.abs(x - startX) > 8) active = false
          return
        }
      }
      if (e.cancelable) e.preventDefault()
      // ~300px of travel = fully collapsed. Pulling up does nothing.
      p.set(clamp01(1 - Math.max(dy - 6, 0) / (slide ? openHeight.get() + 14 : 300)))
      samples.push({ t: performance.now(), y })
      if (samples.length > 6) samples.shift()
    }
    const end = () => {
      if (!active) return
      active = false
      if (!dragging) return
      dragging = false
      const a = samples[0]
      const b = samples[samples.length - 1]
      const v = b.t > a.t ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0
      if (p.get() < 0.65 || v > 600) close()
      else animate(p, 1, OPEN)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      begin(e.clientX, e.clientY)
    }
    const onPointerMove = (e: PointerEvent) => move(e.clientX, e.clientY, e)
    const onPointerUp = () => end()
    el.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerUp)
    return () => {
      el.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerUp)
    }
  }, [p, close, slide, openHeight])

  // Surface geometry, all derived from p. `bottom` keeps the safe-area term (it fades out as the sheet floats 6px off the edge).
  const left = useTransform(p, (v) => (slide ? TO.inset : lerp(FROM.inset, TO.inset, v)))
  const bottom = useTransform(p, (v) =>
    slide ? `${TO.bottom}px` : `calc(var(--safe-bottom) * ${1 - v} + ${lerp(FROM.bottom, TO.bottom, v)}px)`,
  )
  const surfaceHeight = useTransform([p, openHeight], ([v, h]: number[]) => (slide ? h : lerp(FROM.height, h, v)))
  const radiusTop = useTransform(p, (v) => (slide ? TO.radiusTop : lerp(FROM.radius, TO.radiusTop, v)))
  const radiusBottom = useTransform(p, (v) => (slide ? TO.radiusBottom : lerp(FROM.radius, TO.radiusBottom, v)))
  const scrim = useTransform(p, (v) => 0.2 * clamp01(v))
  // Slide variant: the whole sheet rides up from below the screen edge. Transform only, so the glass never fades.
  const slideY = useTransform([p, openHeight], ([v, h]: number[]) => (slide ? (1 - v) * (h + TO.bottom + 8) : 0))
  // Morph variant: the real glass accessory is the surface at p≈0, so the CSS surface only fades in once it has moved off it.
  const surfaceOpacity = useTransform(p, (v) => (slide ? 1 : clamp01(v / HANDOFF)))
  // Cross-fade: the accessory content is gone by p≈.3, the sheet content arrives by p≈.85.
  const collapsedOpacity = useTransform(p, (v) => 1 - clamp01(v / 0.3))
  const openOpacity = useTransform(p, (v) => (slide ? 1 : clamp01((v - 0.5) / 0.35)))

  return (
    <div ref={setLayer} className="absolute inset-0 z-[44]">
      <OverlayRoot.Provider value={layer}>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: scrim }} onClick={() => close()} />
      <motion.div
        ref={surface}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          left,
          right: left,
          bottom,
          height: surfaceHeight,
          borderTopLeftRadius: radiusTop,
          borderTopRightRadius: radiusTop,
          borderBottomLeftRadius: radiusBottom,
          borderBottomRightRadius: radiusBottom,
          opacity: surfaceOpacity,
          y: slideY,
          touchAction: "none",
          // Figma "medium" glass: white lighten fill + hairline sides + soft deep shadow.
          backgroundColor: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(24px) saturate(1.6)",
          WebkitBackdropFilter: "blur(24px) saturate(1.6)",
          boxShadow:
            "1.25px 0 0 -0.75px #dbdbdb, -1.25px 0 0 -0.75px #dbdbdb, 0 0 0 0.5px #dbdbdb, 0 8px 48px rgba(0,0,0,0.25)",
        }}
        className="absolute select-none overflow-hidden"
      >
        {/* The accessory's own row, exactly where it sat in the bar. */}
        <motion.div
          style={{ opacity: collapsedOpacity }}
          className="pointer-events-none absolute inset-x-0 top-0 flex h-12 items-center gap-2 pl-3 pr-4"
        >
          {collapsed}
        </motion.div>

        {/* The sheet. Laid out at final size so nothing reflows while the surface grows. */}
        <motion.div style={{ opacity: openOpacity, height: openHeight }} className="absolute inset-x-0 top-0">
          {/* Content runs edge to edge UNDER the grabber and toolbar (e.g. a map). */}
          <div className="absolute inset-0">{typeof children === "function" ? children(close) : children}</div>
          {edgeBlur && <EdgeBlur {...edgeBlur} radius={TO.radiusTop} />}
          <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-[6px]">
            <div className="h-1 w-[60px] rounded-full bg-[#c3c3c6]" />
          </div>
          {/* Figma: toolbar buttons start at y=16, title text at y=29. */}
          <div className="relative z-10 flex items-start justify-end px-4 pt-4">
            <LiquidGlass mode="small" radius={999} className="flex size-11 items-center justify-center">
              <button onClick={() => close()} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-[#141414]">
                <IconX size={24} stroke={2} />
              </button>
            </LiquidGlass>
            {!hideTitle && (

              <h2 className="pointer-events-none absolute inset-x-0 top-[29px] text-center text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">
                {title}
              </h2>
            )}
          </div>
        </motion.div>
      </motion.div>
      </OverlayRoot.Provider>
    </div>
  )
}
