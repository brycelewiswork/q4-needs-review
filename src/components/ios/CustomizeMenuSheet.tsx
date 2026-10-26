import type { ReactNode } from "react"
import { Reorder, useDragControls } from "motion/react"
import { IconGripVertical } from "@tabler/icons-react"
import { Sheet } from "@/components/ios/Sheet"
import { isTabItem, useMoreMenuStore } from "@/store/useMoreMenuStore"

export type CustomizeItem = { id: string; label: string; icon: ReactNode }

function Row({ item }: { item: CustomizeItem }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item.id}
      dragListener={false}
      dragControls={controls}
      className="relative flex h-[52px] select-none items-center gap-3 bg-white px-4"
      whileDrag={{ scale: 1.02, borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 5 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-[#141414]">{item.icon}</span>
      <span className="flex-1 truncate text-[17px] tracking-[-0.43px] text-black">{item.label}</span>
      <button
        aria-label={`Reorder ${item.label}`}
        data-no-sheet-drag
        onPointerDown={(e) => controls.start(e)}
        className="-mr-2 flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-full text-[#a09ead] active:cursor-grabbing"
      >
        <IconGripVertical size={22} stroke={1.75} />
      </button>
    </Reorder.Item>
  )
}

/**
 * Where the More menu's list is customized: a full-page sheet with every item, dragged by its handle into the order
 * the menu shows. The order is kept (see useMoreMenuStore).
 */
export function CustomizeMenuSheet({ items, onClose }: { items: CustomizeItem[]; onClose: () => void }) {
  const setOrder = useMoreMenuStore((s) => s.setOrder)
  const reset = useMoreMenuStore((s) => s.reset)
  const tabs = items.filter((i) => isTabItem(i.id))
  const rest = items.filter((i) => !isTabItem(i.id))
  const byId = new Map(rest.map((i) => [i.id, i]))
  return (
    <Sheet title="Customize" onClose={onClose}>
      <div className="px-4 pb-10 pt-[76px]">
        <p className="px-2 pb-3 text-[15px] leading-5 tracking-[-0.24px] text-[#6d6a7a]">The tabs keep their order. Drag the rest to change the order of the menu.</p>
        <div className="flex flex-col rounded-[22px] bg-white py-1">
          {/* The tabs: where the main navigation shows them, in its order, so there is nothing to drag. */}
          {tabs.map((i) => (
            <div key={i.id} className="flex h-[52px] items-center gap-3 px-4">
              <span className="flex size-6 shrink-0 items-center justify-center text-[#141414]">{i.icon}</span>
              <span className="flex-1 truncate text-[17px] tracking-[-0.43px] text-black">{i.label}</span>
            </div>
          ))}
          <div aria-hidden className="mx-4 my-1 h-px bg-black/[0.08]" />
          <Reorder.Group axis="y" values={rest.map((i) => i.id)} onReorder={setOrder} className="flex flex-col">
            {rest.map((i) => (
              <Row key={i.id} item={byId.get(i.id)!} />
            ))}
          </Reorder.Group>
        </div>
        <button onClick={reset} className="mx-auto mt-5 block h-11 rounded-full px-5 text-[15px] font-[510] tracking-[-0.24px] text-[#8f55e5] active:opacity-60">
          Reset order
        </button>
      </div>
    </Sheet>
  )
}
