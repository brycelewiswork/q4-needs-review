import { useMemo } from "react"
import { motion, useReducedMotion } from "motion/react"
import { IconCheck } from "@tabler/icons-react"

/** Every tab's color, so the confetti is all of them. */
const CONFETTI = ["#8f55e5", "#2f7df6", "#2da44e", "#f28c28", "#ff5c8a", "#ffc83d"]
const COUNT = 34

/**
 * A page with nothing left on it. A big check pops in on its tab's color with a ring pulsing out, a burst of confetti
 * flies up and settles, and a line says what was done. Plays once when it appears.
 */
export function ReviewCelebration({ accent, area, cleared, byAgent }: { accent: string; /** The tab, in words: "Timesheets". */ area: string; cleared: number; byAgent: number }) {
  const still = useReducedMotion()
  // Each piece: where it lands, how it spins, its color and shape. Chosen once, so a re-render doesn't reshuffle them.
  const pieces = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 1.5
        const power = 90 + Math.random() * 130
        return {
          x: Math.cos(angle) * power,
          y: Math.sin(angle) * power,
          fall: 70 + Math.random() * 90,
          spin: (Math.random() - 0.5) * 900,
          delay: Math.random() * 0.12,
          color: CONFETTI[i % CONFETTI.length],
          w: 5 + Math.random() * 5,
          h: i % 3 === 0 ? 5 + Math.random() * 5 : 9 + Math.random() * 6,
          round: i % 3 === 0,
        }
      }),
    [],
  )
  const line =
    cleared > 0
      ? `You cleared ${cleared} ${cleared === 1 ? "thing" : "things"}${byAgent > 0 ? `, ${byAgent === cleared ? "all" : byAgent} with AI` : ""}.`
      : "Nothing needs you here right now."
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.3 }} className="flex flex-col items-center px-6 pb-8 pt-14 text-center tracking-[-0.43px]" role="status">
      <div className="relative flex size-[104px] items-center justify-center">
        {!still && (
          <>
            {[0, 0.18].map((d) => (
              <motion.span
                key={d}
                aria-hidden
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: accent }}
                initial={{ scale: 0.6, opacity: 0.55 }}
                animate={{ scale: 1.9, opacity: 0 }}
                transition={{ delay: 0.45 + d, duration: 1.1, ease: "easeOut" }}
              />
            ))}
            {pieces.map((p, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute left-1/2 top-1/2"
                style={{ width: p.w, height: p.h, marginLeft: -p.w / 2, marginTop: -p.h / 2, backgroundColor: p.color, borderRadius: p.round ? 999 : 2 }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
                animate={{ x: p.x, y: [0, p.y, p.y + p.fall], opacity: [0, 1, 1, 0], scale: 1, rotate: p.spin }}
                transition={{ delay: 0.5 + p.delay, duration: 1.7, ease: "easeOut", times: [0, 0.4, 1] }}
              />
            ))}
          </>
        )}
        <motion.span
          initial={still ? false : { scale: 0.2, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 14 }}
          className="relative flex size-[84px] items-center justify-center rounded-full text-white shadow-[0_14px_30px_-8px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: accent, backgroundImage: "linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 55%)" }}
        >
          <IconCheck size={44} stroke={3.25} />
        </motion.span>
      </div>
      <motion.h2 initial={still ? false : { y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65, duration: 0.35 }} className="mt-6 text-[28px] font-[590] leading-[34px] text-black">
        All caught up
      </motion.h2>
      <motion.p initial={still ? false : { y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.75, duration: 0.35 }} className="mt-1 max-w-[280px] text-[17px] leading-[22px] text-[#8e8e93]">
        {area} is clear. {line}
      </motion.p>
    </motion.div>
  )
}
