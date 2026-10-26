import { motion } from "motion/react"
import { SlidingNumber } from "@/components/ui/sliding-number"
import { IconCheck, IconChevronRight, IconSparkles } from "@tabler/icons-react"
import { AvatarSlot } from "@/components/ios/ReviewRow"
import { agentPlan, type ReviewItem } from "@/data/needsReview"
import { SPRING_FAST } from "@/lib/motion"

const SPRING = { type: "spring" as const, ...SPRING_FAST.snappy }

/**
 * Everything the agent has finished, collected into one group at the top of the page, collapsed. Its count goes up as
 * rows complete; tapping it opens the list of what was done.
 */
export function ReviewCompleted({ items, open, onToggle, accent, photos }: { items: ReviewItem[]; open: boolean; onToggle: () => void; accent: string; photos: boolean }) {
  return (
    <div className="mb-5 overflow-hidden rounded-[20px] bg-[#f3f2f6] tracking-[-0.43px]">
      <button onClick={onToggle} aria-expanded={open} className="flex min-h-12 w-full items-center gap-2 px-4 text-left active:opacity-60">
        {/* Pops each time another task lands in the group, as the count rolls up. */}
        <motion.span key={items.length} initial={{ scale: 1.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 420, damping: 14 }} className="flex shrink-0" style={{ color: accent }}>
          <IconSparkles size={18} stroke={2} />
        </motion.span>
        <span className="flex-1 text-[17px] font-[590] leading-[22px] text-black">Assistant Tasks</span>
        <span className="text-[15px] leading-5 text-[#8e8e93]" aria-label={`${items.length} completed`}>
          <SlidingNumber value={items.length} />
        </span>
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={SPRING} className="flex text-[#c7c7cc]">
          <IconChevronRight size={16} stroke={2.5} />
        </motion.span>
      </button>
      <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={SPRING} className="overflow-hidden" aria-hidden={!open} inert={!open}>
        <ul className="pb-1">
          {items.map((i) => (
            <li key={i.id} className="flex items-center border-t border-black/[0.07] px-4 py-3">
              <AvatarSlot show={photos} people={i.people ?? [i.title]} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-[590] leading-[22px] text-black">{i.title}</span>
                <span className="flex items-center gap-1 text-[15px] leading-5 text-[#8e8e93]">
                  <IconCheck size={15} stroke={2.5} className="shrink-0" />
                  <span className="truncate">{agentPlan(i).done}</span>
                </span>
              </span>
              <span className="ml-3 shrink-0 self-start pt-[3px] text-[13px] leading-[18px] text-[#7f7f7f]">Just now</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
