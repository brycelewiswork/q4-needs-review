import { useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A two-sided slider: two thumbs on one track, the span between them filled. Drag either thumb, or focus one and
 * use the arrow keys. The thumbs can't cross.
 */
export function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  labels,
  disabled,
  className,
  renderValue,
}: {
  min: number
  max: number
  step: number
  value: [number, number]
  onChange: (v: [number, number]) => void
  /** Screen-reader names for the two thumbs. */
  labels: [string, string]
  disabled?: boolean
  className?: string
  /** Draws each value above its thumb, riding along with it. Room above the slider is the caller's to leave. */
  renderValue?: (v: number) => ReactNode
}) {
  const track = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = track.current
    if (!el) return
    setW(el.offsetWidth)
    const ro = new ResizeObserver(() => setW(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const pct = (v: number) => ((v - min) / (max - min)) * 100
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min))

  const set = (which: 0 | 1, raw: number) => {
    const v = snap(raw)
    if (which === 0) onChange([Math.min(v, value[1] - step), value[1]])
    else onChange([value[0], Math.max(v, value[0] + step)])
  }
  const fromX = (clientX: number) => {
    const r = track.current!.getBoundingClientRect()
    return min + ((clientX - r.left) / r.width) * (max - min)
  }
  const drag = (which: 0 | 1) => (e: React.PointerEvent<HTMLSpanElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => set(which, fromX(ev.clientX))
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }
  // Value labels sit centred over their thumbs. Close together, they part so they never overlap; at the ends they
  // stay inside the card.
  const LABEL_W = 72
  const xs = value.map((v) => (pct(v) / 100) * w)
  const part = Math.max(0, LABEL_W + 4 - (xs[1] - xs[0])) / 2
  const centres = [xs[0] - part, xs[1] + part].map((x) => Math.min(w + 22 - LABEL_W / 2, Math.max(-22 + LABEL_W / 2, x)))
  const key = (which: 0 | 1) => (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? step : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -step : 0
    if (!d || disabled) return
    e.preventDefault()
    set(which, value[which] + d)
  }

  return (
    <div className={cn("relative h-10 touch-none select-none", className)}>
      <div ref={track} className="absolute inset-x-[14px] top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-[#e5e5ea]">
        <div className="absolute inset-y-0 rounded-full bg-[#8f55e5]" style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
        {([0, 1] as const).map((i) => (
          <span
            key={i}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={labels[i]}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value[i]}
            aria-disabled={disabled}
            onPointerDown={drag(i)}
            onKeyDown={key(i)}
            className={cn("absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)] outline-none focus-visible:ring-2 focus-visible:ring-[#8f55e5]/60", !disabled && "cursor-grab active:cursor-grabbing")}
            style={{ left: `${pct(value[i])}%` }}
          >
            {renderValue && (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-[2px] flex justify-center text-[15px] leading-5 text-[#2c2935]" style={{ width: LABEL_W, marginLeft: -LABEL_W / 2 + (centres[i] - xs[i]) }}>
                {renderValue(value[i])}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
