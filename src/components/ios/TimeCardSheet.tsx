import { useState, type MouseEvent } from "react"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { ContextMenu } from "@/components/ios/ContextMenu"
import { CheckAction, FormHeader, SpanCard, clock, hm, shortDate } from "@/components/ios/formKit"
import { Sheet } from "@/components/ios/Sheet"
import { Card, ListRow } from "@/components/ios/list"
import { Bar, WireValue } from "@/components/wire/Wire"
import type { Location } from "@/data/locations"
import { addDays, dayLabel, mondayOf } from "@/lib/dates"
import { useDateStore } from "@/store/useDateStore"
import { useLocName, useStructure } from "@/store/useViewStore"

type Break = { start: number; len: number }

/**
 * Add time card, opened from the Time tab's plus: who worked, when, their breaks and tips. A bottom sheet with
 * a checkmark button at the top right. The structure cut keeps the labels and swaps the values for empty bars.
 */
export function TimeCardSheet({ loc, onClose }: { loc: Location; onClose: () => void }) {
  const wire = useStructure()
  const locName = useLocName()
  const sharedDate = useDateStore((s) => s.date)
  const [day, setDay] = useState(sharedDate)
  const [who, setWho] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  // One slider for the shift: clocked in at the left thumb, out at the right.
  const [span, setSpan] = useState<[number, number]>([9, 17])
  const [inH, outH] = span
  const [breaks, setBreaks] = useState<Break[]>([])
  const [menu, setMenu] = useState<{ kind: "day" | "who" | "role"; anchor: HTMLElement } | null>(null)
  const open = (kind: "day" | "who" | "role") => (e: MouseEvent<HTMLElement>) => setMenu({ kind, anchor: e.currentTarget })

  const week = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(sharedDate), i))
  const people = loc.team.map((m, i) => ({ id: m.name, label: wire ? `Person ${i + 1}` : m.name }))
  const roles = loc.employee.timeClock?.roles ?? Array.from(new Set(loc.team.map((m) => m.role)))
  const worked = Math.max(0, outH - inH - breaks.reduce((n, b) => n + b.len / 60, 0))
  const valid = !!who && !!role
  const addBreak = () => setBreaks((b) => [...b, { start: Math.min(23, inH + 3 + b.length), len: 30 }])
  const none = <span className="text-[#b9b8c1]">Select</span>

  const ready = wire || valid
  return (
    <Sheet
      title="Add time card"
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      action={(dismiss) => <CheckAction ready={ready} onDone={dismiss} label="Save" />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        <Card className="overflow-hidden">
          <ListRow first chevron="updown" onClick={open("who")} title="Employee" trailing={<WireValue>{who ? people.find((p) => p.id === who)!.label : none}</WireValue>} />
          <ListRow chevron="updown" onClick={open("role")} title="Role" trailing={<WireValue>{role ?? none}</WireValue>} />
          {/* The date field, as iOS draws it: the value in a grey capsule. */}
          <ListRow
            title="Date"
            trailing={
              <button onClick={open("day")} aria-haspopup="menu" aria-label="Date" className="flex h-9 items-center rounded-full bg-[rgba(120,120,128,0.12)] px-4 text-[17px] leading-[22px] text-[#2c2935] active:opacity-60">
                <WireValue w={80}>{shortDate(day)}</WireValue>
              </button>
            }
          />
          <ListRow title="Location" trailing={locName(loc)} />
        </Card>

        <FormHeader title="Worked" trailing={wire ? undefined : hm(worked)} />
        <SpanCard span={span} onChange={setSpan} labels={["Clocked in", "Clocked out"]} wire={wire} />

        <FormHeader
          title={wire ? "Breaks" : `Breaks (${breaks.length})`}
          action={
            <button onClick={addBreak} aria-label="Add a break" className="-my-1 -mr-1 flex size-8 items-center justify-center text-[#8f55e5] active:opacity-60">
              <IconPlus size={24} stroke={2} />
            </button>
          }
        />
        {!wire && breaks.length > 0 && (
          <Card className="overflow-hidden">
            {breaks.map((b, i) => (
              <ListRow
                key={i}
                first={i === 0}
                title={`Break ${i + 1}`}
                subtitle={`${clock(b.start)} – ${clock(b.start + b.len / 60)}`}
                trailing={
                  <button aria-label={`Remove break ${i + 1}`} onClick={() => setBreaks((all) => all.filter((_, j) => j !== i))} className="flex size-8 items-center justify-center rounded-full text-[#d0161f] active:opacity-60">
                    <IconTrash size={20} stroke={1.75} />
                  </button>
                }
              />
            ))}
          </Card>
        )}

        <FormHeader title="Tips" />
        <Card className="overflow-hidden">
          {["Cash tips", "Credit tips"].map((l, i) => (
            <ListRow
              key={l}
              first={i === 0}
              title={l}
              trailing={
                wire ? (
                  <Bar w={64} h={12} />
                ) : (
                  <input aria-label={l} inputMode="decimal" placeholder="$0.00" className="w-24 bg-transparent text-right text-[17px] leading-[22px] tracking-[-0.43px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]" />
                )
              }
            />
          ))}
        </Card>
      </div>

      <ContextMenu anchor={menu?.kind === "day" ? menu.anchor : null} items={week.map((d, i) => ({ id: String(i), label: dayLabel(d) }))} onSelect={(id) => setDay(week[Number(id)])} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "who" ? menu.anchor : null} items={people} selectedId={who ?? undefined} onSelect={setWho} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "role" ? menu.anchor : null} items={roles.map((r) => ({ id: r, label: r }))} selectedId={role ?? undefined} onSelect={setRole} onClose={() => setMenu(null)} />
    </Sheet>
  )
}
