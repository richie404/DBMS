import pool from "../config/database.js";
import {attachPropertyMedia, propertyDto, propertySelect, publicCondition} from "./property.model.js";

export async function listFavorites(userId) {
  const [rows] = await pool.execute(`${propertySelect} JOIN favorites f ON f.property_id = p.id WHERE f.user_id = ? AND p.deleted_at IS NULL ORDER BY f.created_at DESC, p.id DESC`, [userId]);
  return attachPropertyMedia(rows.map(row => propertyDto(row)));
}

export async function addFavorite(userId, propertyId) {
  const [result] = await pool.execute(`INSERT IGNORE INTO favorites (user_id, property_id) SELECT ?, p.id FROM properties p JOIN users o ON o.id = p.owner_id WHERE p.id = ? AND ${publicCondition}`, [userId, propertyId]);
  if (result.affectedRows) return true;
  const [rows] = await pool.execute(`SELECT p.id FROM properties p JOIN users o ON o.id = p.owner_id WHERE p.id = ? AND ${publicCondition}`, [propertyId]);
  return rows.length > 0;
}

export async function removeFavorite(userId, propertyId) {
  await pool.execute("DELETE FROM favorites WHERE user_id = ? AND property_id = ?", [userId, propertyId]);
}
