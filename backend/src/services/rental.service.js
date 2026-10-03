import { validDate, addMonths } from "../../../shared/rental-dates.js"
import pool from "../config/database.js"

export class RentalError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
export function fail(status, message) {
  throw new RentalError(status, message)
}
export async function transaction(callback) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
export function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
    fail(400, "Invalid ID")
  return Number(value)
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}
export function quote(property, startDate, endDate, duration) {
  if (duration != null) {
    try {
      const calculatedEnd = addMonths(startDate, Number(duration))
      if (endDate && endDate !== calculatedEnd)
        fail(400, "Checkout date does not match the selected duration")
      endDate = calculatedEnd
    } catch (error) {
      fail(400, error.message)
    }
  }
  if (!validDate(startDate) || !validDate(endDate))
    fail(400, "Enter valid start and end dates")
  if (
    startDate < today() ||
    (property.availableFrom && startDate < property.availableFrom)
  )
    fail(
      400,
      "Start date must be today or later and on or after the property's availability date",
    )
  if (endDate <= startDate) fail(400, "End date must follow start date")
  const start = new Date(startDate)
  const end = new Date(endDate)
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    end.getUTCMonth() -
    start.getUTCMonth()
  let anniversary
  try {
    anniversary = addMonths(startDate, months)
  } catch (error) {
    fail(400, error.message)
  }
  if (months < 1 || endDate !== anniversary)
    fail(
      400,
      "Choose whole calendar months; the end date must be the same day of the month, or the last day when that day does not exist",
    )
  if (property.monthlyRent == null)
    fail(
      409,
      "This property has no monthly rent; booking requests are unavailable",
    )
  const rentCents = Math.round(Number(property.monthlyRent) * 100)
  const depositCents = Math.round(Number(property.depositAmount ?? 0) * 100)
  const totalCents = rentCents * months
  if (!Number.isSafeInteger(totalCents) || totalCents > 99999999999999)
    fail(400, "Rental total exceeds the supported amount")
  return {
    startDate,
    endDate,
    months,
    monthlyRent: rentCents / 100,
    depositAmount: depositCents / 100,
    totalRent: totalCents / 100,
    currency: property.currency,
  }
}
export async function propertyForRenter(
  connection,
  propertyId,
  userId,
  lock = false,
) {
  const [[property]] = await connection.execute(
    `SELECT p.id,p.owner_id AS ownerId,p.title,u.name AS ownerName,u.avatar_url AS ownerAvatarUrl,p.monthly_rent AS monthlyRent,p.deposit_amount AS depositAmount,p.currency,DATE_FORMAT(p.available_from,'%Y-%m-%d') AS availableFrom FROM properties p JOIN users u ON u.id=p.owner_id WHERE p.id=? AND p.moderation_status='approved' AND p.is_available=1 AND p.deleted_at IS NULL AND u.status='active' AND u.deleted_at IS NULL AND u.role='owner' ${
      lock ? "FOR UPDATE" : ""
    }`,
    [id(propertyId)],
  )
  if (!property) fail(404, "Property or owner is no longer available")
  if (property.ownerId === userId)
    fail(403, "You cannot book or contact yourself about your own property")
  return property
}
export async function notify(
  connection,
  {
    userId,
    category,
    title,
    body,
    propertyId = null,
    bookingId = null,
    conversationId = null,
  },
) {
  const column =
    category === "message" ? "message_notifications" : "booking_notifications"
  const [[preference]] = await connection.execute(
    `SELECT ${column} AS enabled FROM user_preferences WHERE user_id=?`,
    [userId],
  )
  if (preference && !preference.enabled) return
  await connection.execute(
    "INSERT INTO notifications (user_id,category,title,body,property_id,booking_id,conversation_id) VALUES (?,?,?,?,?,?,?)",
    [userId, category, title, body, propertyId, bookingId, conversationId],
  )
}
