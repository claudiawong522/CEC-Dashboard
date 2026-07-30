"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

function Tabs({
  orientation = "vertical",
  ...props
}: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" orientation={orientation} {...props} />
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative flex flex-col", className)}
      {...props}
    />
  )
}

// Vertical tabs spec: absolute 15%-tint pill, animated via `top` (not `transform`) — see
// BRAND_KIT.md "Implementation gotchas" and the Controls table's "Vertical tabs" row.
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute inset-x-0 top-(--active-tab-top) h-9 rounded-btn transition-[top] duration-[340ms] ease-indicator",
        className
      )}
      style={{
        background:
          "linear-gradient(95deg, rgba(232,88,61,.15), rgba(224,185,74,.15), rgba(63,167,137,.15), rgba(59,111,194,.15))",
      }}
      {...props}
    />
  )
}

function TabsTab({
  className,
  done,
  children,
  ...props
}: TabsPrimitive.Tab.Props & { done?: boolean }) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        "relative flex h-9 items-center gap-[9px] px-[13px] font-sans text-[13px] text-body outline-none transition-colors duration-200 hover:text-ink data-active:text-ink",
        className
      )}
      {...props}
    >
      {children}
      {done !== undefined && (
        <span
          aria-hidden="true"
          className="ml-auto size-1.5 rounded-full bg-teal transition-opacity duration-300"
          style={{ opacity: done ? 1 : 0 }}
        />
      )}
    </TabsPrimitive.Tab>
  )
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn("min-w-0 flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsIndicator, TabsTab, TabsPanel }
