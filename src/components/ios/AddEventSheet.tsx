import { useState, type MouseEvent } from "react"
import { ContextMenu } from "@/components/ios/ContextMenu"
import { Sheet } from "@/components/ios/Sheet"
import { Card, GroupFooter, ListRow } from "@/components/ios/list"
import { CheckAction, FormHeader, shortDate } from "@/components/ios/formKit"
import { WireValue } from "@/components/wire/Wire"
import { LOCATIONS, type Location } from "@/data/locations"
import { addDays, dayLabel, mondayOf } from "@/lib/dates"
import { useDateStore } from "@/store/useDateStore"
import { canSwitchLocation, useUserTypeStore } from "@/store/useUserTypeStore"
import { useLocName, useStructure } from "@/store/useViewStore"

/**
 * Create event, from the Shifts tab's plus: events show on the schedule for the whole team. A bottom sheet with a
 * checkmark at the top right, ready once the event has a title.
 */
export function AddEventSheet({ loc, onClose }: { loc: Location; onClose: () => void }) {
  const wire = useStructure()
  const locName = useLocName()
  const multi = useUserTypeStore((s) => canSwitchLocation(s.type))
  const sharedDate = useDateStore((s) => s.date)
  const [locId, setLocId] = useState(loc.id)
  const target = LOCATIONS.find((l) => l.id === locId) ?? loc
  const [day, setDay] = useState(sharedDate)
  const [title, setTitle] = useState("")
  const [details, setDetails] = useState("")
  const [menu, setMenu] = useState<{ kind: "loc" | "day"; anchor: HTMLElement } | null>(null)
  const open = (kind: "loc" | "day") => (e: MouseEvent<HTMLElement>) => setMenu({ kind, anchor: e.currentTarget })
  const week = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sharedDate), i))
  const ready = wire || title.trim().length > 0
  const field = "block w-full resize-none bg-transparent text-[17px] leading-[22px] tracking-[-0.43px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]"

  return (
    <Sheet
      title="Create event"
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      // The toolbar title mirrors the title field below, until there is one to show.
      titleSlot={<span className="pointer-events-none max-w-full truncate text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">{title.trim() || "Create event"}</span>}
      action={(dismiss) => <CheckAction ready={ready} onDone={dismiss} label="Create event" />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        {/* The title: a centred, larger field with no header. The toolbar above mirrors it. */}
        <Card className="px-4 py-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Event title" placeholder="Event title" className="block w-full bg-transparent text-center text-[24px] font-[590] leading-8 tracking-[-0.26px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]" />
        </Card>

        <FormHeader title="Event details" />
        <Card className="overflow-hidden">
          <ListRow first chevron={multi ? "updown" : undefined} onClick={multi ? open("loc") : undefined} title="Location" trailing={locName(target)} />
          <ListRow
            title="Date"
            trailing={
              <button onClick={open("day")} aria-haspopup="menu" aria-label="Date" className="flex h-9 items-center rounded-full bg-[rgba(120,120,128,0.12)] px-4 text-[17px] leading-[22px] text-[#2c2935] active:opacity-60">
                <WireValue w={80}>{shortDate(day)}</WireValue>
              </button>
            }
          />
          {/* The details field joins the section, under a divider. */}
          <div className="border-t border-[#ebebeb] p-4">
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} aria-label="Event details" placeholder="Add details for this event..." className={field} />
          </div>
        </Card>
        <GroupFooter>Events will be added to the schedule for the entire team to view.</GroupFooter>
      </div>

      <ContextMenu anchor={menu?.kind === "loc" ? menu.anchor : null} items={LOCATIONS.map((l) => ({ id: l.id, label: locName(l) }))} selectedId={locId} onSelect={setLocId} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "day" ? menu.anchor : null} items={week.map((d, i) => ({ id: String(i), label: dayLabel(d) }))} onSelect={(id) => setDay(week[Number(id)])} onClose={() => setMenu(null)} />
    </Sheet>
  )
}
