import { useEffect, useState } from "react"
import type { Device, Orientation } from "@/store/useViewStore"

export type { Device, Orientation }

export type Size = { w: number; h: number }

/** Room above / below the frame for the page-level controls. */
export const HEADER_H = 64
export const FOOTER_H = 56

/** Logical size of a screen, turned on its side when held in landscape. */
export const oriented = (s: Size, o: Orientation): Size => (o === "landscape" ? { w: s.h, h: s.w } : s)

/**
 * Logical screen sizes, in points (iOS) / dp (Android).
 *  - iPhone 17: 402 × 874.  iPad Air 11" (M3): 820 × 1180.
 *  - Pixel 10 Pro: 410 × 914.  Galaxy Tab S12+ (12.6", 2800 × 1752 px): taken as 800 × 1280 dp, the size Samsung's
 *    tablets report. A guess until someone reads it off a real device.
 */
export const SCREENS = {
  ios: { phone: { w: 402, h: 874, radius: 62 }, tablet: { w: 820, h: 1180, radius: 18 } },
  android: { phone: { w: 410, h: 914, radius: 53 }, tablet: { w: 800, h: 1280, radius: 14 } },
} as const

/** A page-level media query that stays in step with the window. */
export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [query])
  return match
}

/** Scale that fits a device into the window: by height (minus the page controls) and by width. */
export function useFit(box: Size, reserved: number) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => {
      const byH = (window.innerHeight - reserved - 48) / box.h
      const byW = (window.innerWidth - 24) / box.w
      setScale(Math.max(0.2, Math.min(1, byH, byW)))
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [box.w, box.h, reserved])
  return scale
}
