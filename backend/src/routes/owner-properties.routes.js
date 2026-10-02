import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireRole from "../middleware/require-role.js"
import requireCsrf from "../middleware/csrf.js"
import { columns, serializeProperty } from "./property.routes.js"
import { validDate } from "../../../shared/rental-dates.js"
const router = Router()
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
      if (!keys.length || keys.some((key) => !Object.hasOwn(fields, key)))
        return res.status(400).json({
          success: false,
          message:
            "Only listing details and availability can be edited; ownership cannot be changed",
        })
      for (const key of keys) {
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
          "SELECT id FROM properties WHERE id=? AND owner_id=? AND deleted_at IS NULL FOR UPDATE",
          [req.params.id, req.user.id],
        )
        if (!owned) {
          await connection.rollback()
          return res
            .status(404)
            .json({ success: false, message: "Listing not found" })
        }
        await connection.execute(
          `UPDATE properties SET ${keys.map((key) => `${fields[key]}=?`).join(",")} WHERE id=? AND owner_id=?`,
          [...keys.map((key) => body[key]), owned.id, req.user.id],
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
export default router
