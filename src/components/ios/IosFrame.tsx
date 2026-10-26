import type { CSSProperties, ReactNode } from "react"
import { DeviceShell } from "@/components/DeviceShell"
import { DeviceControls } from "@/components/DeviceControls"
import { SCREENS, oriented, useMediaQuery } from "@/lib/device"
import { useViewStore } from "@/store/useViewStore"

/** SF Pro on Apple platforms (Mac + the phone this is previewed on). */
export const IOS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro", "SF Pro Text", system-ui, sans-serif'

/** The iPhone bezel art bleeds past the screen: 450×920 total (aspect 1350/2760). */
const PHONE_ART = { w: 450, h: 920 } as const
/** iPad Air: a black bezel around the screen, no art file, drawn in CSS. */
const PAD_BEZEL = 40
const PAD_RADIUS = 56

function StatusBarPhone() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[62px] items-center px-[9px] pt-[2.333px] text-[#2c2935]"
      style={{ fontFamily: IOS_FONT }}
    >
      <div className="flex flex-1 items-center justify-center pr-[6px]">
        <span className="text-[17px] font-[590] leading-[22px]">9:41</span>
      </div>
      <div className="w-[125px] shrink-0" />
      <div className="flex flex-1 items-center justify-center pr-px">
        <img src="/phone/status-levels.svg" alt="" width={85.33} height={13} />
      </div>
    </div>
  )
}

function Island() {
  return <div className="absolute left-1/2 top-[13px] z-50 h-[37px] w-[125px] -translate-x-1/2 rounded-full bg-black" />
}

/** iPadOS: time and date on the left, the status icons on the right, no island. */
function StatusBarPad() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-6 items-center justify-between px-7 pt-[3px] text-[#2c2935]"
      style={{ fontFamily: IOS_FONT }}
    >
      <span className="flex items-baseline gap-2 text-[15px] font-[590] leading-5">
        9:41
        <span className="text-[13px] font-[510]">Tue Oct 14</span>
      </span>
      <img src="/phone/status-levels.svg" alt="" width={77} height={11.7} />
    </div>
  )
}

/**
 * The iOS device: iPhone 17 or iPad Air 11", upright or on its side. Dimensions come from SCREENS.
 *
 * On an actual phone (≤500px wide, phone, portrait) the frame drops away and the screen goes edge to edge,
 * so the real device chrome is used.
 *
 * Children get CSS vars to lay out against: `--safe-top` (below the status bar), `--safe-bottom` (above the
 * home indicator). A phone on its side keeps these portrait values: it shows the portrait screen turned a quarter-turn.
 */
export function IosFrame({ children, header, footer }: { children: ReactNode; /** Page controls shown on the web page above the device (desktop only). */ header?: ReactNode; /** Page controls shown below the device (desktop only). */ footer?: ReactNode }) {
  const device = useViewStore((s) => s.device)
  const orientation = useViewStore((s) => s.orientation)
  const narrow = useMediaQuery("(max-width: 500px)")
  const land = orientation === "landscape"
  const tablet = device === "tablet"

  if (narrow && !tablet && !land) {
    return (
      <div
        className="ios-screen relative h-svh w-full overflow-hidden bg-[#f3f2f6]"
        style={
          {
            fontFamily: IOS_FONT,
            "--safe-top": "max(env(safe-area-inset-top), 20px)",
            "--safe-bottom": "max(env(safe-area-inset-bottom), 12px)",
            "--safe-left": "0px",
            "--safe-right": "0px",
          } as CSSProperties
        }
      >
        {children}
      </div>
    )
  }

  const spec = SCREENS.ios[device]
  const size = oriented(spec, orientation)
  const screenStyle = {
    fontFamily: IOS_FONT,
    "--safe-top": tablet ? "24px" : "62px",
    "--safe-bottom": tablet ? "20px" : "25px",
    "--safe-left": "0px",
    "--safe-right": "0px",
  } as CSSProperties

  if (tablet) {
    const box = { w: size.w + PAD_BEZEL * 2, h: size.h + PAD_BEZEL * 2 }
    return (
      <DeviceShell
        box={box}
        screen={{ x: PAD_BEZEL, y: PAD_BEZEL, ...size, radius: spec.radius }}
        screenClass="ios-screen bg-[#f3f2f6]"
        screenStyle={screenStyle}
        header={header}
      controls={<DeviceControls />}
        footer={footer}
        art={
          <div
            aria-hidden
            className="absolute inset-0 bg-[#0b0b0d] shadow-[0_50px_70px_rgba(20,20,40,0.2),0_14px_28px_rgba(20,20,40,0.1),inset_0_0_0_3px_#b9bbc2,inset_0_0_0_4px_rgba(0,0,0,0.4)] dark:shadow-[0_50px_70px_rgba(0,0,0,0.55),0_14px_28px_rgba(0,0,0,0.35),inset_0_0_0_3px_#8e9097,inset_0_0_0_4px_rgba(0,0,0,0.4)]"
            style={{ borderRadius: PAD_RADIUS }}
          >
            {/* The front camera sits in the middle of the long edge: top when landscape, left when upright. */}
            <span
              className="absolute size-[9px] rounded-full bg-[#17171c] ring-1 ring-[#2a2a31]"
              style={land ? { left: "50%", top: PAD_BEZEL / 2 - 4.5, translate: "-50% 0" } : { top: "50%", left: PAD_BEZEL / 2 - 4.5, translate: "0 -50%" }}
            />
          </div>
        }
        chrome={<StatusBarPad />}
      >
        {children}
      </DeviceShell>
    )
  }

  // iPhone. The bezel art is portrait; landscape turns it a quarter-turn so the island lands on the left.
  const box = land ? { w: PHONE_ART.h, h: PHONE_ART.w } : PHONE_ART
  return (
    <DeviceShell
      box={box}
      screen={{ x: (box.w - size.w) / 2, y: (box.h - size.h) / 2, ...size, radius: spec.radius }}
      screenClass={land ? "bg-[#f3f2f6]" : "ios-screen bg-[#f3f2f6]"}
      screenStyle={land ? {} : screenStyle}
      header={header}
      controls={<DeviceControls />}
      footer={footer}
      art={
        // The shadow: a transparent box the size of the phone body (measured from the bezel art: 432 × 902 at 9, 9,
        // ~88px corners), so only its OUTER shadow paints. It must not contain anything dark: the screen's blurred
        // glass samples what's behind it, and a dark bezel copy under the edges bled black into the corners.
        // It stays upright (outside the turned art) so the light still falls downward.
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 rounded-[88px] shadow-[0_50px_70px_rgba(20,20,40,0.2),0_14px_28px_rgba(20,20,40,0.1)] dark:shadow-[0_50px_70px_rgba(0,0,0,0.55),0_14px_28px_rgba(0,0,0,0.35)]"
          style={land ? { left: 8.7, top: 9.3, width: 902.3, height: 431.7 } : { left: 9, top: 8.7, width: 431.7, height: 902.3 }}
        />
      }
      chrome={
        land ? null : (
          <>
            <StatusBarPhone />
            <Island />
          </>
        )
      }
      overlay={
        <img
          src="/phone/bezel.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute z-50 max-w-none select-none"
          style={{
            width: PHONE_ART.w,
            height: PHONE_ART.h,
            left: (box.w - PHONE_ART.w) / 2,
            top: (box.h - PHONE_ART.h) / 2,
            transform: land ? "rotate(-90deg)" : undefined,
          }}
        />
      }
    >
      {land ? (
        // The phone has no landscape layout: the portrait screen is turned a quarter-turn to sit in the frame.
        <div
          className="ios-screen absolute overflow-hidden bg-[#f3f2f6]"
          style={{ ...screenStyle, width: spec.w, height: spec.h, left: (size.w - spec.w) / 2, top: (size.h - spec.h) / 2, transform: "rotate(-90deg)" } as CSSProperties}
        >
          {children}
          <StatusBarPhone />
          <Island />
        </div>
      ) : (
        children
      )}
    </DeviceShell>
  )
}
