import pool from "../config/database.js";

const safeUserColumns = `
  u.id,
  u.name,
  u.username,
  u.email,
  u.phone,
  u.role,
  u.status,
  u.avatar_url AS avatarUrl,
  u.deleted_at AS deletedAt`;

export async function findActiveSessionByTokenHash(tokenHash) {
  const [rows] = await pool.execute(`
    SELECT s.id AS sessionId, ${safeUserColumns}
    FROM sessions AS s
    INNER JOIN users AS u ON u.id = s.user_id
    WHERE s.token_hash = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > CURRENT_TIMESTAMP
    LIMIT 1`, [tokenHash]);
  return rows[0] ?? null;
}

export async function createSession({ userId, tokenHash, deviceDescription = null, expiresAt }) {
  const [result] = await pool.execute(
    `INSERT INTO sessions (user_id, token_hash, device_description, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, deviceDescription, expiresAt],
  );
  return result.insertId;
}

export async function revokeSession(sessionId) {
  const [result] = await pool.execute(
    "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL",
    [sessionId],
  );
  return result.affectedRows > 0;
}

export async function revokeOtherSessions(connection, userId, currentSessionId) {
  const [result] = await connection.execute(
    `UPDATE sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ?
       AND id <> ?
       AND revoked_at IS NULL
       AND expires_at > CURRENT_TIMESTAMP`,
    [userId, currentSessionId],
  );
  return result.affectedRows;
}

export async function revokeAllSessionsForUser(connection, userId) {
  const [result] = await connection.execute(
    `UPDATE sessions
     SET revoked_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP`,
    [userId],
  );
  return result.affectedRows;
}

export async function touchSessionLastUsed(sessionId) {
  await pool.execute(
    "UPDATE sessions SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?",
    [sessionId],
  );
}
