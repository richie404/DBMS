import { sessionConfig } from "../config/session.js";
import { findActiveSessionByTokenHash, touchSessionLastUsed } from "../models/session.model.js";
import { hashSessionToken } from "../utils/session-token.js";

function unauthorized(response) {
  return response.status(401).json({ success: false, message: "Authentication required" });
}

export async function requireAuth(request, response, next) {
  const rawToken = request.cookies?.[sessionConfig.cookieName];
  if (typeof rawToken !== "string" || rawToken.length === 0) return unauthorized(response);

  try {
    const session = await findActiveSessionByTokenHash(hashSessionToken(rawToken));
    if (!session || session.deletedAt !== null) return unauthorized(response);

    if (session.status === "suspended" || session.status === "banned") {
      return response.status(403).json({ success: false, message: "Account access is unavailable" });
    }

    request.user = {
      id: session.id,
      name: session.name,
      username: session.username,
      email: session.email,
      role: session.role,
      status: session.status,
      avatarUrl: session.avatarUrl,
    };
    request.auth = { sessionId: session.sessionId };
    await touchSessionLastUsed(session.sessionId);
    return next();
  } catch (error) {
    return next(error);
  }
}
