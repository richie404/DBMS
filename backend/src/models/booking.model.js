import pool from "../config/database.js";

const select = `SELECT b.*, DATE_FORMAT(b.start_date, '%Y-%m-%d') AS start_day, DATE_FORMAT(b.end_date, '%Y-%m-%d') AS end_day,
  p.title AS property_title, p.location AS property_location, p.property_type, p.owner_id,
  (SELECT image_path FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC, sort_order, id LIMIT 1) AS image_url,
  r.name AS renter_name, r.username AS renter_username, o.name AS owner_name
  FROM bookings b JOIN properties p ON p.id = b.property_id JOIN users r ON r.id = b.renter_id JOIN users o ON o.id = p.owner_id`;

export function bookingDto(row) {
  return {id: row.id, code: row.booking_code, startDate: row.start_day, endDate: row.end_day,
    monthlyRent: Number(row.monthly_rent_snapshot), depositAmount: Number(row.deposit_snapshot), totalAmount: Number(row.total_amount), currency: row.currency,
    status: row.status, decisionReason: row.decision_reason, cancellationReason: row.cancellation_reason, createdAt: row.created_at,
    property: {id: row.property_id, title: row.property_title, location: row.property_location, type: row.property_type, image: row.image_url},
    renter: {id: row.renter_id, name: row.renter_name, username: row.renter_username}, owner: {id: row.owner_id, name: row.owner_name}};
}

function scopeCondition(scope, userId) {
  return scope === "admin" ? {sql: "b.deleted_at IS NULL", values: []} : {sql: `b.deleted_at IS NULL AND ${scope === "owner" ? "p.owner_id" : "b.renter_id"} = ?`, values: [userId]};
}

export async function listBookings(scope, userId, filters) {
  const scoped = scopeCondition(scope, userId);
  const where = [scoped.sql], values = [...scoped.values];
  for (const [key, sql] of [["status", "b.status = ?"], ["propertyId", "b.property_id = ?"], ["from", "b.start_date >= ?"], ["to", "b.start_date <= ?"]]) if (filters[key] !== undefined) {where.push(sql); values.push(filters[key]);}
  if (filters.search) {where.push("(p.title LIKE ? OR b.booking_code LIKE ? OR r.name LIKE ? OR o.name LIKE ?)"); values.push(...Array(4).fill(`%${filters.search}%`));}
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM bookings b JOIN properties p ON p.id = b.property_id JOIN users r ON r.id = b.renter_id JOIN users o ON o.id = p.owner_id WHERE ${where.join(" AND ")}`, values);
  const [rows] = await pool.execute(`${select} WHERE ${where.join(" AND ")} ORDER BY b.id DESC LIMIT ${filters.limit} OFFSET ${(filters.page - 1) * filters.limit}`, values);
  const [summaryRows] = await pool.execute(`SELECT b.status, COUNT(*) AS count FROM bookings b JOIN properties p ON p.id = b.property_id WHERE ${scoped.sql} GROUP BY b.status`, scoped.values);
  const summary = Object.fromEntries(summaryRows.map(row => [row.status, row.count]));
  return {items: rows.map(bookingDto), summary, pagination: {page: filters.page, limit: filters.limit, total: count.total, pages: Math.ceil(count.total / filters.limit)}};
}

export async function findBooking(db, bookingId, scope, userId) {
  const scoped = scopeCondition(scope, userId);
  const [rows] = await db.execute(`${select} WHERE b.id = ? AND ${scoped.sql}`, [bookingId, ...scoped.values]);
  if (!rows.length) return null;
  const [events] = await db.execute("SELECT e.id, e.previous_status AS previousStatus, e.new_status AS status, e.reason, e.created_at AS createdAt, u.name AS actorName FROM booking_events e LEFT JOIN users u ON u.id = e.actor_id WHERE e.booking_id = ? ORDER BY e.id", [bookingId]);
  return {...bookingDto(rows[0]), events};
}

export async function bookingEvent(db, bookingId, actorId, previous, next, reason = null) {
  await db.execute("INSERT INTO booking_events (booking_id, actor_id, previous_status, new_status, reason) VALUES (?, ?, ?, ?, ?)", [bookingId, actorId, previous, next, reason]);
}

export async function conflictingBooking(db, propertyId, start, end, excluding = 0) {
  const [rows] = await db.execute("SELECT id FROM bookings WHERE property_id = ? AND id <> ? AND deleted_at IS NULL AND status IN ('approved','confirmed') AND start_date < ? AND end_date > ? LIMIT 1 FOR UPDATE", [propertyId, excluding, end, start]);
  return rows.length > 0;
}
