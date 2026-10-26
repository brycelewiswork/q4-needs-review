import { ASSISTANT_CHATS, MESSAGE_CHATS, type AssistantTurn, type ThreadMsg } from "@/data/chats"
// Dummy data, one record per location. Every widget on every screen reads from
// the selected location, so switching the title menu changes real content.
//
// Convention: when a new widget is added, add its data to EVERY location here.

export type SegmentId = "people" | "sales" | "traffic"
export type RequestScope = "team" | "mine" | "business"
export type RequestItem = {
  id: string
  scope: RequestScope
  initials: string
  who: string
  title: string
  detail: string
  /** "5:12 PM", "Yesterday", "Mon" */
  time: string
}
/** One conversation in the Messages tab. `photo` indexes the shiftmate photos for a DM. */
export type Message = {
  id: string
  kind: "announcement" | "team" | "group" | "dm"
  title: string
  preview: string
  time: string
  unread: boolean
  photo?: number
  /** The conversation itself, for opening it. */
  thread?: ThreadMsg[]
}
/** A timesheet on the Time tab's Day view that needs a manager's review. */
export type Timesheet = {
  id: string
  name: string
  role: string
  dept: string
  start: string
  end: string
  total: string
  rest: string
  issues: string[]
}
export type ShiftKind = "worked" | "today" | "open"
/** Mon…Sun availability on the Account page. */
export type Availability = { kind: "all-day" } | { kind: "available" } | { kind: "blocked"; range: string }

export type Location = {
  id: string
  name: string
  /** The business this location belongs to; the location menu groups under it. */
  company: string
  /** Unread notifications — drives the bell badge. */
  unread: number

  // Profile sheet (opened from the avatar)
  profile: {
    business: string
    address: string
    pin: string
    shoutout: { quote: string; author: string }
    /** Earlier shoutouts, newest first (the Shoutouts page lists them under the featured one). */
    moreShoutouts: { quote: string; author: string; when: string }[]
    stats: {
      onTime: string
      shifts: number
      hours: number
      rating: string
      missedClockOuts: number
      noShows: number
    }
    timeOff: { balance: string; plan: string; accrual: string; upcoming: { range: string; status: "Approved" | "Pending" }[] }
    availability: Availability[]
  }

  // Shared
  events: { title: string; when: string }[]

  // Manager dashboard
  sales: number
  /** Today's labor as a share of sales, percent. The all-locations widget badges it green under 15%, red over. */
  laborPct: number
  /** Mon…Sun dollars for the all-locations chart; days that haven't happened are 0. */
  weekSales: number[]
  weekLabor: number[]
  /** Projected sales for the days still to come (0 for days that have happened). Labor is projected from laborPct. */
  weekForecast: number[]
  managerMessage: string
  /** Hourly columns: Now, 1PM … 7PM. `actual` is bold, `planned` is gray beneath it. */
  status: Record<SegmentId, { actual: number[]; planned: number[] }>
  review: { title: string; detail: string }[]
  myWeek: { day: string; time: string; role: string }[]

  // Requests (bell). Team + business ones need a decision; "mine" are the user's own.
  requests: RequestItem[]

  // Profile pages
  /** `seen`: when they were last active ("2d"); `phone`: whether the Team list offers a call button. */
  team: { name: string; role: string; status: "on" | "scheduled" | "off"; detail: string; seen: string; phone: boolean }[]
  messages: Message[]
  /** Suggested prompts on the assistant sheet. */
  assistant: string[]
  /** Past assistant conversations (Conversations page). */
  conversations: { id: string; title: string; time: string; pinned?: boolean; thread?: AssistantTurn[] }[]
  timesheets: Timesheet[]
  tasks: { id: string; title: string; due: string; done: boolean }[]
  managerLog: { when: string; author: string; note: string }[]
  payroll: {
    nextPayday: string
    period: string
    hours: string
    gross: string
    stubs: { period: string; net: string }[]
  }

  // Employee home
  employee: {
    greeting: string
    /** Mon…Sun shifts the person works AT THIS LOCATION. Hours are decimal (13.5 = 1:30p). `null` = none here (they may work elsewhere that day). */
    week: ({ kind: ShiftKind; start: number; end: number } | null)[]
    todayIndex: number
    /** Indexes into the shiftmate photos; `extra` is the "+N" overflow chip (0 hides it). */
    shiftmates: { photos: number[]; extra: number }
    accessory: { title: string; subtitle: string }
    /** Half sheet opened from the accessory. */
    timeClock: { shift: string; role: string; roles: string[] }
    /** What this person is paid at this location. */
    rate: string
  }
}

/**
 * The signed-in person's weekly availability (Mon…Sun) — theirs, not a location's. On the home
 * chart, a day they're free but not scheduled at ANY location draws as a dashed bar. Hours are decimal.
 */
export const USER_AVAILABILITY: ({ start: number; end: number } | null)[] = [
  { start: 8, end: 20 },
  { start: 8, end: 20 },
  { start: 8, end: 20 },
  { start: 9, end: 17 },
  { start: 8, end: 22 },
  { start: 8, end: 22 },
  { start: 9, end: 18 },
]

/** Earnings belong to the person, not a location: the same on every screen whichever location is selected. */
export const USER_EARNINGS = {
  today: { amount: "$142.50", detail: "6.5 hrs · $38 in tips" },
  period: { amount: "$254.31", payday: "Payday in 6 days" },
} as const

export const HOUR_LABELS = ["Now", "1", "2", "3", "4", "5", "6", "7"] as const

/**
 * The signed-in person's whole week, across every location (Mon…Sun). One shift a day at most, and
 * never at two places on the same day. Each location's `employee.week` is read from this, so the home
 * chart, the Shifts page and the clock can never disagree. Hours are decimal; today is Wednesday.
 */
export const USER_SCHEDULE: ({ loc: string; start: number; end: number } | null)[] = [
  null, // Mon — available, not scheduled
  { loc: "east44", start: 12, end: 20 }, // Tue
  { loc: "montgomery", start: 8.5, end: 14 }, // Wed — today
  { loc: "elm", start: 7, end: 15 }, // Thu
  { loc: "montgomery", start: 14, end: 20 }, // Fri
  { loc: "harbor", start: 8, end: 16 }, // Sat
  null, // Sun
]
const TODAY_INDEX = 2
const weekAt = (locId: string): Location["employee"]["week"] =>
  USER_SCHEDULE.map((d, i) => (d && d.loc === locId ? { kind: i === TODAY_INDEX ? "today" : "worked", start: d.start, end: d.end } : null))

export const LOCATIONS: Location[] = [
  {
    id: "montgomery",
    company: "Crunch Fitness",
    name: "Crunch Fitness - Montgomery",
    unread: 3,
    requests: [
      { id: "m-r1", scope: "team", initials: "JS", who: "Jan Sundar", title: "Unpaid Time Off, 32 hrs", detail: "Thu, Oct 8 - Sun, Oct 11", time: "5:12 PM" },
      { id: "m-r2", scope: "team", initials: "JM", who: "Justin Mason", title: "Availability Request", detail: "Starting Oct 6th", time: "Yesterday" },
      { id: "m-r4", scope: "mine", initials: "BL", who: "Bryce Lewis", title: "Paid Time Off, 8 hrs", detail: "Mon, Oct 19", time: "Pending" },
    ],
    profile: {
      business: "Crunch Fitness",
      address: "Montgomery",
      pin: "512563",
      shoutout: {
        quote: "“Kelli did an amazing job today! She jumped in the register when the line got long, she unclogged the sink in the rest room, and she helped an elderly customer carry his bags. All with a huge smile on her face 💜⭐”",
        author: "Rosie Atkins",
      },
      moreShoutouts: [
        { quote: "Stayed late to help close out a full class and still wiped down every machine. Never has to be asked.", author: "Marcus Webb", when: "Last week" },
        { quote: "Greeted every single member by name this morning. It really sets the tone for the whole floor.", author: "Priya Nair", when: "2 weeks ago" },
      ],
      stats: { onTime: "33%", shifts: 49, hours: 22, rating: "4.3", missedClockOuts: 3, noShows: 2 },
      timeOff: { balance: "120 hr", plan: "Full-time salaried", accrual: "Accrues 4.6 hr every pay period", upcoming: [{ range: "Nov 24 – Nov 28", status: "Approved" }, { range: "Dec 23 – Dec 26", status: "Pending" }] },
      availability: [
        { kind: "blocked", range: "3:00 - 6:00 PM" },
        { kind: "available" },
        { kind: "blocked", range: "3:00 - 6:00 PM" },
        { kind: "blocked", range: "9:00 AM - 6:00 PM" },
        { kind: "all-day" },
        { kind: "all-day" },
        { kind: "all-day" },
      ],
    },
    sales: 131410,
    laborPct: 12.1,
    weekSales: [124800, 112300, 131410, 0, 0, 0, 0],
    weekLabor: [15100, 13800, 15901, 0, 0, 0, 0],
    weekForecast: [0, 0, 0, 122500, 148900, 163200, 139700],
    managerMessage: "Good morning! Still waiting on Jason to clock in. Overall sales and labor are on track.",
    status: {
      people: { actual: [6, 7, 7, 8, 8, 9, 9, 7], planned: [7, 7, 7, 8, 8, 9, 9, 7] },
      sales: { actual: [1200, 1480, 1630, 1710, 1950, 2240, 2310, 1800], planned: [1100, 1400, 1600, 1750, 1900, 2200, 2400, 1900] },
      traffic: { actual: [38, 44, 51, 47, 63, 82, 90, 61], planned: [40, 46, 50, 50, 60, 80, 88, 65] },
    },
    review: [],
    myWeek: [
      { day: "Mon", time: "8:30a – 2p", role: "Front desk" },
      { day: "Wed", time: "8:30a – 2p", role: "Front desk" },
      { day: "Fri", time: "2p – 8p", role: "Floor lead" },
    ],
    events: [
      { title: "Member appreciation day", when: "Fri · 5p" },
      { title: "Equipment service visit", when: "Sat · 9a" },
    ],
    team: [
      { name: "Jason Reyes", role: "Floor lead", status: "scheduled", detail: "Starts 9:00a", seen: "2d", phone: true },
      { name: "Kelli Moore", role: "Front desk", status: "on", detail: "Since 6:02a", seen: "5h", phone: false },
      { name: "Rosie Atkins", role: "Trainer", status: "on", detail: "Since 7:30a", seen: "1d", phone: true },
      { name: "Devon Park", role: "Maintenance", status: "off", detail: "Off today", seen: "3d", phone: true },
      { name: "Imani Brooks", role: "Front desk", status: "scheduled", detail: "Starts 2:00p", seen: "12m", phone: false },
    ],
    messages: [
      { id: "m1", kind: "announcement", title: "Announcements", preview: "Jason: Reminder — quarterly meeting Thursday at 4", time: "9:30 am", unread: true },
      { id: "m2", kind: "team", title: "Team", preview: "Kelli: Front desk is covered until 3", time: "7:30 am", unread: true },
      { id: "m3", kind: "group", title: "Front desk", preview: "Imani: Can someone take my Saturday opener?", time: "9:19 am", unread: false },
      { id: "m4", kind: "dm", title: "Rosie Atkins", preview: "Thanks for sorting the locker schedule", time: "8:25 am", unread: false, photo: 0 },
      { id: "m5", kind: "dm", title: "Devon Park", preview: "Pool pump is fixed — all clear", time: "7:08 am", unread: false, photo: 1 },
      { id: "m6", kind: "dm", title: "Jason Reyes", preview: "Can I swap Friday with Kelli?", time: "Yesterday", unread: false },
      { id: "m7", kind: "dm", title: "Imani Brooks", preview: "Thanks — I'll take the Saturday opener", time: "Yesterday", unread: false },
      { id: "m8", kind: "dm", title: "Kelli Moore", preview: "Locker room towels are restocked", time: "Yesterday", unread: false },
      { id: "m9", kind: "group", title: "Front desk leads", preview: "Imani: Schedule is posted for next week", time: "Mon", unread: false },
      { id: "m10", kind: "dm", title: "Maya Torres", preview: "Is the trainer meeting still at 3?", time: "Mon", unread: false },
      { id: "m11", kind: "dm", title: "Dario Kim", preview: "Running ten minutes late, sorry", time: "Sun", unread: false },
      { id: "m12", kind: "dm", title: "Priya Shah", preview: "Can I get next Friday off?", time: "Sun", unread: false },
      { id: "m13", kind: "dm", title: "Owen Blake", preview: "Sauna maintenance is booked for Thursday", time: "Fri", unread: false },
      { id: "m14", kind: "dm", title: "Lena Wu", preview: "Thanks for covering my shift", time: "Fri", unread: false },
    ],
    timesheets: [
      { id: "t1", name: "Kelli Moore", role: "Front desk", dept: "Guest services", start: "8:02 am", end: "2:10 pm", total: "6 hrs 8 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Missing unpaid break"] },
      { id: "t2", name: "Imani Brooks", role: "Front desk", dept: "Guest services", start: "9:15 am", end: "4:01 pm", total: "6 hrs 46 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t3", name: "Devon Park", role: "Maintenance", dept: "Facilities", start: "7:00 am", end: "3:30 pm", total: "8 hrs 30 min", rest: "Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t4", name: "Jason Reyes", role: "Front desk", dept: "Guest services", start: "8:30 am", end: "3:12 pm", total: "6 hrs 42 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t5", name: "Maya Torres", role: "Trainer", dept: "Fitness", start: "6:00 am", end: "1:20 pm", total: "7 hrs 20 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Late clock-in"] },
      { id: "t6", name: "Rosie Atkins", role: "Trainer", dept: "Fitness", start: "12:00 pm", end: "8:05 pm", total: "8 hrs 5 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t7", name: "Dario Kim", role: "Maintenance", dept: "Facilities", start: "7:45 am", end: "4:00 pm", total: "8 hrs 15 min", rest: "Meal (30 min)", issues: ["Missing paid break"] },
    ],
    assistant: [
      "Can you optimize next week’s schedule?",
      "Who are my most and least reliable employees based on timecard data?",
      "Which day of the week has the most late clock-outs?",
    ],
    conversations: [
      { id: "c1", title: "Optimize next week’s schedule", time: "12m", pinned: true },
      { id: "c2", title: "Labor % drift last week", time: "1h", pinned: true },
      { id: "c3", title: "Kelli clocked in late again", time: "3h", pinned: true },
      { id: "c4", title: "Front desk coverage for Saturday", time: "Yesterday" },
      { id: "c5", title: "Reliability by timecard data", time: "Yesterday" },
      { id: "c6", title: "Pool maintenance vendors", time: "Mon" },
      { id: "c7", title: "Drafting the quarterly meeting agenda", time: "Oct 5" },
    ],
    tasks: [
      { id: "m1", title: "Count the till", due: "Today · 10a", done: true },
      { id: "m2", title: "Wipe down cardio floor", due: "Today · 1p", done: false },
      { id: "m3", title: "Restock towel racks", due: "Today · 3p", done: false },
      { id: "m4", title: "Approve Friday swap", due: "Thu", done: false },
    ],
    managerLog: [
      { when: "Today · 7:40a", author: "Jason R.", note: "Treadmill 4 is out of service. Ticket filed with the vendor." },
      { when: "Yesterday", author: "Kelli M.", note: "Busy evening. Three new memberships and a lost keycard." },
      { when: "Mon", author: "Rosie A.", note: "Spin class sold out. Consider adding a second session." },
    ],
    payroll: {
      nextPayday: "Fri, Oct 18",
      period: "Oct 1 – Oct 14",
      hours: "71.5 hrs",
      gross: "$1,432.50",
      stubs: [
        { period: "Sep 16 – Sep 30", net: "$1,102.14" },
        { period: "Sep 1 – Sep 15", net: "$1,087.60" },
        { period: "Aug 16 – Aug 31", net: "$1,121.33" },
      ],
    },
    employee: {
      greeting: "Good morning! You’re on the clock with a break and lunch left. Off at 2pm.",
      week: weekAt("montgomery"),
      todayIndex: 2,
      shiftmates: { photos: [0, 1, 2, 3], extra: 4 },
      accessory: { title: "On the clock", subtitle: "Off at 2pm" },
      timeClock: { shift: "8:30 AM – 2:00 PM", role: "Front desk", roles: ["Front desk", "Floor lead", "Trainer"] },
      rate: "$18.50 / hr",
    },
  },
  {
    id: "harbor",
    company: "Crunch Fitness",
    name: "Crunch Fitness - Harbor Point",
    unread: 12,
    requests: [
      { id: "h-r1", scope: "team", initials: "AR", who: "Alex Rivera", title: "Unpaid Time Off, 16 hrs", detail: "Mon, Oct 12 - Tue, Oct 13", time: "9:30 AM" },
      { id: "h-r2", scope: "team", initials: "SW", who: "Sam Wu", title: "Missed Clock-out", detail: "Mon, Oct 5 · set to 4:00p", time: "Yesterday" },
      { id: "h-r4", scope: "mine", initials: "BL", who: "Bryce Lewis", title: "Shift Swap", detail: "Fri, Oct 16 · 8a – 4p", time: "Pending" },
    ],
    profile: {
      business: "Crunch Fitness",
      address: "Harbor Point",
      pin: "339081",
      shoutout: {
        quote: "“Stepped in to cover two no-call shifts this week without being asked, and still ran the orientation on Monday. Huge thank you!”",
        author: "Alex Rivera",
      },
      moreShoutouts: [
        { quote: "Caught a safety issue on the floor before it became a problem and fixed it right away.", author: "Dana Kim", when: "Last week" },
        { quote: "Covered a double without complaining and kept the whole crew in a good mood.", author: "Sam Okafor", when: "2 weeks ago" },
      ],
      stats: { onTime: "71%", shifts: 18, hours: 36, rating: "4.1", missedClockOuts: 5, noShows: 1 },
      timeOff: { balance: "38 hr", plan: "Full-time hourly", accrual: "Accrues 1 hr for every 40 worked", upcoming: [] },
      availability: [
        { kind: "available" },
        { kind: "available" },
        { kind: "blocked", range: "12:00 - 4:00 PM" },
        { kind: "all-day" },
        { kind: "all-day" },
        { kind: "available" },
        { kind: "blocked", range: "6:00 - 10:00 PM" },
      ],
    },
    sales: 58730,
    laborPct: 9.6,
    weekSales: [56800, 49200, 58730, 0, 0, 0, 0],
    weekLabor: [5440, 4780, 5638, 0, 0, 0, 0],
    weekForecast: [0, 0, 0, 53800, 66900, 74100, 61200],
    managerMessage: "Good morning! Two people are late and the lobby is busy. Labor is running 11% over plan.",
    status: {
      people: { actual: [3, 4, 4, 4, 5, 5, 5, 3], planned: [5, 5, 5, 5, 5, 5, 5, 4] },
      sales: { actual: [610, 720, 790, 840, 930, 1100, 1180, 860], planned: [600, 700, 800, 850, 900, 1000, 1100, 800] },
      traffic: { actual: [58, 71, 86, 79, 92, 118, 127, 84], planned: [50, 60, 70, 70, 80, 95, 100, 70] },
    },
    review: [
      { title: "Late clock-in", detail: "Alex R. · 22 min" },
      { title: "Late clock-in", detail: "Sam W. · 9 min" },
      { title: "Missed meal break", detail: "Jordan P. · Mon" },
    ],
    myWeek: [
      { day: "Mon", time: "10a – 6p", role: "General manager" },
      { day: "Tue", time: "10a – 6p", role: "General manager" },
      { day: "Thu", time: "10a – 6p", role: "General manager" },
    ],
    events: [
      { title: "New member orientation", when: "Mon · 6p" },
      { title: "Staff meeting", when: "Wed · 9a" },
      { title: "Spin class launch", when: "Sat · 8a" },
    ],
    team: [
      { name: "Alex Rivera", role: "General manager", status: "on", detail: "Since 8:00a", seen: "5h", phone: true },
      { name: "Sam Wu", role: "Front desk", status: "on", detail: "Late · 9 min", seen: "1d", phone: false },
      { name: "Jordan Pierce", role: "Trainer", status: "scheduled", detail: "Starts 11:00a", seen: "3d", phone: true },
      { name: "Nia Cole", role: "Floor lead", status: "scheduled", detail: "Starts 2:00p", seen: "12m", phone: true },
      { name: "Theo Grant", role: "Maintenance", status: "off", detail: "Off today", seen: "1w", phone: false },
      { name: "Mina Sato", role: "Front desk", status: "off", detail: "Off today", seen: "4h", phone: true },
    ],
    messages: [
      { id: "m1", kind: "announcement", title: "Announcements", preview: "Alex: Fire drill Friday at 10 — please be on site", time: "9:30 am", unread: true },
      { id: "m2", kind: "team", title: "Team", preview: "Sam: Front desk line is out the door", time: "8:40 am", unread: false },
      { id: "m3", kind: "group", title: "Floor leads", preview: "Nia: Closing checklist is updated", time: "9:19 am", unread: false },
      { id: "m4", kind: "dm", title: "Jordan Pierce", preview: "Can we move the 11:00 training?", time: "8:25 am", unread: false, photo: 1 },
      { id: "m5", kind: "dm", title: "Alex Rivera", preview: "Great job covering the no-call today", time: "7:08 am", unread: false, photo: 0 },
      { id: "m6", kind: "dm", title: "Mina Sato", preview: "Swapping Saturday with Theo?", time: "Yesterday", unread: false },
      { id: "m7", kind: "dm", title: "Theo Ramos", preview: "Yes, I can swap Saturday", time: "Yesterday", unread: false },
      { id: "m8", kind: "dm", title: "Nia Cole", preview: "Closing checklist is updated", time: "Yesterday", unread: false },
      { id: "m9", kind: "group", title: "Training", preview: "Jordan: Session moved to 11:30", time: "Mon", unread: false },
      { id: "m10", kind: "dm", title: "Sam Wu", preview: "Line is back to normal", time: "Mon", unread: false },
      { id: "m11", kind: "dm", title: "Priya Shah", preview: "Can I borrow the front desk keys?", time: "Sun", unread: false },
      { id: "m12", kind: "dm", title: "Owen Blake", preview: "Boiler is fixed", time: "Sun", unread: false },
      { id: "m13", kind: "dm", title: "Hana Park", preview: "Running early tomorrow", time: "Fri", unread: false },
      { id: "m14", kind: "dm", title: "Lena Wu", preview: "Thanks for the heads up", time: "Fri", unread: false },
    ],
    timesheets: [
      { id: "t1", name: "Sam Wu", role: "Front desk", dept: "Guest services", start: "9:09 am", end: "4:02 pm", total: "6 hrs 53 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Missing unpaid break"] },
      { id: "t2", name: "Nia Cole", role: "Floor lead", dept: "Operations", start: "10:00 am", end: "6:20 pm", total: "8 hrs 20 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t3", name: "Mina Sato", role: "Front desk", dept: "Guest services", start: "8:00 am", end: "2:00 pm", total: "6 hrs", rest: "Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t4", name: "Theo Ramos", role: "Floor lead", dept: "Operations", start: "9:00 am", end: "5:10 pm", total: "8 hrs 10 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t5", name: "Priya Shah", role: "Front desk", dept: "Guest services", start: "7:50 am", end: "3:40 pm", total: "7 hrs 50 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Late clock-in"] },
      { id: "t6", name: "Owen Blake", role: "Floor lead", dept: "Operations", start: "12:00 pm", end: "8:20 pm", total: "8 hrs 20 min", rest: "Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t7", name: "Lena Wu", role: "Front desk", dept: "Guest services", start: "10:15 am", end: "4:30 pm", total: "6 hrs 15 min", rest: "Rest (10 min)", issues: ["Missing unpaid break", "Early clock-out"] },
    ],
    assistant: [
      "Who is likely to hit overtime this week?",
      "Summarize today’s missed breaks.",
      "Find cover for Saturday’s closing shift.",
    ],
    conversations: [
      { id: "c1", title: "Who is at risk of overtime", time: "12m", pinned: true },
      { id: "c2", title: "Missed breaks this week", time: "1h", pinned: true },
      { id: "c3", title: "Sam clocked in late again", time: "3h", pinned: true },
      { id: "c4", title: "Saturday closing cover", time: "Yesterday" },
      { id: "c5", title: "Fire drill reminder", time: "Yesterday" },
      { id: "c6", title: "Training schedule for new hires", time: "Mon" },
      { id: "c7", title: "Front desk wait times", time: "Oct 5" },
    ],
    tasks: [
      { id: "h1", title: "Review late clock-ins", due: "Today · 11a", done: false },
      { id: "h2", title: "Run orientation", due: "Mon · 6p", done: false },
      { id: "h3", title: "Cover Thursday opening", due: "Wed", done: false },
      { id: "h4", title: "Submit weekly labor report", due: "Fri", done: false },
      { id: "h5", title: "Lock up pool chemicals", due: "Yesterday", done: true },
    ],
    managerLog: [
      { when: "Today · 8:20a", author: "Alex R.", note: "Two late clock-ins. Spoke with both and logged a warning." },
      { when: "Yesterday", author: "Theo G.", note: "Pool pump replaced. Back in service by close." },
      { when: "Mon", author: "Alex R.", note: "Spin class launch moved to Saturday. Flyers go up Thursday." },
    ],
    payroll: {
      nextPayday: "Mon, Oct 21",
      period: "Oct 6 – Oct 19",
      hours: "76 hrs",
      gross: "$2,128.00",
      stubs: [
        { period: "Sep 22 – Oct 5", net: "$1,614.90" },
        { period: "Sep 8 – Sep 21", net: "$1,598.45" },
        { period: "Aug 25 – Sep 7", net: "$1,640.02" },
      ],
    },
    employee: {
      greeting: "Good morning! You’re not scheduled at Harbor Point today. Your next shift is Saturday at 8am.",
      week: weekAt("harbor"),
      todayIndex: 2,
      shiftmates: { photos: [2, 3, 0], extra: 7 },
      accessory: { title: "On the clock", subtitle: "Lunch at 12:30pm" },
      timeClock: { shift: "8:00 AM – 4:00 PM", role: "Floor lead", roles: ["Floor lead", "Front desk", "Trainer"] },
      rate: "$19.00 / hr",
    },  },
  {
    id: "east44",
    company: "Downtown Bakery",
    name: "Downtown Bakery - East 44th St.",
    unread: 0,
    requests: [
      { id: "e-r1", scope: "team", initials: "PN", who: "Priya Nair", title: "Timesheet Edit", detail: "Tue, Oct 6 · clock-out 2:10p", time: "8:04 AM" },
      { id: "e-r3", scope: "mine", initials: "BL", who: "Bryce Lewis", title: "Availability Request", detail: "Starting Oct 12th", time: "Pending" },
    ],
    profile: {
      business: "Downtown Bakery",
      address: "E 44th St.",
      pin: "804217",
      shoutout: {
        quote: "“The morning rush was wild and Bryce kept the line moving the whole time. Every customer left with a smile and a warm croissant. We’re lucky to have him on the team.”",
        author: "Dana Kim",
      },
      moreShoutouts: [
        { quote: "Remembered a regular's order before she even reached the counter. That's the kind of thing people talk about.", author: "Jonah Pike", when: "Last week" },
        { quote: "Taught the new hire the espresso machine in one shift. Patient, clear, and funny.", author: "Mina Ortiz", when: "3 weeks ago" },
      ],
      stats: { onTime: "94%", shifts: 31, hours: 28, rating: "4.8", missedClockOuts: 0, noShows: 0 },
      timeOff: { balance: "64 hr", plan: "Part-time hourly", accrual: "Accrues 1 hr for every 30 worked", upcoming: [{ range: "Nov 3", status: "Approved" }] },
      availability: [
        { kind: "all-day" },
        { kind: "all-day" },
        { kind: "available" },
        { kind: "blocked", range: "5:00 - 9:00 PM" },
        { kind: "all-day" },
        { kind: "blocked", range: "All day" },
        { kind: "blocked", range: "All day" },
      ],
    },
    sales: 86250,
    laborPct: 16.5,
    weekSales: [88400, 76900, 86250, 0, 0, 0, 0],
    weekLabor: [14350, 12480, 14231, 0, 0, 0, 0],
    weekForecast: [0, 0, 0, 81200, 99800, 112400, 90100],
    managerMessage: "Good morning! Everyone is clocked in. Sales are running 6% behind forecast, so lunch coverage is worth a look.",
    status: {
      people: { actual: [4, 4, 5, 5, 5, 6, 6, 4], planned: [4, 5, 5, 5, 6, 6, 6, 4] },
      sales: { actual: [820, 940, 1010, 1150, 1260, 1480, 1520, 1100], planned: [900, 1050, 1100, 1200, 1350, 1560, 1600, 1200] },
      traffic: { actual: [22, 27, 31, 29, 36, 48, 52, 33], planned: [25, 30, 33, 32, 40, 50, 55, 38] },
    },
    review: [
      { title: "Timesheet edit", detail: "Priya N. · Tue" },
      { title: "Shift swap request", detail: "Marcus T. ↔ Dana K." },
    ],
    myWeek: [
      { day: "Tue", time: "7a – 3p", role: "Opening manager" },
      { day: "Thu", time: "7a – 3p", role: "Opening manager" },
    ],
    events: [{ title: "Fire inspection", when: "Wed · 10a" }],
    team: [
      { name: "Priya Nair", role: "Baker", status: "on", detail: "Since 5:00a", seen: "1w", phone: true },
      { name: "Marcus Tran", role: "Counter", status: "on", detail: "Since 6:30a", seen: "4h", phone: true },
      { name: "Dana Kim", role: "Shift lead", status: "scheduled", detail: "Starts 12:00p", seen: "6d", phone: false },
      { name: "Luis Ortega", role: "Barista", status: "off", detail: "Off today", seen: "2d", phone: true },
    ],
    messages: [
      { id: "m1", kind: "announcement", title: "Announcements", preview: "Priya: New seasonal menu starts Monday", time: "9:05 am", unread: false },
      { id: "m2", kind: "team", title: "Team", preview: "Marcus: Counter was non-stop this morning", time: "7:30 am", unread: false },
      { id: "m3", kind: "group", title: "Baristas", preview: "Luis: We are low on oat milk — reordering", time: "Yesterday", unread: false },
      { id: "m4", kind: "dm", title: "Dana Kim", preview: "Counter is covered until 3 — heading out", time: "8:25 am", unread: false },
      { id: "m5", kind: "dm", title: "Marcus Tran", preview: "Grinder hopper is empty — refilling now", time: "7:08 am", unread: false, photo: 2 },
      { id: "m6", kind: "dm", title: "Priya Nair", preview: "Thanks for sorting the delivery window", time: "Mon", unread: false, photo: 3 },
      { id: "m7", kind: "dm", title: "Luis Ortega", preview: "Oat milk is on the truck for tomorrow", time: "Mon", unread: false },
      { id: "m8", kind: "dm", title: "Dana Kim", preview: "Can I swap Thursday with Marcus?", time: "Mon", unread: false },
      { id: "m9", kind: "group", title: "Bakers", preview: "Priya: Croissant batch came out great", time: "Sun", unread: false },
      { id: "m10", kind: "dm", title: "Hana Park", preview: "Register 2 is jammed again", time: "Sun", unread: false },
      { id: "m11", kind: "dm", title: "Theo Rao", preview: "I can close on Saturday", time: "Sat", unread: false },
      { id: "m12", kind: "dm", title: "Nia Cole", preview: "Thanks for the tip on the espresso dial", time: "Sat", unread: false },
      { id: "m13", kind: "dm", title: "Eli Moss", preview: "Out sick tomorrow, sorry", time: "Fri", unread: false },
      { id: "m14", kind: "dm", title: "Sam Ono", preview: "Delivery window moved to 7", time: "Fri", unread: false },
    ],
    timesheets: [
      { id: "t1", name: "Marcus Tran", role: "Counter", dept: "Front of house", start: "6:30 am", end: "2:12 pm", total: "7 hrs 42 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Missing unpaid break"] },
      { id: "t2", name: "Priya Nair", role: "Baker", dept: "Back of house", start: "5:00 am", end: "1:05 pm", total: "8 hrs 5 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t3", name: "Luis Ortega", role: "Barista", dept: "Front of house", start: "10:53 am", end: "5:06 pm", total: "6 hrs 13 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t4", name: "Dana Kim", role: "Counter", dept: "Front of house", start: "7:00 am", end: "2:30 pm", total: "7 hrs 30 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t5", name: "Hana Park", role: "Barista", dept: "Front of house", start: "9:10 am", end: "5:15 pm", total: "8 hrs 5 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Late clock-in"] },
      { id: "t6", name: "Theo Rao", role: "Baker", dept: "Back of house", start: "4:30 am", end: "12:40 pm", total: "8 hrs 10 min", rest: "Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t7", name: "Eli Moss", role: "Counter", dept: "Front of house", start: "11:00 am", end: "6:45 pm", total: "7 hrs 45 min", rest: "Rest (10 min)", issues: ["Missing unpaid break", "Early clock-out"] },
    ],
    assistant: [
      "Which shifts are short-staffed this week?",
      "How does labor cost compare to sales since Monday?",
      "Draft an announcement about the new seasonal menu.",
    ],
    conversations: [
      { id: "c1", title: "Hire new dishwasher", time: "12m", pinned: true },
      { id: "c2", title: "Cost of beef averages", time: "1h", pinned: true },
      { id: "c3", title: "Marcus clocked in late again", time: "3h", pinned: true },
      { id: "c4", title: "Seasonal menu announcement", time: "Yesterday" },
      { id: "c5", title: "Oat milk reorder", time: "Yesterday" },
      { id: "c6", title: "Labor vs. sales since Monday", time: "Mon" },
      { id: "c7", title: "Holiday hours", time: "Oct 5" },
    ],
    tasks: [
      { id: "e1", title: "Proof tomorrow’s dough", due: "Today · 4p", done: false },
      { id: "e2", title: "Order flour and butter", due: "Today · 5p", done: false },
      { id: "e3", title: "Fire inspection prep", due: "Wed", done: false },
    ],
    managerLog: [
      { when: "Today · 6:10a", author: "Priya N.", note: "Oven 2 running 15° hot. Adjusted bake times." },
      { when: "Yesterday", author: "Marcus T.", note: "Sold out of croissants by 9a. Bumping the morning batch." },
    ],
    payroll: {
      nextPayday: "Wed, Oct 16",
      period: "Sep 29 – Oct 12",
      hours: "58 hrs",
      gross: "$1,160.00",
      stubs: [
        { period: "Sep 15 – Sep 28", net: "$924.80" },
        { period: "Sep 1 – Sep 14", net: "$951.12" },
      ],
    },
    employee: {
      greeting: "Good morning! You’re not scheduled at East 44th St. today. Your next shift is Tuesday at 12pm.",
      week: weekAt("east44"),
      todayIndex: 2,
      shiftmates: { photos: [1, 3], extra: 0 },
      accessory: { title: "Not clocked in", subtitle: "Shift starts at 12pm" },
      timeClock: { shift: "12:00 PM – 8:00 PM", role: "Counter", roles: ["Counter", "Baker", "Barista"] },
      rate: "$17.25 / hr",
    },
  },
  {
    id: "elm",
    company: "Downtown Bakery",
    name: "Downtown Bakery - Elm Street",
    unread: 2,
    requests: [
      { id: "m-r3", scope: "mine", initials: "BL", who: "Bryce Lewis", title: "Availability Request", detail: "Starting Oct 12th", time: "Pending" },
    ],
    profile: {
      business: "Downtown Bakery",
      address: "Elm St.",
      pin: "615830",
      shoutout: {
        quote: "“The morning rush was wild and Bryce kept the line moving the whole time. Every customer left with a smile and a warm croissant. We’re lucky to have him on the team.”",
        author: "Dana Kim",
      },
      moreShoutouts: [
        { quote: "Remembered a regular's order before she even reached the counter. That's the kind of thing people talk about.", author: "Jonah Pike", when: "Last week" },
        { quote: "Taught the new hire the espresso machine in one shift. Patient, clear, and funny.", author: "Mina Ortiz", when: "3 weeks ago" },
      ],
      stats: { onTime: "94%", shifts: 31, hours: 28, rating: "4.8", missedClockOuts: 0, noShows: 0 },
      timeOff: { balance: "64 hr", plan: "Part-time hourly", accrual: "Accrues 1 hr for every 30 worked", upcoming: [{ range: "Nov 3", status: "Approved" }] },
      availability: [
        { kind: "all-day" },
        { kind: "all-day" },
        { kind: "available" },
        { kind: "blocked", range: "5:00 - 9:00 PM" },
        { kind: "all-day" },
        { kind: "blocked", range: "All day" },
        { kind: "blocked", range: "All day" },
      ],
    },
    sales: 86250,
    laborPct: 16.5,
    weekSales: [88400, 76900, 86250, 0, 0, 0, 0],
    weekLabor: [14350, 12480, 14231, 0, 0, 0, 0],
    weekForecast: [0, 0, 0, 81200, 99800, 112400, 90100],
    managerMessage: "Good morning! Everyone is clocked in. Sales are running 6% behind forecast, so lunch coverage is worth a look.",
    status: {
      people: { actual: [4, 4, 5, 5, 5, 6, 6, 4], planned: [4, 5, 5, 5, 6, 6, 6, 4] },
      sales: { actual: [820, 940, 1010, 1150, 1260, 1480, 1520, 1100], planned: [900, 1050, 1100, 1200, 1350, 1560, 1600, 1200] },
      traffic: { actual: [22, 27, 31, 29, 36, 48, 52, 33], planned: [25, 30, 33, 32, 40, 50, 55, 38] },
    },
    review: [
      { title: "Timesheet edit", detail: "Priya N. · Tue" },
      { title: "Shift swap request", detail: "Marcus T. ↔ Dana K." },
    ],
    myWeek: [
      { day: "Tue", time: "7a – 3p", role: "Opening manager" },
      { day: "Thu", time: "7a – 3p", role: "Opening manager" },
    ],
    events: [{ title: "Fire inspection", when: "Wed · 10a" }],
    team: [
      { name: "Priya Nair", role: "Baker", status: "on", detail: "Since 5:00a", seen: "1w", phone: true },
      { name: "Marcus Tran", role: "Counter", status: "on", detail: "Since 6:30a", seen: "4h", phone: true },
      { name: "Dana Kim", role: "Shift lead", status: "scheduled", detail: "Starts 12:00p", seen: "6d", phone: false },
      { name: "Luis Ortega", role: "Barista", status: "off", detail: "Off today", seen: "2d", phone: true },
    ],
    messages: [
      { id: "m1", kind: "announcement", title: "Announcements", preview: "Priya: New seasonal menu starts Monday", time: "9:05 am", unread: true },
      { id: "m2", kind: "team", title: "Team", preview: "Marcus: Counter was non-stop this morning", time: "7:30 am", unread: false },
      { id: "m3", kind: "group", title: "Baristas", preview: "Luis: We are low on oat milk — reordering", time: "Yesterday", unread: false },
      { id: "m4", kind: "dm", title: "Dana Kim", preview: "Counter is covered until 3 — heading out", time: "8:25 am", unread: false },
      { id: "m5", kind: "dm", title: "Marcus Tran", preview: "Grinder hopper is empty — refilling now", time: "7:08 am", unread: false, photo: 2 },
      { id: "m6", kind: "dm", title: "Priya Nair", preview: "Thanks for sorting the delivery window", time: "Mon", unread: false, photo: 3 },
      { id: "m7", kind: "dm", title: "Luis Ortega", preview: "Oat milk is on the truck for tomorrow", time: "Mon", unread: false },
      { id: "m8", kind: "dm", title: "Dana Kim", preview: "Can I swap Thursday with Marcus?", time: "Mon", unread: false },
      { id: "m9", kind: "group", title: "Bakers", preview: "Priya: Croissant batch came out great", time: "Sun", unread: false },
      { id: "m10", kind: "dm", title: "Hana Park", preview: "Register 2 is jammed again", time: "Sun", unread: false },
      { id: "m11", kind: "dm", title: "Theo Rao", preview: "I can close on Saturday", time: "Sat", unread: false },
      { id: "m12", kind: "dm", title: "Nia Cole", preview: "Thanks for the tip on the espresso dial", time: "Sat", unread: false },
      { id: "m13", kind: "dm", title: "Eli Moss", preview: "Out sick tomorrow, sorry", time: "Fri", unread: false },
      { id: "m14", kind: "dm", title: "Sam Ono", preview: "Delivery window moved to 7", time: "Fri", unread: false },
    ],
    timesheets: [
      { id: "t1", name: "Marcus Tran", role: "Counter", dept: "Front of house", start: "6:30 am", end: "2:12 pm", total: "7 hrs 42 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Missing unpaid break"] },
      { id: "t2", name: "Priya Nair", role: "Baker", dept: "Back of house", start: "5:00 am", end: "1:05 pm", total: "8 hrs 5 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t3", name: "Luis Ortega", role: "Barista", dept: "Front of house", start: "10:53 am", end: "5:06 pm", total: "6 hrs 13 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t4", name: "Dana Kim", role: "Counter", dept: "Front of house", start: "7:00 am", end: "2:30 pm", total: "7 hrs 30 min", rest: "Rest (10 min)", issues: ["Missing unpaid break"] },
      { id: "t5", name: "Hana Park", role: "Barista", dept: "Front of house", start: "9:10 am", end: "5:15 pm", total: "8 hrs 5 min", rest: "Rest (10 min) • Meal (30 min)", issues: ["Missing paid break", "Late clock-in"] },
      { id: "t6", name: "Theo Rao", role: "Baker", dept: "Back of house", start: "4:30 am", end: "12:40 pm", total: "8 hrs 10 min", rest: "Meal (30 min)", issues: ["Missing paid break"] },
      { id: "t7", name: "Eli Moss", role: "Counter", dept: "Front of house", start: "11:00 am", end: "6:45 pm", total: "7 hrs 45 min", rest: "Rest (10 min)", issues: ["Missing unpaid break", "Early clock-out"] },
    ],
    assistant: [
      "Which shifts are short-staffed this week?",
      "How does labor cost compare to sales since Monday?",
      "Draft an announcement about the new seasonal menu.",
    ],
    conversations: [
      { id: "c1", title: "Hire new dishwasher", time: "12m", pinned: true },
      { id: "c2", title: "Cost of beef averages", time: "1h", pinned: true },
      { id: "c3", title: "Marcus clocked in late again", time: "3h", pinned: true },
      { id: "c4", title: "Seasonal menu announcement", time: "Yesterday" },
      { id: "c5", title: "Oat milk reorder", time: "Yesterday" },
      { id: "c6", title: "Labor vs. sales since Monday", time: "Mon" },
      { id: "c7", title: "Holiday hours", time: "Oct 5" },
    ],
    tasks: [
      { id: "e1", title: "Proof tomorrow’s dough", due: "Today · 4p", done: false },
      { id: "e2", title: "Order flour and butter", due: "Today · 5p", done: false },
      { id: "e3", title: "Fire inspection prep", due: "Wed", done: false },
    ],
    managerLog: [
      { when: "Today · 6:10a", author: "Priya N.", note: "Oven 2 running 15° hot. Adjusted bake times." },
      { when: "Yesterday", author: "Marcus T.", note: "Sold out of croissants by 9a. Bumping the morning batch." },
    ],
    payroll: {
      nextPayday: "Wed, Oct 16",
      period: "Sep 29 – Oct 12",
      hours: "58 hrs",
      gross: "$1,160.00",
      stubs: [
        { period: "Sep 15 – Sep 28", net: "$924.80" },
        { period: "Sep 1 – Sep 14", net: "$951.12" },
      ],
    },
    employee: {
      greeting: "Good morning! You’re not scheduled at Elm Street today. Your next shift is Thursday at 7am.",
      week: weekAt("elm"),
      todayIndex: 2,
      shiftmates: { photos: [1, 3], extra: 0 },
      accessory: { title: "Not clocked in", subtitle: "Shift starts at 7am" },
      timeClock: { shift: "7:00 AM – 3:00 PM", role: "Counter", roles: ["Counter", "Baker", "Barista"] },
      rate: "$17.25 / hr",
    },
  },
]

/** Locations in menu order, grouped under their company (LOCATIONS keeps each company's locations together). */
// The same sample conversations at every location, keeping each location's own unread count.
for (const l of LOCATIONS) {
  const unread = l.messages.filter((m) => m.unread).length
  l.messages = MESSAGE_CHATS.map((m, i) => ({ ...m, unread: i < unread }))
  l.conversations = ASSISTANT_CHATS.map((c) => ({ ...c }))
}

export const COMPANIES: { name: string; locations: Location[] }[] = LOCATIONS.reduce<{ name: string; locations: Location[] }[]>((groups, l) => {
  const g = groups.find((x) => x.name === l.company)
  if (g) g.locations.push(l)
  else groups.push({ name: l.company, locations: [l] })
  return groups
}, [])

/** A location's name without its company prefix ("Montgomery"), for rows that sit under a company header. */
export const shortLocationName = (l: Location) => l.name.replace(`${l.company} - `, "")

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const clockLabel = (h: number) => {
  const hr = Math.floor(h)
  const min = Math.round((h - hr) * 60)
  return `${hr % 12 || 12}${min ? `:${String(min).padStart(2, "0")}` : ""}${hr >= 12 ? "p" : "a"}`
}

/** When the signed-in person next works at a location ("Today 8:30a", "Tomorrow 7a", "Fri 2p"), or null if they have no shift there this week. */
export function nextShiftAt(locId: string): string | null {
  for (let step = 0; step < 7; step++) {
    const i = (TODAY_INDEX + step) % 7
    const d = USER_SCHEDULE[i]
    if (d && d.loc === locId) return `${step === 0 ? "Today" : step === 1 ? "Tomorrow" : DAY_NAMES[i]} ${clockLabel(d.start)}`
  }
  return null
}

/** Unread conversations at a location. */
export const unreadAt = (l: Location) => l.messages.filter((m) => m.unread).length

/** The person's next shift at any location: when, and where. */
export function nextShiftAnywhere(): { when: string; loc: Location } | null {
  for (let step = 0; step < 7; step++) {
    const i = (TODAY_INDEX + step) % 7
    const d = USER_SCHEDULE[i]
    const loc = d && LOCATIONS.find((l) => l.id === d.loc)
    if (d && loc) return { when: `${step === 0 ? "Today" : step === 1 ? "Tomorrow" : DAY_NAMES[i]} at ${clockLabel(d.start)}`, loc }
  }
  return null
}

/** How far off a "Fri · 5p" / "Today · 11a" / "Wed" is, in hours from the start of today (days counted forward, so a past day wraps to next week). */
function whenRank(when: string) {
  const [day, time] = when.split("·").map((x) => x.trim())
  const m = /(\d+)\s*([ap])/.exec(time ?? "")
  // A day with no time on it is due by the end of that day.
  const hour = m ? (Number(m[1]) % 12) + (m[2] === "p" ? 12 : 0) : 23
  const offset = day === "Today" ? 0 : day === "Tomorrow" ? 1 : (DAY_NAMES.indexOf(day) - TODAY_INDEX + 7) % 7
  return offset * 24 + hour
}

/** Events from several locations, soonest first, each tagged with where it is. */
export function upcomingEvents(scope: Location[], limit = 4) {
  return scope
    .flatMap((l) => l.events.map((e) => ({ ...e, loc: l })))
    .sort((a, b) => whenRank(a.when) - whenRank(b.when))
    .slice(0, limit)
}

/** Tasks from several locations, due soonest first, each tagged with where it is. */
export function upcomingTasks(scope: Location[], limit = 4) {
  return scope
    .flatMap((l) => l.tasks.map((t) => ({ ...t, loc: l })))
    .sort((a, b) => whenRank(a.due) - whenRank(b.due))
    .slice(0, limit)
}

/** The newest manager-log notes across locations, each tagged with where it is. Times are "Today · 6:10a", "Yesterday", "Mon". */
export function recentLog(scope: Location[], limit = 3) {
  const ago = (when: string) => {
    const [day, time] = when.split("·").map((x) => x.trim())
    const m = /(\d+)(?::\d+)?\s*([ap])/.exec(time ?? "")
    const hour = m ? (Number(m[1]) % 12) + (m[2] === "p" ? 12 : 0) : 12
    const days = day === "Today" ? 0 : day === "Yesterday" ? 1 : (TODAY_INDEX - DAY_NAMES.indexOf(day) + 7) % 7 || 7
    return days * 24 - hour
  }
  return scope
    .flatMap((l) => l.managerLog.map((e) => ({ ...e, loc: l })))
    .sort((a, b) => ago(a.when) - ago(b.when))
    .slice(0, limit)
}
