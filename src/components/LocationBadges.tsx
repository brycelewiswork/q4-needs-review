import { IconBell, IconMessage } from "@tabler/icons-react"
import { LOCATIONS, unreadAt, type Location } from "@/data/locations"
import { pendingFor, useRequestsStore } from "@/store/useRequestsStore"
import { cn } from "@/lib/utils"

export type Counts = { messages: number; requests: number }

/** What is waiting at each location: unread conversations, and requests that still need a decision. Pass several to add them up. */
export function useCounts(scope: Location[] = LOCATIONS): Counts {
  const decided = useRequestsStore((s) => s.decided)
  const added = useRequestsStore((s) => s.added)
  return {
    messages: scope.reduce((n, l) => n + unreadAt(l), 0),
    requests: scope.reduce((n, l) => n + pendingFor(l, decided, added).length, 0),
  }
}

/**
 * What is waiting on a location, quietly: an icon per kind so each says what it is (a message for unread conversations,
 * a bell for requests waiting on a decision) with its count beside it and a tiny red dot after the count, the only
 * colour. Nothing at all when there is nothing. The same in the full design and the structure cut.
 */
export function LocationBadges({ messages, requests, android, className }: Counts & { android?: boolean; className?: string }) {
  if (!messages && !requests) return null
  const item = (Icon: typeof IconMessage, n: number, label: string) => (
    <span role="img" aria-label={label} className="flex items-center gap-[3px]">
      <Icon size={16} stroke={1.75} />
      <span className="text-[13px] font-[510] leading-4 tabular-nums">{n}</span>
      {/* The count is one the app shows in red (unread, or waiting on a decision), so it gets the tiny red dot. */}
      <span aria-hidden className="size-[5px] rounded-full" style={{ backgroundColor: android ? "var(--m-error)" : "#ff3b30" }} />
    </span>
  )
  return (
    <span className={cn("flex shrink-0 items-center gap-[10px]", android ? "text-m-variant" : "text-[#7f7f7f]", className)}>
      {messages > 0 && item(IconMessage, messages, `${messages} unread ${messages === 1 ? "message" : "messages"}`)}
      {requests > 0 && item(IconBell, requests, `${requests} ${requests === 1 ? "request" : "requests"} waiting`)}
    </span>
  )
}

/** LocationBadges for one location, for places that can't call the hook themselves (inside a map). */
export function LocationBadgesFor({ loc, android, className }: { loc: Location; android?: boolean; className?: string }) {
  return <LocationBadges {...useCounts([loc])} android={android} className={className} />
}

/** A single dot for a location that has anything waiting, for the collapsed rail where the icons don't fit. */
export function LocationDot({ loc, className }: { loc: Location; className?: string }) {
  const { messages, requests } = useCounts([loc])
  if (!messages && !requests) return null
  return <span aria-hidden className={cn("bg-m-variant size-[8px] rounded-full", className)} />
}
