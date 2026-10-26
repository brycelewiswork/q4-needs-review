import { createContext, useContext, type ReactNode } from "react"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LOCATIONS, type Location } from "@/data/locations"

type LocationState = {
  /** The one selected location. It is also the last one used: it persists, so the app opens where the person left off. */
  locationId: string
  setLocation: (id: string) => void
}

/** The one location switcher. Every page below Home reads its content through this, and shows exactly one location. */
export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locationId: LOCATIONS[0].id,
      setLocation: (locationId) => set({ locationId }),
    }),
    { name: "q4-location" },
  ),
)

export function useLocation(): Location {
  const id = useLocationStore((s) => s.locationId)
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0]
}

/**
 * Overrides which locations are on screen for everything below it. Home is a fixed overview (all of a person's
 * locations, whatever the switcher says), and a location opened from it shows just that one.
 */
export const ScopeContext = createContext<Location[] | null>(null)

/** The locations whose data is on screen: the override if there is one (Home), else the selected location. Pages below Home never mix locations. */
export function useScope(): Location[] {
  const override = useContext(ScopeContext)
  const loc = useLocation()
  return override ?? [loc]
}

/** Opens one location's own view, growing out of the thing tapped. Provided on the Home overview, where a location's header and the breakdown rows are ways in. */
/** `row` is the element tapped and `clone` its look, for the view to grow out of. */
export const OpenLocationContext = createContext<((l: Location, row?: HTMLElement, clone?: ReactNode) => void) | null>(null)
