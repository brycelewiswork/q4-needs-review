import { useState, type Dispatch, type MouseEvent, type SetStateAction } from "react"
import { Sheet } from "@/components/ios/Sheet"
import { ContextMenu } from "@/components/ios/ContextMenu"
import { Card, ListRow } from "@/components/ios/list"
import { cn } from "@/lib/utils"
import { CheckAction, FormHeader } from "@/components/ios/formKit"
import { REVIEW_PROPERTIES, REVIEW_SORTS, type DetailLines, type ReviewGroup, type ReviewProperty, type ReviewSort } from "@/data/needsReview"

/** The most lines a row's description takes before it's cut off. */
const LINES = [
  { id: "1", label: "1 line" },
  { id: "2", label: "2 lines" },
  { id: "3", label: "3 lines" },
]

const GROUPS: { id: ReviewGroup; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "employee", label: "Employee" },
  { id: "none", label: "None" },
]

/**
 * How Needs Review looks, in a bottom sheet from the "..." menu (View Options). Changes apply as they're made; the checkmark
 * just closes it. How the list is grouped and ordered (a line each, with a menu), how many lines of description a row shows, and which properties each row shows. The photos checkbox stays in the menu itself.
 */
export function ReviewViewSheet({ grouping, onGrouping, sort, onSort, detailLines, onDetailLines, properties, onProperties, onClose }: { grouping: ReviewGroup; onGrouping: Dispatch<SetStateAction<ReviewGroup>>; sort: ReviewSort; onSort: (s: ReviewSort) => void; detailLines: DetailLines; onDetailLines: (n: DetailLines) => void; properties: Record<ReviewProperty, boolean>; onProperties: Dispatch<SetStateAction<Record<ReviewProperty, boolean>>>; onClose: () => void }) {
  const [menu, setMenu] = useState<{ kind: "grouping" | "order" | "lines"; anchor: HTMLElement } | null>(null)
  const open = (kind: "grouping" | "order" | "lines") => (e: MouseEvent<HTMLElement>) => setMenu({ kind, anchor: e.currentTarget })
  return (
    <Sheet
      title="View Options"
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      action={(dismiss) => <CheckAction ready onDone={dismiss} label="Done" />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        {/* One line each: the name at the left, the choice at the right with the up/down chevron, and a menu to change it. */}
        <Card className="overflow-hidden">
          <ListRow first chevron="updown" onClick={open("grouping")} title="Grouping" trailing={GROUPS.find((g) => g.id === grouping)!.label} />
          <ListRow chevron="updown" onClick={open("order")} title="Order by" trailing={REVIEW_SORTS.find((o) => o.id === sort)!.label} />
          <ListRow chevron="updown" onClick={open("lines")} title="Detail length" trailing={LINES.find((l) => l.id === String(detailLines))!.label} />
        </Card>

        <FormHeader title="Row properties" />
        {/* A container of tags: purple when the property shows on rows, gray when it doesn't. Color alone says which. */}
        <Card className="flex flex-wrap gap-2 p-3">
          {REVIEW_PROPERTIES.map((p) => {
            const on = properties[p.id]
            return (
              <button
                key={p.id}
                onClick={() => onProperties((cur) => ({ ...cur, [p.id]: !cur[p.id] }))}
                aria-pressed={on}
                className={cn(
                  "flex h-9 items-center rounded-full px-4 text-[15px] font-[510] leading-5 transition-colors duration-150 active:opacity-70",
                  on ? "bg-[#8f55e5] text-white" : "bg-black/5 text-[#8e8e93]",
                )}
              >
                {p.label}
              </button>
            )
          })}
        </Card>
      </div>

      <ContextMenu anchor={menu?.kind === "grouping" ? menu.anchor : null} items={GROUPS} selectedId={grouping} onSelect={(id) => onGrouping(id as ReviewGroup)} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "lines" ? menu.anchor : null} items={LINES} selectedId={String(detailLines)} onSelect={(id) => onDetailLines(Number(id) as DetailLines)} onClose={() => setMenu(null)} />
      <ContextMenu anchor={menu?.kind === "order" ? menu.anchor : null} items={REVIEW_SORTS.map((o) => ({ id: o.id, label: o.label }))} selectedId={sort} onSelect={(id) => onSort(id as ReviewSort)} onClose={() => setMenu(null)} />
    </Sheet>
  )
}
