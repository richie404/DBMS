const canonicalRoles = new Set(["renter", "owner", "admin"]);

export default function requireRole(...roles) {
  if (roles.length === 0 || roles.some((role) => !canonicalRoles.has(role))) {
    throw new Error("requireRole requires one or more canonical roles.");
  }

  return function roleMiddleware(request, response, next) {
    if (!request.user) {
      return response.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ success: false, message: "Permission denied" });
    }
    return next();
  };
}
