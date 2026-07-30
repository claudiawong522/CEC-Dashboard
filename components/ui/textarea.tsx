import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[74px] w-full rounded-input border border-line-input bg-[var(--input-ground,var(--paper))] px-[13px] py-[11px] font-sans text-[13px] leading-[1.65] text-strong transition-colors outline-none placeholder:text-faint focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
