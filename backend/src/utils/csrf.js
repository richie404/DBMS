import { createHmac, timingSafeEqual } from "node:crypto";
import env from "../config/env.js";

export function generateCsrfToken(sessionId) {
  return createHmac("sha256", env.csrfSecret).update(String(sessionId), "utf8").digest("hex");
}

export function verifyCsrfToken(sessionId, submittedToken) {
  if (typeof submittedToken !== "string") return false;
  const expected = Buffer.from(generateCsrfToken(sessionId), "utf8");
  const received = Buffer.from(submittedToken, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
