import { Router } from "express"
import pool from "../config/database.js"
import { requireAuth } from "../middleware/auth.js"
import requireCsrf from "../middleware/csrf.js"
import { clearSessionCookieOptions, sessionConfig } from "../config/session.js"
const router = Router()
router.use(requireAuth)
router.get("/", async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      "SELECT id,device_description AS device,created_at AS createdAt,last_used_at AS lastUsedAt,expires_at AS expiresAt,(id=?) AS current FROM sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP ORDER BY created_at DESC,id DESC",
      [req.auth.sessionId, req.user.id],
    )
    res
      .set("Cache-Control", "no-store")
      .json({
        success: true,
        data: {
          items: items.map((item) => ({
            ...item,
            current: Boolean(item.current),
          })),
        },
      })
  } catch (error) {
    next(error)
  }
})
router.post("/revoke-others", requireCsrf, async (req, res, next) => {
  try {
    await pool.execute(
      "UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND id<>? AND revoked_at IS NULL",
      [req.user.id, req.auth.sessionId],
    )
    res.json({ success: true, data: {} })
  } catch (error) {
    next(error)
  }
})
router.delete("/:id", requireCsrf, async (req, res, next) => {
  try {
    if (
      !/^[1-9]\d*$/.test(req.params.id) ||
      !Number.isSafeInteger(Number(req.params.id))
    )
      return res
        .status(400)
        .json({ success: false, message: "Invalid session ID" })
    const [result] = await pool.execute(
      "UPDATE sessions SET revoked_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND revoked_at IS NULL AND expires_at>CURRENT_TIMESTAMP",
      [req.params.id, req.user.id],
    )
    if (!result.affectedRows)
      return res
        .status(404)
        .json({ success: false, message: "Session not found" })
    const current = Number(req.params.id) === req.auth.sessionId
    if (current)
      res.clearCookie(sessionConfig.cookieName, clearSessionCookieOptions)
    res.json({ success: true, data: { current } })
  } catch (error) {
    next(error)
  }
})
export default router
