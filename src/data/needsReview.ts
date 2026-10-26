/**
 * Fake data for the Needs Review page: the things a single-location manager has to look at, drawn from the same
 * crew as the Montgomery location in locations.ts.
 *
 * Each area (a tab) is divided into kinds of thing that needs review; the page shows one section per kind.
 */
export type ReviewArea = "timesheets" | "schedule" | "hiring" | "me"

export type ReviewKind =
  | "clockout"
  | "breaks"
  | "timecard"
  | "noshow"
  | "cover"
  | "claim"
  | "availability"
  | "timeoff"
  | "applicant"
  | "i9"

/** The sections of each area, in page order. */
export const REVIEW_SECTIONS: Record<ReviewArea, { kind: ReviewKind; label: string }[]> = {
  timesheets: [
    { kind: "clockout", label: "Missed clock-outs" },
    { kind: "breaks", label: "Missed breaks" },
    { kind: "timecard", label: "Flagged time cards" },
  ],
  schedule: [
    { kind: "noshow", label: "No-shows" },
    { kind: "cover", label: "Cover requests" },
    { kind: "claim", label: "Open shift claims" },
    { kind: "availability", label: "Availability requests" },
    { kind: "timeoff", label: "Time-off requests" },
  ],
  me: [
    { kind: "timecard", label: "My time card" },
    { kind: "cover", label: "Shift requests" },
  ],
  hiring: [
    { kind: "applicant", label: "New applicants" },
    { kind: "i9", label: "I-9 verifications" },
  ],
}

/** What the plus on a section's header adds: the sheet's title, and the fields to fill in. */
export const REVIEW_ADD: Record<ReviewKind, { title: string; fields: string[] }> = {
  clockout: { title: "Add missed clock-out", fields: ["Employee", "Date", "Clock-out time"] },
  breaks: { title: "Add missed break", fields: ["Employee", "Date", "Break type"] },
  timecard: { title: "Flag a time card", fields: ["Employee", "Date", "Reason"] },
  noshow: { title: "Record a no-show", fields: ["Employee", "Shift", "Date"] },
  cover: { title: "New cover request", fields: ["Employee", "Shift", "Covered by"] },
  claim: { title: "New open shift claim", fields: ["Employee", "Open shift"] },
  availability: { title: "New availability request", fields: ["Employee", "Days", "Hours"] },
  timeoff: { title: "New time-off request", fields: ["Employee", "Start date", "End date"] },
  applicant: { title: "Add an applicant", fields: ["Name", "Role", "Email"] },
  i9: { title: "Start an I-9 verification", fields: ["Employee", "Start date", "Document"] },
}

/**
 * What a review item is made of, per kind. The row's one-line description is built from these by `describeReview`, so
 * it comes from the data, not from prose written per item.
 */
export type ReviewData =
  | { kind: "clockout"; day: string; clockedIn: string; expectedOut: string; role: string; /** Hours still open, if they're still clocked in. */ openHours?: number }
  | { kind: "breaks"; worked: string; missing: "paid" | "unpaid" | "both" }
  | { kind: "timecard"; flag: "late"; scheduled: string; actual: string; minutesLate: number }
  | { kind: "timecard"; flag: "geofence"; miles: number }
  | { kind: "timecard"; flag: "overtime"; hours: number; shiftsLeft: number }
  | { kind: "noshow"; shiftStart: string; role: string }
  | { kind: "cover"; day: string; shift: string; /** Who agreed to take it. */ coveredBy?: string; /** What they'd take in exchange: it's a swap. */ swapFor?: string }
  | { kind: "claim"; day: string; shift: string; start: string; end: string }
  | { kind: "availability"; available: boolean; days: string }
  | { kind: "timeoff"; dates: string; reason?: string }
  | { kind: "applicant"; role: string; screening: "passed" | "pending" | "failed" }
  | { kind: "i9"; issue: "section2"; due: string }
  | { kind: "i9"; issue: "expiring"; days: number }

/** "a" or "an" for a figure: an 8 hr shift, an 11 am start, a 6 hr one. */
const a = (figure: string) => (/^(8|11|18)(\D|$)/.test(figure) ? "an" : "a")

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** The one line under a row's title: a template per kind, filled from the item's data. */
export function describeReview(d: ReviewData): string {
  switch (d.kind) {
    case "clockout":
      return `Didn't clock out ${d.day}. Expected out at ${d.expectedOut}.${d.openHours ? ` Open for ${plural(d.openHours, "hr")}.` : ""}`
    case "breaks":
      return `No ${d.missing === "both" ? "paid or unpaid" : d.missing} break on ${a(d.worked)} ${d.worked} shift.`
    case "timecard":
      if (d.flag === "late") return `Clocked in ${d.minutesLate} min late, at ${d.actual} for ${a(d.scheduled)} ${d.scheduled} shift.`
      if (d.flag === "geofence") return `Clocked in ${d.miles} miles from the location.`
      return `At ${plural(d.hours, "hr")} with ${plural(d.shiftsLeft, "shift")} left this week.`
    case "noshow":
      return `Didn't show for the ${d.shiftStart} ${d.role} shift.`
    case "cover":
      if (d.swapFor) return `Want to swap ${d.day} ${d.shift} for ${d.swapFor}.`
      if (d.coveredBy) return `Wants ${d.coveredBy} to cover the ${d.day} ${d.shift}.`
      return `Asked for someone to take the ${d.day} ${d.shift}.`
    case "claim":
      return `Claimed the ${d.day} ${d.shift}, ${d.start} – ${d.end}.`
    case "availability":
      return `${d.available ? "Now available" : "No longer available"} ${d.days}.`
    case "timeoff":
      return `Requested ${d.dates} off${d.reason ? ` for ${d.reason}` : ""}.`
    case "applicant":
      return `Applied for ${d.role}. ${d.screening === "passed" ? "Passed the screening." : d.screening === "failed" ? "Did not pass the screening." : "Not yet screened."}`
    case "i9":
      return d.issue === "section2" ? `Section 2 is due ${d.due}.` : `Work authorization expires in ${plural(d.days, "day")}.`
  }
}

/** An item as written: the people it's about and its structured data. The kind, title and one-liner follow from those. */
type RawItem = {
  id: string
  /** How many days ago it came in, for the date range and sorting. */
  daysAgo: number
  area: ReviewArea
  /** Not seen yet: a blue dot until it's opened. */
  unread?: boolean
  /** Whose avatar: one person, or two for a swap (shown layered). Also the title. */
  people: string[]
  data: ReviewData
  /** When it came in, or when it's due. */
  when: string
  /** 0–100: how much this matters now. The Priority tab sorts by it, standing in for the AI's ranking. */
  signal: number
  /** The AI's note: one caption with what it knows that makes the decision easier, and why this is here. */
  context: string
  /** More than the row's line says, shown when it's tapped open: label and value. */
  facts: [label: string, value: string][]
}

export type ReviewItem = RawItem & {
  kind: ReviewKind
  /** Who it's about, in a line: the people's names. */
  title: string
  /** The one line under the title, from `describeReview`. */
  detail: string
  /** Hours ago it was created, and hours ago it last changed (an approval, a note, the agent). Never older than created. */
  created: number
  updated: number
  /** Which location it's from. */
  location: string
}

export type ReviewUrgency = "high" | "medium" | "low"

/** How urgent an item is, from its signal: the AI's read, in three levels. */
export const urgencyOf = (i: ReviewItem): ReviewUrgency => (i.signal >= 70 ? "high" : i.signal >= 45 ? "medium" : "low")

/** The properties a row can show beneath its description. Each can be added or taken away from View Options. */
export const REVIEW_PROPERTIES = [
  { id: "role", label: "Role" },
  { id: "location", label: "Location" },
  { id: "urgency", label: "Urgency" },
] as const
export type ReviewProperty = (typeof REVIEW_PROPERTIES)[number]["id"]

/** The most lines of description a row shows before cutting it off. */
export type DetailLines = 1 | 2 | 3

/**
 * Whether the fix is already worked out and only needs a yes: someone asked for a swap or a cover with a person lined up,
 * claimed an open shift, or sent an availability or time-off request. Those get a plain Approve, with no agent and no
 * manual option. The rest (a no-show, a missed clock-out, an applicant…) have no plan yet, so the agent makes one.
 */
export function hasPlan(item: ReviewItem): boolean {
  const d = item.data
  switch (d.kind) {
    case "cover":
      return !!(d.coveredBy || d.swapFor)
    case "claim":
    case "availability":
    case "timeoff":
      return true
    default:
      return false
  }
}

/**
 * What the agent does when the main action is tapped: the steps it narrates as it works, and what it reports when it's
 * done. A template per kind, filled from the item's data, like the one-line description.
 */
export function agentPlan(item: ReviewItem): { /** The button: what it will do, in words. */ label: string; steps: string[]; done: string } {
  const d = item.data
  const p = item.people[0].split(" ")[0]
  switch (d.kind) {
    case "clockout":
      return { label: "Fix clock-out", steps: [`Checking ${p}'s schedule`, `Setting clock-out to ${d.expectedOut}`, "Updating the time card"], done: `Clock-out set to ${d.expectedOut}` }
    case "breaks":
      return { label: d.missing === "both" ? "Add breaks" : "Add break", steps: [`Reviewing ${p}'s shift`, `Adding the ${d.missing === "both" ? "paid and unpaid" : d.missing} break`, "Recalculating hours"], done: "Break added to the time card" }
    case "timecard":
      if (d.flag === "late") return { label: "Approve clock-in", steps: [`Checking ${p}'s schedule`, "Approving the late clock-in", "Noting it on the time card"], done: "Late clock-in approved" }
      if (d.flag === "geofence") return { label: "Approve clock-in", steps: [`Checking ${p}'s location history`, "Approving the clock-in", "Noting it on the time card"], done: "Clock-in approved" }
      return { label: "Adjust schedule", steps: [`Reviewing ${p}'s week`, "Moving a shift to stay under 40 hrs", "Updating the schedule"], done: "Schedule adjusted" }
    case "noshow":
      return { label: "Find cover", steps: [`Messaging ${p}`, `Finding available ${d.role} staff`, "Offering the shift"], done: "Shift offered to 3 people" }
    case "cover":
      if (d.swapFor || d.coveredBy) return { label: d.swapFor ? "Approve swap" : "Approve cover", steps: ["Checking hours and overtime", "Updating the schedule", `Notifying ${item.people.map((n) => n.split(" ")[0]).join(" and ")}`], done: d.swapFor ? "Swap approved" : "Cover approved" }
      return { label: "Find cover", steps: ["Finding who's available", "Offering the shift", "Waiting for a taker"], done: "Offered to 3 people" }
    case "claim":
      return { label: "Assign shift", steps: [`Checking ${p}'s hours`, "Assigning the shift", `Notifying ${p}`], done: `Shift assigned to ${p}` }
    case "availability":
      return { label: "Set availability", steps: ["Checking affected shifts", `Updating ${p}'s availability`, "Rebalancing coverage"], done: "Availability updated" }
    case "timeoff":
      return { label: "Approve time off", steps: [`Checking coverage for ${d.dates}`, "Approving the request", "Updating the schedule"], done: "Time off approved" }
    case "applicant":
      return { label: "Schedule interview", steps: [`Reviewing ${p}'s application`, "Finding interview times", "Sending an invite"], done: "Interview invite sent" }
    case "i9":
      return d.issue === "section2"
        ? { label: "Verify documents", steps: [`Checking ${p}'s documents`, "Verifying Section 2", "Filing the I-9"], done: "I-9 verified" }
        : { label: "Re-verify I-9", steps: [`Checking ${p}'s documents`, "Starting re-verification", `Sending ${p} a reminder`], done: "Re-verification started" }
  }
}

const RAW_ITEMS: RawItem[] = [
  // Timesheets: missed clock-outs
  { id: "co1", daysAgo: 1, people: ["Devon Park"], data: { kind: "clockout", day: "yesterday", clockedIn: "7:02 am", expectedOut: "3:30 pm", role: "Maintenance" }, area: "timesheets", unread: true, when: "Yesterday", signal: 74, context: "Devon has clocked out on time for 41 of his last 42 shifts, so this looks like a missed tap, not a long day.", facts: [["Scheduled", "7:00 am – 3:30 pm"], ["Clocked in", "7:02 am"], ["Clocked out", "Missing"]] },
  { id: "co2", daysAgo: 2, people: ["Rosie Atkins"], data: { kind: "clockout", day: "Tuesday", clockedIn: "11:58 am", expectedOut: "8:00 pm", role: "Trainer", openHours: 31 }, area: "timesheets", unread: true, when: "Wed", signal: 79, context: "Her shift ended at 8:00 pm Tuesday and nothing suggests she worked overnight. Fixing it now keeps her under 40 hrs.", facts: [["Scheduled", "12:00 pm – 8:00 pm"], ["Clocked in", "11:58 am Tue"], ["Open for", "31 hrs"]] },

  // Timesheets: missed breaks
  { id: "br1", daysAgo: 0, people: ["Kelli Moore"], data: { kind: "breaks", worked: "6 hr 8 min", missing: "both" }, area: "timesheets", unread: true, when: "Today", signal: 81, context: "Kelli had no break on her last two shifts either. A correction before payroll avoids a premium-pay penalty.", facts: [["Worked", "6 hrs 8 min"], ["Paid break", "Missing"], ["Unpaid break", "Missing"]] },
  { id: "br2", daysAgo: 1, people: ["Imani Brooks"], data: { kind: "breaks", worked: "6 hr 46 min", missing: "unpaid" }, area: "timesheets", when: "Yesterday", signal: 47, context: "Imani usually takes her break around 1 pm. It may have been taken without punching out.", facts: [["Worked", "6 hrs 46 min"], ["Paid break", "10 min"], ["Unpaid break", "Missing"]] },
  { id: "br3", daysAgo: 12, people: ["Dario Kim"], data: { kind: "breaks", worked: "8 hr 15 min", missing: "paid" }, area: "timesheets", when: "Oct 14", signal: 35, context: "Dario's break may have been logged under the wrong shift on Monday. His timecard shows a 30-minute gap at 1:10 pm.", facts: [["Worked", "8 hrs 15 min"], ["Paid break", "Missing"], ["Unpaid break", "30 min"]] },

  // Timesheets: flagged time cards
  { id: "tcd1", daysAgo: 0, people: ["Maya Torres"], data: { kind: "timecard", flag: "late", scheduled: "6:00 am", actual: "6:24 am", minutesLate: 24 }, area: "timesheets", when: "Today", signal: 38, context: "Maya's clock-in was 24 minutes late and her commute alert shows she left home at 5:50 am.", facts: [["Scheduled", "6:00 am"], ["Clocked in", "6:24 am"], ["Late", "24 min"]] },
  { id: "tcd2", daysAgo: 0, people: ["Dario Kim"], data: { kind: "timecard", flag: "geofence", miles: 1.2 }, area: "timesheets", unread: true, when: "Today", signal: 55, context: "The punch matches Dario's phone location from his drive in. He may have clocked in from the parking lot across the road.", facts: [["Clock-in", "7:45 am"], ["Distance", "1.2 miles away"], ["Device", "Mobile app"]] },
  { id: "tcd3", daysAgo: 4, people: ["Rosie Atkins"], data: { kind: "timecard", flag: "overtime", hours: 37, shiftsLeft: 2 }, area: "timesheets", when: "This week", signal: 69, context: "If Rosie works both remaining shifts, she'll cross 40 hrs by about 4 hrs. Trimming Thursday's close would keep her under.", facts: [["Hours so far", "37 hrs"], ["Shifts left", "Thu, Fri"], ["Projected", "44 hrs"]] },
  { id: "tcd4", daysAgo: 11, area: "timesheets", people: ["Priya Shah"], data: { kind: "timecard", flag: "late", scheduled: "9:00 am", actual: "9:31 am", minutesLate: 31 }, when: "Oct 15", signal: 22, context: "Priya has been late twice this pay period. The first was approved.", facts: [["Scheduled", "9:00 am"], ["Clocked in", "9:31 am"], ["Late", "31 min"]] },

  // Schedule: no-shows
  { id: "ns1", daysAgo: 0, people: ["Owen Blake"], data: { kind: "noshow", shiftStart: "8 am", role: "maintenance" }, area: "schedule", unread: true, when: "Today", signal: 93, context: "Owen hasn't answered two texts. He had no time off or availability change on file. Maintenance is the only person scheduled for the sauna service.", facts: [["Shift", "8:00 am – 4:00 pm"], ["Role", "Maintenance"], ["Called or texted", "No"]] },

  // Schedule: cover requests
  { id: "cv1", daysAgo: 0, people: ["Jason Reyes", "Kelli Moore"], data: { kind: "cover", day: "Friday", shift: "shift", coveredBy: "Kelli Moore" }, area: "schedule", when: "3h ago", signal: 46, context: "Kelli is off Friday and well under her hours, and Jason has covered for others twice this month.", facts: [["Jason", "Fri, 2 pm – 8 pm"], ["Covered by", "Kelli Moore"], ["Overtime", "None"]] },
  { id: "cv2", daysAgo: 1, people: ["Imani Brooks"], data: { kind: "cover", day: "Saturday", shift: "opener" }, area: "schedule", unread: true, when: "Yesterday", signal: 61, context: "Three people are available Saturday morning, and Maya just opened up Saturdays. Offering it to her first fills it fastest.", facts: [["Shift", "Sat, 6:00 am – 12:00 pm"], ["Role", "Front desk"], ["Volunteers", "None"]] },
  { id: "cv3", daysAgo: 1, people: ["Lena Wu", "Maya Torres"], data: { kind: "cover", day: "Tuesday", shift: "midday", swapFor: "Thursday opener" }, area: "schedule", when: "Yesterday", signal: 44, context: "Lena and Maya have swapped twice before without issues. Neither would be over 30 hrs.", facts: [["Lena gives", "Tue, 10 am – 2 pm"], ["Maya gives", "Thu, 6 am – 12 pm"], ["Overtime", "None"]] },

  // Schedule: open shift claims
  { id: "oc1", daysAgo: 0, people: ["Dario Kim"], data: { kind: "claim", day: "Sunday", shift: "close", start: "4 pm", end: "10 pm" }, area: "schedule", unread: true, when: "1h ago", signal: 50, context: "Dario is qualified for floor lead and has closed twice this month. He would hit 38 hrs, under overtime.", facts: [["Shift", "Sun, 4:00 pm – 10:00 pm"], ["Role", "Floor lead"], ["His week", "38 hrs"]] },
  { id: "oc2", daysAgo: 0, people: ["Lena Wu"], data: { kind: "claim", day: "Tuesday", shift: "midday", start: "10 am", end: "2 pm" }, area: "schedule", when: "5h ago", signal: 33, context: "Lena has covered this slot before. Approving her leaves the midday front desk fully staffed.", facts: [["Shift", "Tue, 10:00 am – 2:00 pm"], ["Role", "Front desk"], ["Her week", "22 hrs"]] },

  // Schedule: availability requests
  { id: "av1", daysAgo: 2, people: ["Lena Wu"], data: { kind: "availability", available: false, days: "weekday mornings" }, area: "schedule", when: "2d ago", signal: 29, context: "Lena's weekday morning shifts would need new coverage. Imani and Kelli are both free to pick them up.", facts: [["Unavailable", "Mon – Fri mornings"], ["Shifts affected", "3 of 5"], ["Effective", "Next week"]] },
  { id: "av2", daysAgo: 1, people: ["Maya Torres"], data: { kind: "availability", available: true, days: "Saturdays" }, area: "schedule", unread: true, when: "Yesterday", signal: 41, context: "Maya's new Saturday availability matches the open Saturday opener, which has had no claims.", facts: [["Available", "Sat, all day"], ["Shifts affected", "0"], ["Effective", "This week"]] },

  // Schedule: time-off requests
  { id: "to1", daysAgo: 1, people: ["Priya Shah"], data: { kind: "timeoff", dates: "next Friday" }, area: "schedule", unread: true, when: "Yesterday", signal: 52, context: "Two others are off the same day. Approving still leaves front desk covered, but the opening shift would be tight.", facts: [["Date", "Fri, Nov 7"], ["Already off", "2 people"], ["Coverage", "Thin at open"]] },
  { id: "to2", daysAgo: 3, people: ["Kelli Moore"], data: { kind: "timeoff", dates: "Nov 24 – 28", reason: "Thanksgiving" }, area: "schedule", when: "3d ago", signal: 58, context: "Kelli asked for the same week last year and it was approved. Two other requests overlap, so coverage drops on Wednesday.", facts: [["Dates", "Nov 24 – 28"], ["Shifts affected", "4"], ["Already off", "Jason Reyes"]] },
  { id: "to3", daysAgo: 10, area: "schedule", people: ["Owen Blake"], data: { kind: "timeoff", dates: "Oct 17 – 18", reason: "a family event" }, when: "Oct 16", signal: 27, context: "Owen asked a week out. The Saturday maintenance shift would need cover.", facts: [["Dates", "Oct 17 – 18"], ["Shifts affected", "2"], ["Already off", "None"]] },

  // Hiring: new applicants
  { id: "ap1", daysAgo: 1, people: ["Ana Ruiz"], data: { kind: "applicant", role: "Front desk", screening: "passed" }, area: "hiring", unread: true, when: "1d ago", signal: 63, context: "She has two years of front desk experience and is available weekends, which is the gap on your schedule.", facts: [["Role", "Front desk"], ["Applied", "Yesterday"], ["Screening", "Passed"]] },
  { id: "ap2", daysAgo: 2, people: ["Marcus Bell"], data: { kind: "applicant", role: "Trainer", screening: "passed" }, area: "hiring", when: "2d ago", signal: 66, context: "Marcus is certified and has asked about Saturday classes, when you have no trainer scheduled.", facts: [["Role", "Trainer"], ["Experience", "4 years"], ["Screening", "Passed"]] },
  { id: "ap3", daysAgo: 15, people: ["Jules Carter"], data: { kind: "applicant", role: "Maintenance", screening: "pending" }, area: "hiring", when: "Oct 11", signal: 31, context: "Of the five maintenance applicants this week, Jules has the most relevant experience on paper.", facts: [["Role", "Maintenance"], ["Applied", "Mon"], ["Screening", "Not started"]] },

  // Hiring: I-9 verifications
  { id: "i91", daysAgo: 5, people: ["Tess Morgan"], data: { kind: "i9", issue: "section2", due: "Thursday" }, area: "hiring", unread: true, when: "Mon", signal: 85, context: "Federal rules require the employer section within three business days of her start. She has uploaded a passport.", facts: [["Start date", "Monday"], ["Section 1", "Done"], ["Section 2", "Due Thursday"]] },
  { id: "i92", daysAgo: 0, people: ["Leo Park"], data: { kind: "i9", issue: "expiring", days: 9 }, area: "hiring", when: "9 days", signal: 57, context: "His authorization expires Nov 4. Reverifying within 90 days of expiry is required to keep him on the schedule.", facts: [["Document", "Employment authorization"], ["Expires", "Nov 4"], ["Section 3", "Not started"]] },

  // Me: what involves the manager personally
  { id: "me1", daysAgo: 0, unread: true, people: ["Bryce Lewis"], data: { kind: "timecard", flag: "overtime", hours: 38, shiftsLeft: 2 }, area: "me", when: "This week", signal: 60, context: "You're on track for 46 hrs. Moving Friday's close to Imani would keep you under 40.", facts: [["Hours so far", "38 hrs"], ["Shifts left", "Thu, Fri"], ["Projected", "46 hrs"]] },
  { id: "me2", daysAgo: 0, unread: true, people: ["Jason Reyes", "Bryce Lewis"], data: { kind: "cover", day: "Saturday", shift: "opener", swapFor: "Sunday close" }, area: "me", when: "2h ago", signal: 48, context: "You're off Sunday afternoon and well under your hours, and Jason has covered for you before.", facts: [["Jason gives", "Sat, 6 am – 12 pm"], ["You give", "Sun, 4 pm – 10 pm"], ["Overtime", "None"]] },
  { id: "me3", daysAgo: 1, people: ["Kelli Moore", "Bryce Lewis"], data: { kind: "cover", day: "Thursday", shift: "midday", coveredBy: "Bryce Lewis" }, area: "me", when: "Yesterday", signal: 44, context: "Kelli asked you directly. She's covered two of your shifts this month.", facts: [["Shift", "Thu, 10 am – 2 pm"], ["Role", "Front desk"], ["Your week", "30 hrs"]] },
]

/** Fake created and updated times: created from the day and the "3h ago" on it, updated somewhere between then and now. */
function ages(r: RawItem, index: number) {
  const hours = r.when.match(/^(\d+)h ago$/)
  const created = r.daysAgo * 24 + (hours ? Number(hours[1]) : 2 + ((index * 7) % 19))
  const updated = created - Math.floor(created * (((index * 37) % 10) / 10) * 0.85)
  // Most of it is the one location; some is its sister gym.
  const location = ["Montgomery", "Montgomery", "Harbor Point"][index % 3]
  return { created, updated, location }
}

export const REVIEW_ITEMS: ReviewItem[] = RAW_ITEMS.map((r, i) => ({
  ...r,
  kind: r.data.kind,
  title: r.people.join(" & "),
  detail: describeReview(r.data),
  ...ages(r, i),
}))

/** The roles this business has added: what the roles filter lists. Each has its dot color from roleColor. */
export const REVIEW_ROLES = ["Front desk", "Floor lead", "Trainer", "Maintenance", "Shift lead", "Counter", "Opening manager", "General manager"] as const

/** Each person's role at this location. */
const PERSON_ROLE: Record<string, string> = {
  "Devon Park": "Maintenance",
  "Rosie Atkins": "Trainer",
  "Kelli Moore": "Front desk",
  "Imani Brooks": "Front desk",
  "Dario Kim": "Shift lead",
  "Maya Torres": "Trainer",
  "Owen Blake": "Maintenance",
  "Jason Reyes": "Floor lead",
  "Lena Wu": "Front desk",
  "Priya Shah": "Counter",
  "Tess Morgan": "Front desk",
  "Leo Park": "Opening manager",
  "Bryce Lewis": "General manager",
}

/** The roles an item is about: its people's roles, or the role an applicant applied for. */
export const rolesOf = (i: ReviewItem): string[] =>
  i.data.kind === "applicant" ? [i.data.role] : i.people.map((p) => PERSON_ROLE[p]).filter(Boolean)

export type ReviewRange = "any" | "today" | "week" | "current" | "last"
export type ReviewSort = "priority" | "created" | "updated"

/**
 * Date ranges, as days ago. Pay periods are two weeks: the current one began a week ago (Oct 19 – Nov 1), the last one
 * ran Oct 5 – 18.
 */
export const REVIEW_RANGES: { id: ReviewRange; label: string; /** Shorter, for the filter pill. */ short: string; dates?: string; min: number; max: number }[] = [
  { id: "any", label: "Any time", short: "Any time", min: 0, max: Infinity },
  { id: "today", label: "Today", short: "Today", min: 0, max: 0 },
  { id: "week", label: "Last 7 days", short: "7 days", min: 0, max: 6 },
  { id: "current", label: "Current pay period", short: "This period", dates: "Oct 19 – Nov 1", min: 0, max: 7 },
  { id: "last", label: "Last pay period", short: "Last period", dates: "Oct 5 – 18", min: 8, max: 21 },
]

export const REVIEW_SORTS: { id: ReviewSort; label: string; detail: string }[] = [
  { id: "priority", label: "Priority", detail: "What needs you most first" },
  { id: "created", label: "Last created", detail: "Newest items first" },
  { id: "updated", label: "Last updated", detail: "Most recently changed first" },
]

/** What narrows the list, beyond the tab and the search, and how it's ordered. */
export type ReviewFilters = { unreadOnly: boolean; /** Empty means every role. */ roles: ReadonlySet<string>; range: ReviewRange; sort: ReviewSort }

export const NO_REVIEW_FILTERS: ReviewFilters = { unreadOnly: false, roles: new Set(), range: "any", sort: "priority" }

export type ReviewTabId = ReviewArea

/** The Priority section at the top of a tab: up to this many of its items, and only ones that matter this much or more. */
const PRIORITY_COUNT = 3
const PRIORITY_MIN = 60

/** How a tab is grouped under its Priority section: by kind of thing, by employee, or not at all (one list in kind order). */
export type ReviewGroup = "type" | "employee" | "none"

export type ReviewSection = { key: string; /** The employee, for a section grouped by employee. */ person?: string; label?: string; /** The kind of thing the section holds (what its plus adds). Omitted on Priority, which cuts across kinds. */ kind?: ReviewKind; items: ReviewItem[] }

/**
 * What a tab shows, narrowed to what matches the search and filters. It opens with a Priority section: the AI's few highest-
 * signal items from across the tab's kinds. Below it, the tab is divided into its kinds of thing, in order, skipping any
 * with nothing in them. An item in Priority isn't repeated below.
 */
export function reviewSectionsFor(tab: ReviewTabId, query = "", filters: ReviewFilters = NO_REVIEW_FILTERS, group: ReviewGroup = "type"): ReviewSection[] {
  const { unreadOnly, roles, range, sort } = filters
  const span = REVIEW_RANGES.find((r) => r.id === range)!
  const order = (items: ReviewItem[]) => {
    if (sort === "created") return [...items].sort((a, b) => a.created - b.created)
    if (sort === "updated") return [...items].sort((a, b) => a.updated - b.updated)
    return [...items].sort((a, b) => b.signal - a.signal)
  }
  const q = query.trim().toLowerCase()
  const matches = (i: ReviewItem) =>
    (!unreadOnly || !!i.unread) &&
    (roles.size === 0 || rolesOf(i).some((r) => roles.has(r))) &&
    i.daysAgo >= span.min &&
    i.daysAgo <= span.max &&
    (!q ||
    [i.title, i.detail, i.when, i.context, ...i.facts.flat()].some((t) => t.toLowerCase().includes(q)))
  const pool = REVIEW_ITEMS.filter((i) => i.area === tab && matches(i))
  const top = [...pool].filter((i) => i.signal >= PRIORITY_MIN).sort((a, b) => b.signal - a.signal).slice(0, PRIORITY_COUNT)
  const topIds = new Set(top.map((i) => i.id))
  const rest = pool.filter((i) => !topIds.has(i.id))
  const groups: ReviewSection[] =
    group === "employee"
      ? // One section per person (a swap goes under the first of the two), in name order.
        [...new Set(rest.map((i) => i.people[0]))].sort((a, b) => a.localeCompare(b)).map((person) => ({ key: `person:${person}`, person, label: person, items: order(rest.filter((i) => i.people[0] === person)) }))
      : REVIEW_SECTIONS[tab].map(({ kind, label }) => ({ key: kind, label, kind, items: order(rest.filter((i) => i.kind === kind)) }))
  return [{ key: "priority", label: "Priority", items: order(top) }, ...groups].filter((s) => s.items.length > 0)
}
