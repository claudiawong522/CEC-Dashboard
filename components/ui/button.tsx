import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

// cornellec.com's buttons: square, 2px black border, Space Grotesk uppercase,
// mint for the primary action, and every hover inverts to black. See
// design/BRAND_KIT.md v2 § Buttons.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border-2 bg-clip-padding font-display text-[12px] font-bold tracking-wide uppercase whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-fluid outline-none select-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-mint text-foreground hover:bg-foreground hover:text-mint",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background aria-expanded:bg-foreground aria-expanded:text-background",
        secondary:
          "border-line bg-background text-foreground hover:border-foreground aria-expanded:border-foreground",
        ghost:
          "border-transparent text-foreground/60 hover:bg-muted/60 hover:text-foreground aria-expanded:bg-muted/60 aria-expanded:text-foreground",
        destructive:
          "border-transparent text-red hover:border-red hover:bg-red hover:text-background focus-visible:ring-red",
        link: "border-transparent link-underline font-sans text-[13px] font-medium normal-case tracking-normal text-foreground",
      },
      // Under md every size is at least 44px tall: phones are touch, and the
      // desktop sizes (28 to 36px) are below a fingertip.
      size: {
        default:
          "h-9 gap-2 px-4 max-md:h-11 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1.5 px-2.5 text-[10px] max-md:h-11 max-md:px-3 max-md:text-[11px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-[11px] max-md:h-11 max-md:px-4 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-[13px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-9 max-md:size-11",
        "icon-xs": "size-7 max-md:size-11 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 max-md:size-11 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
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
