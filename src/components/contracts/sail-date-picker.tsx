"use client"

import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
} from "react-aria-components"
import { parseDate } from "@internationalized/date"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

// Bridge: "YYYY-MM-DD" string ↔ CalendarDate
function fromIsoString(s: string) {
  try {
    return parseDate(s)
  } catch {
    return null
  }
}

interface SailDatePickerProps {
  value: string // YYYY-MM-DD
  onChange: (v: string) => void
  label?: string
  size?: "sm" | "md"
  error?: boolean
  disableBefore?: string // YYYY-MM-DD
  disableAfter?: string  // YYYY-MM-DD
  placeholder?: string
}

export function SailDatePicker({
  value,
  onChange,
  label,
  size = "md",
  error = false,
  disableBefore,
  disableAfter,
}: SailDatePickerProps) {
  const calDate = value ? fromIsoString(value) : null

  const minValue = disableBefore ? fromIsoString(disableBefore) : undefined
  const maxValue = disableAfter ? fromIsoString(disableAfter) : undefined

  return (
    <DatePicker
      value={calDate ?? undefined}
      onChange={d => d && onChange(d.toString())}
      minValue={minValue ?? undefined}
      maxValue={maxValue ?? undefined}
      className="flex flex-col gap-1"
    >
      {label && (
        <Label className="text-xs font-medium text-[#596171]">{label}</Label>
      )}

      {/* Input row */}
      <Group
        className={[
          "flex items-center rounded-md border bg-white transition-all outline-none",
          "focus-within:ring-[3px]",
          size === "sm" ? "h-8 px-2 gap-1" : "h-9 px-3 gap-1.5",
          error
            ? "border-[#e61947] focus-within:border-[#e61947] focus-within:ring-[#e61947]/15"
            : "border-[#dfe1e6] focus-within:border-[#533AFD] focus-within:ring-[#533AFD]/15",
        ].join(" ")}
      >
        <DateInput className="flex items-center gap-px flex-1 min-w-0">
          {segment => (
            <DateSegment
              segment={segment}
              className={[
                "rounded px-px outline-none tabular-nums caret-transparent",
                size === "sm" ? "text-xs text-[#353A44]" : "text-sm text-[#1A1A1A]",
                "data-[type=literal]:text-[#A0A8B4] data-[type=literal]:select-none",
                "data-[placeholder]:text-[#A0A8B4]",
                "focus:bg-[#EEF0FF] focus:text-[#533AFD] focus:rounded",
              ].join(" ")}
            />
          )}
        </DateInput>

        <Button className="shrink-0 flex items-center justify-center text-[#A0A8B4] hover:text-[#533AFD] transition-colors outline-none">
          <CalendarDays className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </Button>
      </Group>

      {/* Calendar popover */}
      <Popover
        offset={8}
        className="z-[300] entering:animate-in entering:fade-in entering:zoom-in-95 exiting:animate-out exiting:fade-out exiting:zoom-out-95 duration-100"
      >
        <Dialog className="outline-none">
          <Calendar className="bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[#ebeef1] p-4 w-[280px]">
            {/* Month nav header */}
            <header className="flex items-center justify-between mb-3">
              <Button
                slot="previous"
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#596171] outline-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Heading className="text-sm font-semibold text-[#353A44]" />
              <Button
                slot="next"
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#f5f6f8] text-[#596171] outline-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </header>

            <CalendarGrid>
              {/* Day-of-week header */}
              <CalendarGridHeader>
                {day => (
                  <CalendarHeaderCell className="text-[10px] font-medium text-[#A0A8B4] w-9 h-7 text-center">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>

              {/* Date cells */}
              <CalendarGridBody>
                {date => (
                  <CalendarCell
                    date={date}
                    className={[
                      "w-9 h-9 flex items-center justify-center text-sm rounded-full outline-none cursor-pointer transition-colors",
                      "text-[#353A44]",
                      "outside-month:text-[#c5cad3] outside-month:pointer-events-none",
                      "hover:bg-[#f0f0ff]",
                      "focus:ring-2 focus:ring-[#533AFD]/40",
                      "selected:bg-[#533AFD] selected:text-white selected:hover:bg-[#4730E0]",
                      "today:ring-1 today:ring-[#533AFD] today:ring-offset-1",
                      "disabled:text-[#c5cad3] disabled:pointer-events-none",
                    ].join(" ")}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  )
}
