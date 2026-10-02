import {randomUUID} from "node:crypto";
import pool from "../config/database.js";
import {assert} from "../utils/api-error.js";
import {date, id, text} from "../validators/rental.validator.js";
import {lockProperty} from "../models/property.model.js";
import {bookingEvent, conflictingBooking, findBooking} from "../models/booking.model.js";

export async function bookingDetails(bookingId, scope, userId) {
  const booking = await findBooking(pool, bookingId, scope, userId);
  assert(booking, 404, "Booking not found");
  return booking;
}

export async function createBooking(renterId, body) {
  assert(body && Object.keys(body).every(key => ["propertyId", "startDate", "endDate"].includes(key)), 400, "Invalid booking fields");
  const propertyId = id(body.propertyId), start = date(body.startDate, "start date"), end = date(body.endDate, "end date");
  assert(end > start, 400, "End date must be after start date");
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  assert(days <= 3660, 400, "Rental period must not exceed ten years");
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const property = await lockProperty(db, propertyId);
    assert(property && !property.deleted_at, 404, "Property not found");
    assert(property.owner_id !== renterId, 400, "You cannot book your own property");
    const [[clock]] = await db.query("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today");
    assert(start >= clock.today, 400, "Start date must not be in the past");
    const [owners] = await db.execute("SELECT id FROM users WHERE id = ? AND status = 'active' AND deleted_at IS NULL", [property.owner_id]);
    assert(property.moderation_status === "approved" && property.is_available && owners.length && (!property.available_date || start >= property.available_date), 409, "Property is unavailable for these dates");
    assert(property.monthly_rent !== null && Number(property.monthly_rent) > 0, 409, "Property rent is not configured");
    assert(!await conflictingBooking(db, propertyId, start, end), 409, "Property already has a booking for these dates");
    const rentCents = Math.round(Number(property.monthly_rent) * 100);
    const depositCents = Math.round(Number(property.deposit_amount ?? 0) * 100);
    // Daily prorating uses a 30-day rental month; the end date is exclusive.
    const totalCents = Math.round(rentCents * days / 30) + depositCents;
    assert(Number.isSafeInteger(totalCents) && totalCents <= 99999999999999, 400, "Booking amount is too large");
    const [result] = await db.execute("INSERT INTO bookings (booking_code, property_id, renter_id, start_date, end_date, monthly_rent_snapshot, deposit_snapshot, total_amount, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [`RN-${randomUUID()}`, propertyId, renterId, start, end, property.monthly_rent, property.deposit_amount ?? 0, (totalCents / 100).toFixed(2), property.currency]);
    await bookingEvent(db, result.insertId, renterId, null, "pending");
    const booking = await findBooking(db, result.insertId, "renter", renterId);
    await db.commit();
    return booking;
  } catch (error) {await db.rollback(); throw error;}
  finally {db.release();}
}

export async function changeBooking(user, bookingId, action, body = {}) {
  assert(body && Object.keys(body).every(key => key === "reason"), 400, "Invalid booking action fields");
  const reason = body.reason === undefined || body.reason === "" ? null : text(body.reason, "reason", 2000);
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    // Lock in property -> booking order, shared by creation and approval.
    const [references] = await db.execute("SELECT property_id FROM bookings WHERE id = ? AND deleted_at IS NULL", [bookingId]);
    assert(references.length, 404, "Booking not found");
    const property = await lockProperty(db, references[0].property_id);
    const [rows] = await db.execute("SELECT *, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_day, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_day FROM bookings WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [bookingId]);
    const booking = rows[0];
    const scope = user.role === "owner" ? "owner" : "renter";
    assert(booking && (scope === "owner" ? property.owner_id === user.id : booking.renter_id === user.id), 404, "Booking not found");
    const next = action === "cancel" ? "cancelled" : action === "approve" ? "approved" : "rejected";
    if (action === "cancel") {
      assert(["pending", "approved", "confirmed"].includes(booking.status), 409, "This booking cannot be cancelled");
      const [[clock]] = await db.query("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today");
      assert(booking.start_day >= clock.today, 409, "A rental that has started cannot be cancelled here");
      await db.execute("UPDATE bookings SET status = 'cancelled', cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ? WHERE id = ?", [user.id, reason, bookingId]);
    } else {
      assert(user.role === "owner" && property.owner_id === user.id, 403, "Only the property owner can decide this booking");
      assert(booking.status === "pending", 409, "Only pending bookings can be approved or rejected");
      if (action === "approve") {
        const [[clock]] = await db.query("SELECT DATE_FORMAT(CURRENT_DATE, '%Y-%m-%d') AS today");
        assert(!property.deleted_at && property.moderation_status === "approved" && property.is_available && booking.start_day >= clock.today && (!property.available_date || booking.start_day >= property.available_date), 409, "Property is unavailable for this booking");
        assert(!await conflictingBooking(db, property.id, booking.start_day, booking.end_day, bookingId), 409, "Another approved booking overlaps these dates");
      }
      await db.execute("UPDATE bookings SET status = ?, decision_by = ?, decision_at = CURRENT_TIMESTAMP, decision_reason = ? WHERE id = ?", [next, user.id, reason, bookingId]);
    }
    await bookingEvent(db, bookingId, user.id, booking.status, next, reason);
    const result = await findBooking(db, bookingId, scope, user.id);
    await db.commit();
    return result;
  } catch (error) {await db.rollback(); throw error;}
  finally {db.release();}
}
