import { useEffect } from "react"
import { IconMoon, IconSun } from "@tabler/icons-react"
import { useTheme } from "next-themes"
import { SegmentedControl } from "@/components/ios/SegmentedControl"

/** Light / dark for the prototype, on the web page below the phone: two icons. */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  // The prototype was drawn in light: start there instead of following the OS.
  useEffect(() => {
    if (theme === "system") setTheme("light")
  }, [theme, setTheme])
  const value = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark"
  return (
    <SegmentedControl
      className="w-[96px]"
      value={value}
      onChange={setTheme}
      options={[
        { id: "light", ariaLabel: "Light", label: <IconSun size={18} stroke={1.75} /> },
        { id: "dark", ariaLabel: "Dark", label: <IconMoon size={18} stroke={1.75} /> },
      ]}
    />
  )
}
