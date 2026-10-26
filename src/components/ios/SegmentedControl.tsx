import { useId, type ReactNode } from "react"
import { motion } from "motion/react"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** iOS segmented control: a tinted track with a white thumb that slides to the selected segment. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { id: T; label: ReactNode; /** For icon-only segments: the name screen readers use. */ ariaLabel?: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  const thumb = useId()
  return (
    <div role="tablist" className={cn("flex h-8 rounded-full bg-[#767680]/[0.12] p-[2px] dark:bg-white/10", className)}>
      {options.map((o) => {
        const on = o.id === value
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={on}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.id)}
            className="relative flex flex-1 items-center justify-center rounded-full text-[15px] tracking-[-0.43px] text-[#2c2935] dark:text-neutral-100"
          >
            {on && (
              <motion.span
                layoutId={thumb}
                transition={{ type: "spring", ...SPRING_FAST.snappy }}
                className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:bg-neutral-600"
              />
            )}
            <span className={cn("relative", on ? "font-[590]" : "font-normal")}>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
