import type { ReactNode } from "react"
import { Card } from "@/components/ios/list"
import { cn } from "@/lib/utils"
import { useStructure } from "@/store/useViewStore"

/**
 * The structure cut's building blocks (iOS). A screen keeps its titles and navigation; its content
 * becomes a flat grey bar, an empty card, or a list of skeleton rows.
 */

/** A flat placeholder bar: a line of text that isn't there. */
export function Bar({ w = "100%", h = 12, className }: { w?: number | string; h?: number; className?: string }) {
  return <span aria-hidden className={cn("block shrink-0 rounded-full bg-[#dedde4]", className)} style={{ width: w, height: h }} />
}

/** Placeholder lines standing in for a paragraph. */
export function BarLines({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-2 py-3", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Bar key={i} w={i === lines - 1 ? "62%" : "100%"} h={14} />
      ))}
    </div>
  )
}

/** A card with a title and nothing in it. */
export function WireCard({ title, h = 120, className, children }: { title?: ReactNode; h?: number; className?: string; children?: ReactNode }) {
  return (
    <Card className={cn("relative tracking-[-0.43px]", className)}>
      <div className="flex flex-col p-4" style={{ minHeight: h }}>
        {title && <p className="text-[15px] font-[510] leading-[22px] text-black">{title}</p>}
        {children}
      </div>
    </Card>
  )
}

/** A card of skeleton rows: an avatar disc, two lines, and (optionally) a short trailing bar. */
export function WireList({ rows = 3, avatar = true, trailing = false, className }: { rows?: number; avatar?: boolean; trailing?: boolean; className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="px-4" aria-hidden>
          <div className={cn("flex items-center gap-3 py-3", i > 0 && "border-t border-[#ebebeb]")}>
            {avatar && <span className="size-10 shrink-0 rounded-full bg-[#dedde4]" />}
            <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
              <Bar w="55%" h={12} />
              <Bar w="35%" h={10} />
            </span>
            {trailing && <Bar w={44} h={12} />}
          </div>
        </div>
      ))}
    </Card>
  )
}

/** A value in a row: shown as is in the full design, a short bar in the structure cut. */
export function WireValue({ children, w = 70 }: { children: ReactNode; w?: number }) {
  const wire = useStructure()
  return wire ? <Bar w={w} h={12} /> : <>{children}</>
}
