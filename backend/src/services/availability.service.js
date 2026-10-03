import { today, fail } from "./rental.service.js"
import { addMonths, overlaps } from "../../../shared/rental-dates.js"
// No temporary holds exist. Approved and confirmed bookings reserve [start,end).
export const reservationSQL =
  "status IN ('approved','confirmed') AND deleted_at IS NULL"
export async function availability(
  connection,
  property,
  months = 1,
  from = today(),
) {
  try {
    addMonths(from, months)
  } catch (error) {
    fail(400, error.message)
  }
  const [reserved] = await connection.execute(
    `SELECT DATE_FORMAT(start_date,'%Y-%m-%d') AS startDate,DATE_FORMAT(end_date,'%Y-%m-%d') AS endDate FROM bookings WHERE property_id=? AND ${reservationSQL} AND end_date>? ORDER BY start_date,end_date`,
    [property.id, today()],
  )
  const earliest =
    property.availableFrom && property.availableFrom > today()
      ? property.availableFrom
      : today()
  let candidate = from > earliest ? from : earliest
  let nextMoveIn = candidate
  try {
    for (const period of reserved) {
      if (
        overlaps(
          candidate,
          addMonths(candidate, months),
          period.startDate,
          period.endDate,
        )
      )
        candidate = period.endDate
    }
    addMonths(candidate, months)
    nextMoveIn = candidate
  } catch {
    nextMoveIn = null
  }
  return {
    earliestMoveIn: earliest,
    reserved,
    nextMoveIn,
    months,
    dateConvention: "checkout-exclusive",
    occupiedToday: reserved.some(
      (p) => p.startDate <= today() && p.endDate > today(),
    ),
  }
}
export async function ensureFree(
  connection,
  propertyId,
  start,
  end,
  excludeId = 0,
) {
  const [[conflict]] = await connection.execute(
    `SELECT DATE_FORMAT(start_date,'%Y-%m-%d') AS startDate,DATE_FORMAT(end_date,'%Y-%m-%d') AS endDate FROM bookings WHERE property_id=? AND id<>? AND ${reservationSQL} AND start_date<? AND end_date>? ORDER BY start_date LIMIT 1 FOR UPDATE`,
    [propertyId, excludeId, end, start],
  )
  if (conflict)
    fail(
      409,
      `Unavailable period: ${conflict.startDate} to ${conflict.endDate} (checkout). Choose a free period.`,
    )
}
