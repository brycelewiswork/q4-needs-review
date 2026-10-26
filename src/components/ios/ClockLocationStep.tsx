import { motion } from "motion/react"
import { ListRow } from "@/components/ios/list"
import { LOCATIONS, type Location } from "@/data/locations"
import { nextShiftDay, scheduledToday } from "@/store/useTimeClockStore"
import { useLocName, useStructure } from "@/store/useViewStore"

/**
 * The first step of the time clock for someone with several locations: which one are they clocking in for?
 * Home has no location, so the clock can't assume one. Most people have a single scheduled location on a given
 * day, and the row says so, which makes it a second's work. Someone already clocked in somewhere skips this.
 */
export function ClockLocationStep({ onPick }: { onPick: (l: Location) => void }) {
  const locName = useLocName()
  const wire = useStructure()
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="absolute inset-x-4" style={{ top: 44 }}>
        <h3 className="text-[22px] font-[590] leading-7 tracking-[-0.26px] text-[#1a1a1a]">Where are you working?</h3>
        <p className="mt-[2px] text-[15px] leading-5 tracking-[-0.24px] text-[#5a5666]">Choose the location you're clocking in for.</p>
      </div>
      <div className="absolute inset-x-4 overflow-hidden bg-black/[0.07]" style={{ top: 132, borderRadius: 26 }}>
        {LOCATIONS.map((l, i) => {
          const today = scheduledToday(l)
          const hint = today ? (wire ? "Scheduled today" : `Scheduled today, ${l.employee.timeClock.shift}`) : `No shift today, next ${nextShiftDay(l)}`
          return <ListRow key={l.id} compact first={i === 0} divider="border-black/[0.09]" chevron onClick={() => onPick(l)} title={locName(l)} subtitle={hint} />
        })}
      </div>
    </motion.div>
  )
}
