import { cn } from "@/lib/utils"

const k = (n: number) => `$${Math.round(n / 1000)}K`
export { k as shortMoney }

/**
 * A wireframe sales-and-labor bar chart: a pair of gray bars per day (sales, then the shorter labor beside it), with the
 * days still to come drawn paler from the forecast. Gray on purpose, it stands in for the real chart in menus and rows.
 */
export function WireBars({ sales, labor, forecast, h = 28, className }: { sales: number[]; labor: number[]; forecast: number[]; h?: number; className?: string }) {
  const value = (i: number) => sales[i] || forecast[i] || 0
  const max = Math.max(...sales.map((_, i) => value(i)), 1)
  return (
    <span aria-hidden className={cn("flex shrink-0 items-end gap-[3px]", className)} style={{ height: h }}>
      {sales.map((_, i) => {
        const future = !sales[i]
        return (
          <span key={i} className="flex items-end gap-px">
            <span className={cn("block w-[3px] rounded-t-[1px]", future ? "bg-black/[0.12]" : "bg-black/30")} style={{ height: Math.max(2, (value(i) / max) * h) }} />
            <span className={cn("block w-[3px] rounded-t-[1px]", future ? "bg-black/[0.06]" : "bg-black/[0.16]")} style={{ height: Math.max(2, ((labor[i] || 0) / max) * h) }} />
          </span>
        )
      })}
    </span>
  )
}
