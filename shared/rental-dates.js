// DATE-only ISO strings, start inclusive and checkout exclusive.
export function validDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  )
}
export function addMonths(start, months) {
  if (
    !validDate(start) ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 120
  )
    throw new Error(
      "Choose a valid move-in date and a duration of 1–120 whole months",
    )
  const date = new Date(start + "T00:00:00Z")
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  )
  if (target.getUTCFullYear() > 9999)
    throw new Error("Checkout exceeds the supported date range")
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), last))
  return target.toISOString().slice(0, 10)
}
export function addDays(date, days) {
  const value = new Date(date + "T00:00:00Z")
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
export function overlaps(start, end, otherStart, otherEnd) {
  return start < otherEnd && end > otherStart
}
export function formatDate(date) {
  return validDate(date)
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(date + "T00:00:00Z"))
    : "Not specified"
}
