import { ChatThread } from "@/components/ios/ChatThread"
import { Fragment, useState } from "react"
import { IconBriefcase, IconFilter, IconAlertHexagonFilled, IconChevronUp, IconSelector, IconClockFilled, IconCoffee, IconSearch, IconSpeakerphone, IconUsers, IconUsersGroup } from "@tabler/icons-react"
import { ContextMenu } from "@/components/ios/ContextMenu"
import type { FilterKind, TimeFilters } from "@/components/ios/TimeFilterSheet"
import { GlassChip } from "@/components/ios/GlassChip"
import { Card, Initials, ListRow, SectionHeader } from "@/components/ios/list"
import { roleColor } from "@/lib/roleColor"
import { cn } from "@/lib/utils"
import { USER_EARNINGS, type Location, type Message } from "@/data/locations"
import { WeekCalendar } from "@/components/ios/WeekCalendar"
import { dayLabel, payPeriodOf, rangeLabel, weekdayIndex, weeksFromBase } from "@/lib/dates"
import { useDateStore } from "@/store/useDateStore"
import { shiftKey, useShiftsStore } from "@/store/useShiftsStore"
import { useStructure } from "@/store/useViewStore"
import { useScope } from "@/store/useLocationStore"
import { ByLocation, LocationHeader } from "@/components/ios/LocationHeader"
import { Bar, WireCard, WireList } from "@/components/wire/Wire"

/** The big title each tab page opens with. */
export function PageTitle({ children }: { children: string }) {
  return <h1 className="pb-3 pt-3 text-[34px] font-bold leading-[41px] tracking-[0.4px] text-black">{children}</h1>
}


type Row = { who: string; role: string; start: number; end: number; mine?: boolean; open?: boolean }

/** am/pm with minutes: 13.5 → "1:30 pm" */
function clock(h: number) {
  const whole = Math.floor(h)
  const m = Math.round((h - whole) * 60)
  return `${whole % 12 === 0 ? 12 : whole % 12}:${String(m).padStart(2, "0")} ${whole % 24 >= 12 ? "pm" : "am"}`
}
const shortName = (n: string) => {
  const [f, ...rest] = n.split(" ")
  return rest.length ? `${f} ${rest[rest.length - 1][0]}.` : f
}
const initialsOf = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()

/** A day's schedule at a location: the team's shifts (derived from `loc.team`), the user's own, and an open shift on some days. */
const EXTRA_STAFF = ["Maya T.", "Dario K.", "Priya S.", "Owen B.", "Lena W.", "Sam O.", "Hana P.", "Theo R.", "Nia C.", "Eli M."]

function dayRows(loc: Location, i: number): Row[] {
  const starts = [8, 8, 9, 10, 10, 12]
  const lens = [5, 8, 7, 6, 4, 8]
  const rows: Row[] = []
  loc.team.forEach((m, j) => {
    if ((i + j) % 3 === 2) return
    const k = (i + j) % starts.length
    rows.push({ who: shortName(m.name), role: m.role, start: starts[k], end: starts[k] + lens[k] })
  })
  // The rest of the floor: more people on the schedule than the team list names, so a day is a real list.
  const roles = Array.from(new Set(loc.team.map((m) => m.role)))
  EXTRA_STAFF.forEach((who, j) => {
    if ((i + j) % 4 === 3 || !roles.length) return
    const k = (i * 2 + j) % starts.length
    rows.push({ who, role: roles[j % roles.length], start: starts[k] + (j % 2 ? 1 : 0), end: starts[k] + (j % 2 ? 1 : 0) + lens[(k + j) % lens.length] })
  })
  const mine = loc.employee.week[i]
  if (mine) rows.push({ who: "Bryce L.", role: loc.employee.timeClock?.role ?? "Team", start: mine.start, end: mine.end, mine: true })
  if (loc.team.length && i % 3 === 0) {
    const m = loc.team[i % loc.team.length]
    rows.push({ who: "Open shift", role: m.role, start: 16, end: 22, open: true })
  }
  return rows.sort((a, b) => a.start - b.start)
}

type Filter = "all" | "mine" | "open"
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All shifts" },
  { id: "mine", label: "My shifts" },
  { id: "open", label: "Open shifts" },
]

/** Shifts: a week strip, filters, and the selected day's schedule at this location. */
export function ShiftsPage({ split }: { loc?: Location; /** Two columns (iPad landscape): the schedule on the left, the chosen shift on the right. */ split?: boolean }) {
  const [selKey, setSelKey] = useState<string | null>(null)
  const date = useDateStore((s) => s.date)
  const [filter, setFilter] = useState<Filter>("all")
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const day = weekdayIndex(date)
  // The data is a pattern, so different weeks reshuffle it a little.
  const scope = useScope()
  const grouped = scope.length > 1
  const addedMap = useShiftsStore((st) => st.added)
  const groups = scope.map((l) => {
    const added = addedMap[shiftKey(l.id, date)]
    const every = [...dayRows(l, (((day + weeksFromBase(date) * 3) % 7) + 7) % 7), ...(added ?? [])].sort((a, b) => a.start - b.start)
    return { l, every, rows: every.filter((r) => (filter === "mine" ? r.mine : filter === "open" ? r.open : true)).map((r) => ({ ...r, l })) }
  })
  const rows = groups.flatMap((g) => g.rows)
  // The day's summary ignores the filters: covered hours are the staffed shifts, open shifts are still to fill.
  const every = groups.flatMap((g) => g.every)
  const staffed = every.filter((r) => !r.open)
  const hours = Math.round(staffed.reduce((n, r) => n + (r.end - r.start), 0))
  const openCount = every.length - staffed.length
  const wire = useStructure()

  const keyOf = (r: (typeof rows)[number]) => `${r.l.id}-${r.who}-${rows.indexOf(r)}`
  const chosen = rows.find((r) => keyOf(r) === selKey) ?? rows[0]

  const main = (
    <>
      <WeekCalendar label={dayLabel(date)} workingDots />

      {/* The hero on the left; the shift filter is a dropdown on the right, level with it. */}
      <div className="flex items-start justify-between gap-3 pb-4 pt-1 tracking-[-0.43px]">
        {wire ? (
          <div className="flex flex-col gap-2 pt-1">
            <Bar w={90} h={26} />
            <Bar w={150} h={12} />
          </div>
        ) : (
          <div>
            <p className="text-[28px] font-[590] leading-[30px] text-black">{`${hours} hrs`}</p>
            <p className="text-[15px] font-[510] leading-5 text-[#939393]">
              {`Covered by ${staffed.length} ${staffed.length === 1 ? "person" : "people"}`}
              {openCount > 0 && ` · ${openCount} open`}
            </p>
          </div>
        )}
        <GlassChip onClick={(e) => setMenu(e.currentTarget)}>
          <span className="flex items-center gap-1">
            {FILTERS.find((f) => f.id === filter)!.label}
            <IconSelector size={14} stroke={2.5} className="text-[#4e4e4e]" />
          </span>
        </GlassChip>
      </div>
      <ContextMenu
        anchor={menu}
        items={FILTERS}
        selectedId={filter}
        onSelect={(id) => setFilter(id as Filter)}
        onClose={() => setMenu(null)}
      />

      {/* One container per location, a row per shift, hairline dividers between. */}
      {wire ? <WireList rows={split ? 14 : grouped ? 3 : 6} trailing /> : groups.map(({ l, rows: group }) => (
        grouped && group.length === 0 ? null : (
        <div key={l.id} className={grouped ? "pb-2" : undefined}>
        {grouped && <LocationHeader loc={l} className="px-0 pt-1" />}
        <Card className="overflow-hidden">
        {group.length === 0 ? (
          <p className="p-4 text-[17px] leading-[22px] tracking-[-0.43px] text-[#999]">No shifts</p>
        ) : (
          group.map((r, i) => (
            // The padding is on the outer row and the divider on the inner one, so dividers stop 16px short of both edges.
            <div
              key={keyOf(r)}
              onClick={split ? () => setSelKey(keyOf(r)) : undefined}
              role={split ? "button" : undefined}
              aria-current={split && chosen === r ? "true" : undefined}
              className={cn("px-4", split && "cursor-pointer", split && chosen === r && "bg-[#8f55e5]/[0.1]")}
            >
            <div className={cn("flex items-center gap-3 py-3 tracking-[-0.43px]", i > 0 && "border-t border-[#ebebeb]")}>
              {/* The role's color: a vertical bar down the left of the row. */}
              <span aria-hidden className="w-1 shrink-0 self-stretch rounded-full" style={{ backgroundColor: roleColor(r.role) }} />
              {/* The avatar leads, then the name over the role. */}
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ece6fb] text-[15px] font-[590] leading-none text-[#6b3fc4]">
                  {r.open ? "?" : initialsOf(r.who)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[17px] font-[590] leading-5 text-black">{r.who}</span>
                  <span className="-mt-px truncate text-[15px] leading-[18px] text-[#8e8e93]">{r.role}</span>
                </span>
              </span>
              {/* Start in the primary color, end secondary beneath it. */}
              <span className="flex shrink-0 flex-col items-end text-right text-[15px] leading-5">
                <span className="text-black">{clock(r.start)}</span>
                <span className="flex items-center gap-[6px] text-[#8e8e93]">
                  {/* Long shifts (8h or more) run into overtime: an orange tonal pill to the left of the end time. */}
                  {r.end - r.start >= 8 && (
                    <span className="rounded-full bg-[rgba(242,153,74,0.2)] px-[6px] py-[1px] text-[11px] font-[590] leading-4 text-[#b8620a]">Overtime</span>
                  )}
                  {clock(r.end)}
                </span>
              </span>
            </div>
            </div>
          ))
        )}
        </Card>
        </div>
        )
      ))}
      {grouped && !wire && rows.length === 0 && <Card className="p-4 text-[17px] leading-[22px] tracking-[-0.43px] text-[#999]">No shifts</Card>}
    </>
  )
  if (!split) return main
  const col = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  return (
    <div className="absolute inset-0 flex">
      <div className={cn(col, "w-[380px] shrink-0 overflow-y-auto pl-4 pr-2")} style={{ paddingTop: "calc(var(--safe-top) + 54px)", paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
        {main}
      </div>
      <div className={cn(col, "min-w-0 flex-1 overflow-y-auto pl-2 pr-4")} style={{ paddingTop: "calc(var(--safe-top) + 62px)", paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
        {chosen ? <ShiftDetail row={chosen} loc={chosen.l} date={date} /> : <WireCard title="No shift selected" h={200} />}
      </div>
    </div>
  )
}

/** A single shift, opened: who, when, where, and what you can do with it. */
function ShiftDetail({ row: r, loc, date }: { row: Row; loc: Location; date: Date }) {
  const wire = useStructure()
  const hours = r.end - r.start
  const fact = (label: string, value: string) => (
    <div className="flex items-center justify-between gap-4 border-t border-[#ebebeb] px-4 py-3 first:border-t-0">
      <span className="text-[17px] leading-[22px] text-black">{label}</span>
      <span className="text-[17px] leading-[22px] text-[#8e8e93]">{value}</span>
    </div>
  )
  if (wire) {
    return (
      <div className="flex flex-col gap-4">
        <WireCard title="Shift" h={120} />
        <WireCard title="Details" h={200} />
        <WireCard title="Notes" h={96} />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-4 tracking-[-0.43px]">
      <div className="flex items-center gap-3 px-1 pt-1">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#ece6fb] text-[20px] font-[590] text-[#6b3fc4]">{r.open ? "?" : initialsOf(r.who)}</span>
        <div className="min-w-0">
          <p className="truncate text-[28px] font-[590] leading-[32px] text-black">{r.who}</p>
          <p className="flex items-center gap-2 text-[15px] leading-5 text-[#8e8e93]">
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: roleColor(r.role) }} />
            {r.role}
          </p>
        </div>
      </div>
      <Card className="overflow-hidden">
        {fact("Date", dayLabel(date))}
        {fact("Time", `${clock(r.start)} – ${clock(r.end)}`)}
        {fact("Length", `${hours} hrs`)}
        {fact("Location", loc.name)}
      </Card>
      <Card className="p-4">
        <p className="text-[15px] font-[510] leading-5 text-black">Notes</p>
        <p className="pt-1 text-[15px] leading-5 text-[#8e8e93]">{r.open ? "Nobody is on this shift yet." : "No notes on this shift."}</p>
      </Card>
      <div className="flex gap-3">
        <button className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#8f55e5] text-[17px] font-[590] text-white active:opacity-80">{r.open ? "Assign" : "Edit shift"}</button>
        <button className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#787880]/[0.16] text-[17px] font-[590] text-black active:opacity-80">{r.mine ? "Swap" : "Message"}</button>
      </div>
    </div>
  )
}

/** Time (formerly Timesheets): a Day / Pay period segmented control, filter chips, and the timesheets needing review. */
export function TimePage({ split, filters, onFilter }: { filters: TimeFilters; onFilter: (k: FilterKind) => void; loc?: Location; /** Two columns (iPad landscape): the day's timesheets on the left, the pay period on the right. */ split?: boolean }) {
  const date = useDateStore((s) => s.date)
  const storedView = useDateStore((s) => s.timeView)
  // Split view shows both, so the Day / Pay period choice doesn't apply.
  const view = split ? "day" : storedView
  const setView = useDateStore((s) => s.setTimeView)
  const [resolved, setResolved] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(true)
  // Each filter narrows the list when it has anything chosen; an empty one lets everything through.
  // In "all locations" the timesheets from every location are listed together, each group under its location's header.
  const scope = useScope()
  const all = scope.length > 1
  const pending = scope.flatMap((l) =>
    l.timesheets
      .filter(
        (t) =>
          !resolved[`${l.id}:${t.id}`] &&
          (!filters.roles.length || filters.roles.includes(t.role)) &&
          (!filters.team.length || filters.team.includes(t.name)) &&
          (!filters.issues.length || t.issues.some((i) => filters.issues.includes(i))),
      )
      .map((t) => ({ ...t, l })),
  )
  const active = (k: FilterKind) => filters[k].length > 0
  const count = (k: FilterKind) => (filters[k].length ? ` ${filters[k].length}` : "")
  const wire = useStructure()
  const main = (
    <>
      <WeekCalendar label={view === "day" ? dayLabel(date) : rangeLabel(...payPeriodOf(date))} />

      {/* overflow-x:auto also clips vertically, which cut off the chips' drop shadows. Pad the scroller to hold
          them (the glass shadow reaches ~23px below) and cancel the padding with negative margins. */}
      <div className="-mx-4 -mb-3 -mt-3 flex gap-2 overflow-x-auto px-4 pb-7 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Search is just an icon: a square glass chip. */}
        {/* Each filter is an icon, a label and a filter mark, and opens a full-height sheet of options. */}
        <GlassChip active={active("team")} onClick={() => onFilter("team")}>
          <span className="flex items-center gap-[6px]">
            <IconSearch size={18} stroke={1.75} />
            {`Team Members${count("team")}`}
          </span>
        </GlassChip>
        <GlassChip active={active("issues")} onClick={() => onFilter("issues")}>
          <span className="flex items-center gap-[6px]">
            <IconAlertHexagonFilled size={18} />
            {`Issues${count("issues")}`}
            <IconFilter size={16} stroke={2} />
          </span>
        </GlassChip>
        <GlassChip active={active("roles")} onClick={() => onFilter("roles")}>
          <span className="flex items-center gap-[6px]">
            <IconBriefcase size={18} stroke={1.75} />
            {`Roles${count("roles")}`}
            <IconFilter size={16} stroke={2} />
          </span>
        </GlassChip>
        {!split && (
          <GlassChip active={view === "period"} onClick={() => setView(view === "period" ? "day" : "period")}>
            Pay period
          </GlassChip>
        )}
      </div>

      {view === "day" ? (
        <>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center justify-between pb-1 text-left tracking-[-0.43px]"
          >
            <h2 className="text-[15px] font-[590] leading-5 text-[#747182]">
              Needs review{!wire && <> <span className="text-[#b9b8c1]">{pending.length}</span></>}
            </h2>
            <IconChevronUp size={20} stroke={3} className={cn("text-[#747182] transition-transform duration-200", !open && "rotate-180")} />
          </button>

          {open && wire && (
            <div className="flex flex-col gap-2">
              {all ? (
                scope.map((l) => (
                  <div key={l.id}>
                    <LocationHeader loc={l} className="px-0" />
                    <WireCard h={150} />
                  </div>
                ))
              ) : (
                Array.from({ length: split ? 5 : 4 }, (_, i) => <WireCard key={i} h={150} />)
              )}
            </div>
          )}
          {open && !wire && (
            <div className="flex flex-col gap-2">
              {pending.length === 0 && <Card className="p-4 text-[17px] leading-[22px] tracking-[-0.43px] text-[#999]">All caught up</Card>}
              {pending.map((t, idx) => (
                <Fragment key={`${t.l.id}:${t.id}`}>
                {all && (idx === 0 || pending[idx - 1].l.id !== t.l.id) && <LocationHeader loc={t.l} className="px-0" />}
                <Card className="p-4 tracking-[-0.43px]">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ece6fb] text-[17px] font-[590] text-[#6b3fc4]">{initialsOf(t.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[17px] font-[590] leading-[22px] text-black">{t.name}</span>
                      <span className="block truncate text-[15px] leading-5 text-[#7f7f7f]">{`${t.role} | ${t.dept}`}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pl-1 pt-3">
                    <div className="flex items-start gap-3">
                      <IconClockFilled size={20} className="mt-[1px] shrink-0 text-[#928fa0]" />
                      <span>
                        <span className="block text-[17px] leading-[22px] text-black">{`${t.start} - ${t.end}`}</span>
                        <span className="block text-[13px] leading-4 text-[#7f7f7f]">{`Total: ${t.total}`}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IconCoffee size={20} className="shrink-0 text-[#928fa0]" />
                      <span className="text-[17px] leading-[22px] text-black">{t.rest}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3">
                    {t.issues.map((i) => (
                      <span key={i} className="rounded-full bg-[#fdeaea] px-3 py-[5px] text-[15px] leading-5 text-[#e00000]">{i}</span>
                    ))}
                  </div>
                  <div className="mt-3 border-t border-[#ebebeb] pt-3">
                    <button
                      onClick={() => setResolved((r) => ({ ...r, [`${t.l.id}:${t.id}`]: true }))}
                      className="h-12 w-full rounded-[14px] border-2 border-[#8f55e5] text-[17px] font-[590] text-[#8f55e5] active:bg-[#8f55e5]/10"
                    >
                      Resolve issues
                    </button>
                  </div>
                </Card>
                </Fragment>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="pt-2">
          <SectionHeader>Pay period</SectionHeader>
          <ByLocation scope={scope}>
            {(l) => wire ? (
              <WireList rows={4} avatar={false} trailing />
            ) : (
              <Card className="overflow-hidden">
                <ListRow first title="Period" trailing={l.payroll.period} />
                <ListRow title="Hours" trailing={l.payroll.hours} />
                <ListRow title="Gross pay" trailing={l.payroll.gross} />
                <ListRow title="Next payday" trailing={l.payroll.nextPayday} />
              </Card>
            )}
          </ByLocation>
        </div>
      )}
    </>
  )
  if (!split) return main
  const col = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  return (
    <div className="absolute inset-0 flex">
      <div className={cn(col, "w-[380px] shrink-0 overflow-y-auto pl-4 pr-2")} style={{ paddingTop: "calc(var(--safe-top) + 54px)", paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
        {main}
      </div>
      <div className={cn(col, "min-w-0 flex-1 overflow-y-auto pl-2 pr-4")} style={{ paddingTop: "calc(var(--safe-top) + 62px)", paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
        <PayPeriod scope={scope} date={date} />
      </div>
    </div>
  )
}

/** The pay period at a glance: the hours paid, the period's totals, and what each person was paid. */
function PayPeriod({ scope, date }: { scope: Location[]; date: Date }) {
  const wire = useStructure()
  const paid = (i: number) => (i % 4 === 3 ? 0 : 18 + ((i * 7) % 23))
  return (
    <div className="tracking-[-0.43px]">
      <p className="pb-2 text-[15px] font-[590] leading-5 text-[#8f55e5]">{`Pay period: ${rangeLabel(...payPeriodOf(date))}`}</p>
      <ByLocation scope={scope}>
        {(loc) => {
          const p = loc.payroll
          const issues = (name: string) => loc.timesheets.filter((t) => t.name === name).reduce((n, t) => n + t.issues.length, 0)
          return wire ? (
            <>
              <Bar w={150} h={34} />
              <div className="pb-4 pt-2"><Bar w={80} h={12} /></div>
              <WireList rows={scope.length > 1 ? 4 : 8} trailing />
            </>
          ) : (
            <>
              <p className="text-[41px] font-[590] leading-[normal] text-black">{p.hours}</p>
              <p className="pb-4 text-[15px] font-[510] leading-5 text-[#939393]">Total paid</p>
              <Card className="mb-4 overflow-hidden">
                <ListRow first title="Gross pay" trailing={p.gross} />
                <ListRow title="Next payday" trailing={p.nextPayday} />
              </Card>
              <Card className="mb-4 overflow-hidden">
                {loc.team.map((m, i) => (
                  <ListRow
                    key={m.name}
                    first={i === 0}
                    leading={<Initials name={m.name} />}
                    title={m.name}
                    subtitle={`Total paid: ${paid(i)} hrs`}
                    trailing={issues(m.name) ? <span className="text-[15px] text-[#d0161f]">{`${issues(m.name)} issues`}</span> : undefined}
                  />
                ))}
              </Card>
            </>
          )
        }}
      </ByLocation>
    </div>
  )
}

/** Money (employees): what they've earned and been paid. Earnings belong to the person; pay stubs come from the location. */
export function MoneyPage(_props: { loc?: Location }) {
  const wire = useStructure()
  const scope = useScope()
  if (wire) {
    return (
      <>
        <WireCard title="This pay period" h={110} className="mt-4" />
        <SectionHeader>Today</SectionHeader>
        <WireList rows={2} avatar={false} trailing />
        <SectionHeader>Recent pay stubs</SectionHeader>
        <WireList rows={3} avatar={false} trailing />
      </>
    )
  }
  return (
    <>
      <Card className="mt-4 p-4 tracking-[-0.43px]">
        <p className="text-[15px] leading-5 text-black">This pay period</p>
        <p className="text-[34px] font-bold leading-[41px] text-black">{USER_EARNINGS.period.amount}</p>
        <p className="text-[15px] leading-5 text-[#7f7f7f]">{USER_EARNINGS.period.payday}</p>
      </Card>
      <SectionHeader>Today</SectionHeader>
      <Card className="overflow-hidden">
        <ListRow first title="Earned" trailing={USER_EARNINGS.today.amount} />
        <ListRow title="Hours and tips" trailing={USER_EARNINGS.today.detail} />
      </Card>
      <SectionHeader>Recent pay stubs</SectionHeader>
      <ByLocation scope={scope}>
        {(l) => (
          <Card className="overflow-hidden">
            {l.payroll.stubs.map((st, i) => (
              <ListRow key={st.period} first={i === 0} chevron title={st.period} trailing={st.net} />
            ))}
          </Card>
        )}
      </ByLocation>
    </>
  )
}

const TONES = [
  { bg: "#bfe9c6", fg: "#1f6b2e" },
  { bg: "#fde3d6", fg: "#c2491d" },
  { bg: "#e3dcf8", fg: "#5a35b5" },
  { bg: "#ede4fc", fg: "#7440d1" },
]
const MATE_PHOTOS = ["/phone/mate-1.jpg", "/phone/mate-2.jpg", "/phone/mate-3.jpg", "/phone/mate-4.jpg"]

function MessageAvatar({ m }: { m: Message }) {
  const wire = useStructure()
  if (m.kind !== "dm") {
    const Icon = m.kind === "announcement" ? IconSpeakerphone : m.kind === "team" ? IconUsersGroup : IconUsers
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f1ecfc] text-black">
        <Icon size={22} stroke={1.5} />
      </span>
    )
  }
  // The structure cut keeps initials: photos are for the full cut.
  if (m.photo !== undefined && !wire) return <img src={MATE_PHOTOS[m.photo % 4]} alt="" className="size-11 shrink-0 rounded-full object-cover object-top" />
  const t = TONES[[...m.title].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length]
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full text-[17px] leading-[22px]" style={{ backgroundColor: t.bg, color: t.fg }}>
      {initialsOf(m.title)}
    </span>
  )
}

export type ConvoRow = Message & { l: Location }
/** Conversations from every location in scope, each id prefixed with its location (ids repeat from one location to the next). */
const conversationsIn = (scope: Location[]): ConvoRow[] => scope.flatMap((l) => l.messages.map((m) => ({ ...m, id: `${l.id}:${m.id}`, l })))

/** Messages: the selected location's conversations, or in "all locations" each location's under its own header. */
export function ChatPage({ selectedId, onSelect, onOpen }: { loc?: Location; /** Split view: the open conversation, highlighted in the list. */ selectedId?: string; onSelect?: (id: string) => void; /** A phone: what opening a conversation does (it takes the whole screen). */ onOpen?: (m: ConvoRow) => void }) {
  const [filter, setFilter] = useState<"all" | "unread" | "threads">("all")
  const scope = useScope()
  const keep = (m: Message) => (filter === "unread" ? m.unread : filter === "threads" ? m.kind !== "dm" : true)
  const groups = scope.map((l) => ({ l, rows: conversationsIn([l]).filter(keep) }))
  const grouped = scope.length > 1
  const toggle = (f: "unread" | "threads") => setFilter((cur) => (cur === f ? "all" : f))
  return (
    <>
      <div className="flex gap-2 pb-4 pt-4">
        <GlassChip active={filter === "unread"} onClick={() => toggle("unread")}>
          <span className="flex items-center gap-[6px]">
            Unread
            <span aria-hidden className="size-2 rounded-full bg-[#8f55e5]" style={filter === "unread" ? { backgroundColor: "#fff" } : undefined} />
          </span>
        </GlassChip>
        <GlassChip active={filter === "threads"} onClick={() => toggle("threads")}>
          Threads
        </GlassChip>
      </div>
      {groups.map(({ l, rows }) =>
        grouped && rows.length === 0 ? null : (
          <div key={l.id} className={grouped ? "pb-2" : undefined}>
            {grouped && <LocationHeader loc={l} className="px-0 pt-1" />}
            <Card className="overflow-hidden">
              {rows.length === 0 && <p className="p-4 text-[17px] leading-[22px] tracking-[-0.43px] text-[#999]">No messages</p>}
              {rows.map((m, i) => (
                <button key={m.id} onClick={onSelect ? () => onSelect(m.id) : onOpen ? () => onOpen(m) : undefined} aria-current={selectedId === m.id ? "true" : undefined} className={cn("flex w-full items-center gap-3 pl-4 pr-4 text-left tracking-[-0.43px] active:bg-black/[0.04]", selectedId === m.id && "bg-[#8f55e5]/[0.1]")}>
                  <MessageAvatar m={m} />
                  <span className={cn("flex min-w-0 flex-1 flex-col py-3", i > 0 && "border-t border-[#ebebeb]")}>
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[17px] font-[590] leading-[22px] text-black">{m.title}</span>
                      <span className="shrink-0 text-[15px] leading-5 text-[#7f7f7f]">{m.time}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[15px] leading-5 text-[#7f7f7f]">{m.preview}</span>
                      {m.unread && <span aria-label="Unread" className="size-[10px] shrink-0 rounded-full bg-[#8f55e5]" />}
                    </span>
                  </span>
                </button>
              ))}
            </Card>
          </div>
        ),
      )}
      {grouped && groups.every((g) => g.rows.length === 0) && <Card className="p-4 text-[17px] leading-[22px] tracking-[-0.43px] text-[#999]">No messages</Card>}
    </>
  )
}

/** One conversation, opened: who it's with, the thread, and the composer. */
function Conversation({ m }: { m: Message }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white tracking-[-0.43px]">
      <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.07] px-5 py-3">
        <MessageAvatar m={m} />
        <div className="min-w-0">
          <p className="truncate text-[17px] font-[590] leading-[22px] text-black">{m.title}</p>
          <p className="text-[13px] leading-[18px] text-[#7f7f7f]">{m.kind === "dm" ? "Direct message" : m.kind === "announcement" ? "Announcements" : "Thread"}</p>
        </div>
      </div>
      <div className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-5 py-5">
        <ChatThread m={m} />
      </div>
      <div className="shrink-0 px-4 pb-4">
        <div className="flex h-11 items-center rounded-full border border-black/10 px-4 text-[17px] text-[#a2a2a8]">Message</div>
      </div>
    </div>
  )
}

/** A conversation as a page of its own (a phone): the bubbles, with the composer pinned under them. */
export function ConversationPage({ m }: { m: Message }) {
  return (
    <div className="flex min-h-full flex-col justify-end pb-3">
      <ChatThread m={m} />
      <div className="sticky bottom-0 -mx-4 mt-3 bg-gradient-to-t from-[#f3f2f6] from-70% to-transparent px-4 pb-1 pt-3">
        <div className="flex h-11 items-center rounded-full border border-black/10 bg-white px-4 text-[17px] text-[#a2a2a8]">Message</div>
      </div>
    </div>
  )
}

/** iPad Messages: the list on the left, the open conversation on the right. */
export function MessagesSplit(_props: { loc?: Location }) {
  const scope = useScope()
  const messages = conversationsIn(scope)
  const [sel, setSel] = useState(messages[0]?.id)
  const m = messages.find((x) => x.id === sel) ?? messages[0]
  const col = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  return (
    <div className="absolute inset-0 flex">
      <div className={cn(col, "w-[40%] min-w-[240px] max-w-[380px] shrink-0 overflow-y-auto pl-4 pr-2")} style={{ paddingTop: "calc(var(--safe-top) + 54px)", paddingBottom: "calc(var(--safe-bottom) + 32px)" }}>
        <ChatPage selectedId={m?.id} onSelect={setSel} />
      </div>
      <div className="min-w-0 flex-1 pl-2 pr-4" style={{ paddingTop: "calc(var(--safe-top) + 62px)", paddingBottom: "calc(var(--safe-bottom) + 16px)" }}>
        {m && <Conversation m={m} />}
      </div>
    </div>
  )
}
