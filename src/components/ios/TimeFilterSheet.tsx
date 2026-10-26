import { useState } from "react"
import { IconCheck, IconSearch } from "@tabler/icons-react"
import { Bar } from "@/components/wire/Wire"
import { Card, Initials, ListRow } from "@/components/ios/list"
import { Sheet } from "@/components/ios/Sheet"
import type { Location } from "@/data/locations"
import { useStructure } from "@/store/useViewStore"

export type FilterKind = "team" | "issues" | "roles"
export type TimeFilters = Record<FilterKind, string[]>
export const NO_FILTERS: TimeFilters = { team: [], issues: [], roles: [] }

export const ISSUE_OPTIONS = ["Missing paid break", "Missing unpaid break", "Late clock-in", "Early clock-out", "Overtime"]

const TITLES: Record<FilterKind, string> = { team: "Team Members", issues: "Issues", roles: "Roles" }

/** The Time page's filters: each a full-height sheet of options, chosen and then applied. */
export function TimeFilterSheet({ kind, loc, value, onApply, onClose }: { kind: FilterKind; loc: Location; value: string[]; onApply: (v: string[]) => void; onClose: () => void }) {
  const wire = useStructure()
  const [draft, setDraft] = useState(value)
  const [query, setQuery] = useState("")
  const toggle = (id: string) => setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const roles = Array.from(new Set(loc.team.map((m) => m.role)))
  const members = loc.team.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()))
  const tick = (on: boolean) => (on ? <IconCheck size={22} stroke={2.5} className="text-[#8f55e5]" /> : <span className="block size-[22px]" />)
  return (
    <Sheet
      title={TITLES[kind]}
      onClose={onClose}
      footer={(dismiss) => (
        <div className="flex gap-3 px-4 pt-3" style={{ paddingBottom: "calc(var(--safe-bottom) + 8px)" }}>
          <button onClick={() => setDraft([])} className="h-12 flex-1 rounded-full bg-[#787880]/[0.16] text-[17px] font-[590] tracking-[-0.43px] text-black active:opacity-80">Clear</button>
          <button onClick={() => { onApply(draft); dismiss() }} className="h-12 flex-1 rounded-full bg-[#8f55e5] text-[17px] font-[590] tracking-[-0.43px] text-white active:opacity-80">Apply</button>
        </div>
      )}
    >
      <div className="flex flex-col gap-3 px-4 pb-28 pt-2">
        {kind === "team" && (
          <label className="flex h-11 items-center gap-2 rounded-full bg-[#767680]/[0.12] px-4 tracking-[-0.43px]">
            <IconSearch size={20} stroke={1.75} className="shrink-0 text-[#8e8e93]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search team members" className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-[#8e8e93]" />
          </label>
        )}
        <Card className="overflow-hidden">
          {kind === "team" &&
            members.map((m, i) => (
              <ListRow key={m.name} first={i === 0} onClick={() => toggle(m.name)} leading={<Initials name={m.name} size={36} />} title={wire ? <Bar w={110} h={12} /> : m.name} trailing={tick(draft.includes(m.name))} />
            ))}
          {kind === "issues" && ISSUE_OPTIONS.map((o, i) => <ListRow key={o} first={i === 0} onClick={() => toggle(o)} title={o} trailing={tick(draft.includes(o))} />)}
          {kind === "roles" && roles.map((r, i) => <ListRow key={r} first={i === 0} onClick={() => toggle(r)} title={r} trailing={tick(draft.includes(r))} />)}
        </Card>
      </div>
    </Sheet>
  )
}
