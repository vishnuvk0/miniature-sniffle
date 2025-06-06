"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type TimeRange = "1D" | "1W" | "MTD" | "YTD" | "ALL";

interface TimeRangeFilterProps {
  value: TimeRange;
  onValueChange: (value: TimeRange) => void;
}

const timeRanges: { label: string; value: TimeRange }[] = [
  { label: "1D", value: "1D" },
  { label: "1W", value: "1W" },
  { label: "MTD", value: "MTD" },
  { label: "YTD", value: "YTD" },
  { label: "All", value: "ALL" },
];

export function TimeRangeFilter({ value, onValueChange }: TimeRangeFilterProps) {
  const handleValueChange = (newValue: TimeRange) => {
    if (newValue) { // Toggle group can be deselected, returning null
      onValueChange(newValue);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={handleValueChange}
        aria-label="Time range filter"
        variant="outline"
        size="sm"
      >
        {timeRanges.map(({ label, value }) => (
          <ToggleGroupItem key={value} value={value} aria-label={label}>
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
} 