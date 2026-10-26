/**
 * The More menu's motion: one curve and one set of timings for both platforms. The menu opens in the space above the bar on Apple's
 * decelerating curve (fast start, gentle settle), and its rows come in from the top down once it has taken form.
 */
export const MORPH_EASE = [0.32, 0.72, 0, 1] as const
const OPEN = 0.44

/** A CSS cubic-bezier as a function: progress in (0..1) to eased progress, solved by bisection on x. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const axis = (a: number, b: number, t: number) => 3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t
  return (x: number) => {
    if (x <= 0 || x >= 1) return Math.min(1, Math.max(0, x))
    let lo = 0
    let hi = 1
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2
      if (axis(x1, x2, mid) < x) lo = mid
      else hi = mid
    }
    return axis(y1, y2, (lo + hi) / 2)
  }
}

/** The cascade's own curve, gentler than the morph's: the gaps between rows grow from the top (a few ms) to a slow finish at the bottom (about 60 ms), so the last rows settle in one by one. */
const decelerate = cubicBezier(0.28, 1, 0.85, 1)
/** When the first row starts, after the menu begins to open: once the shape has taken form (a little over a fifth of the way), plus a beat. */
const ROWS_AFTER = OPEN * 0.22 + 0.04
/** How long the cascade takes from the first row's start to the last row's. */
const SPREAD = 0.23
/**
 * The delay before row `index` of `count` starts. The rows' start times follow a bezier of their own, not an even beat: the curve
 * is an ease-out, mirrored, so the top rows follow one another closely and the gaps widen toward the bottom, the way the motion
 * itself settles.
 */
const stagger = (index: number, count: number) => SPREAD * (1 - decelerate(1 - index / Math.max(1, count - 1)))

/**
 * One row of the menu. Rows come in from the top down, each starting after the one above it on the curve above and rising a few
 * pixels as it fades in, so the list seems to unfold. On closing they all leave at once (a staggered exit would hold the menu open).
 */
export const morphRow = (open: boolean, index: number, count: number) => ({
  animate: { opacity: open ? 1 : 0, y: open ? 0 : 8 },
  transition: open
    ? { duration: 0.3, delay: ROWS_AFTER + stagger(index, count), ease: MORPH_EASE }
    : { duration: 0.12, ease: "easeIn" as const },
})

