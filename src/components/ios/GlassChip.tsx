import type { ReactNode } from "react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { cn } from "@/lib/utils"

/**
 * Designbase "iOS Tag Filter Chip", type=Label, size=Small, style=glass (Figma 60799:30780 / 60799:30708).
 * 32pt pill, 10pt side padding, 15pt label (regular — 510 renders too heavy here). Default is plain glass with #141414 text; `active` tints the
 * glass with the brand color and turns the label white.
 */
export function GlassChip({
  active,
  onClick,
  children,
  className,
  ariaLabel,
}: {
  active?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  children: ReactNode
  className?: string
  /** For an icon-only chip: the label screen readers use. */
  ariaLabel?: string
}) {
  return (
    <LiquidGlass mode="small" accent={active ? "#8f55e5" : undefined} radius={999} className="inline-flex h-8 shrink-0">
      <button
        onClick={onClick}
        aria-pressed={active}
        aria-label={ariaLabel}
        className={cn(
          "flex h-full items-center justify-center rounded-full px-[10px] text-[15px] font-normal leading-4 tracking-[-0.43px] whitespace-nowrap transition-colors duration-200 active:opacity-70",
          active ? "text-white" : "text-[#141414]",
          className,
        )}
      >
        {children}
      </button>
    </LiquidGlass>
  )
}
