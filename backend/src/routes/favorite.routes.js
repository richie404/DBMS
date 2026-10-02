import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireCsrf from "../middleware/csrf.js"
import requireRole from "../middleware/require-role.js"
import {
  columns,
  serializeProperty,
  visibleProperties,
} from "./property.routes.js"

const router = Router()
router.use(requireAuth)
router.get("/", async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${columns} FROM favorites f JOIN properties p ON p.id=f.property_id WHERE f.user_id=? AND ${visibleProperties} ORDER BY f.created_at DESC,p.id DESC`,
      [request.user.id],
    )
    response.set("Cache-Control", "no-store").json({
      success: true,
      data: { properties: rows.map(serializeProperty) },
    })
  } catch (error) {
    next(error)
  }
})
router.put(
  "/:id",
  requireRole("renter"),
  requireCsrf,
  async (request, response, next) => {
    if (!/^[1-9]\d*$/.test(request.params.id))
      return response
        .status(400)
        .json({ success: false, message: "Invalid property ID" })
    try {
      // Lock the listing until the favorite is saved so visibility cannot change between checks.
      const connection = await pool.getConnection()
      try {
        await connection.beginTransaction()
        const [rows] = await connection.execute(
          `SELECT p.id FROM properties p WHERE p.id=? AND ${visibleProperties} FOR UPDATE`,
          [request.params.id],
        )
        if (!rows.length) {
          await connection.rollback()
          return response
            .status(404)
            .json({
              success: false,
              message: "Property is no longer available",
            })
        }
        await connection.execute(
          "INSERT INTO favorites (user_id,property_id) VALUES (?,?) ON DUPLICATE KEY UPDATE property_id=VALUES(property_id)",
          [request.user.id, request.params.id],
        )
        await connection.commit()
      } catch (error) {
        await connection.rollback()
        throw error
      } finally {
        connection.release()
      }
      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  },
)
router.delete(
  "/:id",
  requireRole("renter"),
  requireCsrf,
  async (request, response, next) => {
    if (!/^[1-9]\d*$/.test(request.params.id))
      return response
        .status(400)
        .json({ success: false, message: "Invalid property ID" })
    try {
      await pool.execute(
        "DELETE FROM favorites WHERE user_id=? AND property_id=?",
        [request.user.id, request.params.id],
      )
      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  },
)
export default router
