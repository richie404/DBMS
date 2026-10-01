export async function findUserByEmail(connection, email) {
  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserByUsername(connection, username) {
  const [rows] = await connection.execute(
    "SELECT id FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  return rows[0] ?? null;
}

export async function findUserForLogin(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, username, email, phone, password_hash AS passwordHash, role, status,
      avatar_url AS avatarUrl, deleted_at AS deletedAt
     FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findUserForPasswordReset(connection, email) {
  const [rows] = await connection.execute(
    `SELECT id, name, email, status, deleted_at AS deletedAt
     FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findPasswordHashByUserId(connection, userId) {
  const [rows] = await connection.execute(
    "SELECT password_hash AS passwordHash FROM users WHERE id = ? FOR UPDATE",
    [userId],
  );
  return rows[0]?.passwordHash ?? null;
}

export async function updatePasswordHash(connection, userId, passwordHash) {
  await connection.execute(
    "UPDATE users SET password_hash = ? WHERE id = ?",
    [passwordHash, userId],
  );
}

export async function createUser(connection, { name, username, email, passwordHash, role }) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, username, email, password_hash, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, username, email, passwordHash, role],
  );
  const [rows] = await connection.execute(
    `SELECT id, name, username, email, phone, role, status, avatar_url AS avatarUrl
     FROM users WHERE id = ?`,
    [result.insertId],
  );
  return rows[0];
}

export async function createDefaultUserPreferences(connection, userId) {
  await connection.execute("INSERT INTO user_preferences (user_id) VALUES (?)", [userId]);
}
import pool from "../config/database.js";

