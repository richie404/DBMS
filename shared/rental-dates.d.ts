export function validDate(value: unknown): value is string
export function addMonths(start: string, months: number): string
export function addDays(date: string, days: number): string
export function overlaps(
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string,
): boolean
export function formatDate(date: string): string
