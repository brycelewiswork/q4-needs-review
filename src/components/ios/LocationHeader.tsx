import { useContext, type ReactNode } from "react"
import { IconChevronRight } from "@tabler/icons-react"
import type { Location } from "@/data/locations"
import { OpenLocationContext } from "@/store/useLocationStore"
import { useLocName } from "@/store/useViewStore"

/** The caption above one location's share of a list, in "all locations". */
export function LocationHeader({ loc, className }: { loc: Location; className?: string }) {
  const name = useLocName()
  const open = useContext(OpenLocationContext)
  const cls = `px-4 pb-1 pt-3 text-[13px] font-[590] leading-[18px] tracking-[-0.08px] text-[#7f7f7f] ${className ?? ""}`
  // On the Home overview a header is also the way into that location's own view.
  if (open) {
    return (
      <h3 className={cls}>
        <button onClick={(e) => open(loc, e.currentTarget, <span className="flex items-center gap-[2px] px-4 text-[13px] font-[590] leading-[18px] text-[#7f7f7f]">{name(loc)}</span>)} className="flex items-center gap-[2px] text-left active:opacity-60">
          {name(loc)}
          <IconChevronRight size={13} stroke={2.5} className="shrink-0" />
        </button>
      </h3>
    )
  }
  return <h3 className={cls}>{name(loc)}</h3>
}

/**
 * Wherever data from several locations could sit side by side, render it through this: one location (the
 * usual case) renders as is, "all locations" renders each location's share under its own header.
 */
export function ByLocation({ scope, children }: { scope: Location[]; children: (l: Location) => ReactNode }) {
  if (scope.length === 1) return <>{children(scope[0])}</>
  return (
    <>
      {scope.map((l) => (
        <div key={l.id}>
          <LocationHeader loc={l} />
          {children(l)}
        </div>
      ))}
    </>
  )
}
