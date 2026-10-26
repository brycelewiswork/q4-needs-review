import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { IconCheck, IconSearch } from "@tabler/icons-react"
import { Sheet } from "@/components/ios/Sheet"
import { Card, Switch } from "@/components/ios/list"
import { CheckAction, FormHeader } from "@/components/ios/formKit"
import { REVIEW_RANGES, REVIEW_ROLES, REVIEW_SORTS, type ReviewFilters } from "@/data/needsReview"
import { roleColor } from "@/lib/roleColor"

/** One choice in a list of them, with a check at the right when it's the one (or one of the ones) chosen. */
export function Choice({ first, on, role, onClick, leading, children, detail }: { first?: boolean; on: boolean; role?: "radio" | "checkbox"; onClick: () => void; leading?: ReactNode; children: ReactNode; detail?: string }) {
  return (
    <button
      onClick={onClick}
      role={role ?? "radio"}
      aria-checked={on}
      className={`flex min-h-[48px] w-full items-center gap-3 px-4 py-1 text-left active:bg-black/5 ${first ? "" : "border-t border-[#ebebeb]"}`}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] leading-[22px] text-[#2c2935]">{children}</span>
        {detail && <span className="block text-[13px] leading-[18px] text-[#8e8e93]">{detail}</span>}
      </span>
      {on && <IconCheck size={20} stroke={2.5} className="shrink-0 text-[#8f55e5]" />}
    </button>
  )
}

/**
 * Filter and Sort for Needs Review, in a bottom sheet from the filter pill. Changes apply as they're made; the checkmark
 * just closes it. Order by (the same as in View Options), a date range (with the current and last pay period), unread only, and the business's roles,
 * each with its dot, searchable and multi-select. More ways to narrow and order will be added here.
 */
export function ReviewFilterSheet({
  filters,
  onFilters,
  onClose,
}: {
  filters: ReviewFilters
  onFilters: Dispatch<SetStateAction<ReviewFilters>>
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const shown = REVIEW_ROLES.filter((r) => r.toLowerCase().includes(q.trim().toLowerCase()))
  const set = (patch: Partial<ReviewFilters>) => onFilters((f) => ({ ...f, ...patch }))
  const toggleRole = (r: string) =>
    onFilters((f) => {
      const roles = new Set(f.roles)
      if (!roles.delete(r)) roles.add(r)
      return { ...f, roles }
    })
  return (
    <Sheet
      title="Filter and Sort"
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      action={(dismiss) => <CheckAction ready onDone={dismiss} label="Done" />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        <FormHeader title="Order by" />
        <Card className="overflow-hidden">
          {REVIEW_SORTS.map((o, i) => (
            <Choice key={o.id} first={i === 0} on={filters.sort === o.id} detail={o.detail} onClick={() => set({ sort: o.id })}>
              {o.label}
            </Choice>
          ))}
        </Card>

        <FormHeader title="Date range" />
        <Card className="overflow-hidden">
          {REVIEW_RANGES.map((o, i) => (
            <Choice key={o.id} first={i === 0} on={filters.range === o.id} detail={o.dates} onClick={() => set({ range: o.id })}>
              {o.label}
            </Choice>
          ))}
        </Card>

        <FormHeader title="Status" />
        <Card className="overflow-hidden">
          <div className="flex min-h-[52px] items-center justify-between gap-4 px-4">
            <span className="text-[17px] leading-[22px] text-[#2c2935]">Unread only</span>
            <Switch checked={filters.unreadOnly} onChange={(unreadOnly) => set({ unreadOnly })} label="Unread only" />
          </div>
        </Card>

        <FormHeader
          title="Roles"
          action={
            filters.roles.size > 0 ? (
              <button onClick={() => set({ roles: new Set() })} className="text-[15px] leading-5 text-[#8f55e5] active:opacity-60">
                Clear
              </button>
            ) : undefined
          }
        />
        <Card className="overflow-hidden">
          <label className="flex h-11 items-center gap-2 border-b border-[#ebebeb] px-4">
            <IconSearch size={18} stroke={1.75} className="shrink-0 text-[#928fa0]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search roles"
              aria-label="Search roles"
              className="min-w-0 flex-1 bg-transparent text-[17px] leading-[22px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]"
            />
          </label>
          {shown.length === 0 ? (
            <p className="px-4 py-4 text-[15px] leading-5 text-[#8e8e93]">No roles match “{q.trim()}”</p>
          ) : (
            shown.map((r, i) => (
              <Choice
                key={r}
                first={i === 0}
                role="checkbox"
                on={filters.roles.has(r)}
                onClick={() => toggleRole(r)}
                leading={<span aria-hidden className="size-[10px] shrink-0 rounded-full" style={{ backgroundColor: roleColor(r) }} />}
              >
                {r}
              </Choice>
            ))
          )}
        </Card>
      </div>
    </Sheet>
  )
}
