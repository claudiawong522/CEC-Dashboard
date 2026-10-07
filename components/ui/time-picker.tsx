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

// Parses whatever's been typed so far — bare digits ("6", "630", "6:30")
// with an optional trailing am/pm — into a 24-hour "HH:MM" string, or null
// if it isn't parseable yet. With no am/pm typed, hours 1-12 default to PM
// (event times skew afternoon/evening) and 13-23 are already unambiguous.
function parseTypedTime(raw: string): string | null {
  let s = raw.trim().toLowerCase()
  if (!s) return null

  let meridiem: "am" | "pm" | null = null
  const meridiemMatch = s.match(/(am|pm|a|p)$/)
  if (meridiemMatch) {
    meridiem = meridiemMatch[1].startsWith("a") ? "am" : "pm"
    s = s.slice(0, -meridiemMatch[1].length)
  }
  if (!s) return null

  let hour: number
  let minute = 0

  if (s.includes(":")) {
    const [hStr, mStr = ""] = s.split(":")
    if (!/^\d{1,2}$/.test(hStr) || !/^\d{0,2}$/.test(mStr)) return null
    hour = Number(hStr)
    minute = mStr ? Number(mStr) : 0
  } else {
    if (!/^\d{1,4}$/.test(s)) return null
    if (s.length <= 2) {
      hour = Number(s)
    } else if (s.length === 3) {
      hour = Number(s.slice(0, 1))
      minute = Number(s.slice(1))
    } else {
      hour = Number(s.slice(0, 2))
      minute = Number(s.slice(2))
    }
  }

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59 || hour > 23) return null

  let hour24: number
  if (meridiem === "am") {
    if (hour > 12) return null
    hour24 = hour % 12
  } else if (meridiem === "pm") {
    if (hour > 12) return null
    hour24 = hour === 12 ? 12 : hour + 12
  } else if (hour === 0 || hour >= 13) {
    hour24 = hour
  } else {
    hour24 = hour === 12 ? 12 : hour + 12
  }

  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

function nearestOption(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  const index = Math.min(95, Math.max(0, Math.round((h * 60 + m) / 15)))
  return TIME_OPTIONS[index]
}

// Typed digits reset after a pause, same as native <select> typeahead —
// otherwise stale keystrokes from a while ago would silently prefix the
// next entry.
const TYPEAHEAD_RESET_MS = 1200

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
  const bufferRef = React.useRef("")
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function scrollToOption(option: string) {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector(`[data-option="${option}"]`)
        ?.scrollIntoView({ block: "center" })
    })
  }

  function clearBuffer() {
    bufferRef.current = ""
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      clearBuffer()
      return
    }
    if (e.key === "Backspace") {
      bufferRef.current = bufferRef.current.slice(0, -1)
    } else if (/^[0-9]$/.test(e.key) || e.key === ":" || /^[ap]$/i.test(e.key)) {
      bufferRef.current += e.key.toLowerCase()
    } else {
      return
    }

    e.preventDefault()
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(clearBuffer, TYPEAHEAD_RESET_MS)

    const parsed = parseTypedTime(bufferRef.current)
    if (parsed) {
      onChange(parsed)
      setOpen(true)
      scrollToOption(nearestOption(parsed))
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        clearBuffer()
        if (next && value) scrollToOption(nearestOption(value))
      }}
    >
      <PopoverTrigger
        id={id}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-auto w-full min-w-0 items-center gap-2 border border-line bg-background px-3 py-2.5 font-sans text-[14px] text-foreground transition-[border-color] duration-200 ease-fluid outline-none hover:border-foreground/40 focus-visible:border-foreground data-[popup-open]:border-foreground",
          !value && "text-foreground/40",
          className,
        )}
      >
        <ClockIcon className="size-3.5 shrink-0 text-foreground/50" />
        <span className="truncate">{value ? formatTimeLabel(value) : placeholder}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[132px] p-1.5">
        <div ref={listRef} className="flex max-h-[220px] flex-col overflow-y-auto">
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              data-option={option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={cn(
                "shrink-0 px-2.5 py-1.5 text-left font-sans text-[13px] text-foreground transition-colors duration-150 hover:bg-muted/60",
                option === value && "bg-mint font-medium text-foreground hover:bg-mint",
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
