"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function parseIsoDate(value: string) {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  id,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseIsoDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        className={cn(
          "flex h-auto w-full min-w-0 items-center gap-2 border border-line bg-background px-3 py-2.5 font-sans text-[14px] text-foreground transition-[border-color] duration-200 ease-fluid outline-none hover:border-foreground/40 focus-visible:border-foreground data-[popup-open]:border-foreground",
          !selected && "text-foreground/40",
          className,
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0 text-foreground/50" />
        <span className="truncate">{selected ? format(selected, "MMM d, yyyy") : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(toIsoDate(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
