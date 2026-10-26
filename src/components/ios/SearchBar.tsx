import { IconSearch } from "@tabler/icons-react"
import { LiquidGlass } from "@/components/ui/liquid-glass"

/**
 * The bottom search toolbar — Designbase "iOS Toolbar", location=bottom, type=search (Figma 59618:11437).
 * Figma specifies a 48pt glass field with 17pt / weight-510 text. Tuned down here to 44pt, 16pt regular and a 20pt
 * magnifier, because the spec read large and heavy in the prototype. Margins are the spec's: 28pt sides, 4pt above, 32pt below
 * (the home-indicator room). Pin it to the bottom of a sheet or screen.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="px-7 pb-8 pt-1">
      <LiquidGlass mode="small" radius={999} className="flex h-11 items-center">
        <label className="flex h-full w-full items-center gap-1 pl-[11px] pr-[10px] text-[16px] font-normal tracking-[-0.43px]">
          <IconSearch size={20} stroke={1.75} className="shrink-0 text-[#141414]" />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder={placeholder}
            aria-label={placeholder}
            className="min-w-0 flex-1 bg-transparent text-[#141414] outline-none placeholder:text-[#5c5c5c]"
          />
          {/* mic (SF Symbol), secondary label color */}
          <span
            aria-hidden
            className="block h-4 w-[11px] shrink-0 bg-[#727272]"
            style={{ maskImage: "url(/phone/kb-mic.svg)", WebkitMaskImage: "url(/phone/kb-mic.svg)", maskSize: "100% 100%", WebkitMaskSize: "100% 100%", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" }}
          />
        </label>
      </LiquidGlass>
    </div>
  )
}
