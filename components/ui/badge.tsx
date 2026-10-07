import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Tags are square, bordered, and set in the display label style.
const badgeVariants = cva(
  "group/badge inline-flex h-[22px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border px-2 font-display text-[10px] font-medium tracking-[0.12em] uppercase whitespace-nowrap transition-colors duration-200 ease-fluid focus-visible:ring-2 focus-visible:ring-mint has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-red [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-foreground bg-foreground text-background [a]:hover:bg-background [a]:hover:text-foreground",
        secondary: "border-transparent bg-muted text-foreground [a]:hover:bg-foreground [a]:hover:text-background",
        mint: "border-foreground bg-mint text-foreground",
        destructive: "border-red/40 text-red [a]:hover:bg-red [a]:hover:text-background",
        outline: "border-line text-foreground [a]:hover:border-foreground",
        ghost: "border-transparent text-foreground/60 hover:bg-muted/60 hover:text-foreground",
        link: "border-transparent px-0 text-foreground link-underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
