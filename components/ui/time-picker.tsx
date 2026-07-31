"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const totalMinutes = i * 15
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
})

function formatTimeLabel(value: string) {
  const [hStr, mStr] = value.split(":")
  const h = Number(hStr)
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${mStr} ${h < 12 ? "AM" : "PM"}`
}

function TimePicker({
  value,
  onChange,
  placeholder = "Pick a time",
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
  const listRef = React.useRef<HTMLDivElement>(null)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          requestAnimationFrame(() => {
            listRef.current
              ?.querySelector('[data-active="true"]')
              ?.scrollIntoView({ block: "center" })
          })
        }
      }}
    >
      <PopoverTrigger
        id={id}
        className={cn(
          "flex h-auto w-full min-w-0 items-center gap-2 rounded-input border border-line-input bg-[var(--input-ground,var(--paper))] px-3 py-2.5 font-sans text-[13.5px] text-ink transition-[border-color,box-shadow] duration-[220ms] outline-none focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]",
          !value && "text-faint",
          className,
        )}
      >
        <ClockIcon className="size-3.5 shrink-0 text-faint" />
        <span className="truncate">{value ? formatTimeLabel(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[132px] p-1.5">
        <div ref={listRef} className="flex max-h-[220px] flex-col overflow-y-auto">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              data-active={option === value}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={cn(
                "shrink-0 rounded-input px-2.5 py-1.5 text-left font-sans text-[13px] text-ink transition-colors duration-150 hover:bg-hover",
                option === value && "bg-[var(--cent)] text-paper hover:bg-[var(--cent)]",
              )}
            >
              {formatTimeLabel(option)}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
