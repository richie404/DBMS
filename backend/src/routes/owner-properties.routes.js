import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireRole from "../middleware/require-role.js"
import requireCsrf from "../middleware/csrf.js"
import { columns, serializeProperty } from "./property.routes.js"
import { validDate } from "../../../shared/rental-dates.js"
const router = Router()
router.post(
  "/owner/properties",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  async (req, res, next) => {
    try {
      const body = req.body ?? {}
      const types = ["room", "studio", "flat", "apartment", "office", "parking"]
      const title = typeof body.title === "string" ? body.title.trim() : ""
      const location = typeof body.location === "string" ? body.location.trim() : ""
      const type = body.type
      const monthlyRent = Number(body.monthlyRent)
      const depositAmount = Number(body.depositAmount ?? 0)
      if (!title || title.length > 200 || !location || location.length > 255 || !types.includes(type) || !Number.isFinite(monthlyRent) || monthlyRent <= 0 || !Number.isFinite(depositAmount) || depositAmount < 0)
        return res.status(400).json({ success: false, message: "Enter a title, location, property type, positive monthly rent, and valid deposit." })
      const [result] = await pool.execute(
        "INSERT INTO properties (owner_id,title,location,property_type,monthly_rent,deposit_amount,moderation_status,is_available) VALUES (?,?,?,?,?,?, 'pending', TRUE)",
        [req.user.id, title, location, type, monthlyRent, depositAmount],
      )
      res.status(201).json({ success: true, data: { propertyId: result.insertId } })
    } catch (error) {
      next(error)
    }
  },
)
router.get(
  ["/owner/properties", "/admin/properties"],
  requireAuth,
  requireRole("owner", "admin"),
  async (req, res, next) => {
    try {
      if (req.path.startsWith("/admin") && req.user.role !== "admin")
        return res
          .status(403)
          .json({ success: false, message: "Admin access required" })
      const own = req.path.startsWith("/owner")
      const [rows] = await pool.execute(
        `SELECT ${columns},p.owner_id AS ownerId,p.moderation_status AS moderationStatus,p.is_available AS isAvailable FROM properties p WHERE p.deleted_at IS NULL ${
          own ? "AND p.owner_id=?" : ""
        } ORDER BY p.updated_at DESC,p.id DESC`,
        own ? [req.user.id] : [],
      )
      res.set("Cache-Control", "no-store").json({
        success: true,
        data: { properties: rows.map(serializeProperty) },
      })
    } catch (error) {
      next(error)
    }
  },
)
router.patch(
  "/owner/properties/:id",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  async (req, res, next) => {
    try {
      const body = req.body ?? {},
        keys = Object.keys(body)
      const fields = {
        title: "title",
        description: "description",
        location: "location",
        monthlyRent: "monthly_rent",
        depositAmount: "deposit_amount",
        availableFrom: "available_from",
        isAvailable: "is_available",
      }
      const resubmitting = body.resubmitForReview === true
      if (
        !keys.length ||
        keys.some(
          (key) => !Object.hasOwn(fields, key) && key !== "resubmitForReview",
        )
      )
        return res.status(400).json({
          success: false,
          message:
            "Only listing details and availability can be edited; ownership cannot be changed",
        })
      for (const key of keys.filter((key) => key !== "resubmitForReview")) {
        const value = body[key]
        if (
          ["monthlyRent", "depositAmount"].includes(key) &&
          (!Number.isFinite(value) || value < 0 || value > 9999999999.99)
        )
          return res.status(400).json({
            success: false,
            message: "Enter valid non-negative amounts",
          })
        if (key === "availableFrom" && value !== null && !validDate(value))
          return res.status(400).json({
            success: false,
            message: "Enter a valid earliest available date",
          })
        if (key === "isAvailable" && typeof value !== "boolean")
          return res.status(400).json({
            success: false,
            message: "Availability must be true or false",
          })
        if (
          ["title", "description", "location"].includes(key) &&
          (typeof value !== "string" ||
            value.length >
              (key === "title" ? 200 : key === "location" ? 255 : 10000))
        )
          return res
            .status(400)
            .json({ success: false, message: "Invalid listing text" })
      }
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        const [[owned]] = await connection.execute(
          "SELECT id,moderation_status AS moderationStatus FROM properties WHERE id=? AND owner_id=? AND deleted_at IS NULL FOR UPDATE",
          [req.params.id, req.user.id],
        )
        if (!owned) {
          await connection.rollback()
          return res
            .status(404)
            .json({ success: false, message: "Listing not found" })
        }
        if (resubmitting && !["draft", "rejected"].includes(owned.moderationStatus)) {
          await connection.rollback()
          return res.status(409).json({ success: false, message: "Only draft or rejected listings can be submitted for review" })
        }
        const updateKeys = keys.filter((key) => key !== "resubmitForReview")
        const updates = updateKeys.map((key) => `${fields[key]}=?`)
        const values = updateKeys.map((key) => body[key])
        if (resubmitting) {
          updates.push("moderation_status='pending'", "rejection_reason=NULL", "reviewed_by=NULL", "reviewed_at=NULL")
        }
        await connection.execute(
          `UPDATE properties SET ${updates.join(",")} WHERE id=? AND owner_id=?`,
          [...values, owned.id, req.user.id],
        )
        await connection.commit()
        res.json({ success: true, data: {} })
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
    } catch (error) {
      next(error)
    }
  },
)
router.delete(
  "/owner/properties/:id",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  async (req, res, next) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [[property]] = await connection.execute("SELECT id FROM properties WHERE id=? AND owner_id=? AND deleted_at IS NULL FOR UPDATE", [req.params.id, req.user.id])
      if (!property) { await connection.rollback(); return res.status(404).json({ success: false, message: "Listing not found" }) }
      const [[active]] = await connection.execute("SELECT COUNT(*) AS count FROM bookings WHERE property_id=? AND status IN ('pending','approved','confirmed') AND deleted_at IS NULL", [property.id])
      if (active.count) { await connection.rollback(); return res.status(409).json({ success: false, message: "Resolve active booking requests before archiving this listing." }) }
      await connection.execute("UPDATE properties SET deleted_at=NOW(), is_available=FALSE WHERE id=?", [property.id])
      await connection.commit()
      res.json({ success: true, data: {} })
    } catch (error) { await connection.rollback(); next(error) } finally { connection.release() }
  },
)
export default router
