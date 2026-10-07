"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// Field labels are the site's tracked uppercase display label.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 font-display text-[11px] leading-none font-medium tracking-[0.14em] text-foreground/70 uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
