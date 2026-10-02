export function bookingFilter(filter, date) {
  if (/^booking:[1-9]\d*$/.test(filter)) {const n=Number(filter.slice(8));return Number.isSafeInteger(n)&&n<=4294967295?{sql:"b.id=?",values:[n]}:null}
  if (
    ![
      "",
      "active",
      "completed",
      "pending",
      "approved",
      "confirmed",
      "rejected",
      "cancelled",
    ].includes(filter)
  )
    return null
  if (filter === "completed") return {sql:"b.status IN ('approved','confirmed') AND b.end_date<=?",values:[date]}
  if (filter === "active")
    return {
      sql: "b.status IN ('approved','confirmed') AND b.end_date>?",
      values: [date],
    }
  if (filter === "pending")
    return { sql: "b.status='pending' AND b.end_date>?", values: [date] }
  return filter
    ? { sql: "b.status=?", values: [filter] }
    : { sql: "1=1", values: [] }
}
