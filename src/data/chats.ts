/**
 * Sample conversations, for the two chat surfaces: Messages (the team) and the assistant. They are shown in every cut, the
 * structure one included, so the prototype reads like an app in use. Every location gets the same set (see locations.ts, which
 * keeps each location's own unread counts).
 */

/** One bubble in a Messages thread. `me` is the person using the app. */
export type ThreadMsg = { from: string; text: string; time: string; me?: boolean }
/** One turn with the assistant. */
export type AssistantTurn = { role: "user" | "assistant"; text: string }

export type MessageChat = {
  id: string
  kind: "announcement" | "team" | "group" | "dm"
  title: string
  /** The line under the title in the list: the last message, who said it first for a group. */
  preview: string
  time: string
  photo?: number
  thread: ThreadMsg[]
}

export type AssistantChat = { id: string; title: string; time: string; pinned?: boolean; thread: AssistantTurn[] }

export const MESSAGE_CHATS: MessageChat[] = [
  {
    id: "m1",
    kind: "announcement",
    title: "Announcements",
    preview: "Jason: Reminder — quarterly meeting Thursday at 4",
    time: "9:30 am",
    thread: [
      { from: "Jason Reyes", text: "Welcome to the new announcements channel. Anything everyone needs to see will land here.", time: "Mon 8:02 am" },
      { from: "You", me: true, text: "Schedule for the week of the 21st is posted. Check your shifts and flag any conflicts by Wednesday.", time: "Tue 3:15 pm" },
      { from: "Jason Reyes", text: "Pool will be closed Thursday 6–8 am for the quarterly service.", time: "Wed 11:40 am" },
      { from: "Jason Reyes", text: "Reminder — quarterly meeting Thursday at 4 in the studio room. Pizza on us.", time: "9:30 am" },
    ],
  },
  {
    id: "m2",
    kind: "team",
    title: "Team",
    preview: "Kelli: Front desk is covered until 3",
    time: "7:30 am",
    thread: [
      { from: "Devon Park", text: "Morning all. Locker room 2 is out of order until maintenance gets here.", time: "6:48 am" },
      { from: "You", me: true, text: "Thanks Devon. Please put a sign on the door and send members to locker room 1.", time: "6:52 am" },
      { from: "Imani Brooks", text: "Sign is up. Two members already asked.", time: "7:05 am" },
      { from: "Kelli Moore", text: "Front desk is covered until 3, then Imani takes over.", time: "7:30 am" },
    ],
  },
  {
    id: "m3",
    kind: "group",
    title: "Front desk",
    preview: "Imani: Can someone take my Saturday opener?",
    time: "9:19 am",
    thread: [
      { from: "Imani Brooks", text: "Can someone take my Saturday opener? I have a family thing.", time: "8:41 am" },
      { from: "Kelli Moore", text: "I can if I'm off by 2. Do we know the close?", time: "8:55 am" },
      { from: "You", me: true, text: "Kelli, you're off at 1 on Saturday, so you're good. I'll swap it in the schedule.", time: "9:04 am" },
      { from: "Kelli Moore", text: "Perfect, thank you.", time: "9:07 am" },
      { from: "Imani Brooks", text: "Thanks both! I owe you one, Kelli.", time: "9:19 am" },
    ],
  },
  {
    id: "m4",
    kind: "dm",
    title: "Rosie Atkins",
    preview: "Thanks for sorting the locker schedule",
    time: "8:25 am",
    photo: 0,
    thread: [
      { from: "Rosie Atkins", text: "Hey! Quick one. Are the personal training locker slots changing this month?", time: "Yesterday 4:10 pm" },
      { from: "You", me: true, text: "Yes, trainers move to the east wall on the 1st. I'll send the new map tonight.", time: "Yesterday 4:32 pm" },
      { from: "You", me: true, text: "Sent it to your email. Let me know if anything looks off.", time: "Yesterday 7:50 pm" },
      { from: "Rosie Atkins", text: "Thanks for sorting the locker schedule", time: "8:25 am" },
    ],
  },
  {
    id: "m5",
    kind: "dm",
    title: "Devon Park",
    preview: "Pool pump is fixed — all clear",
    time: "7:08 am",
    photo: 1,
    thread: [
      { from: "Devon Park", text: "Pool pump was making that noise again. Checking it first thing.", time: "6:20 am" },
      { from: "You", me: true, text: "Thanks. Do you need me to close the lanes?", time: "6:31 am" },
      { from: "Devon Park", text: "Already roped off. Replaced the seal, running a test now.", time: "6:50 am" },
      { from: "Devon Park", text: "Pool pump is fixed — all clear", time: "7:08 am" },
      { from: "You", me: true, text: "Great work. I'll note it in the manager log.", time: "7:10 am" },
    ],
  },
  {
    id: "m6",
    kind: "dm",
    title: "Jason Reyes",
    preview: "Can I swap Friday with Kelli?",
    time: "Yesterday",
    thread: [
      { from: "Jason Reyes", text: "Can I swap Friday with Kelli? I have a dentist appointment at 10.", time: "Yesterday 2:12 pm" },
      { from: "You", me: true, text: "Has she agreed? If so I'll approve it once you both confirm in the app.", time: "Yesterday 2:40 pm" },
      { from: "Jason Reyes", text: "She said yes. I'll send the request now.", time: "Yesterday 2:44 pm" },
      { from: "Jason Reyes", text: "Done. Can you approve it today?", time: "Yesterday 2:46 pm" },
    ],
  },
  {
    id: "m7",
    kind: "dm",
    title: "Maya Torres",
    preview: "Is the trainer meeting still at 3?",
    time: "Mon",
    thread: [
      { from: "Maya Torres", text: "Is the trainer meeting still at 3?", time: "Mon 11:02 am" },
      { from: "You", me: true, text: "Moved to 3:30 so the 3 o'clock class can finish. Same room.", time: "Mon 11:20 am" },
      { from: "Maya Torres", text: "Got it. Should I bring the new class plans?", time: "Mon 11:24 am" },
      { from: "You", me: true, text: "Yes please. Print two copies if you can.", time: "Mon 11:30 am" },
    ],
  },
  {
    id: "m8",
    kind: "dm",
    title: "Priya Shah",
    preview: "Can I get next Friday off?",
    time: "Sun",
    thread: [
      { from: "Priya Shah", text: "Hi! Can I get next Friday off? My sister is visiting.", time: "Sun 10:15 am" },
      { from: "You", me: true, text: "Let me check coverage. Can you submit it as a time off request so it's on record?", time: "Sun 12:02 pm" },
      { from: "Priya Shah", text: "Just submitted.", time: "Sun 12:10 pm" },
      { from: "You", me: true, text: "Approved. Enjoy the visit!", time: "Sun 1:30 pm" },
    ],
  },
]

export const ASSISTANT_CHATS: AssistantChat[] = [
  {
    id: "c1",
    title: "Optimize next week’s schedule",
    time: "12m",
    pinned: true,
    thread: [
      { role: "user", text: "Can you optimize next week’s schedule?" },
      { role: "assistant", text: "Happy to. Based on this month’s sales, three things stand out:\n\n• Tuesday and Wednesday mornings are overstaffed by one person.\n• Friday after 5 pm is short by two, and it’s your busiest hour.\n• Saturday’s opener is unfilled.\n\nWant me to draft a version that fixes those without adding labor cost?" },
      { role: "user", text: "Yes, keep labor under 15%." },
      { role: "assistant", text: "Draft ready. It moves Maya from Tuesday open to Friday close, fills Saturday with Kelli, and trims Wednesday by 4 hours. Projected labor is 14.2%, down from 15.8%. I haven’t published anything. Want to review it first?" },
    ],
  },
  {
    id: "c2",
    title: "Labor % drift last week",
    time: "1h",
    pinned: true,
    thread: [
      { role: "user", text: "Why did labor % creep up last week?" },
      { role: "assistant", text: "Labor ran 16.4% against a 15% target. Two causes:\n\n1. Sales were 9% below forecast on Thursday and Friday, but the schedule didn’t change.\n2. Four shifts ran over: 6.5 hours of overtime in total, mostly front desk.\n\nThe overtime alone added about 0.6 points." },
      { role: "user", text: "Which shifts went over?" },
      { role: "assistant", text: "Tue close (Kelli, +1.5h), Thu open (Imani, +2h), Fri close (Jason, +1h) and Sat close (Imani, +2h). Most were late handoffs. I can set an alert for any shift that’s about to run over." },
    ],
  },
  {
    id: "c3",
    title: "Kelli clocked in late again",
    time: "3h",
    pinned: true,
    thread: [
      { role: "user", text: "Kelli clocked in late again. How often is this happening?" },
      { role: "assistant", text: "Kelli has clocked in late 5 times in the last 30 days, between 6 and 14 minutes each. Four of them were opening shifts. On-time rate is 83%, compared with 94% for the front desk overall." },
      { role: "user", text: "Help me write something supportive." },
      { role: "assistant", text: "Here’s a draft:\n\n“Hi Kelli, I noticed a few late clock-ins on opening shifts lately. Is there anything making mornings harder? If it helps, I’m open to moving you to mid shifts. Let’s find something that works.”\n\nWant me to send it as a direct message?" },
    ],
  },
  {
    id: "c4",
    title: "Front desk coverage for Saturday",
    time: "Yesterday",
    thread: [
      { role: "user", text: "Who can cover the front desk on Saturday morning?" },
      { role: "assistant", text: "Three people are available and under 40 hours that week:\n\n• Kelli Moore (28h scheduled)\n• Jason Reyes (31h)\n• Priya Shah (22h)\n\nPriya has the most room, and she has opened before." },
      { role: "user", text: "Ask Kelli first." },
      { role: "assistant", text: "Done. I sent Kelli an open shift offer for Saturday 6 am–1 pm. I’ll let you know when she responds." },
    ],
  },
  {
    id: "c5",
    title: "Reliability by timecard data",
    time: "Yesterday",
    thread: [
      { role: "user", text: "Who are my most and least reliable employees based on timecard data?" },
      { role: "assistant", text: "Over the last 60 days, by on-time clock-ins and missed breaks:\n\nMost reliable\n• Maya Torres, 98% on time\n• Devon Park, 97%\n• Rosie Atkins, 95%\n\nNeeds a conversation\n• Dario Kim, 78%\n• Kelli Moore, 83%\n\nDario’s lates cluster on Mondays." },
    ],
  },
  {
    id: "c6",
    title: "Pool maintenance vendors",
    time: "Mon",
    thread: [
      { role: "user", text: "I need a new pool maintenance vendor. What should I ask them?" },
      { role: "assistant", text: "A short list to start:\n\n1. Response time for a same-day emergency\n2. Whether they’re licensed for commercial pools\n3. What’s included in the monthly visit: chemicals, filters, testing\n4. Insurance coverage and references from other gyms\n5. Cancellation terms\n\nI can turn this into an email you can send to three vendors." },
      { role: "user", text: "Please do." },
      { role: "assistant", text: "Draft ready. It’s addressed to “Hello,” with your questions in a numbered list and a request for a quote by Friday." },
    ],
  },
  {
    id: "c7",
    title: "Drafting the quarterly meeting agenda",
    time: "Oct 5",
    thread: [
      { role: "user", text: "Draft an agenda for Thursday’s quarterly meeting. 45 minutes." },
      { role: "assistant", text: "Here’s a 45-minute outline:\n\n• 0:00 Wins from the quarter (5 min)\n• 0:05 Numbers: sales, labor, member growth (10 min)\n• 0:15 New class schedule (10 min)\n• 0:25 Pool and locker room updates (5 min)\n• 0:30 Holiday hours and time off (10 min)\n• 0:40 Open questions (5 min)\n\nWant me to share it as an announcement?" },
    ],
  },
  {
    id: "c8",
    title: "Tip pool split for last week",
    time: "Oct 2",
    thread: [
      { role: "user", text: "How should I split last week’s tip pool?" },
      { role: "assistant", text: "The pool was $412. By hours worked, the split is:\n\n• Kelli Moore, 28h: $98\n• Imani Brooks, 26h: $91\n• Jason Reyes, 31h: $108\n• Priya Shah, 22h: $77\n• Devon Park, 12h: $38\n\nThat matches your usual rule of splitting by hours. Want me to publish these to payroll?" },
    ],
  },
]
