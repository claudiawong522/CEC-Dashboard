"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--black)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !rounded-none !border !border-foreground !bg-background font-sans !text-[13px] !text-foreground !shadow-soft",
          title: "font-sans font-medium",
          description: "font-sans !text-subtle",
          actionButton: "!rounded-none !border-2 !border-foreground !bg-mint !font-display !text-[11px] !font-bold !uppercase !text-foreground",
          cancelButton: "!rounded-none !bg-muted !font-display !text-[11px] !font-bold !uppercase !text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
