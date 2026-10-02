import {recordActivity} from "./activity.service.js";
import pool from "../config/database.js";
import env from "../config/env.js";
import { createDefaultUserPreferences, createUser, findPasswordHashByUserId, findUserByEmail, findUserByUsername, findUserForLogin, findUserForPasswordReset, updatePasswordHash } from "../models/user.model.js";
import { createSession, revokeAllSessionsForUser, revokeOtherSessions } from "../models/session.model.js";
import { createPasswordResetToken, findUsableResetTokenForUpdate, invalidateUnusedResetTokensForUser, markResetTokenUsed } from "../models/password-reset-token.model.js";
import { deliverPasswordResetInstructions } from "./password-reset-delivery.service.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { calculateSessionExpiry, generateSessionToken, hashSessionToken } from "../utils/session-token.js";
import { generateSecureToken, hashSecureToken } from "../utils/secure-token.js";

export class RegistrationConflictError extends Error {
  constructor(field) {
    super("Registration conflict");
    this.field = field;
  }
}

function duplicateField(error) {
  if (error?.code !== "ER_DUP_ENTRY") return null;
  if (error.sqlMessage?.includes("uq_users_email")) return "email";
  if (error.sqlMessage?.includes("uq_users_username")) return "username";
  return "account";
}

export async function registerUser(input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (await findUserByEmail(connection, input.email)) throw new RegistrationConflictError("email");
    if (await findUserByUsername(connection, input.username)) throw new RegistrationConflictError("username");

    const passwordHash = await hashPassword(input.password);
    const user = await createUser(connection, { ...input, passwordHash });
    await createDefaultUserPreferences(connection, user.id);
    await recordActivity(connection,user.id,"user.registered","user",user.id,"Account registered");
    await connection.commit();
    return user;
  } catch (error) {
    await connection.rollback();
    const field = duplicateField(error);
    if (field) throw new RegistrationConflictError(field);
    throw error;
  } finally {
    connection.release();
  }
}

export class InvalidCredentialsError extends Error {}
export class AccountUnavailableError extends Error {}

export async function loginUser({ email, password, deviceDescription }) {
  const user = await findUserForLogin(email);
  if (!user || user.deletedAt !== null) throw new InvalidCredentialsError();
  if (!await verifyPassword(user.passwordHash, password)) throw new InvalidCredentialsError();
  if (user.status === "suspended" || user.status === "banned") throw new AccountUnavailableError();

  const rawToken = generateSessionToken();
  await createSession({
    userId: user.id,
    tokenHash: hashSessionToken(rawToken),
    deviceDescription,
    expiresAt: calculateSessionExpiry(),
  });
  return {
    rawToken,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    },
  };
}

export class IncorrectCurrentPasswordError extends Error {}
export class SamePasswordError extends Error {}
export class InvalidResetTokenError extends Error {}

export async function changePassword({ userId, currentSessionId, currentPassword, newPassword }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await findPasswordHashByUserId(connection, userId);
    if (!passwordHash || !await verifyPassword(passwordHash, currentPassword)) {
      throw new IncorrectCurrentPasswordError();
    }
    if (await verifyPassword(passwordHash, newPassword)) throw new SamePasswordError();

    await updatePasswordHash(connection, userId, await hashPassword(newPassword));
    await revokeOtherSessions(connection, userId, currentSessionId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function requestPasswordReset(email, delivery = deliverPasswordResetInstructions) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const connection = await pool.getConnection();
    let deliveryPayload = null;
    try {
      await connection.beginTransaction();
      const user = await findUserForPasswordReset(connection, email);
      if (!user || user.deletedAt !== null || user.status !== "active") {
        await connection.commit();
        return;
      }

      const rawToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + env.passwordResetTokenTtlMinutes * 60 * 1000);
      await invalidateUnusedResetTokensForUser(connection, user.id);
      await createPasswordResetToken(connection, {
        userId: user.id,
        tokenHash: hashSecureToken(rawToken),
        expiresAt,
      });
      await connection.commit();
      deliveryPayload = { user, rawToken };
    } catch (error) {
      await connection.rollback();
      if (error?.code === "ER_LOCK_DEADLOCK" && attempt < 2) continue;
      throw error;
    } finally {
      connection.release();
    }

    if (deliveryPayload) await delivery(deliveryPayload.user, deliveryPayload.rawToken);
    return;
  }
}

export async function resetPasswordWithToken({ token, newPassword }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const resetToken = await findUsableResetTokenForUpdate(connection, hashSecureToken(token));
    if (!resetToken || resetToken.deletedAt !== null || resetToken.status !== "active") {
      throw new InvalidResetTokenError();
    }
    if (await verifyPassword(resetToken.passwordHash, newPassword)) throw new SamePasswordError();

    await updatePasswordHash(connection, resetToken.userId, await hashPassword(newPassword));
    await markResetTokenUsed(connection, resetToken.id);
    await invalidateUnusedResetTokensForUser(connection, resetToken.userId);
    await revokeAllSessionsForUser(connection, resetToken.userId);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
