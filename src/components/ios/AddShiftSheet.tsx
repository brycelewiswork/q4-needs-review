import { useState, type MouseEvent } from "react"
import { ContextMenu } from "@/components/ios/ContextMenu"
import { Sheet } from "@/components/ios/Sheet"
import { Card, Initials, ListRow } from "@/components/ios/list"
import { CheckAction, FormHeader, SpanCard, shortDate } from "@/components/ios/formKit"
import { WireValue } from "@/components/wire/Wire"
import { LOCATIONS, type Location } from "@/data/locations"
import { addDays, dayLabel, mondayOf } from "@/lib/dates"
import { roleColor } from "@/lib/roleColor"
import { useDateStore } from "@/store/useDateStore"
import { useShiftsStore } from "@/store/useShiftsStore"
import { canSwitchLocation, useUserTypeStore } from "@/store/useUserTypeStore"
import { useLocName, useStructure } from "@/store/useViewStore"

const shortName = (n: string) => {
  const [f, ...rest] = n.split(" ")
  return rest.length ? `${f} ${rest[rest.length - 1][0]}.` : f
}

/**
 * Add shift, from the Shifts tab's plus: where, who, the role, which days of the week, and when. A bottom sheet with
 * a checkmark at the top right. Adding puts the shift on each chosen day at that location.
 */
export function AddShiftSheet({ loc, onClose }: { loc: Location; onClose: () => void }) {
  const wire = useStructure()
  const locName = useLocName()
  const multi = useUserTypeStore((s) => canSwitchLocation(s.type))
  const sharedDate = useDateStore((s) => s.date)
  const add = useShiftsStore((s) => s.add)

  const [locId, setLocId] = useState(loc.id)
  const target = LOCATIONS.find((l) => l.id === locId) ?? loc
  const roles = target.employee.timeClock?.roles ?? Array.from(new Set(target.team.map((m) => m.role)))
  const [who, setWho] = useState("open")
  const [role, setRole] = useState(roles[0])
  const [day, setDay] = useState(sharedDate)
  const [span, setSpan] = useState<[number, number]>([9, 17])
  const [note, setNote] = useState("")
  const [menu, setMenu] = useState<{ kind: "loc" | "who" | "role" | "day"; anchor: HTMLElement } | null>(null)
  const open = (kind: "loc" | "who" | "role" | "day") => (e: MouseEvent<HTMLElement>) => setMenu({ kind, anchor: e.currentTarget })

  // "8 hr", or "8 hr 30 min"
  const mins = Math.round((span[1] - span[0]) * 60)
  const duration = mins % 60 === 0 ? `${mins / 60} hr` : `${Math.floor(mins / 60)} hr ${mins % 60} min`
  const week = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sharedDate), i))
  const people = [{ id: "open", label: "Open shift" }, ...target.team.map((m, i) => ({ id: m.name, label: wire ? `Person ${i + 1}` : m.name }))]

  const pickLocation = (id: string) => {
    const next = LOCATIONS.find((l) => l.id === id)!
    setLocId(id)
    setWho("open")
    setRole((next.employee.timeClock?.roles ?? [])[0] ?? role)
  }
  const pickWho = (id: string) => {
    setWho(id)
    const member = target.team.find((m) => m.name === id)
    if (member) setRole(member.role)
  }
  const save = (dismiss: () => void) => {
    add(target.id, day, { who: who === "open" ? "Open shift" : shortName(who), role, start: span[0], end: span[1], open: who === "open" })
    dismiss()
  }

  return (
    <Sheet
      title="Add shift"
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      action={(dismiss) => <CheckAction ready onDone={() => save(dismiss)} label="Add shift" />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        <FormHeader title="Basic details" />
        <Card className="overflow-hidden">
          <ListRow first chevron={multi ? "updown" : undefined} onClick={multi ? open("loc") : undefined} title="Location" trailing={locName(target)} />
          <ListRow
            chevron="updown"
            onClick={open("who")}
            title="Team member"
            trailing={
              <span className="flex items-center gap-2">
                {who !== "open" && !wire && <Initials name={who} size={28} />}
                <WireValue>{people.find((p) => p.id === who)!.label}</WireValue>
              </span>
            }
          />
          <ListRow
            chevron="updown"
            onClick={open("role")}
            title="Role"
            trailing={
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-full" style={{ backgroundColor: roleColor(role) }} />
                <WireValue>{role}</WireValue>
              </span>
            }
          />
        </Card>

        <FormHeader title="Date & time" />
        <Card className="overflow-hidden">
          {/* The date field, as iOS draws it: the value in a grey capsule. */}
          <ListRow
            first
            title="Date"
            trailing={
              <button onClick={open("day")} aria-haspopup="menu" aria-label="Date" className="flex h-9 items-center rounded-full bg-[rgba(120,120,128,0.12)] px-4 text-[17px] leading-[22px] text-[#2c2935] active:opacity-60">
                <WireValue w={80}>{shortDate(day)}</WireValue>
              </button>
            }
          />
          <ListRow title="Time" trailing={<WireValue w={56}>{duration}</WireValue>} />
          <SpanCard bare span={span} onChange={setSpan} labels={["Start time", "End time"]} wire={wire} />
        </Card>

        <Card className="mt-2 p-4">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} aria-label="Shift note" placeholder="Add a shift note..." className="block w-full resize-none bg-transparent text-[17px] leading-[22px] tracking-[-0.43px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]" />
        </Card>
      </div>

      <ContextMenu anchor={menu?.kind === "loc" ? menu.anchor : null} items={LOCATIONS.map((l) => ({ id: l.id, label: locName(l) }))} selectedId={locId} onSelect={pickLocation} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "who" ? menu.anchor : null} items={people} selectedId={who} onSelect={pickWho} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "day" ? menu.anchor : null} items={week.map((d, i) => ({ id: String(i), label: dayLabel(d) }))} onSelect={(id) => setDay(week[Number(id)])} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "role" ? menu.anchor : null} items={roles.map((r) => ({ id: r, label: r }))} selectedId={role} onSelect={setRole} onClose={() => setMenu(null)} />
    </Sheet>
  )
}
