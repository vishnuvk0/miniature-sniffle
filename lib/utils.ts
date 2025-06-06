import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number into a string with commas as thousands separators.
 * @param value The number to format.
 * @returns A string representation of the number with commas.
 */
export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat().format(num);
}

/**
 * Parses a string that may contain commas or a 'k' suffix into a number.
 * @param value The string to parse.
 * e.g., "50,000" -> 50000 | "50k" -> 50000
 * @returns The parsed number.
 */
export function parsePoints(value: string): number {
  if (!value) return 0;
  const cleaned = value.trim().toLowerCase();
  
  if (cleaned.endsWith('k')) {
    const numPart = cleaned.slice(0, -1).replace(/,/g, '');
    const num = parseFloat(numPart);
    if (!isNaN(num)) {
      return num * 1000;
    }
  }

  const num = parseFloat(cleaned.replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
}
