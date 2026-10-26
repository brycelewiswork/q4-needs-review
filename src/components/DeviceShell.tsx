import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import { FOOTER_H, HEADER_H, useFit, type Size } from "@/lib/device"

export type ScreenRect = { x: number; y: number; w: number; h: number; radius: number }

/**
 * The stage a device sits on: page controls above and below, the device scaled to fit, centred.
 *
 * `box` is the device's outer size at 1:1 (screen plus bezel). `screen` is where the live screen sits inside it.
 * `art` paints the bezel / body (and any shadow) inside the box; `overlay` paints on top of the screen
 * (bezel art that must cover the corners, camera, home bar). Children are the app.
 */
export function DeviceShell({
  box,
  screen,
  screenClass,
  screenStyle,
  art,
  chrome,
  overlay,
  controls,
  header,
  footer,
  children,
}: {
  box: Size
  screen: ScreenRect
  screenClass: string
  screenStyle: CSSProperties
  art: ReactNode
  /** Drawn inside the screen, over the app: status bar, camera cutout. */
  chrome?: ReactNode
  overlay?: ReactNode
  /** Page controls just above the device (which device, how it's held). */
  controls?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
}) {
  // The page controls wrap on a narrow window, so the room they take is measured, not fixed.
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = useState(HEADER_H)
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeaderH(Math.max(HEADER_H, el.offsetHeight)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [header])
  const controlsRef = useRef<HTMLDivElement>(null)
  const [controlsH, setControlsH] = useState(0)
  useLayoutEffect(() => {
    const el = controlsRef.current
    if (!el) return setControlsH(0)
    const ro = new ResizeObserver(() => setControlsH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [controls])
  const scale = useFit(box, (header ? headerH : 0) + (footer ? FOOTER_H : 0) + controlsH)
  return (
    <div
      className="relative flex h-svh w-full items-center justify-center overflow-hidden bg-[#e4e3e8] dark:bg-neutral-900"
      style={{ paddingTop: header ? headerH : 0, paddingBottom: footer ? FOOTER_H : 0 }}
    >
      {footer && (
        <div className="absolute inset-x-0 bottom-0 z-[60] flex items-center justify-center" style={{ height: FOOTER_H }}>
          {footer}
        </div>
      )}
      {header && (
        <div ref={headerRef} className="absolute inset-x-0 top-0 z-[60] flex items-center justify-center py-2" style={{ minHeight: HEADER_H }}>
          {header}
        </div>
      )}
      <div className="flex shrink-0 flex-col items-center">
      {controls && <div ref={controlsRef} className="relative z-[60] flex shrink-0 justify-center pb-3">{controls}</div>}
      <div className="relative shrink-0" style={{ width: box.w * scale, height: box.h * scale }}>
        <div className="relative origin-top-left" style={{ width: box.w, height: box.h, transform: `scale(${scale})` }}>
          {art}
          <div
            className={`${screenClass} absolute overflow-hidden`}
            style={{ left: screen.x, top: screen.y, width: screen.w, height: screen.h, borderRadius: screen.radius, ...screenStyle }}
          >
            {children}
            {chrome}
          </div>
          {overlay}
        </div>
      </div>
      </div>
    </div>
  )
}
