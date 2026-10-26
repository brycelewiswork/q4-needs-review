import { Fragment } from "react"
import type { Message } from "@/data/locations"
import { cn } from "@/lib/utils"

/** "Yesterday 4:10 pm" → the day ("Yesterday") and the clock ("4:10 pm"); a time alone is today. */
const split = (t: string) => {
  const m = t.match(/^(.*?)\s*(\d{1,2}:\d{2} [ap]m)$/i)
  return m ? { day: m[1] || "Today", clock: m[2] } : { day: "", clock: t }
}

/** A Messages conversation's bubbles: yours on the right in the brand color, theirs on the left, a day label where the day changes. */
export function ChatThread({ m, className }: { m: Message; className?: string }) {
  const thread = m.thread ?? [{ from: m.title, text: m.preview, time: m.time }]
  const group = m.kind !== "dm"
  let day = ""
  return (
    <div className={cn("flex flex-col gap-1 tracking-[-0.43px]", className)}>
      {thread.map((t, i) => {
        const { day: d, clock } = split(t.time)
        const showDay = d !== day
        day = d
        const prev = thread[i - 1]
        const newSender = !prev || prev.from !== t.from
        return (
          <Fragment key={i}>
            {showDay && d && <p className="pb-1 pt-3 text-center text-[13px] leading-[18px] text-[#7f7f7f]">{d}</p>}
            <div className={cn("flex flex-col", t.me ? "items-end" : "items-start", newSender && i > 0 && "pt-2")}>
              {group && !t.me && newSender && <span className="px-3 pb-[2px] text-[12px] leading-4 text-[#7f7f7f]">{t.from}</span>}
              <p className={cn("max-w-[78%] whitespace-pre-line rounded-[20px] px-4 py-[8px] text-[17px] leading-[22px]", t.me ? "bg-[#8f55e5] text-white" : "bg-[#ececf0] text-black")}>{t.text}</p>
              <span className="px-3 pt-[2px] text-[11px] leading-[14px] text-[#a2a2a8]">{clock}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
