import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[80px] w-full border border-line bg-background px-3 py-2.5 font-sans text-[14px] leading-[1.6] text-foreground transition-[border-color] duration-200 ease-fluid outline-none placeholder:text-foreground/40 hover:border-foreground/40 focus-visible:border-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
