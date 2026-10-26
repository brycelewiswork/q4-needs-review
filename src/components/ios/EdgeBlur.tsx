import { LinearBlur } from "@/components/ui/progressive-blur"

/** One edge. `false` (or omitted) turns it off; `true` uses the defaults. */
export type EdgeBlurSide =
  | boolean
  | {
      /** Peak backdrop blur in px at the very edge. */
      strength?: number
      /** Number of stacked blur layers in the ramp. */
      steps?: number
      /** Height of the effect — px, or any CSS length (e.g. "calc(var(--safe-top) + 64px)"). */
      height?: number | string
      /** Color the content fades toward (alpha is the strength at the very edge). `false` = no color overlay, blur only. */
      tint?: string | false
    }

export type EdgeBlurConfig = { top?: EdgeBlurSide; bottom?: EdgeBlurSide }

// The page color at 70%. A variable so dark mode can swap it (see ios-dark.css).
const PAGE = "var(--ios-page-tint, rgba(243,242,246,0.7))"
const DEFAULTS = { strength: 20, steps: 6, height: 70, tint: PAGE }

function resolve(side: EdgeBlurSide | undefined) {
  if (!side) return null
  return { ...DEFAULTS, ...(side === true ? {} : side) }
}

// Eased (not linear) falloff for the tint so it never reads as a hard edge.
const EASE_STOPS = [1, 0.56, 0.25, 0.06, 0]

function Edge({ side, cfg, radius }: { side: "top" | "bottom"; cfg: ReturnType<typeof resolve> & object; radius?: number | string }) {
  const dir = side === "top" ? "to bottom" : "to top"
  const stops = cfg.tint
    ? EASE_STOPS.map((a, i) => `color-mix(in srgb, ${cfg.tint} ${a * 100}%, transparent) ${i * 25}%`).join(", ")
    : null
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 z-10 ${side === "top" ? "top-0" : "bottom-0"}`}
      style={{
        height: cfg.height,
        ...(radius
          ? side === "top"
            ? { borderTopLeftRadius: radius, borderTopRightRadius: radius }
            : { borderBottomLeftRadius: radius, borderBottomRightRadius: radius }
          : null),
      }}
    >
      {/* Blur layers carry no tint of their own — they'd stack it to near-opaque. */}
      {/* rounded-[inherit]: LinearBlur's layers inherit THIS element's radius, which has to come from
          the wrapper — without it the root is square and the blur spills past the sheet's rounded corners. */}
      <LinearBlur side={side} strength={cfg.strength} steps={cfg.steps} tint="transparent" className="rounded-[inherit]" />
      {stops && <div className="absolute inset-0 rounded-[inherit]" style={{ backgroundImage: `linear-gradient(${dir}, ${stops})` }} />}
    </div>
  )
}

/**
 * iOS scroll-edge effect: content softens as it scrolls under a top and/or
 * bottom bar. Top and bottom are configured independently. Place it inside a
 * `relative` container, above the scrolling content and below the bars.
 */
/** `radius`: the corner radius of what the blur sits in, a number or a CSS length (`var(--drawer-radius)`). */
export function EdgeBlur({ top, bottom, radius }: EdgeBlurConfig & { radius?: number | string }) {
  const t = resolve(top)
  const b = resolve(bottom)
  return (
    <>
      {t && <Edge side="top" cfg={t} radius={radius} />}
      {b && <Edge side="bottom" cfg={b} radius={radius} />}
    </>
  )
}
