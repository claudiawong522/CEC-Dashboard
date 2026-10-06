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
      className={cn("relative flex flex-col border-l border-line", className)}
      {...props}
    />
  )
}

// The site marks the active nav link with a mint underline. In a vertical
// list that becomes a 3px mint bar on the left edge, slid between rows by
// animating `top` (not `transform`, see BRAND_KIT.md § Gotchas).
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute -left-px top-(--active-tab-top) h-9 w-[3px] bg-mint transition-[top] duration-[340ms] ease-fluid",
        className
      )}
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
        "relative flex h-9 items-center gap-[9px] pr-3 pl-4 font-sans text-[13px] text-foreground/55 outline-none transition-colors duration-200 ease-fluid hover:text-foreground data-active:font-medium data-active:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {done !== undefined && (
        <span
          aria-hidden="true"
          className="ml-auto size-1.5 bg-mint-dark transition-opacity duration-300"
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
