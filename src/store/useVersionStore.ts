import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * Which version of the prototype is showing. A is the first design; B starts as a copy of it to take somewhere else.
 * C and D are held places, not built yet (the switch shows them dimmed).
 */
export type Version = "a" | "b" | "c" | "d"

export const VERSIONS: { id: Version; ready: boolean }[] = [
  { id: "a", ready: true },
  { id: "b", ready: true },
  { id: "c", ready: false },
  { id: "d", ready: false },
]

const fromUrl = (): Version | null => {
  const v = new URLSearchParams(window.location.search).get("v")
  return VERSIONS.some((x) => x.id === v && x.ready) ? (v as Version) : null
}

export const useVersionStore = create<{ version: Version; setVersion: (v: Version) => void }>()(
  persist(
    (set) => ({ version: "a", setVersion: (version) => set({ version }) }),
    {
      name: "q4-needs-review-version",
      // A link (?v=b) beats whatever was saved.
      merge: (saved, current) => ({ ...current, ...(saved as object), ...(fromUrl() ? { version: fromUrl()! } : {}) }),
    },
  ),
)
