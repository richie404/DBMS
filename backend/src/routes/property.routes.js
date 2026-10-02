import { availability } from "../services/availability.service.js"
import { today } from "../services/rental.service.js"
import { Router } from "express"
import pool from "../config/database.js"

const router = Router()
export const visibleProperties =
  "p.moderation_status = 'approved' AND p.is_available = 1 AND p.deleted_at IS NULL"
const types = ["room", "studio", "flat", "apartment", "office", "parking"]
const sorts = {
  newest: "p.created_at DESC, p.id DESC",
  oldest: "p.created_at ASC, p.id ASC",
  rent_asc: "p.monthly_rent IS NULL ASC, p.monthly_rent ASC, p.id ASC",
  rent_desc: "p.monthly_rent IS NULL ASC, p.monthly_rent DESC, p.id DESC",
  size_desc: "p.size_sqft IS NULL ASC, p.size_sqft DESC, p.id DESC",
}
const columns = `p.id,p.owner_id AS ownerId, (SELECT name FROM users WHERE id=p.owner_id) AS ownerName,(SELECT avatar_url FROM users WHERE id=p.owner_id) AS ownerAvatarUrl, p.title, p.description, p.location, p.property_type AS propertyType,
  p.monthly_rent AS monthlyRent, p.currency, p.size_sqft AS sizeSqft, p.bedrooms, p.bathrooms,
  p.furnished, p.bachelor_allowed AS bachelorAllowed, p.family_allowed AS familyAllowed,
  p.deposit_amount AS depositAmount, DATE_FORMAT(p.available_from,'%Y-%m-%d') AS availableFrom, p.created_at AS createdAt,
  (SELECT image_path FROM property_images WHERE property_id = p.id
   ORDER BY is_primary DESC, sort_order ASC, id ASC LIMIT 1) AS primaryImage`

export function serializeProperty(row) {
  return {
    ...row,
    owner: {
      id: row.ownerId,
      name: row.ownerName,
      avatarUrl: row.ownerAvatarUrl,
    },
    monthlyRent: row.monthlyRent == null ? null : Number(row.monthlyRent),
    sizeSqft: row.sizeSqft == null ? null : Number(row.sizeSqft),
    depositAmount: row.depositAmount == null ? null : Number(row.depositAmount),
    furnished: Boolean(row.furnished),
    bachelorAllowed: Boolean(row.bachelorAllowed),
    familyAllowed: Boolean(row.familyAllowed),
  }
}

export function listingQuery(query) {
  const clauses = [visibleProperties]
  const values = []
  const errors = {}
  const text = (key) => {
    if (query[key] == null || query[key] === "") return ""
    if (typeof query[key] !== "string" || query[key].length > 255) {
      errors[key] = "Use at most 255 characters"
      return ""
    }
    return query[key].trim()
  }
  const term = text("search")
  const location = text("location")
  // '=' escapes LIKE wildcards so user input remains a literal substring.
  const like = (value) =>
    `%${value.replace(/[=%_]/g, (character) => `=${character}`)}%`
  if (term) {
    clauses.push(
      "(p.title LIKE ? ESCAPE '=' OR p.location LIKE ? ESCAPE '=' OR p.description LIKE ? ESCAPE '=')",
    )
    values.push(like(term), like(term), like(term))
  }
  if (location) {
    clauses.push("p.location LIKE ? ESCAPE '='")
    values.push(like(location))
  }
  const prices = {}
  for (const [key, operator] of [
    ["minRent", ">="],
    ["maxRent", "<="],
  ]) {
    if (query[key] == null || query[key] === "") continue
    if (
      typeof query[key] !== "string" ||
      !/^\d+(?:\.\d{1,2})?$/.test(query[key]) ||
      Number(query[key]) > 9999999999.99
    )
      errors[key] =
        "Enter a valid non-negative rent with up to two decimal places"
    else {
      prices[key] = Number(query[key])
      clauses.push(`p.monthly_rent ${operator} ?`)
      values.push(prices[key])
    }
  }
  if (
    prices.minRent != null &&
    prices.maxRent != null &&
    prices.minRent > prices.maxRent
  )
    errors.minRent = "Minimum rent cannot exceed maximum rent"
  if (query.type) {
    if (!types.includes(query.type)) errors.type = "Unsupported property type"
    else {
      clauses.push("p.property_type = ?")
      values.push(query.type)
    }
  }
  if (query.bedrooms) {
    if (!["1", "2", "3", "4+"].includes(query.bedrooms))
      errors.bedrooms = "Unsupported bedroom filter"
    else {
      clauses.push(
        query.bedrooms === "4+" ? "p.bedrooms >= ?" : "p.bedrooms = ?",
      )
      values.push(query.bedrooms === "4+" ? 4 : Number(query.bedrooms))
    }
  }
  if (query.furnishing) {
    if (!["furnished", "unfurnished"].includes(query.furnishing))
      errors.furnishing = "Unsupported furnishing filter"
    else {
      clauses.push("p.furnished = ?")
      values.push(query.furnishing === "furnished" ? 1 : 0)
    }
  }
  if (query.eligibility) {
    if (!["bachelor", "family"].includes(query.eligibility))
      errors.eligibility = "Unsupported eligibility filter"
    else
      clauses.push(
        query.eligibility === "bachelor"
          ? "p.bachelor_allowed = 1"
          : "p.family_allowed = 1",
      )
  }
  const sort = query.sort ?? "newest"
  if (typeof sort !== "string" || !Object.hasOwn(sorts, sort))
    errors.sort = "Unsupported sort order"
  const integer = (key, fallback, max) => {
    if (query[key] == null) return fallback
    if (
      typeof query[key] !== "string" ||
      !/^\d+$/.test(query[key]) ||
      Number(query[key]) < 1 ||
      Number(query[key]) > max
    ) {
      errors[key] = `Enter an integer between 1 and ${max}`
      return fallback
    }
    return Number(query[key])
  }
  const page = integer("page", 1, 1000000)
  const limit = integer("limit", 12, 48)
  return {
    errors,
    where: clauses.join(" AND "),
    values,
    order: sorts[sort],
    page,
    limit,
  }
}

router.get("/locations", async (request, response, next) => {
  try {
    const [locations] = await pool.query(
      `SELECT p.location, COUNT(*) AS count FROM properties p WHERE ${visibleProperties} AND p.location IS NOT NULL AND TRIM(p.location) <> '' GROUP BY p.location ORDER BY count DESC, p.location ASC LIMIT 4`,
    )
    response.json({ success: true, data: { locations } })
  } catch (error) {
    next(error)
  }
})

router.get("/", async (request, response, next) => {
  const query = listingQuery(request.query)
  if (Object.keys(query.errors).length) return response.status(400).json({
      success: false,
      message: "Invalid filters",
      errors: query.errors,
    })
  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()
    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) AS total FROM properties p WHERE ${query.where}`,
      query.values,
    )
    const [rows] = await connection.query(
      `SELECT ${columns} FROM properties p WHERE ${query.where} ORDER BY ${query.order} LIMIT ? OFFSET ?`,
      [...query.values, query.limit, (query.page - 1) * query.limit],
    )
    await connection.commit()
    response.set("Cache-Control", "no-store").json({
      success: true,
      data: {
        properties: rows.map(serializeProperty),
        total: Number(total),
        page: query.page,
        limit: query.limit,
        hasMore: query.page * query.limit < total,
      },
    })
  } catch (error) {
    if (connection) await connection.rollback()
    next(error)
  } finally {
    connection?.release()
  }
})

router.get("/:id/availability", async (request, response, next) => {
  try {
    const [[property]] = await pool.execute(
      `SELECT p.id,DATE_FORMAT(p.available_from,"%Y-%m-%d") AS availableFrom FROM properties p WHERE ${visibleProperties} AND p.id=?`,
      [request.params.id],
    )
    if (!property) return response.status(404).json({
        success: false,
        message: "Property is withdrawn or unpublished",
      })
    const months =
      request.query.months == null ? 1 : Number(request.query.months)
    const data = await availability(
      pool,
      property,
      months,
      request.query.from ?? today(),
    )
    response
      .set("Cache-Control", "no-store")
      .json({ success: true, data: { availability: data } })
  } catch (error) {
    if (error.status)
      return response
        .status(error.status)
        .json({ success: false, message: error.message })
    next(error)
  }
})
router.get("/:id", async (request, response, next) => {
  if (!/^[1-9]\d*$/.test(request.params.id))
    return response
      .status(404)
      .json({ success: false, message: "Property not found" })
  try {
    const [rows] = await pool.execute(
      `SELECT ${columns} FROM properties p WHERE ${visibleProperties} AND p.id = ?`,
      [request.params.id],
    )
    if (!rows.length) return response.status(404).json({
        success: false,
        message: "Property not found or no longer available",
      })
    const [images] = await pool.execute(
      "SELECT image_path AS url FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, sort_order ASC, id ASC",
      [request.params.id],
    )
    response.set("Cache-Control", "no-store").json({
      success: true,
      data: {
        property: {
          ...serializeProperty(rows[0]),
          images: images.map((image) => image.url),
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

export { columns }
export default router
