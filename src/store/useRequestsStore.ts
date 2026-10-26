import { create } from "zustand"
import type { Location, RequestItem } from "@/data/locations"

export type Decision = "approved" | "declined"

type State = {
  decided: Record<string, Decision>
  /** Requests created with the "Add request" button, per location (appended after the seeded ones). */
  added: Record<string, RequestItem[]>
  decide: (id: string, d: Decision) => void
  addRequest: (locId: string, r: RequestItem) => void
}

/** Approve / decline decisions, by request id. Not persisted: a reload resets. */
export const useRequestsStore = create<State>()((set) => ({
  decided: {},
  added: {},
  decide: (id, d) => set((s) => ({ decided: { ...s.decided, [id]: d } })),
  addRequest: (locId, r) => set((s) => ({ added: { ...s.added, [locId]: [...(s.added[locId] ?? []), r] } })),
}))

/** Seeded + added requests for a location. */
export const requestsFor = (loc: Location, added: Record<string, RequestItem[]>): RequestItem[] => [
  ...loc.requests,
  ...(added[loc.id] ?? []),
]

/** Requests that still need the user's decision (team + business, undecided). */
export const pendingFor = (
  loc: Location,
  decided: Record<string, Decision>,
  added: Record<string, RequestItem[]> = {},
): RequestItem[] => requestsFor(loc, added).filter((r) => r.scope !== "mine" && !decided[r.id])
