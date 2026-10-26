import { useState } from "react"
import { cn } from "@/lib/utils"

/** Figma "iOS keyboard" (Designbase 60144:14184): 402 × 332 — 24 top pad, 25 suggestions, keys, 78 bottom buttons. */
export const KEYBOARD_H = 332

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]

/** A single-color SVG recolored through its alpha. */
function Glyph({ src, w, h, color = "#2c2935" }: { src: string; w: number; h: number; color?: string }) {
  return (
    <span
      aria-hidden
      className="block shrink-0"
      style={{
        width: w,
        height: h,
        backgroundColor: color,
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskSize: "100% 100%",
        WebkitMaskSize: "100% 100%",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
      }}
    />
  )
}

// Figma key: 43pt tall, 8.5pt radius; the three key fills composite to white on the keyboard surface.
const KEY = "flex h-[43px] min-w-px items-center justify-center overflow-clip rounded-[8.5px] bg-white text-[#2c2935] active:bg-[#dfe2e7]"

/**
 * The iOS 26 keyboard, portrait. Taps call `onKey`: a character, `"⌫"`, `" "` or `"\n"`.
 * `capitalize` is the auto-capitalize state (start of a sentence); the shift key adds a one-shot capital.
 * `suggestions` fills the autocorrection row (three, left to right).
 */
export function Keyboard({
  onKey,
  capitalize,
  suggestions,
  onSuggestion,
}: {
  onKey: (k: string) => void
  capitalize: boolean
  suggestions: string[]
  onSuggestion: (s: string) => void
}) {
  const [shift, setShift] = useState(false)
  const caps = capitalize || shift
  const press = (k: string) => (e: React.PointerEvent) => {
    e.preventDefault() // keep focus in the field
    onKey(k)
  }
  const letter = (c: string) => (
    <button key={c} onPointerDown={(e) => {
      press(caps ? c : c.toLowerCase())(e)
      setShift(false)
    }} className={cn(KEY, "flex-1 text-[23px] leading-7")}>
      {caps ? c : c.toLowerCase()}
    </button>
  )

  return (
    <div
      className="ios-keyboard flex flex-col items-end pt-6 tracking-normal"
      style={{
        height: KEYBOARD_H,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        borderBottomLeftRadius: 62,
        borderBottomRightRadius: 62,
        backgroundColor: "rgba(226,229,234,0.92)",
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.05)",
      }}
      onPointerDown={(e) => e.preventDefault()}
    >
      {/* autocorrection */}
      <div className="flex h-[25px] w-full shrink-0 items-center gap-[6px] px-[8.5px] text-[18px] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex min-w-px flex-1 items-center">
            {i > 0 && <span aria-hidden className="mr-[6px] h-[25px] w-px rounded-full bg-[#666]/40" />}
            <button
              onPointerDown={(e) => {
                e.preventDefault()
                if (suggestions[i]) onSuggestion(suggestions[i])
              }}
              className="min-w-px flex-1 truncate text-center active:opacity-50"
            >
              {suggestions[i] ?? ""}
            </button>
          </div>
        ))}
      </div>

      <div className="flex w-full shrink-0 flex-col gap-[11px] px-[6.67px]">
        <div className="flex items-center justify-center gap-[6px]">{ROWS[0].split("").map(letter)}</div>
        <div className="flex items-center justify-center gap-[6px] px-5">{ROWS[1].split("").map(letter)}</div>
        <div className="flex items-center gap-[13.33px]">
          <button
            aria-label="Shift"
            aria-pressed={caps}
            onPointerDown={(e) => {
              e.preventDefault()
              setShift((s) => !s)
            }}
            className={cn(KEY, "w-[45px] shrink-0")}
          >
            <Glyph src="/phone/kb-shift.svg" w={24} h={20} />
          </button>
          <div className="flex min-w-px flex-1 items-center gap-[6px]">{ROWS[2].split("").map(letter)}</div>
          <button aria-label="Delete" onPointerDown={press("⌫")} className={cn(KEY, "w-[45px] shrink-0")}>
            <Glyph src="/phone/kb-delete.svg" w={22} h={18} />
          </button>
        </div>
        <div className="flex items-center gap-[6px]">
          <span className={cn(KEY, "w-[92.67px] shrink-0 text-[18px] leading-7")}>123</span>
          <button aria-label="Space" onPointerDown={press(" ")} className={cn(KEY, "flex-1")} />
          <button aria-label="Return" onPointerDown={press("\n")} className={cn(KEY, "w-[93px] shrink-0")}>
            <Glyph src="/phone/kb-return.svg" w={19} h={17} />
          </button>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between px-8 pb-[26px] pt-[23px]">
        <Glyph src="/phone/kb-emoji.svg" w={26.8} h={26.8} color="#141414" />
        <Glyph src="/phone/kb-mic.svg" w={17} h={25} color="#141414" />
      </div>
    </div>
  )
}
