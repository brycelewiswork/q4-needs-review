import { useState } from "react"
import { Sheet } from "@/components/ios/Sheet"
import { Card, GroupFooter } from "@/components/ios/list"
import { CheckAction } from "@/components/ios/formKit"
import { REVIEW_ADD, REVIEW_SECTIONS, type ReviewKind } from "@/data/needsReview"

const labelOf = (kind: ReviewKind) =>
  (Object.values(REVIEW_SECTIONS).flat().find((s) => s.kind === kind)?.label ?? "").toLowerCase()

/**
 * Add a new one of a section's kind of request, from the plus on its header. A bottom sheet with a checkmark at the
 * top right, ready once the first field has something in it. The fields come from REVIEW_ADD.
 */
export function AddReviewSheet({ kind, onClose }: { kind: ReviewKind; onClose: () => void }) {
  const { title, fields } = REVIEW_ADD[kind]
  const [values, setValues] = useState<string[]>(() => fields.map(() => ""))
  const [notes, setNotes] = useState("")
  const ready = values[0].trim().length > 0
  return (
    <Sheet
      title={title}
      onClose={onClose}
      closeSide="left"
      edgeBlur={{ top: { strength: 16, steps: 5, height: 84 }, bottom: false }}
      action={(dismiss) => <CheckAction ready={ready} onDone={dismiss} label={title} />}
    >
      <div className="flex flex-col gap-2 px-4 pb-10 pt-[10px] tracking-[-0.43px]">
        <Card className="overflow-hidden">
          {fields.map((f, i) => (
            <label key={f} className={`flex min-h-[52px] items-center justify-between gap-4 px-4 ${i > 0 ? "border-t border-[#ebebeb]" : ""}`}>
              <span className="text-[17px] leading-[22px] text-[#2c2935]">{f}</span>
              <input
                value={values[i]}
                onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder="Add"
                className="min-w-0 flex-1 bg-transparent text-right text-[17px] leading-[22px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]"
              />
            </label>
          ))}
          <div className="border-t border-[#ebebeb] p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              aria-label="Notes"
              placeholder="Add a note..."
              className="block w-full resize-none bg-transparent text-[17px] leading-[22px] text-[#2c2935] outline-none placeholder:text-[#b9b8c1]"
            />
          </div>
        </Card>
        <GroupFooter>This will be added to {labelOf(kind)} for you to review with the rest.</GroupFooter>
      </div>
    </Sheet>
  )
}
