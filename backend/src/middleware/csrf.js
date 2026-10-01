import { verifyCsrfToken } from "../utils/csrf.js";

// Future authenticated mutations must place requireAuth before requireCsrf.
export default function requireCsrf(request, response, next) {
  if (!request.auth?.sessionId || !verifyCsrfToken(request.auth.sessionId, request.get("X-CSRF-Token"))) {
    return response.status(403).json({ success: false, message: "Invalid CSRF token" });
  }
  return next();
}
