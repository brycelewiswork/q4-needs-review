import { useId } from "react"
import { motion } from "motion/react"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { VERSIONS, useVersionStore } from "@/store/useVersionStore"

/**
 * A, B, C, D along the left edge of the page: which version of the prototype is showing. A thumb slides to the one
 * chosen; the ones not built yet are dimmed. Hidden on a real phone, where the frame drops away and there's no room.
 */
export function VersionSwitch() {
  const version = useVersionStore((s) => s.version)
  const setVersion = useVersionStore((s) => s.setVersion)
  const thumb = useId()
  return (
    <div
      role="tablist"
      aria-label="Version"
      className="fixed left-3 top-1/2 z-[70] flex -translate-y-1/2 flex-col rounded-full bg-[#767680]/[0.12] p-[2px] max-[500px]:hidden dark:bg-white/10"
    >
      {VERSIONS.map((v) => {
        const on = v.id === version
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={on}
            aria-label={`Version ${v.id.toUpperCase()}${v.ready ? "" : ", not built yet"}`}
            disabled={!v.ready}
            onClick={() => setVersion(v.id)}
            className={cn(
              "relative flex size-7 items-center justify-center rounded-full text-[13px] tracking-[-0.08px] text-[#2c2935] dark:text-neutral-100",
              on ? "font-[590]" : "font-[510]",
              !v.ready && "opacity-35",
            )}
          >
            {on && (
              <motion.span
                layoutId={thumb}
                transition={{ type: "spring", ...SPRING_FAST.snappy }}
                className="absolute inset-0 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] dark:bg-neutral-600"
              />
            )}
            <span className="relative">{v.id.toUpperCase()}</span>
          </button>
        )
      })}
    </div>
  )
}
