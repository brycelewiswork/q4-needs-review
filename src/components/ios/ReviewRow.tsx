import { useRef, useState } from "react"
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react"
import { IconBellFilled, IconBellRinging, IconFlag, IconFlagFilled, IconLogin2, IconLogout2, IconMapPin, IconMessageCircle, IconSparkles, IconX, IconCheck } from "@tabler/icons-react"
import { agentPlan, hasPlan, rolesOf, urgencyOf, type DetailLines, type ReviewItem, type ReviewProperty, type ReviewUrgency } from "@/data/needsReview"
import { roleColor } from "@/lib/roleColor"
import { SPRING_FAST } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { Initials } from "@/components/ios/list"

/** Width of each swipe action, and how far the row slides to show all three. */
const ACTION_W = 76
const REVEAL = ACTION_W * 3
/** Dragged this far, the row is dismissed on release (a full swipe, like Mail's). */
const FULL_SWIPE = REVEAL + 70
const SNAP = { type: "spring" as const, ...SPRING_FAST.snappy }

/** Whole class names, so Tailwind sees them. */
const CLAMP: Record<DetailLines, string> = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" }

const URGENCY: Record<ReviewUrgency, { label: string; chip: string }> = {
  high: { label: "High urgency", chip: "bg-[#fdeaea] text-[#e00000]" },
  medium: { label: "Medium urgency", chip: "bg-[#fdf0e2] text-[#b8620a]" },
  low: { label: "Low urgency", chip: "bg-black/5 text-[#7f7f7f]" },
}

/** The properties a row shows beneath its description, the ones turned on in View Options: role, location, urgency. */
function RowProperties({ item, show }: { item: ReviewItem; show: Record<ReviewProperty, boolean> }) {
  const on = show.role || show.location || show.urgency
  const roles = [...new Set(rolesOf(item))]
  const urgency = URGENCY[urgencyOf(item)]
  return (
    <motion.span
      initial={false}
      animate={{ height: on ? "auto" : 0, opacity: on ? 1 : 0 }}
      transition={SNAP}
      className="block overflow-hidden"
      aria-hidden={!on}
    >
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-[5px] text-[13px] leading-[18px] text-[#8e8e93]">
        {show.role &&
          roles.map((r) => (
            <span key={r} className="flex items-center gap-[5px]">
              <span aria-hidden className="size-[8px] rounded-full" style={{ backgroundColor: roleColor(r) }} />
              {r}
            </span>
          ))}
        {show.location && (
          <span className="flex items-center gap-[3px]">
            <IconMapPin size={13} stroke={2} />
            {item.location}
          </span>
        )}
        {show.urgency && <span className={cn("rounded-full px-2 text-[12px] font-[510] leading-[18px]", urgency.chip)}>{urgency.label}</span>}
      </span>
    </motion.span>
  )
}

/**
 * The avatar's slot at the left of a row. Showing or hiding the photos (the "..." menu) animates it: the avatar fades and
 * the slot's width closes up, so the text slides left to fill it (and back).
 */
export function AvatarSlot({ show, people }: { show: boolean; people: string[] }) {
  return (
    <motion.span
      initial={false}
      animate={{ width: show ? 40 : 0, marginRight: show ? 12 : 0, opacity: show ? 1 : 0 }}
      transition={SNAP}
      aria-hidden
      className="flex shrink-0 overflow-hidden"
    >
      <ReviewAvatar people={people} />
    </motion.span>
  )
}

/** A progress ring in the gutter, in place of the unread dot while the agent works; a filled check once it's done. */
function ProgressWheel({ progress, done, color }: { progress: number; done: boolean; color: string }) {
  const r = 5.5
  const c = 2 * Math.PI * r
  return (
    <span aria-hidden className="absolute left-[-1px] top-[23px] flex size-[14px] items-center justify-center">
      <motion.svg width="14" height="14" viewBox="0 0 14 14" className="absolute inset-0" animate={done ? { rotate: 0 } : { rotate: 360 }} transition={done ? { duration: 0 } : { duration: 1.1, repeat: Infinity, ease: "linear" }}>
        <circle cx="7" cy="7" r={r} fill="none" stroke={color} strokeOpacity="0.2" strokeWidth="2" />
        <motion.circle
          cx="7"
          cy="7"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - progress) }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: "50% 50%" }}
        />
      </motion.svg>
      {done && (
        <motion.span initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
          <IconCheck size={10} stroke={3.5} />
        </motion.span>
      )}
    </span>
  )
}

/**
 * Who the row is about. One person is one avatar; two (a swap or trade) are layered on a 45° diagonal, each smaller
 * so the pair fills the same square, the second in front.
 */
export function ReviewAvatar({ people }: { people: string[] }) {
  if (people.length < 2) return <Initials name={people[0]} size={40} />
  return (
    <span aria-hidden className="relative size-10 shrink-0">
      <span className="absolute left-0 top-0"><Initials name={people[0]} size={26} /></span>
      <span className="absolute bottom-0 right-0 rounded-full ring-2 ring-white"><Initials name={people[1]} size={26} /></span>
    </span>
  )
}

/**
 * A missed clock-out as a vertical timeline in a light gray box: a purple tile for clocking in with the role under it, a
 * bar down to a gap that fades out in dots, and the expected clock-out. Markers and line sit in the left column.
 */
function ClockoutTimeline({ clockedIn, expectedOut, role }: { clockedIn: string; expectedOut: string; role: string }) {
  return (
    <div className="rounded-2xl bg-[#f3f2f6] p-3 tracking-[-0.31px]">
      <div className="flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#8f55e5] text-white">
          <IconLogin2 size={15} stroke={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-[510] leading-5 text-black">Clocked in</span>
          <span className="block text-[13px] leading-4 text-[#8e8e93]">{role}</span>
        </span>
        <span className="text-[15px] leading-5 text-[#2c2935]">{clockedIn}</span>
      </div>
      {/* The line, in the marker column (24px wide, so its center is 12px in). */}
      <div aria-hidden className="flex w-6 flex-col items-center py-[2px]">
        <span className="h-5 w-1 rounded-full bg-[#8f55e5]" />
        <span className="mt-[5px] h-[10px] w-1 rounded-full bg-[#a2a2a2]" />
        <span className="mt-[5px] size-[6px] rounded-full bg-[#a2a2a2]" />
        <span className="mt-[4px] size-[3px] rounded-full bg-[#a2a2a2]" />
      </div>
      <div className="mt-[2px] flex items-center gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#a06df0] to-[#7a3fd0] text-white">
          <IconLogout2 size={15} stroke={2} />
        </span>
        <span className="min-w-0 flex-1 text-[15px] font-[510] leading-5 text-black">Expected clock-out</span>
        <span className="text-[15px] leading-5 text-[#2c2935]">{expectedOut}</span>
      </div>
    </div>
  )
}

/**
 * One thing that needs review, in two states. Minimized: the title, when it came in, and the first line of detail.
 * Tapped: the full detail, the facts behind it, why it's here, and the actions. Open and closed is the page's to
 * hold (one row open at a time), so this is controlled.
 *
 * Swipe it left for Remind, Important and Dismiss; swiping all the way dismisses. Mount it inside AnimatePresence so
 * a dismissed row slides off and closes up.
 */
export function ReviewRow({
  item,
  accent,
  photos,
  properties,
  detailLines,
  unread,
  open,
  important,
  reminded,
  agent,
  onToggle,
  onRun,
  onApprove,
  onImportant,
  onRemind,
  onDismiss,
}: {
  item: ReviewItem
  /** The main action's color: the current tab's. */
  accent: string
  /** Show the avatar at the left. */
  photos: boolean
  /** Which properties show beneath the description. */
  properties: Record<ReviewProperty, boolean>
  /** The most lines of description shown while the row is minimized. */
  detailLines: DetailLines
  /** Show the blue dot. */
  unread: boolean
  open: boolean
  /** Marked important: an orange flag by the time. */
  important: boolean
  /** A reminder is set: a bell by the time. */
  reminded: boolean
  /** The agent is working on it (or has finished): shown in place of the unread dot and the detail line. */
  agent?: { step: number; done: boolean; steps: string[]; doneText: string }
  onToggle: () => void
  /** The main action: hand it to the agent. */
  onRun: () => void
  /** The plain Approve, for an item that already has a plan. */
  onApprove: () => void
  onImportant: () => void
  onRemind: () => void
  onDismiss: () => void
}) {
  const main = agentPlan(item).label
  const names = item.people.map((n) => n.split(" ")[0]).join(" and ")
  const x = useMotionValue(0)
  // Hidden until the row moves, so no edge of them shows past the row at rest.
  const actionsOpacity = useTransform(x, [0, -6], [0, 1])
  const [revealed, setRevealed] = useState(false)
  // A drag ends in a click on the row: ignore it.
  const dragged = useRef(false)
  const settle = (to: number) => {
    setRevealed(to !== 0)
    animate(x, to, SNAP)
  }
  const actions = [
    { id: "remind", label: reminded ? "Reminder set" : "Remind me", color: "#5e5ce6", icon: <IconBellRinging size={22} stroke={1.75} />, run: onRemind },
    { id: "important", label: important ? "Not important" : "Important", color: "#ff9500", icon: important ? <IconFlagFilled size={22} /> : <IconFlag size={22} stroke={1.75} />, run: onImportant },
    { id: "dismiss", label: "Dismiss", color: "#8e8e93", icon: <IconX size={22} stroke={2} />, run: onDismiss },
  ]

  return (
    <motion.li
      exit={{ height: 0, opacity: 0, transition: { duration: 0.22, delay: 0.08 } }}
      className="relative overflow-hidden border-b border-black/[0.09] last:border-b-0"
    >
      {/* Behind the row: revealed as it slides left. */}
      <motion.div style={{ opacity: actionsOpacity }} className="absolute inset-y-0 right-0 flex" inert={!revealed}>
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              if (a.id === "dismiss") return a.run()
              a.run()
              settle(0)
            }}
            style={{ width: ACTION_W, backgroundColor: a.color }}
            className="flex flex-col items-center justify-center gap-1 px-1 text-center text-[13px] font-[510] leading-4 tracking-[-0.08px] text-white active:opacity-80"
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </motion.div>

      <motion.div
        drag={agent ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -(REVEAL + 140), right: 0 }}
        dragElastic={0.08}
        style={{ x }}
        exit={{ x: "-100%", transition: { duration: 0.2 } }}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={(_, info) => {
          setTimeout(() => (dragged.current = false), 60)
          const at = x.get()
          if (at < -FULL_SWIPE) onDismiss()
          else if (at < -REVEAL / 2 || info.velocity.x < -500) settle(-REVEAL)
          else settle(0)
        }}
        className="relative touch-pan-y bg-white pl-5"
      >
        {/* The gutter at the title's line: the unread dot (it fades once the row has been opened), or, while the agent works on it, a progress wheel. */}
        <span
          aria-hidden
          className={cn("absolute left-0 top-[25px] size-[10px] rounded-full bg-[#007aff] transition-opacity duration-200", unread && !agent ? "opacity-100" : "opacity-0")}
        />
        {agent && <ProgressWheel progress={agent.done ? 1 : (agent.step + 0.5) / agent.steps.length} done={agent.done} color={accent} />}
        <button
          onClick={() => {
            if (dragged.current) return
            // A row that's swiped open closes first.
            if (x.get() < -4) return settle(0)
            onToggle()
          }}
          aria-expanded={open}
          aria-label={unread ? `Unread, ${item.title}` : undefined}
          className="block w-full py-3 text-left tracking-[-0.43px] active:opacity-60"
        >
          <span className="flex items-start">
          <AvatarSlot show={photos} people={item.people ?? [item.title]} />
          <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-[17px] font-[590] leading-[22px] text-black">{item.title}</span>
            <span className="flex shrink-0 items-center gap-[5px] text-[13px] leading-[18px] text-[#7f7f7f]">
              {important && <IconFlagFilled size={13} className="text-[#ff9500]" aria-label="Important" />}
              {reminded && <IconBellFilled size={13} className="text-[#5e5ce6]" aria-label="Reminder set" />}
              {item.when}
            </span>
          </span>
          {agent ? (
            // The second line is the agent's progress: the step it's on, then what it did, in the same gray as the description.
            <span className="relative mt-px block h-5 overflow-hidden text-[15px] leading-5" aria-live="polite">
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={agent.done ? "done" : agent.step}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-1 whitespace-nowrap text-[#8e8e93]"
                >
                  {agent.done ? <IconCheck size={15} stroke={2.5} /> : <IconSparkles size={14} stroke={2} />}
                  {agent.done ? agent.doneText : `${agent.steps[agent.step]}…`}
                </motion.span>
              </AnimatePresence>
            </span>
          ) : (
            <span className={cn("mt-px block text-[15px] leading-5 text-[#8e8e93]", !open && CLAMP[detailLines])}>{item.detail}</span>
          )}
          <RowProperties item={item} show={properties} />
          </span>
          </span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={SNAP}
          className="overflow-hidden"
          aria-hidden={!open}
          inert={!open}
        >
          <div className="pb-4 tracking-[-0.43px]">
            {item.data.kind === "clockout" ? (
              <ClockoutTimeline {...item.data} />
            ) : (
              <dl className="flex flex-col gap-[6px] rounded-2xl bg-[#f3f2f6] px-3 py-[10px]">
                {item.facts.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 text-[15px] leading-5">
                    <dt className="text-[#8e8e93]">{label}</dt>
                    <dd className="text-right text-black">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {/* The assistant's read on it, under the facts so they stay together: one caption. */}
            <aside className="mt-2 flex items-start gap-[7px] rounded-2xl bg-[#f1ecfc] px-3 py-[10px]">
              <IconSparkles size={16} stroke={2} className="mt-[2px] shrink-0 text-[#6b3fc4]" />
              <p className="text-[15px] leading-5 text-[#4a2f86]">{item.context}</p>
            </aside>
            {/* Message the person, then either a plain Approve (the fix is already planned) or, when there's no plan, solve it by hand or hand it to the agent. The main action is last, at the right: where a thumb lands. */}
            <div className="mt-3 flex gap-2">
              <button aria-label={`Message ${names}`} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black/5 text-black active:opacity-60">
                <IconMessageCircle size={20} stroke={1.75} />
              </button>
              {hasPlan(item) ? (
                <button onClick={onApprove} style={{ backgroundColor: accent }} className="flex h-10 flex-1 items-center justify-center rounded-full px-3 text-[15px] font-[590] text-white active:opacity-80">
                  Approve
                </button>
              ) : (
                <>
                  <button aria-haspopup="dialog" className="flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-black/5 px-3 text-[15px] font-[590] text-black active:opacity-60">
                    Solve manually
                  </button>
                  <button onClick={onRun} style={{ backgroundColor: accent }} className="flex h-10 flex-[1.5] items-center justify-center gap-[6px] whitespace-nowrap rounded-full px-3 text-[15px] font-[590] text-white active:opacity-80">
                    <IconSparkles size={16} stroke={2} />
                    {main}
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.li>
  )
}
