import { useEffect, type ReactNode } from "react"
import { motion, useMotionValue, useTransform } from "motion/react"
import { IconChevronLeft } from "@tabler/icons-react"
import { EdgeBlur } from "@/components/ios/EdgeBlur"
import { LiquidGlass } from "@/components/ui/liquid-glass"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"

/**
 * A full-screen page pushed over the app, like a navigation push (not a sheet): it slides in from the
 * right, covers the toolbar and the tab bar, and comes back with the glass back button (or Escape).
 * Its layer is above the nav (20) and below the status bar (40), so the clock and battery stay visible.
 * Mount it inside AnimatePresence so the slide-out plays.
 */
export function FullPage({ title, onBack, children, action, subheader, footer, className }: { title: string; onBack: () => void; children: ReactNode; /** A glass button at the right of the header (e.g. a checkmark to confirm). */ action?: ReactNode; /** Pinned under the title, over the scrolling content (e.g. a group of tabs). */ subheader?: ReactNode; /** Pinned to the bottom over the scrolling content (e.g. a search bar). */ footer?: ReactNode; /** Replaces the page background (default: the grouped-list gray). */ className?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onBack()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onBack])

  // With a subheader (tabs), the top is the iOS scroll-edge bar: clear at rest, and one hard frosted bar with a hairline fades in
  // as rows slide under the tabs, so they slide under something solid instead of a soft blur. It runs from the very top
  // down through the row of the pinned section header (92px below the safe area, up to 36 tall), all one background.
  const scrollY = useMotionValue(0)
  // Content starts 112px below the safe area and the tabs end at 92, so it first slides under the tabs after 20px of scroll: the bar
  // starts to fade in there, not before, and is fully in 24px later.
  const barOpacity = useTransform(scrollY, [20, 44], [0, 1])

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", ...SPRING_FAST.snappy }}
      role="dialog"
      aria-label={title}
      className={cn("absolute inset-0 z-[30]", className ?? "bg-[#f3f2f6]")}
    >
      <div
        onScroll={(e) => scrollY.set(e.currentTarget.scrollTop)}
        className="[scrollbar-width:none] absolute inset-0 overflow-y-auto px-4 [&::-webkit-scrollbar]:hidden"
        style={{ paddingTop: `calc(var(--safe-top) + ${subheader ? 112 : 54}px)`, paddingBottom: `calc(var(--safe-bottom) + ${footer ? 104 : 24}px)` }}
      >
        {children}
      </div>

      {subheader && (
        <motion.div
          aria-hidden
          style={{ opacity: barOpacity, height: "calc(var(--safe-top) + 128px)" }}
          className="pointer-events-none absolute inset-x-0 top-0 z-[5] border-b border-black/[0.09] bg-white/70 backdrop-blur-xl"
        />
      )}
      <EdgeBlur top={subheader ? false : { strength: 24, steps: 6, height: "calc(var(--safe-top) + 64px)" }} bottom={footer ? { strength: 10, steps: 6, height: "calc(var(--safe-bottom) + 96px)", tint: "var(--ios-page-tint, rgba(255,255,255,0.5))" } : false} />

      <div className="absolute inset-x-4 z-10 flex h-11 items-center justify-center" style={{ top: "var(--safe-top)" }}>
        <LiquidGlass mode="small" radius={999} className="absolute left-0 flex size-11 items-center justify-center">
          <button onClick={onBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full text-[#141414]">
            <IconChevronLeft size={24} stroke={2} />
          </button>
        </LiquidGlass>
        <h2 className="text-[17px] font-[590] leading-[22px] tracking-[-0.43px] text-[#1a1a1a]">{title}</h2>
        {action && (
          <LiquidGlass mode="small" radius={999} className="absolute right-0 flex size-11 items-center justify-center">
            {action}
          </LiquidGlass>
        )}
      </div>
      {footer && <div className="absolute inset-x-0 bottom-0 z-10">{footer}</div>}
      {subheader && (
        <div className="absolute inset-x-0 z-10 flex justify-center" style={{ top: "calc(var(--safe-top) + 54px)" }}>
          {subheader}
        </div>
      )}
    </motion.div>
  )
}
