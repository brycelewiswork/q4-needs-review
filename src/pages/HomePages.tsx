import { IconCheck } from "@tabler/icons-react"
import { Card, GroupLabel, Initials, ListRow } from "@/components/ios/list"
import { cn } from "@/lib/utils"
import { taskKey, useTasksStore } from "@/store/useTasksStore"
import type { Location } from "@/data/locations"
import { MoneyPage } from "@/pages/TabPages"
import { useStructure } from "@/store/useViewStore"
import { WireList } from "@/components/wire/Wire"
import { ByLocation } from "@/components/ios/LocationHeader"
import { useScope } from "@/store/useLocationStore"

/** The full pages the home dashboard widgets open (see FullPage). */
export type HomePageId = "log" | "earnings" | "shiftmates" | "tasks"

export const HOME_PAGE_TITLES: Record<HomePageId, string> = {
  log: "Manager Log",
  earnings: "Money",
  shiftmates: "Shiftmates",
  tasks: "Task Manager",
}

function ManagerLogPage({ scope }: { scope: Location[] }) {
  if (useStructure()) return <div className="flex flex-col gap-3 pt-2"><ByLocation scope={scope}>{() => <WireList rows={3} avatar={false} />}</ByLocation></div>
  return (
    <div className="flex flex-col gap-3 pt-2 tracking-[-0.43px]">
      <ByLocation scope={scope}>
        {(loc) => (
          <div className="flex flex-col gap-3">
            {loc.managerLog.length === 0 && <Card className="p-4 text-[17px] text-[#999]">No notes yet</Card>}
            {loc.managerLog.map((e) => (
              <Card key={e.when + e.author} className="p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-[590] leading-5 text-black">{e.author}</span>
                  <span className="shrink-0 text-[13px] leading-[18px] text-[#8e8e93]">{e.when}</span>
                </div>
                <p className="pt-1 text-[17px] leading-[22px] text-[#2c2935]">{e.note}</p>
              </Card>
            ))}
          </div>
        )}
      </ByLocation>
    </div>
  )
}

const STATUS = {
  on: { label: "Clocked in", color: "#34c759" },
  scheduled: { label: "Scheduled", color: "#8e8e93" },
  off: { label: "Off", color: "#c7c7cc" },
} as const

/** Who's on with you: the team at this location (or each location), with their status today. */
function ShiftmatesPage({ scope }: { scope: Location[] }) {
  if (useStructure()) return <div className="pt-2"><ByLocation scope={scope}>{() => <WireList rows={scope.length > 1 ? 4 : 7} trailing />}</ByLocation></div>
  return (
    <div className="pt-2">
      <ByLocation scope={scope}>
        {(loc) => {
          const on = loc.team.filter((m) => m.status === "on").length
          return (
            <>
              <GroupLabel>{`${on} of ${loc.team.length} clocked in`}</GroupLabel>
              <Card className="overflow-hidden">
                {loc.team.map((m, i) => (
                  <ListRow
                    key={m.name}
                    first={i === 0}
                    leading={<Initials name={m.name} />}
                    title={m.name}
                    subtitle={m.role}
                    trailing={
                      <span className="flex flex-col items-end">
                        <span className="flex items-center gap-[6px] text-[15px] leading-5 text-[#2c2935]">
                          <span className="size-2 rounded-full" style={{ backgroundColor: STATUS[m.status].color }} />
                          {STATUS[m.status].label}
                        </span>
                        <span className="text-[13px] leading-[18px] text-[#747182]">{m.detail}</span>
                      </span>
                    }
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

/** A task's tick: a circle that fills purple when done. */
export function TaskTick({ done }: { done: boolean }) {
  return (
    <span className={cn("flex size-6 items-center justify-center rounded-full border-[1.5px] transition-colors duration-150", done ? "border-[#8f55e5] bg-[#8f55e5]" : "border-[#c7c7cc]")}>
      {done && <IconCheck size={14} stroke={3} className="text-white" />}
    </span>
  )
}

/** Every task for this location (or each location), tickable. The dashboard's Task Manager section shows the first few. */
function TasksPage({ scope }: { scope: Location[] }) {
  const doneMap = useTasksStore((s) => s.done)
  const toggle = useTasksStore((s) => s.toggle)
  if (useStructure()) return <div className="pt-2"><ByLocation scope={scope}>{() => <WireList rows={scope.length > 1 ? 3 : 6} avatar={false} trailing />}</ByLocation></div>
  return (
    <div className="pt-2">
      <ByLocation scope={scope}>
        {(loc) => {
          const isDone = (id: string, seed: boolean) => doneMap[taskKey(loc, id)] ?? seed
          const count = loc.tasks.filter((t) => isDone(t.id, t.done)).length
          return (
            <>
              <GroupLabel>{`${count} of ${loc.tasks.length} done`}</GroupLabel>
              <Card className="overflow-hidden">
                {loc.tasks.map((t, i) => {
                  const done = isDone(t.id, t.done)
                  return (
                    <ListRow
                      key={t.id}
                      first={i === 0}
                      onClick={() => toggle(taskKey(loc, t.id), done)}
                      leading={<TaskTick done={done} />}
                      title={t.title}
                      titleClassName={done ? "text-[#928fa0] line-through" : undefined}
                      trailing={<span className="text-[15px]">{t.due}</span>}
                    />
                  )
                })}
              </Card>
            </>
          )
        }}
      </ByLocation>
    </div>
  )
}

export function HomePage({ id, loc }: { id: HomePageId; loc: Location }) {
  const scope = useScope()
  if (id === "tasks") return <TasksPage scope={scope} />
  if (id === "log") return <ManagerLogPage scope={scope} />
  // Earnings is one card on the Money tab, so tapping it shows that tab's content as a page.
  if (id === "earnings") return <MoneyPage loc={loc} />
  return <ShiftmatesPage scope={scope} />
}
