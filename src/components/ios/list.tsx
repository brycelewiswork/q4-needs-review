import type { ReactNode } from "react"
import { motion } from "motion/react"
import { IconChevronRight, IconSelector } from "@tabler/icons-react"
import { Squircle } from "@/components/squircle"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"

/** White grouped-list surface (iOS "inset grouped" card). */
export function Card({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <Squircle as="div" cornerRadius={26} className={cn("bg-white", className)}>
      {children}
    </Squircle>
  )
}

/** chevron.up.chevron.down — the pull-down menu indicator. */
export const UpDownChevron = () => <IconSelector size={16} stroke={2.5} className="shrink-0 text-[#928fa0]" />

export const Chevron = () => <IconChevronRight size={16} stroke={2.5} className="shrink-0 text-[#928fa0]" />

/** Small gray label above a group. */
export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[13px] font-[590] leading-[18px] tracking-[-0.08px] text-[#747182]">{children}</p>
  )
}

/** iOS list header: 17pt semibold label, optional trailing action (e.g. Edit). */
export function SectionHeader({
  children,
  action,
  onAction,
}: {
  children: ReactNode
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center px-4 pb-1 pt-[14px] tracking-[-0.43px]">
      <h3 className="flex-1 text-[17px] font-[590] leading-[22px] text-[#747182]">{children}</h3>
      {action && (
        <button onClick={onAction} className="text-[15px] leading-5 text-[#8f55e5] active:opacity-60">
          {action}
        </button>
      )}
    </div>
  )
}

/** Footnote under a group. */
export function GroupFooter({ children }: { children: ReactNode }) {
  return <p className="px-4 pt-2 text-[13px] leading-[18px] tracking-[-0.08px] text-[#5a5666]">{children}</p>
}

/**
 * One row in a grouped list. Rows after the first get an inset hairline.
 * Pass `onClick` to make it a button.
 */
export function ListRow({
  first,
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  onClick,
  titleClassName,
  compact,
  divider = "border-[#ebebeb]",
}: {
  first?: boolean
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  chevron?: boolean | "updown"
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  titleClassName?: string
  /** 44pt row instead of 52pt. */
  compact?: boolean
  /** Divider color class (default: hairline on white). */
  divider?: string
}) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn("flex w-full items-center pl-4 pr-4 text-left", onClick && "active:bg-black/[0.04]")}
    >
      {leading && <span className="mr-3 flex shrink-0 items-center">{leading}</span>}
      <span
        className={cn(
          // A row with a second line gets more height than a one-liner, so the two lines have room.
          compact ? "flex min-h-[44px] min-w-0 flex-1 items-center gap-3 py-1 tracking-[-0.43px]" : subtitle ? "flex min-h-[68px] min-w-0 flex-1 items-center gap-3 py-3 tracking-[-0.43px]" : "flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2 tracking-[-0.43px]",
          !first && `border-t ${divider}`,
        )}
        style={!first ? { marginLeft: 0 } : undefined}
      >
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-[17px] leading-[22px] text-[#2c2935]", titleClassName)}>{title}</span>
          {subtitle && <span className="block text-[15px] leading-5 text-[#5a5666]">{subtitle}</span>}
        </span>
        {trailing && <span className="shrink-0 text-[17px] leading-[22px] text-[#5a5666]">{trailing}</span>}
        {chevron === "updown" ? <UpDownChevron /> : chevron ? <Chevron /> : null}
      </span>
    </Comp>
  )
}

/** iOS switch. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  /** Looks the same, but doesn't respond (e.g. a page that's only editable after Edit). */
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? "#34c759" : "rgba(120,120,128,0.32)" }}
    >
      <motion.span
        className="absolute left-[2px] top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: "spring", ...SPRING_FAST.snappy }}
      />
    </button>
  )
}

/** Initials avatar with a stable tint per name. */
const TINTS: [string, string][] = [
  ["#beacff", "#937ee2"],
  ["#bfe8e9", "#64c3c4"],
  ["#ffd7a8", "#f0a04b"],
  ["#ffc2d1", "#e6708f"],
  ["#d7c2ff", "#a47ae8"],
]
/** The signed-in person's own avatar tint: the purple of the profile card in Settings, so their avatar matches everywhere it shows. */
export const SELF_TINT: [string, string] = TINTS[0]

export function Initials({ name, size = 40, tint }: { name: string; size?: number; /** Overrides the tint chosen from the name. */ tint?: [string, string] }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
  const [a, b] = tint ?? TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TINTS.length]
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-[590] text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundImage: `linear-gradient(${a}, ${b})` }}
    >
      {initials}
    </span>
  )
}
