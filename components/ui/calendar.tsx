"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        root: "font-sans",
        months: "flex flex-col gap-3",
        month: "relative flex flex-col gap-3",
        month_caption: "flex items-center justify-center px-8 font-sans text-[13.5px] text-ink",
        nav: "flex items-center justify-between",
        button_previous: cn(
          "absolute left-1 top-1 flex size-7 items-center justify-center rounded-input text-faint transition-colors duration-200 hover:bg-hover hover:text-ink",
        ),
        button_next: cn(
          "absolute right-1 top-1 flex size-7 items-center justify-center rounded-input text-faint transition-colors duration-200 hover:bg-hover hover:text-ink",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 font-mono text-[9.5px] tracking-[0.1em] uppercase text-faint",
        week: "flex w-full mt-1",
        day: "day-cell relative size-9 p-0 text-center",
        day_button: cn(
          "day-btn flex size-9 items-center justify-center rounded-input font-sans text-[13px] text-ink transition-colors duration-150",
          "hover:bg-hover",
        ),
        outside: "text-faded",
        disabled: "text-faded opacity-40 pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
