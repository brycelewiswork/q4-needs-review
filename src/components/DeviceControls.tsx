import { IconBrandAppleFilled, IconDeviceMobile, IconDeviceTablet, IconRectangle, IconRectangleVertical } from "@tabler/icons-react"
import { SegmentedControl } from "@/components/ios/SegmentedControl"
import { useViewStore } from "@/store/useViewStore"
import { VERSION } from "@/lib/version"

/** Tabler has no filled Android mark, so this is the Material "android" glyph (Apache 2.0). */
function AndroidFilled({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25S7.69 15.25 7 15.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
    </svg>
  )
}

/** Which device the prototype is shown on: the platform (by its logo), phone or tablet, and how it's held. Sits just above the frame. */
export function DeviceControls() {
  const platform = useViewStore((s) => s.platform)
  const setPlatform = useViewStore((s) => s.setPlatform)
  const device = useViewStore((s) => s.device)
  const setDevice = useViewStore((s) => s.setDevice)
  const orientation = useViewStore((s) => s.orientation)
  const setOrientation = useViewStore((s) => s.setOrientation)
  return (
    <div className="flex flex-col items-center gap-3">
    <div className="w-full max-w-[680px] px-4 text-left">
      <h1 className="text-[15px] font-semibold leading-5 text-neutral-900 dark:text-neutral-100">{VERSION.title}</h1>
      {VERSION.subtitle.length > 0 && (
      <div className="mt-1 flex flex-col gap-2">
        {VERSION.subtitle.map((p) => (
          <p key={p} className="text-[13px] leading-[18px] text-neutral-500 dark:text-neutral-400">{p}</p>
        ))}
      </div>
      )}
    </div>
    <div className="flex items-center gap-3">
      <SegmentedControl
        className="w-[92px]"
        value={platform}
        onChange={setPlatform}
        options={[
          { id: "ios", label: <IconBrandAppleFilled size={18} />, ariaLabel: "iOS" },
          { id: "android", label: <AndroidFilled />, ariaLabel: "Android" },
        ]}
      />
      <SegmentedControl
        className="w-[84px]"
        value={device}
        onChange={setDevice}
        options={[
          { id: "phone", label: <IconDeviceMobile size={18} stroke={1.75} />, ariaLabel: "Phone" },
          { id: "tablet", label: <IconDeviceTablet size={18} stroke={1.75} />, ariaLabel: "Tablet" },
        ]}
      />
      <SegmentedControl
        className="w-[84px]"
        value={orientation}
        onChange={setOrientation}
        options={[
          { id: "portrait", label: <IconRectangleVertical size={18} stroke={1.75} />, ariaLabel: "Portrait" },
          { id: "landscape", label: <IconRectangle size={18} stroke={1.75} />, ariaLabel: "Landscape" },
        ]}
      />
    </div>
    </div>
  )
}
