"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-[21px] w-[38px] shrink-0 items-center rounded-full p-0.5 outline-none transition-colors duration-[320ms] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-unchecked:bg-line-strong",
        className
      )}
      style={{
        background: props.checked
          ? "linear-gradient(95deg,#F3B5A6,#EFDCA8,#AEDACA,#B7CBEB)"
          : undefined,
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[17px] rounded-full bg-paper shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-[360ms] ease-spring data-checked:translate-x-[17px] data-unchecked:translate-x-0"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
