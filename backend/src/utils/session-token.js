import { sessionConfig } from "../config/session.js";
import { generateSecureToken, hashSecureToken } from "./secure-token.js";

export function generateSessionToken() {
  return generateSecureToken();
}

export function hashSessionToken(rawToken) {
  if (typeof rawToken !== "string" || rawToken.length === 0) {
    throw new TypeError("Session token must be a non-empty string.");
  }
  return hashSecureToken(rawToken);
}

export function calculateSessionExpiry(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("Session expiry requires a valid Date.");
  }
  return new Date(now.getTime() + sessionConfig.durationMilliseconds);
}
