import { createHash, randomBytes } from "node:crypto";

export function generateSecureToken(byteLength = 32) {
  if (!Number.isInteger(byteLength) || byteLength < 32) {
    throw new RangeError("Secure tokens require at least 32 random bytes.");
  }
  return randomBytes(byteLength).toString("base64url");
}

export function hashSecureToken(rawToken) {
  if (typeof rawToken !== "string" || rawToken.length === 0) {
    throw new TypeError("Token must be a non-empty string.");
  }
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}
