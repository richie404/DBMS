export async function invalidateUnusedResetTokensForUser(connection, userId) {
  await connection.execute(
    "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL",
    [userId],
  );
}

export async function createPasswordResetToken(connection, { userId, tokenHash, expiresAt }) {
  await connection.execute(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function findUsableResetTokenForUpdate(connection, tokenHash) {
  const [rows] = await connection.execute(
    `SELECT t.id, t.user_id AS userId, u.password_hash AS passwordHash, u.status, u.deleted_at AS deletedAt
     FROM password_reset_tokens AS t
     INNER JOIN users AS u ON u.id = t.user_id
     WHERE t.token_hash = ?
       AND t.used_at IS NULL
       AND t.expires_at > CURRENT_TIMESTAMP
     LIMIT 1 FOR UPDATE`,
    [tokenHash],
  );
  return rows[0] ?? null;
}

export async function markResetTokenUsed(connection, tokenId) {
  await connection.execute(
    "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL",
    [tokenId],
  );
}
