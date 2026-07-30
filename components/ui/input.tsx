import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // bg reads from --input-ground so it can be repointed per-container
        // (e.g. SectionCard sets it to page-colored since its own card is
        // already paper-colored — an input can't contrast against itself).
        "h-auto w-full min-w-0 rounded-input border border-line-input bg-[var(--input-ground,var(--paper))] px-3 py-2.5 font-sans text-[13.5px] text-ink transition-[border-color,box-shadow] duration-[220ms] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-faint focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
