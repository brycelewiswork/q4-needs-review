import type { CSSProperties, ReactNode } from "react"
import { DeviceShell } from "@/components/DeviceShell"
import { DeviceControls } from "@/components/DeviceControls"
import { SCREENS, oriented, useMediaQuery } from "@/lib/device"
import { useViewStore } from "@/store/useViewStore"

/**
 * Pixel 10 Pro at 1:1 dp, from the android-nav sketch (Figma "Bezels / Android Standard"): a 410 × 914
 * screen, the bezel art placed at (-18, -19) and sized 450.839 × 949.
 */
export const A_SCREEN = SCREENS.android.phone
const BEZEL = { x: -18, y: -19, w: 450.839, h: 949 } as const
const OUTER_RADIUS = 72
/** Galaxy Tab: a thin black bezel, drawn in CSS (no art file). */
const TAB_BEZEL = 28
const TAB_RADIUS = 38

const mask = (src: string): CSSProperties => ({ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat" })

function StatusIcons() {
  return (
    <div className="relative h-[17px] w-[46px]">
      <span className="absolute left-0 top-0 block h-[17px] w-[17px] bg-current" style={mask("/android/wifi.svg")} />
      <span className="absolute left-[16px] top-0 block h-[17px] w-[17px] bg-current" style={mask("/android/signal.svg")} />
      <span className="absolute left-[38px] top-px block h-[15px] w-2 bg-current" style={mask("/android/battery.svg")} />
    </div>
  )
}

/** Figma "Status Bar / Android": 52 tall, 24/10 padding, Roboto Medium 14/20, the camera cutout centred. */
function StatusBarPhone() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[52px] items-end justify-between px-6 py-[10px] text-m-on-surface">
      <p className="text-[14px] font-medium leading-5 tracking-[0.14px]">9:41</p>
      <StatusIcons />
      <img src="/android/camera-cutout.svg" alt="" className="absolute left-1/2 top-[18px] size-6 -translate-x-1/2" />
    </div>
  )
}

function StatusBarTablet() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-8 items-center justify-between px-6 text-m-on-surface">
      <p className="text-[14px] font-medium leading-5 tracking-[0.14px]">9:41</p>
      <StatusIcons />
    </div>
  )
}

/**
 * The Android device: Pixel 10 Pro or Galaxy Tab S12+, upright or on its side. Dimensions come from SCREENS.
 * On an actual phone (≤500px wide, phone, portrait) the frame drops away.
 */
export function AndroidFrame({ children, header, footer }: { children: ReactNode; header?: ReactNode; footer?: ReactNode }) {
  const device = useViewStore((s) => s.device)
  const orientation = useViewStore((s) => s.orientation)
  const narrow = useMediaQuery("(max-width: 500px)")
  const land = orientation === "landscape"
  const tablet = device === "tablet"
  const font = "Roboto, system-ui, sans-serif"

  if (narrow && !tablet && !land) {
    return (
      <div className="android-screen bg-m-surface relative h-svh w-full overflow-hidden" style={{ fontFamily: font, "--safe-top": "52px", "--safe-bottom": "0px" } as CSSProperties}>
        {children}
      </div>
    )
  }

  const spec = SCREENS.android[device]
  const size = oriented(spec, orientation)
  const screenStyle = { fontFamily: font, "--safe-top": tablet ? "32px" : land ? "36px" : "52px", "--safe-bottom": "0px" } as CSSProperties

  if (tablet) {
    const box = { w: size.w + TAB_BEZEL * 2, h: size.h + TAB_BEZEL * 2 }
    return (
      <DeviceShell
        box={box}
        screen={{ x: TAB_BEZEL, y: TAB_BEZEL, ...size, radius: spec.radius }}
        screenClass="android-screen bg-m-surface"
        screenStyle={screenStyle}
        header={header}
      controls={<DeviceControls />}
        footer={footer}
        art={
          <div
            aria-hidden
            className="absolute inset-0 bg-[#08080a] shadow-[0_44px_90px_-24px_rgb(0_0_0/0.22),0_12px_28px_-12px_rgb(0_0_0/0.1),inset_0_0_0_2px_#3a3b40] dark:shadow-[0_44px_90px_-24px_rgb(0_0_0/0.6),0_12px_28px_-12px_rgb(0_0_0/0.4),inset_0_0_0_2px_#3a3b40]"
            style={{ borderRadius: TAB_RADIUS }}
          >
            {/* The front camera: middle of the long edge, top when landscape, left when upright. */}
            <span
              className="absolute size-[8px] rounded-full bg-[#17171c] ring-1 ring-[#2a2a31]"
              style={land ? { left: "50%", top: TAB_BEZEL / 2 - 4, translate: "-50% 0" } : { top: "50%", left: TAB_BEZEL / 2 - 4, translate: "0 -50%" }}
            />
          </div>
        }
        chrome={<StatusBarTablet />}
      >
        {children}
      </DeviceShell>
    )
  }

  // Pixel. The bezel art is portrait; landscape turns it a quarter-turn (counter-clockwise, cutout to the left).
  // After the turn, the portrait margins (left 18, top 19, right 22.839, bottom 16) become top 22.839, left 19.
  const box = land ? { w: BEZEL.h, h: BEZEL.w } : { w: BEZEL.w, h: BEZEL.h }
  const at = land ? { x: 19, y: 22.839 } : { x: -BEZEL.x, y: -BEZEL.y }
  return (
    <DeviceShell
      box={box}
      screen={{ ...at, ...size, radius: spec.radius }}
      screenClass={land ? "bg-m-surface" : "android-screen bg-m-surface"}
      screenStyle={land ? {} : screenStyle}
      header={header}
      controls={<DeviceControls />}
      footer={footer}
      art={
        // A soft shadow shaped like the phone's outer silhouette, hidden under the phone.
        <div aria-hidden className="absolute inset-0 shadow-[0_44px_90px_-24px_rgb(0_0_0/0.16),0_12px_28px_-12px_rgb(0_0_0/0.08)] dark:shadow-[0_44px_90px_-24px_rgb(0_0_0/0.6),0_12px_28px_-12px_rgb(0_0_0/0.4)]" style={{ borderRadius: OUTER_RADIUS }} />
      }
      chrome={land ? null : <StatusBarPhone />}
      overlay={
        <img
          src="/android/pixel-10-pro.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-w-none select-none"
          style={{
            width: BEZEL.w,
            height: BEZEL.h,
            left: (box.w - BEZEL.w) / 2,
            top: (box.h - BEZEL.h) / 2,
            transform: land ? "rotate(-90deg)" : undefined,
          }}
        />
      }
    >
      {land ? (
        // The phone doesn't get a landscape layout: the portrait screen is turned a quarter-turn to sit in the frame.
        <div
          className="android-screen bg-m-surface absolute overflow-hidden"
          style={{ ...screenStyle, "--safe-top": "52px", width: spec.w, height: spec.h, left: (size.w - spec.w) / 2, top: (size.h - spec.h) / 2, transform: "rotate(-90deg)" } as CSSProperties}
        >
          {children}
          <StatusBarPhone />
        </div>
      ) : (
        children
      )}
    </DeviceShell>
  )
}
