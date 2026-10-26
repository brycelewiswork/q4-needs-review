import type { ReactNode } from "react"
import { IconCheck } from "@tabler/icons-react"
import { RangeSlider } from "@/components/RangeSlider"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { Card } from "@/components/ios/list"
import { WireValue } from "@/components/wire/Wire"
import { MONTHS } from "@/lib/dates"
import { cn } from "@/lib/utils"

/** The pieces the Add time card / Add shift / Create event sheets share. */

/** 13.5 → "1:30 pm" */
export const clock = (h: number) => {
  const whole = Math.floor(h)
  const m = Math.round((h - whole) * 60)
  return `${whole % 12 === 0 ? 12 : whole % 12}:${String(m).padStart(2, "0")} ${whole % 24 >= 12 ? "pm" : "am"}`
}
/** 7.5 → "7 hr 30 min" */
export const hm = (hours: number) => `${Math.floor(hours)} hr ${Math.round((hours - Math.floor(hours)) * 60)} min`
/** Oct 14, 2026 */
export const shortDate = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`

/** A section header: the title, with a value and/or a button at the right. */
export function FormHeader({ title, trailing, action }: { title: string; trailing?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 tracking-[-0.43px]">
      <h3 className="text-[17px] font-[590] leading-[22px] text-[#747182]">{title}</h3>
      {trailing && <span className="text-[15px] leading-5 text-[#7f7f7f]">{trailing}</span>}
      {action}
    </div>
  )
}

/** The sheet's confirm button: a checkmark in glass at the top right, purple once the form is ready. */
export function CheckAction({ ready, onDone, label }: { ready: boolean; onDone: () => void; label: string }) {
  return (
    <LiquidGlass mode="small" accent={ready ? "#8f55e5" : undefined} radius={999} className="absolute right-4 top-4 flex size-11 items-center justify-center">
      <button onClick={onDone} disabled={!ready} aria-label={label} className={cn("flex size-9 items-center justify-center rounded-full", ready ? "text-white" : "text-[#b9b8c1]")}>
        <IconCheck size={24} stroke={2} />
      </button>
    </LiquidGlass>
  )
}

/** Start and end on one two-sided slider, with both times above it. Values are bars in the structure cut. */
export function SpanCard({ span, onChange, labels, wire, bare }: { span: [number, number]; onChange: (v: [number, number]) => void; labels: [string, string]; wire: boolean; /** Sit inside another card (under a row) instead of being a card itself. */ bare?: boolean }) {
  const Wrap = bare ? "div" : Card
  return (
    <Wrap className={bare ? "border-t border-[#ebebeb] px-4 pb-2 pt-3" : "px-4 pb-2 pt-3"}>
      {/* The times ride above their handles, so there is no separate label row. */}
      <RangeSlider
        className="mt-7"
        min={5}
        max={24}
        step={0.25}
        value={span}
        onChange={onChange}
        labels={labels}
        disabled={wire}
        renderValue={(v) => <WireValue w={56}>{clock(v)}</WireValue>}
      />
      <div aria-hidden className="relative mx-[14px] h-4 text-[11px] leading-4 text-[#b9b8c1]">
        {[["5a", 5], ["12p", 12], ["6p", 18], ["12a", 24]].map(([l, h]) => (
          <span key={l} className="absolute -translate-x-1/2" style={{ left: `${(((h as number) - 5) / 19) * 100}%` }}>{l}</span>
        ))}
      </div>
    </Wrap>
  )
}
