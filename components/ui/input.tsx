import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Square, 1px hairline, white; focus turns the border black. No ring, no
// glow: the site signals focus with contrast alone.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-auto w-full min-w-0 border border-line bg-background px-3 py-2.5 font-sans text-[14px] text-foreground transition-[border-color] duration-200 ease-fluid outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-foreground/40 hover:border-foreground/40 focus-visible:border-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red",
        className
      )}
      {...props}
    />
  )
}

export { Input }
