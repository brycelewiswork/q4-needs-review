import { useEffect, useId, useRef, type ReactNode } from "react"
import { motion } from "motion/react"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"

export type ColorTab<T extends string> = { id: T; label: string; icon?: ReactNode; /** The tab's color: fills it when it's selected. */ color: string }

/**
 * Tabs for the top of a page under its title. No backing: the labels sit on the page, and the selected tab is filled
 * with its own color, a pill that slides between them. Scrolls sideways when the tabs outgrow the screen, edges faded.
 */
export function ColorTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly ColorTab<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  const thumb = useId()
  // If the tabs outgrow the screen (a narrow phone, or more tabs later), keep the selected one in view.
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!el || !list.current) return
    list.current.scrollTo({ left: el.offsetLeft - (list.current.clientWidth - el.offsetWidth) / 2, behavior: "smooth" })
  }, [value])
  return (
    <div ref={list} role="tablist" className={cn("[scrollbar-width:none] flex w-full items-center gap-0 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,#000_14px,#000_calc(100%-14px),transparent)] [&::-webkit-scrollbar]:hidden", className)}>
      {tabs.map((t) => {
        const on = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex h-9 shrink-0 items-center gap-1 rounded-full px-2.5 text-[14px] leading-5 tracking-[-0.23px] transition-colors duration-200",
              on ? "font-[590] text-white" : "font-[510] text-[#9a9a9f] active:opacity-60",
            )}
          >
            {on && (
              <motion.span
                layoutId={thumb}
                transition={{ type: "spring", ...SPRING_FAST.snappy }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: t.color }}
              />
            )}
            {t.icon && <span className="relative flex">{t.icon}</span>}
            <span className="relative">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}
