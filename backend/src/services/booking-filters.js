export function bookingFilter(filter, date) {
  if (
    ![
      "",
      "active",
      "pending",
      "approved",
      "confirmed",
      "rejected",
      "cancelled",
    ].includes(filter)
  )
    return null
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
