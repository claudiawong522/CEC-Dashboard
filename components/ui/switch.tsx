"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

// A 40x22 rectangle with the 2px black border and a black square knob. The
// track fills mint when on.
function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-[22px] w-[40px] shrink-0 items-center border-2 border-foreground bg-background p-[2px] outline-none transition-colors duration-200 ease-fluid after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 data-checked:bg-mint data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[14px] bg-foreground transition-transform duration-200 ease-fluid data-checked:translate-x-[18px] data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
