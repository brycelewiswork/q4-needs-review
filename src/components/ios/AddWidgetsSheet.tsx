import { Sheet } from "@/components/ios/Sheet"
import { AddWidgetsBody } from "@/components/DashboardEdit"

/** Customize Dashboard's plus: preview a removed widget and put it back. The close is an X at the top left, like Health's "Add a Card". */
export function AddWidgetsSheet({ multi, onClose }: { /** Without several locations there is no Locations widget to bring back. */ multi: boolean; onClose: () => void }) {
  return (
    <Sheet title="Add a Widget" onClose={onClose} closeSide="left" titleSlot={<span />}>
      <AddWidgetsBody multi={multi} />
    </Sheet>
  )
}
