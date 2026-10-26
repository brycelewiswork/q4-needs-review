import { create } from "zustand"
import { persist } from "zustand/middleware"

/** The signed-in person. Same across locations; edited on the Personal Information page. */
export type Person = {
  name: string
  firstName: string
  middleName: string
  lastName: string
  dob: string
  ssn: string
  phone: string
  email: string
  address: string
  emergencyName: string
  emergencyPhone: string
  experience: string
  certifications: string
  education: string
}

const DEFAULTS: Person = {
  name: "Bryce Lewis",
  firstName: "Bryce",
  middleName: "",
  lastName: "Lewis",
  dob: "Oct 24, 1989",
  ssn: "•••1112",
  phone: "",
  email: "blewis@joinhomebase.com",
  address: "425 2nd St #450",
  emergencyName: "Jane Doe",
  emergencyPhone: "510-123-4567",
  experience: "BSCAH",
  certifications: "Team Spirit",
  education: "Brown University",
}

type PersonState = Person & { set: (patch: Partial<Person>) => void }

export const usePersonStore = create<PersonState>()(
  persist(
    (set) => ({ ...DEFAULTS, set: (patch) => set(patch) }),
    { name: "q4-person" },
  ),
)
