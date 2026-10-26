import { create } from "zustand"

/**
 * Who is looking at the app. This sketch is only about the single-location owner/manager (OAM), so the type
 * is fixed; the store stays so the screens brought over from Version D keep their employee / multi-location branches.
 *
 *   employee  → employee home · Home / Money / Shifts / Chat · can work at several locations (switcher)
 *   oam       → owner/manager dashboard · Home / Shifts / Time / Chat · one location, no switcher
 *   multi     → owner/manager dashboard · Home / Shifts / Time / Chat · location switcher
 */
export type UserType = "employee" | "oam" | "multi"

/** Whether this kind of user can switch location. Only a single-location owner/manager can't. */
export const canSwitchLocation = (t: UserType) => t !== "oam"

export const useUserTypeStore = create<{ type: UserType }>()(() => ({ type: "oam" }))
