import pool from "../config/database.js";

export const propertySelect = `SELECT p.*, DATE_FORMAT(p.available_from, '%Y-%m-%d') AS available_date,
  o.name AS owner_name, o.username AS owner_username, o.avatar_url AS owner_avatar
  FROM properties p INNER JOIN users o ON o.id = p.owner_id`;
export const publicCondition = "p.deleted_at IS NULL AND p.moderation_status = 'approved' AND p.is_available = 1 AND o.deleted_at IS NULL AND o.status = 'active'";

export function propertyDto(row, privateView = false) {
  return {
    id: row.id, title: row.title, description: row.description, location: row.location,
    type: row.property_type, monthlyRent: row.monthly_rent === null ? null : Number(row.monthly_rent),
    depositAmount: row.deposit_amount === null ? null : Number(row.deposit_amount), currency: row.currency,
    sizeSqft: row.size_sqft === null ? null : Number(row.size_sqft), bedrooms: row.bedrooms, bathrooms: row.bathrooms,
    furnished: Boolean(row.furnished), bachelorAllowed: Boolean(row.bachelor_allowed), familyAllowed: Boolean(row.family_allowed),
    moderationStatus: row.moderation_status, available: Boolean(row.is_available), availableFrom: row.available_date,
    archived: row.deleted_at !== null, createdAt: row.created_at, updatedAt: row.updated_at,
    owner: { id: row.owner_id, name: row.owner_name, username: row.owner_username, avatarUrl: row.owner_avatar },
    ...(privateView ? { rejectionReason: row.rejection_reason, reviewedAt: row.reviewed_at } : {}),
    images: [], amenities: [],
  };
}

export async function attachPropertyMedia(properties, db = pool) {
  if (!properties.length) return properties;
  const ids = [...new Set(properties.map(p => p.id))];
  const placeholders = ids.map(() => "?").join(",");
  const [images] = await db.execute(`SELECT id, property_id, image_path, sort_order, is_primary FROM property_images WHERE property_id IN (${placeholders}) ORDER BY is_primary DESC, sort_order, id`, ids);
  const [amenities] = await db.execute(`SELECT pa.property_id, a.id, a.code, a.display_name FROM property_amenities pa JOIN amenities a ON a.id = pa.amenity_id WHERE pa.property_id IN (${placeholders}) ORDER BY a.display_name`, ids);
  for (const property of properties) {
    property.images = images.filter(i => i.property_id === property.id).map(i => ({id: i.id, url: i.image_path, primary: Boolean(i.is_primary), sortOrder: i.sort_order}));
    property.amenities = amenities.filter(a => a.property_id === property.id).map(a => ({id: a.id, code: a.code, name: a.display_name}));
  }
  return properties;
}

function whereClause(scope, userId, filters) {
  const where = [scope === "public" ? publicCondition : "p.deleted_at IS NULL"];
  const values = [];
  if (scope === "owner") { where.push("p.owner_id = ?"); values.push(userId); }
  if (filters.search) { where.push("(p.title LIKE ? OR p.location LIKE ? OR p.description LIKE ?)"); values.push(...Array(3).fill(`%${filters.search}%`)); }
  if (filters.location) { where.push("p.location LIKE ?"); values.push(`%${filters.location}%`); }
  if (filters.createdAfter) {where.push("p.created_at >= ?"); values.push(filters.createdAfter);}
  for (const [key, condition] of [["type", "p.property_type = ?"], ["minPrice", "p.monthly_rent >= ?"], ["maxPrice", "p.monthly_rent <= ?"], ["bedrooms", "p.bedrooms >= ?"], ["status", "p.moderation_status = ?"]]) {
    if (filters[key] !== undefined) { where.push(condition); values.push(filters[key]); }
  }
  if (filters.availability === "available") where.push("p.is_available = 1");
  if (filters.availability === "unavailable") where.push("p.is_available = 0");
  if (filters.availability === "now") where.push("p.is_available = 1 AND (p.available_from IS NULL OR p.available_from <= CURRENT_DATE)");
  if (filters.availability === "future") where.push("p.is_available = 1 AND p.available_from > CURRENT_DATE");
  return { where: where.join(" AND "), values };
}

export async function listProperties(scope, userId, filters, db = pool) {
  const {where, values} = whereClause(scope, userId, filters);
  const order = filters.sort === "price_asc" ? "p.monthly_rent ASC, p.id DESC" : filters.sort === "price_desc" ? "p.monthly_rent DESC, p.id DESC" : "p.id DESC";
  const [[count]] = await db.execute(`SELECT COUNT(*) AS total FROM properties p JOIN users o ON o.id = p.owner_id WHERE ${where}`, values);
  const [rows] = await db.execute(`${propertySelect} WHERE ${where} ORDER BY ${order} LIMIT ${filters.limit} OFFSET ${(filters.page - 1) * filters.limit}`, values);
  return {items: await attachPropertyMedia(rows.map(row => propertyDto(row, scope !== "public")), db), pagination: {page: filters.page, limit: filters.limit, total: count.total, pages: Math.ceil(count.total / filters.limit)}};
}

export async function findProperty(propertyId, scope, userId, db = pool) {
  let where = "p.id = ?";
  const values = [propertyId];
  if (scope === "public") where += ` AND ${publicCondition}`;
  else if (scope === "owner") {where += " AND p.owner_id = ? AND p.deleted_at IS NULL"; values.push(userId);}
  else where += " AND p.deleted_at IS NULL";
  const [rows] = await db.execute(`${propertySelect} WHERE ${where}`, values);
  if (!rows.length) return null;
  return (await attachPropertyMedia([propertyDto(rows[0], scope !== "public")], db))[0];
}

export async function lockProperty(db, propertyId) {
  const [rows] = await db.execute("SELECT *, DATE_FORMAT(available_from, '%Y-%m-%d') AS available_date FROM properties WHERE id = ? FOR UPDATE", [propertyId]);
  return rows[0] ?? null;
}

export async function insertProperty(db, ownerId, fields) {
  const keys = Object.keys(fields);
  const [result] = await db.execute(`INSERT INTO properties (owner_id, ${keys.join(", ")}) VALUES (?, ${keys.map(() => "?").join(", ")})`, [ownerId, ...Object.values(fields)]);
  return result.insertId;
}

export async function updateProperty(db, propertyId, fields) {
  const keys = Object.keys(fields);
  if (keys.length) await db.execute(`UPDATE properties SET ${keys.map(key => `${key} = ?`).join(", ")} WHERE id = ?`, [...Object.values(fields), propertyId]);
}

export async function replacePropertyMedia(db, propertyId, images, amenityIds) {
  if (images !== undefined) {
    await db.execute("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
    for (const [index, image] of images.entries()) await db.execute("INSERT INTO property_images (property_id, image_path, sort_order, is_primary) VALUES (?, ?, ?, ?)", [propertyId, image, index, index === 0]);
  }
  if (amenityIds !== undefined) {
    await db.execute("DELETE FROM property_amenities WHERE property_id = ?", [propertyId]);
    for (const amenityId of amenityIds) await db.execute("INSERT INTO property_amenities (property_id, amenity_id) VALUES (?, ?)", [propertyId, amenityId]);
  }
}
