import type { ReactNode } from "react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { cn } from "@/lib/utils"

/**
 * iOS popover (Figma ".iOS popover backgrounds", light): a glass body with a small
 * arrow callout that points at what it's about. `down` puts the arrow under the body
 * (the popover sits above its target), `up` puts it on top, `none` is a plain bubble.
 *
 * The body is real `LiquidGlass` (medium). Don't put it under an element whose opacity
 * animates — see "Glass: never put it under a fading ancestor" in CLAUDE.md.
 */
export function Popover({
  arrow = "down",
  className,
  children,
}: {
  arrow?: "down" | "up" | "none"
  className?: string
  children: ReactNode
}) {
  const callout = (
    <span
      aria-hidden
      className={cn("block h-[10px] w-[22px]", arrow === "down" ? "-mt-px" : "-mb-px")}
      style={{
        // Pointed tip with a slightly chamfered point, same translucent white as the glass fill.
        clipPath:
          arrow === "down"
            ? "polygon(0 0, 100% 0, 63% 82%, 50% 100%, 37% 82%)"
            : "polygon(37% 18%, 50% 0, 63% 18%, 100% 100%, 0 100%)",
        backgroundColor: "rgba(250,250,250,0.78)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    />
  )
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {arrow === "up" && callout}
      <LiquidGlass mode="medium" radius={22} className="px-[14px] py-[8px]">
        {children}
      </LiquidGlass>
      {arrow === "down" && callout}
    </div>
  )
}
