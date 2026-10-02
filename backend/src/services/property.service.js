import {recordActivity,listingNotification} from "./activity.service.js";
import pool from "../config/database.js";
import {assert} from "../utils/api-error.js";
import {findProperty, insertProperty, lockProperty, replacePropertyMedia, updateProperty} from "../models/property.model.js";
import {publishable, text} from "../validators/rental.validator.js";

export async function propertyDetails(propertyId, scope, userId) {
  const property = await findProperty(propertyId, scope, userId);
  assert(property, 404, "Property not found");
  return property;
}

export async function saveProperty(ownerId, propertyId, input) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const existing = propertyId ? await lockProperty(db, propertyId) : null;
    if (propertyId) assert(existing && !existing.deleted_at && existing.owner_id === ownerId, 404, "Property not found");
    const fields = {...input.fields};
    const substantive = Object.keys(fields).some(key => !["is_available", "available_from", "moderation_status"].includes(key)) || input.images !== undefined || input.amenityIds !== undefined;
    if (existing?.moderation_status === "approved" && substantive) fields.moderation_status = fields.moderation_status ?? "pending";
    const merged = {...existing, ...fields};
    if (merged.moderation_status === "pending") publishable(merged);
    if (input.amenityIds?.length) {
      const [rows] = await db.execute(`SELECT id FROM amenities WHERE id IN (${input.amenityIds.map(() => "?").join(",")})`, input.amenityIds);
      assert(rows.length === input.amenityIds.length, 400, "Unknown amenity");
    }
    if (fields.moderation_status) { fields.rejection_reason = null; fields.reviewed_by = null; fields.reviewed_at = null; }
    const savedId = propertyId ?? await insertProperty(db, ownerId, fields);
    if (propertyId) await updateProperty(db, propertyId, fields);
    await replacePropertyMedia(db, savedId, input.images, input.amenityIds);
    const property = await findProperty(savedId, "owner", ownerId, db);
    await recordActivity(db,ownerId,propertyId?"property.updated":"property.created","property",savedId,"Listing "+(property.title||savedId));
    await listingNotification(db,ownerId,savedId,property.title,property.moderationStatus);
    await db.commit();
    return property;
  } catch (error) {await db.rollback(); throw error;}
  finally {db.release();}
}

export async function archiveProperty(ownerId, propertyId) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const property = await lockProperty(db, propertyId);
    assert(property && !property.deleted_at && property.owner_id === ownerId, 404, "Property not found");
    const [[active]] = await db.execute("SELECT COUNT(*) AS count FROM bookings WHERE property_id = ? AND deleted_at IS NULL AND status IN ('pending','approved','confirmed') AND end_date > CURRENT_DATE", [propertyId]);
    assert(!active.count, 409, "Resolve active booking requests before archiving this property");
    await db.execute("UPDATE properties SET deleted_at = CURRENT_TIMESTAMP, is_available = 0 WHERE id = ?", [propertyId]);
    await db.commit();
  } catch (error) {await db.rollback(); throw error;}
  finally {db.release();}
}

export async function moderateProperty(adminId, propertyId, body) {
  assert(body && Object.keys(body).every(key => ["status", "reason"].includes(key)), 400, "Invalid moderation body");
  assert(["approved", "rejected"].includes(body.status), 400, "Choose approved or rejected");
  const reason = body.status === "rejected" ? text(body.reason, "rejection reason", 2000) : null;
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const property = await lockProperty(db, propertyId);
    assert(property && !property.deleted_at, 404, "Property not found");
    assert(property.moderation_status === "pending", 409, "Only pending listings can be reviewed");
    if (body.status === "approved") publishable(property);
    await db.execute("UPDATE properties SET moderation_status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?", [body.status, reason, adminId, propertyId]);
    await listingNotification(db,property.owner_id,propertyId,property.title,body.status);
    await recordActivity(db,adminId,"listing."+body.status,"property",propertyId,"Listing "+body.status);
    const result = await findProperty(propertyId, "admin", adminId, db);
    await db.commit();
    return result;
  } catch (error) {await db.rollback(); throw error;}
  finally {db.release();}
}
