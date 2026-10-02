import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireRole from "../middleware/require-role.js"
import requireCsrf from "../middleware/csrf.js"
import { columns, serializeProperty } from "./property.routes.js"
import { propertyInput, id } from "../validators/rental.validator.js"
import {
  saveProperty,
  archiveProperty,
  propertyDetails,
  moderateProperty,
} from "../services/property.service.js"
import { bookingFilter } from "../services/booking-filters.js"
import { today } from "../services/rental.service.js"
import { availability } from "../services/availability.service.js"
const router = Router()
const run = (fn) => async (req, res, next) => {
  try {
    res
      .set("Cache-Control", "no-store")
      .json({ success: true, data: await fn(req) })
  } catch (e) {
    if (e.status && e.status < 500)
      res.status(e.status).json({ success: false, message: e.message })
    else next(e)
  }
}
router.get(
  "/admin/properties",
  requireAuth,
  requireRole("admin"),
  run(async () => {
    const [rows] = await pool.execute(
      `SELECT ${columns},p.moderation_status AS moderationStatus,p.is_available AS isAvailable FROM properties p WHERE p.deleted_at IS NULL ORDER BY p.updated_at DESC,p.id DESC`,
    )
    return { properties: rows.map(serializeProperty) }
  }),
)
router.get("/admin/properties/:id",requireAuth,requireRole("admin"),run(async req=>({property:await propertyDetails(id(req.params.id),"admin",req.user.id)})));
router.get("/admin/properties/:id/availability",requireAuth,requireRole("admin"),run(async req=>({availability:await availability(pool,await propertyDetails(id(req.params.id),"admin",req.user.id),Number(req.query.months||1),req.query.from||today())})));
router.patch("/admin/properties/:id/moderation",requireAuth,requireRole("admin"),requireCsrf,run(async req=>({property:await moderateProperty(req.user.id,id(req.params.id),req.body)})));
router.use("/owner", requireAuth, requireRole("owner"))
router.get(
  "/owner/properties",
  run(async (req) => {
    const [rows] = await pool.execute(
      `SELECT ${columns},p.moderation_status AS moderationStatus,p.is_available AS isAvailable,p.rejection_reason AS rejectionReason,EXISTS(SELECT 1 FROM bookings b WHERE b.property_id=p.id AND b.deleted_at IS NULL AND b.status IN ('approved','confirmed') AND b.start_date<=? AND b.end_date>?) AS occupiedToday FROM properties p WHERE p.owner_id=? AND p.deleted_at IS NULL ORDER BY p.updated_at DESC,p.id DESC`,
      [today(), today(), req.user.id],
    )
    return { properties: rows.map(serializeProperty) }
  }),
)
router.get(
  "/owner/properties/:id/availability",
  run(async (req) => {
    const property = await propertyDetails(
      id(req.params.id),
      "owner",
      req.user.id,
    )
    return {
      availability: await availability(
        pool,
        property,
        Number(req.query.months || 1),
        req.query.from || today(),
      ),
    }
  }),
)
router.get(
  "/owner/properties/:id",
  run(async (req) => ({
    property: await propertyDetails(id(req.params.id), "owner", req.user.id),
  })),
)
router.post(
  "/owner/properties",
  requireCsrf,
  run(async (req) => ({
    property: await saveProperty(
      req.user.id,
      null,
      propertyInput(req.body, true),
    ),
  })),
)
router.patch(
  "/owner/properties/:id",
  requireCsrf,
  run(async (req) => {
    const body = { ...req.body }
    if (Object.hasOwn(body, "isAvailable")) {
      body.available = body.isAvailable
      delete body.isAvailable
    }
    return {
      property: await saveProperty(
        req.user.id,
        id(req.params.id),
        propertyInput(body),
      ),
    }
  }),
)
router.delete(
  "/owner/properties/:id",
  requireCsrf,
  run(async (req) => {
    await archiveProperty(req.user.id, id(req.params.id))
    return {}
  }),
)
router.get(
  "/owner/summary",
  run(async (req) => {
    const active = bookingFilter("active", today()),
      pending = bookingFilter("pending", today())
    const [[counts]] = await pool.execute(
      `SELECT
(SELECT COUNT(*) FROM properties WHERE owner_id=? AND deleted_at IS NULL) AS totalProperties,
(SELECT COUNT(*) FROM properties p WHERE owner_id=? AND deleted_at IS NULL AND moderation_status='approved' AND is_available=1) AS availableProperties,
(SELECT COUNT(*) FROM bookings b JOIN properties p ON p.id=b.property_id WHERE p.owner_id=? AND b.deleted_at IS NULL AND ${pending.sql}) AS pendingRequests,
(SELECT COUNT(*) FROM bookings b JOIN properties p ON p.id=b.property_id WHERE p.owner_id=? AND b.deleted_at IS NULL AND ${active.sql}) AS activeBookings,
(SELECT COUNT(*) FROM messages m JOIN conversations c ON c.id=m.conversation_id WHERE c.owner_id=? AND m.sender_id<>? AND m.read_at IS NULL) AS unreadMessages`,
      [
        req.user.id,
        req.user.id,
        req.user.id,
        ...pending.values,
        req.user.id,
        ...active.values,
        req.user.id,
        req.user.id,
      ],
    )
    const [payments] = await pool.execute(
      "SELECT currency,SUM(amount) AS amount FROM payments WHERE payee_id=? AND record_type='payout' AND status='completed' GROUP BY currency",
      [req.user.id],
    )
    return { counts, payments }
  }),
)
router.get(
  "/owner/payments",
  run(async (req) => {
    const [items] = await pool.execute(
      `SELECT x.id,x.reference_code AS reference,x.record_type AS recordType,x.amount,x.currency,x.status,x.transaction_at AS transactionAt,x.booking_id AS bookingId,p.title FROM payments x LEFT JOIN bookings b ON b.id=x.booking_id LEFT JOIN properties p ON p.id=b.property_id WHERE x.payee_id=? ORDER BY x.created_at DESC,x.id DESC`,
      [req.user.id],
    )
    return { items }
  }),
)
router.get(
  "/owner/amenities",
  run(async () => {
    const [items] = await pool.execute(
      "SELECT id,display_name AS name FROM amenities ORDER BY display_name",
    )
    return { items }
  }),
)
router.get(
  "/owner/preferences",
  run(async (req) => {
    const [[preferences]] = await pool.execute(
      "SELECT booking_notifications,message_notifications,favorite_notifications,marketing_notifications FROM user_preferences WHERE user_id=?",
      [req.user.id],
    )
    return { preferences }
  }),
)
router.patch(
  "/owner/preferences",
  requireCsrf,
  run(async (req) => {
    const keys = Object.keys(req.body || {})
    if (
      !keys.length ||
      keys.some(
        (k) =>
          ![
            "booking_notifications",
            "message_notifications",
            "favorite_notifications",
            "marketing_notifications",
          ].includes(k),
      ) ||
      Object.values(req.body).some((v) => typeof v !== "boolean")
    ) {
      const e = new Error("Invalid notification preferences")
      e.status = 400
      throw e
    }
    await pool.execute(
      `UPDATE user_preferences SET ${keys.map((k) => k + "=?").join(",")} WHERE user_id=?`,
      [...Object.values(req.body), req.user.id],
    )
    return {}
  }),
)
export default router
