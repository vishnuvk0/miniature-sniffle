"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { parseDate } from "chrono-node"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disableFuture?: boolean;
}

export function DatePicker({ date, setDate, disableFuture = false }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState<string>(date ? format(date, "PPP") : "")
  const [month, setMonth] = React.useState<Date | undefined>(date)

  React.useEffect(() => {
    if (date) {
      if(document.activeElement?.id !== 'date-input') {
        setInputValue(format(date, "PPP"));
      }
      setMonth(date);
    } else {
      setInputValue("");
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const parsed = parseDate(value);
    if (parsed) {
        if (!disableFuture || (disableFuture && parsed <= new Date())) {
            setDate(parsed);
            setMonth(parsed);
        }
    }
  }

  const handleSelectDate = (selectedDate: Date | undefined) => {
    if(selectedDate){
        if (!disableFuture || (disableFuture && selectedDate <= new Date())) {
            setDate(selectedDate);
            setInputValue(format(selectedDate, "PPP"));
        }
    } else {
        setDate(undefined);
        setInputValue("");
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center w-full">
        <Input
          id="date-input"
          value={inputValue}
          placeholder="Tomorrow, next week..."
          className="w-full pr-10"
          onChange={handleInputChange}
          onBlur={() => {
            if (date) setInputValue(format(date, "PPP"))
          }}
          onKeyDown={(e) => {
              if (e.key === "Enter" && parseDate(inputValue)) {
                  setOpen(false);
              }
          }}
        />
        <PopoverTrigger asChild>
            <Button
                variant="ghost"
                className="absolute right-1 h-7 w-7 p-0"
            >
                <span className="sr-only">Open calendar</span>
                <CalendarIcon className="h-4 w-4" />
            </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelectDate}
          disabled={disableFuture ? (d) => d > new Date() || d < new Date("1900-01-01") : undefined}
        />
      </PopoverContent>
    </Popover>
  )
} 