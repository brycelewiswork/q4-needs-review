import { useRef, useState } from "react"
import { motion } from "motion/react"
import { IconChevronDown, IconSearch } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }
/** The filter button's two widths: a circle, and the "Filtered by Unread" pill. */
const CIRCLE = 44
const PILL = 164

const mask = (url: string) => ({
  maskImage: `url(${url})`,
  WebkitMaskImage: `url(${url})`,
  maskSize: "100% 100%",
  WebkitMaskSize: "100% 100%",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
})

/**
 * The bottom bar of the Needs Review page, in two states.
 *
 * At rest: a filter button at the left, a search field filling the rest. Tapping the filter button filters to unread
 * right away, and the bar animates (like Mail's) into its filtered state: the button widens into a "Filtered by Unread"
 * pill and the search field folds down to a search button at the right. The pill's blue circle clears the filter; its
 * label opens the filters sheet. Tapping the search button opens the field again beside the circle.
 */
export function ReviewBar({
  query,
  onQuery,
  filtered,
  summary,
  onFilter,
  onClear,
  onOptions,
}: {
  query: string
  onQuery: (q: string) => void
  /** Any filter is on. */
  filtered: boolean
  /** What's filtered, in a few words, for the pill: "Unread", "Unread, 2 roles". */
  summary: string
  /** The filter button at rest: turns on the first filter (unread). */
  onFilter: () => void
  /** The pill's blue circle: turns every filter off. */
  onClear: () => void
  /** The pill's label: opens the filters sheet. */
  onOptions: () => void
}) {
  const [searching, setSearching] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  // The search field is a full field at rest and while searching; folded to a button when filtered and not searching.
  const folded = filtered && !searching
  // The label shows only while there's room for it: filtered, and not squeezed by the open search field.
  const pill = filtered && !searching

  const clearFilter = () => {
    onClear()
    setSearching(false)
  }

  return (
    <div className="flex items-center justify-between gap-2 px-7 pb-8 pt-1">
      <motion.div initial={false} animate={{ width: pill ? PILL : CIRCLE }} transition={SPRING} className="shrink-0">
        <LiquidGlass mode="small" radius={999} className="flex h-11 w-full items-center overflow-hidden p-1">
          <button
            onClick={() => (filtered ? clearFilter() : onFilter())}
            aria-label={filtered ? "Clear filter" : "Filter by unread"}
            aria-pressed={filtered}
            className={cn("flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200", filtered ? "bg-[#007aff]" : "bg-transparent")}
          >
            <span aria-hidden className={cn("block h-4 w-5 transition-colors duration-200", filtered ? "bg-white" : "bg-[#141414]")} style={mask("/phone/sf-filter.svg")} />
          </button>
          <motion.button
            initial={false}
            animate={{ opacity: pill ? 1 : 0 }}
            transition={{ duration: 0.15 }}
            onClick={onOptions}
            aria-haspopup="dialog"
            aria-label="Filter options"
            tabIndex={pill ? 0 : -1}
            className={cn("ml-[10px] flex min-w-0 flex-col items-start whitespace-nowrap text-left leading-[17px] tracking-[-0.23px]", !pill && "pointer-events-none")}
          >
            <span className="text-[14px] font-[510] text-[#141414]">Filtered by</span>
            <span className="flex max-w-[96px] items-center gap-[2px] text-[14px] font-[510] text-[#007aff]">
              <span className="truncate">{summary}</span>
              <IconChevronDown size={14} stroke={2.5} className="shrink-0" />
            </span>
          </motion.button>
        </LiquidGlass>
      </motion.div>

      <motion.div
        initial={false}
        animate={folded ? { flexGrow: 0, flexBasis: `${CIRCLE}px` } : { flexGrow: 1, flexBasis: "0px" }}
        transition={SPRING}
        className="min-w-0"
      >
        <LiquidGlass mode="small" radius={999} className="relative flex h-11 w-full items-center overflow-hidden">
          <label className="flex h-full w-full items-center gap-1 pl-[11px] pr-[10px] text-[16px] font-normal tracking-[-0.43px]">
            <IconSearch size={20} stroke={1.75} className="shrink-0 text-[#141414]" />
            <input
              ref={input}
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search"
              aria-label="Search"
              tabIndex={folded ? -1 : 0}
              className="min-w-0 flex-1 bg-transparent text-[#141414] outline-none placeholder:text-[#5c5c5c]"
            />
            <span aria-hidden className="block h-4 w-[11px] shrink-0 bg-[#727272]" style={mask("/phone/kb-mic.svg")} />
          </label>
          {/* Folded to a button: this sits over the field and opens it. */}
          {folded && (
            <button
              onClick={() => {
                setSearching(true)
                requestAnimationFrame(() => input.current?.focus())
              }}
              aria-label="Search"
              className="absolute inset-0"
            />
          )}
        </LiquidGlass>
      </motion.div>

    </div>
  )
}
