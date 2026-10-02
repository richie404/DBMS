import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireRole from "../middleware/require-role.js"
import requireCsrf from "../middleware/csrf.js"
import { assert } from "../utils/api-error.js"
import { today } from "../services/rental.service.js"
import { bookingFilter } from "../services/booking-filters.js"
import { id, text, date } from "../validators/rental.validator.js"

const router = Router()
const route = (fn) => async (req, res, next) => {
  try {
    res.json({ success: true, data: await fn(req) })
  } catch (e) {
    next(e)
  }
}
const rows = async (sql, values = []) => (await pool.execute(sql, values))[0]
async function transaction(fn) {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()
    const result = await fn(db)
    await db.commit()
    return result
  } catch (e) {
    await db.rollback()
    throw e
  } finally {
    db.release()
  }
}
const audit = (db, req, action, type, target, description) =>
  db.execute(
    "INSERT INTO activity_logs (actor_id,action,target_type,target_id,description) VALUES (?,?,?,?,?)",
    [req.user.id, action, type, target, description],
  )
const notify = (db, user, category, title, body, refs = {}) =>
  db.execute(
    "INSERT INTO notifications (user_id,category,title,body,property_id,booking_id,conversation_id) VALUES (?,?,?,?,?,?,?)",
    [
      user,
      category,
      title,
      body,
      refs.propertyId ?? null,
      refs.bookingId ?? null,
      refs.conversationId ?? null,
    ],
  )
const personColumns =
  "u.id,u.name,u.username,u.email,u.phone,u.role,u.status,u.avatar_url AS avatarUrl,u.created_at AS createdAt"
const preferenceColumns = [
  "booking_notifications",
  "message_notifications",
  "favorite_notifications",
  "marketing_notifications",
  "security_alert_notifications",
  "moderation_queue_notifications",
  "payment_incident_notifications",
  "system_health_notifications",
  "scheduled_report_notifications",
]
router.use(requireAuth)
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store")
  next()
})
router.get(
  "/account",
  route(async (req) => {
    const [user] = await rows(
      `SELECT ${personColumns},(SELECT COUNT(*) FROM properties WHERE owner_id=u.id AND deleted_at IS NULL) AS propertyCount FROM users u WHERE u.id=?`,
      [req.user.id],
    )
    const [preferences] = await rows(
      "SELECT * FROM user_preferences WHERE user_id=?",
      [req.user.id],
    )
    return { user, preferences }
  }),
)
router.patch(
  "/account",
  requireCsrf,
  route(async (req) => {
    const body = req.body
    assert(
      body &&
        Object.keys(body).every((k) =>
          ["name", "username", "email", "phone", "avatarUrl"].includes(k),
        ),
      400,
      "Invalid profile fields",
    )
    const fields = {}
    if (body.name !== undefined) fields.name = text(body.name, "name", 150)
    if (body.username !== undefined) {
      fields.username = text(body.username, "username", 50)
      assert(/^[a-zA-Z0-9_]+$/.test(fields.username), 400, "Invalid username")
    }
    if (body.email !== undefined) {
      fields.email = text(body.email, "email", 254).toLowerCase()
      assert(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email),
        400,
        "Invalid email",
      )
    }
    if (body.phone !== undefined)
      fields.phone = text(body.phone, "phone", 32, true)
    if (body.avatarUrl !== undefined) {
      fields.avatar_url = text(body.avatarUrl, "avatar URL", 2048, true)
      assert(
        !fields.avatar_url || /^https?:\/\//.test(fields.avatar_url),
        400,
        "Avatar must be an HTTP(S) URL",
      )
    }
    assert(Object.keys(fields).length, 400, "No profile changes supplied")
    try {
      await transaction(async (db) => {
        await db.execute(
          `UPDATE users SET ${Object.keys(fields)
            .map((k) => `${k}=?`)
            .join(",")} WHERE id=?`,
          [...Object.values(fields), req.user.id],
        )
        await audit(
          db,
          req,
          "profile.updated",
          "user",
          req.user.id,
          "Account profile updated",
        )
      })
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        assert(false, 409, "Email or username already exists")
      }
      throw e
    }
    const [user] = await rows(
      `SELECT ${personColumns} FROM users u WHERE id=?`,
      [req.user.id],
    )
    return { user }
  }),
)
router.patch(
  "/account/preferences",
  requireCsrf,
  route(async (req) => {
    assert(
      req.body &&
        Object.keys(req.body).length &&
        Object.keys(req.body).every((k) => preferenceColumns.includes(k)),
      400,
      "Invalid preferences",
    )
    assert(
      Object.values(req.body).every((v) => typeof v === "boolean"),
      400,
      "Preferences must be boolean",
    )
    const [result] = await pool.execute(
      `UPDATE user_preferences SET ${Object.keys(req.body)
        .map((k) => `${k}=?`)
        .join(",")} WHERE user_id=?`,
      [...Object.values(req.body), req.user.id],
    )
    assert(result.affectedRows, 404, "Preferences record not found")
    return {
      preferences: (
        await rows("SELECT * FROM user_preferences WHERE user_id=?", [
          req.user.id,
        ])
      )[0],
    }
  }),
)
const paymentSql = `SELECT x.id,x.reference_code AS reference,x.booking_id AS bookingId,x.record_type AS recordType,x.amount,x.currency,x.status,x.transaction_at AS transactionAt,x.created_at AS createdAt,x.notes,p.id AS propertyId,p.title,p.location,
 (SELECT image_path FROM property_images WHERE property_id=p.id ORDER BY is_primary DESC,sort_order,id LIMIT 1) AS image,
 payer.name AS payerName,payer.role AS payerRole,payee.name AS payeeName FROM payments x LEFT JOIN bookings b ON b.id=x.booking_id LEFT JOIN properties p ON p.id=b.property_id LEFT JOIN users payer ON payer.id=x.payer_id LEFT JOIN users payee ON payee.id=x.payee_id`
router.get(
  "/admin/payments",
  requireRole("admin"),
  route(async () => ({
    items: await rows(
      `${paymentSql} ORDER BY COALESCE(x.transaction_at,x.created_at) DESC,x.id DESC`,
    ),
  })),
)
router.get(
  "/admin/users",
  requireRole("admin"),
  route(async () => ({
    items: await rows(
      `SELECT ${personColumns},(SELECT COUNT(*) FROM properties WHERE owner_id=u.id AND deleted_at IS NULL) AS properties,(SELECT COUNT(*) FROM bookings WHERE renter_id=u.id AND deleted_at IS NULL) AS bookings,(SELECT COUNT(*) FROM messages WHERE sender_id=u.id) AS messages FROM users u WHERE deleted_at IS NULL ORDER BY created_at DESC,id DESC`,
    ),
  })),
)
router.patch(
  "/admin/users/:id/status",
  requireRole("admin"),
  requireCsrf,
  route((req) =>
    transaction(async (db) => {
      const target = id(req.params.id),
        status = req.body?.status
      assert(
        ["active", "suspended", "banned"].includes(status),
        400,
        "Invalid status",
      )
      assert(target !== req.user.id, 400, "Cannot restrict your own account")
      const [found] = await db.execute(
        "SELECT role,status FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE",
        [target],
      )
      assert(found.length, 404, "User not found")
      assert(
        found[0].role !== "admin",
        403,
        "Administrator access cannot be restricted here",
      )
      await db.execute("UPDATE users SET status=? WHERE id=?", [status, target])
      if (status !== "active")
        await db.execute(
          "UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND revoked_at IS NULL",
          [target],
        )
      await audit(
        db,
        req,
        "user." + status,
        "user",
        target,
        typeof req.body.reason === "string"
          ? req.body.reason.slice(0, 1000)
          : `Account status changed to ${status}`,
      )
      return {}
    }),
  ),
)
router.get(
  "/admin/activity",
  requireRole("admin"),
  route(async () => ({
    items: await rows(
      "SELECT l.id,l.action,l.target_type AS targetType,l.target_id AS targetId,l.outcome,l.description,l.source_ip AS sourceIp,l.created_at AS createdAt,u.name AS actorName,u.role AS actorRole FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_id ORDER BY l.created_at DESC,l.id DESC",
    ),
    timezone: (await applicationClock()).timezone,
  })),
)
async function applicationClock() {
  const [[setting]] = await pool.query(
    "SELECT timezone,currency FROM platform_settings WHERE id=1",
  )
  assert(setting, 503, "Platform settings are not initialized")
  const timezone = setting.timezone
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  }).formatToParts(new Date())
  const offset =
    parts.find((p) => p.type === "timeZoneName").value.replace("GMT", "") ||
    "+00:00"
  // DATETIME storage follows the configured database wall-clock offset, independently of the presentation timezone.
  return {
    timezone,
    currency: setting.currency,
    day,
    offset,
    storageOffset: process.env.DB_TIMEZONE || "+06:00",
  }
}
const activitySelect =
  "SELECT l.id,l.action,l.target_type AS targetType,l.target_id AS targetId,l.outcome,l.description,l.source_ip AS sourceIp,l.created_at AS createdAt,u.name AS actorName,u.role AS actorRole FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_id"
router.get(
  "/admin/overview",
  requireRole("admin"),
  route(async () => {
    const clock = await applicationClock()
    const active = bookingFilter("active", today())
    const [[counts]] = await pool.execute(
      `SELECT
 (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS users,
 (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role='renter') AS renters,
 (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role='owner') AS owners,
 (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role='admin') AS admins,
 (SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL) AS listings,
 (SELECT COUNT(*) FROM properties WHERE moderation_status='pending' AND deleted_at IS NULL) AS pendingListings,
 (SELECT COUNT(*) FROM bookings b WHERE b.deleted_at IS NULL AND ${active.sql}) AS activeBookings,
 (SELECT COUNT(*) FROM activity_logs WHERE DATE(CONVERT_TZ(created_at,?,?))=?) AS activityToday`,
      [...active.values, clock.storageOffset, clock.offset, clock.day],
    )
    const items = await rows(
      activitySelect + " ORDER BY l.created_at DESC,l.id DESC LIMIT 6",
    )
    const hourlyRows = await rows(
      "SELECT HOUR(CONVERT_TZ(created_at,?,?)) AS hour,COUNT(*) AS count FROM activity_logs WHERE DATE(CONVERT_TZ(created_at,?,?))=? GROUP BY hour",
      [
        clock.storageOffset,
        clock.offset,
        clock.storageOffset,
        clock.offset,
        clock.day,
      ],
    )
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Number(hourlyRows.find((r) => r.hour === hour)?.count || 0),
    }))
    return {
      counts,
      items,
      hourly,
      timezone: clock.timezone,
      day: clock.day,
      policy:
        "Non-deleted users (all statuses), non-deleted listings (all moderation states); active bookings are approved/confirmed with an end date after today. Activity includes recorded events only.",
    }
  }),
)
router.get(
  "/admin/analytics",
  requireRole("admin"),
  route(async (req) => {
    const range = req.query.range ?? "This Month"
    assert(
      ["Today", "This Week", "This Month", "This Year"].includes(range),
      400,
      "Invalid range",
    )
    const clock = await applicationClock()
    let start = clock.day
    if (range === "This Week") {
      const d = new Date(start + "T00:00:00Z")
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
      start = d.toISOString().slice(0, 10)
    }
    if (range === "This Month") start = clock.day.slice(0, 7) + "-01"
    if (range === "This Year") start = clock.day.slice(0, 4) + "-01-01"
    const buckets = []
    for (
      let d = new Date(start + "T00:00:00Z");
      d.toISOString().slice(0, 10) <= clock.day;
      d.setUTCDate(d.getUTCDate() + 1)
    )
      buckets.push(d.toISOString().slice(0, 10))
    const series = {}
    for (const [key, table, column, extra] of [
      ["users", "users", "created_at", " AND deleted_at IS NULL"],
      ["listings", "properties", "created_at", " AND deleted_at IS NULL"],
      ["bookings", "bookings", "created_at", " AND deleted_at IS NULL"],
      [
        "revenue",
        "payments",
        "COALESCE(transaction_at,created_at)",
        " AND status='completed' AND record_type='charge' AND currency=?",
      ],
    ]) {
      const grouped = await rows(
        `SELECT DATE_FORMAT(CONVERT_TZ(${column},?,?),'%Y-%m-%d') AS day,${
          key === "revenue" ? "SUM(amount)" : "COUNT(*)"
        } AS value FROM ${table} WHERE DATE(CONVERT_TZ(${column},?,?)) BETWEEN ? AND ?${extra} GROUP BY day ORDER BY day`,
        [
          clock.storageOffset,
          clock.offset,
          clock.storageOffset,
          clock.offset,
          start,
          clock.day,
          ...(key === "revenue" ? [clock.currency] : []),
        ],
      )
      series[key] = buckets.map((day) => ({
        day,
        value: Number(grouped.find((r) => r.day === day)?.value || 0),
      }))
    }
    return {
      series,
      start,
      end: clock.day,
      timezone: clock.timezone,
      currency: clock.currency,
    }
  }),
)
router.get(
  "/admin/settings",
  requireRole("admin"),
  route(async () => ({
    settings:
      (
        await rows(
          "SELECT platform_name AS platformName,support_email AS supportEmail,currency,timezone,review_target_hours AS reviewTargetHours,session_timeout_minutes AS sessionTimeoutMinutes,maintenance_mode AS maintenanceMode FROM platform_settings WHERE id=1",
        )
      )[0] ?? null,
  })),
)
router.patch(
  "/admin/settings",
  requireRole("admin"),
  requireCsrf,
  route((req) =>
    transaction(async (db) => {
      const map = {
        platformName: "platform_name",
        supportEmail: "support_email",
        currency: "currency",
        timezone: "timezone",
        reviewTargetHours: "review_target_hours",
        sessionTimeoutMinutes: "session_timeout_minutes",
        maintenanceMode: "maintenance_mode",
      }
      assert(
        req.body &&
          Object.keys(req.body).length &&
          Object.keys(req.body).every((k) => Object.hasOwn(map, k)),
        400,
        "Invalid settings",
      )
      const fields = {}
      for (const [key, value] of Object.entries(req.body)) {
        if (key === "maintenanceMode") {
          assert(typeof value === "boolean", 400, "Invalid maintenance setting")
          fields[map[key]] = value
        } else if (
          ["reviewTargetHours", "sessionTimeoutMinutes"].includes(key)
        ) {
          assert(
            Number.isInteger(value) && value > 0 && value <= 65535,
            400,
            "Invalid duration",
          )
          fields[map[key]] = value
        } else {
          fields[map[key]] = text(
            value,
            key,
            key === "supportEmail" ? 254 : 100,
            key === "supportEmail",
          )
          if (key === "currency")
            assert(/^[A-Z]{3}$/.test(value), 400, "Invalid currency")
          if (key === "timezone") {
            try {
              new Intl.DateTimeFormat("en", { timeZone: value })
            } catch {
              assert(false, 400, "Invalid timezone")
            }
          }
        }
      }
      const [r] = await db.execute(
        `UPDATE platform_settings SET ${Object.keys(fields)
          .map((k) => `${k}=?`)
          .join(",")},updated_by=? WHERE id=1`,
        [...Object.values(fields), req.user.id],
      )
      assert(r.affectedRows, 404, "Platform settings have not been initialized")
      await audit(
        db,
        req,
        "platform.settings.updated",
        "settings",
        1,
        "Platform configuration updated",
      )
      return {}
    }),
  ),
)
export default router
