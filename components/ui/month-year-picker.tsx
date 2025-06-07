"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthYearPickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

export function MonthYearPicker({ date, setDate }: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1980 + 1 }, (_, i) => currentYear - i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const selectedYear = date ? date.getFullYear() : undefined;
  const selectedMonth = date ? date.getMonth() : undefined;

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr, 10);
    if (date) {
      const newDate = new Date(date);
      newDate.setFullYear(year);
      setDate(newDate);
    } else {
      const newDate = new Date();
      newDate.setFullYear(year);
      newDate.setMonth(0);
      setDate(newDate);
    }
  };

  const handleMonthChange = (monthStr: string) => {
    const monthIndex = months.indexOf(monthStr);
    if (date) {
      const newDate = new Date(date);
      newDate.setMonth(monthIndex);
      setDate(newDate);
    } else {
      const newDate = new Date();
      newDate.setMonth(monthIndex);
      setDate(newDate);
    }
  };
  
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "MMMM yyyy") : <span>Pick a month</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-3 z-50" align="start">
          <div className="space-y-3">
            <div>
              <Select
                value={selectedYear?.toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={selectedMonth !== undefined ? months[selectedMonth] : undefined}
                onValueChange={handleMonthChange}
                disabled={!selectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[200px]">
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
} 