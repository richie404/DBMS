import { recordActivity } from "../services/activity.service.js"
import pool from "../config/database.js"

export async function updateProfile(request, response, next) {
  const input = request.body ?? {}
  const errors = {}
  const name = typeof input.name === "string" ? input.name.trim() : ""
  const username =
    typeof input.username === "string" ? input.username.trim() : ""
  const email =
    typeof input.email === "string" ? input.email.trim().toLowerCase() : ""
  const phone =
    typeof input.phone === "string" ? input.phone.trim() || null : null
  if (!name || name.length > 150)
    errors.name = "Enter a name of up to 150 characters"
  if (!/^[A-Za-z0-9_]{3,50}$/.test(username))
    errors.username = "Use 3-50 letters, numbers, or underscores"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    errors.email = "Enter a valid email address"
  if (
    (input.phone != null && typeof input.phone !== "string") ||
    (phone && phone.length > 32)
  )
    errors.phone = "Enter a phone number of up to 32 characters"
  const avatarUrl =
    input.avatarUrl === undefined
      ? (request.user.avatarUrl ?? null)
      : typeof input.avatarUrl === "string"
        ? input.avatarUrl.trim() || null
        : null
  if (
    input.avatarUrl !== undefined &&
    (typeof input.avatarUrl !== "string" ||
      (avatarUrl &&
        (!/^https?:\/\//.test(avatarUrl) || avatarUrl.length > 2048)))
  )
    errors.avatarUrl = "Enter an HTTP(S) avatar URL"
  if (Object.keys(errors).length)
    return response
      .status(400)
      .json({ success: false, message: "Validation failed", errors })
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    await connection.execute(
      "UPDATE users SET name = ?, username = ?, email = ?, phone = ?, avatar_url = ? WHERE id = ?",
      [name, username, email, phone, avatarUrl, request.user.id],
    )
    await recordActivity(
      connection,
      request.user.id,
      "profile.updated",
      "user",
      request.user.id,
      "Account profile updated",
    )
    await connection.commit()
    return response.json({
      success: true,
      data: {
        user: { ...request.user, name, username, email, phone, avatarUrl },
      },
    })
  } catch (error) {
    await connection.rollback()
    if (error.code === "ER_DUP_ENTRY")
      return response
        .status(409)
        .json({
          success: false,
          message: "Email or username is already in use",
        })
    return next(error)
  } finally {
    connection.release()
  }
}
