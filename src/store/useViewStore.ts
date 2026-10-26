import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LOCATIONS } from "@/data/locations"

/**
 * How the prototype is shown, set from the controls above the device.
 *
 *   platform    → "ios" or "android".
 *   device      → a phone or a tablet.
 *   orientation → held upright or on its side.
 */
export type Platform = "ios" | "android"
export type Device = "phone" | "tablet"
export type Orientation = "portrait" | "landscape"

/**
 * Which cut of Version D's screens this sketch shows. "structure" keeps titles, card titles and navigation and turns
 * everything else into empty boxes and list skeletons; "full" is the finished-looking design. No switch for it here.
 */
const DETAIL = "full" as "full" | "structure"

type View = { platform: Platform; device: Device; orientation: Orientation }

type State = View & {
  setPlatform: (p: Platform) => void
  setDevice: (d: Device) => void
  setOrientation: (o: Orientation) => void
}

const fromUrl = (): Partial<View> => {
  const q = new URLSearchParams(window.location.search)
  const out: Partial<View> = {}
  const p = q.get("platform")
  const d = q.get("device")
  const o = q.get("orientation")
  if (p === "ios" || p === "android") out.platform = p
  if (d === "phone" || d === "tablet") out.device = d
  if (o === "portrait" || o === "landscape") out.orientation = o
  return out
}

export const useViewStore = create<State>()(
  persist(
    (set) => ({
      platform: "ios",
      device: "phone",
      orientation: "portrait",
      setPlatform: (platform) => set({ platform }),
      setDevice: (device) => set({ device }),
      setOrientation: (orientation) => set({ orientation }),
    }),
    {
      name: "q4-needs-review-view",
      // A link (?platform=android&device=tablet&orientation=landscape) beats whatever was saved.
      merge: (saved, current) => ({ ...current, ...(saved as object), ...fromUrl() }),
    },
  ),
)

/** True when screens should render the pared-down structure cut. */
export const useStructure = () => DETAIL === "structure"

/**
 * How to print a location's name. The structure cut drops the real business names for "Location 1",
 * "Location 2"… so nobody reads the sample data instead of the IA.
 */
export function useLocName() {
  const wire = useStructure()
  return (l: { id: string; name: string }) => (wire ? `Location ${LOCATIONS.findIndex((x) => x.id === l.id) + 1}` : l.name)
}

/** The title in the toolbar: the selected location's name. */
export function useLocTitle(loc: { id: string; name: string }) {
  const name = useLocName()
  return name(loc)
}

/** The user, anonymized for the structure cut. */
export const ANON = { name: "First Last", email: "name@email.com" }
