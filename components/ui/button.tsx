import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-btn border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-200 ease-brand outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:scale-[0.975] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-primary",
        outline:
          "border-line-input bg-transparent text-body hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink aria-expanded:bg-wash aria-expanded:text-ink dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-line-strong aria-expanded:bg-line-strong",
        ghost:
          "text-faint hover:bg-wash hover:text-ink aria-expanded:bg-wash aria-expanded:text-ink dark:hover:bg-muted/50",
        destructive:
          "bg-transparent text-destructive hover:bg-coral/10 hover:border-coral/30 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:hover:bg-destructive/20 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-btn),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-btn has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-btn),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-btn has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-btn),10px)] in-data-[slot=button-group]:rounded-btn [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-btn),12px)] in-data-[slot=button-group]:rounded-btn",
        "icon-lg": "size-9",
      },
    },
    compoundVariants: [
      {
        // brand kit's "Icon 36px" button: paper ground, hairline border, rotates on hover —
        // only when Secondary-styled (outline) icon buttons are used for standalone icon
        // actions (e.g. calendar prev/next), not the ghost-styled dialog close X.
        variant: "outline",
        size: ["icon", "icon-sm", "icon-lg", "icon-xs"],
        class: "bg-paper hover:rotate-90 active:rotate-90",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { loading?: boolean }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
