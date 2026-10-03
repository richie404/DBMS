import type { UserRole } from "../types/auth";

export const dashboards: Record<UserRole, string> = {
  renter: "Renter dashboard",
  owner: "Owner workspace",
  admin: "Admin overview",
};

const rolePages: Record<UserRole, readonly string[]> = {
  renter: ["Renter dashboard", "Saved homes", "Bookings", "Booking details", "Messages", "Notifications", "Settings", "Redirect Renter"],
  owner: ["Owner workspace", "Owner listings", "Owner add property", "Owner edit property", "Owner booking requests", "Owner booking details", "Owner messages", "Owner earnings", "Owner profile", "Owner notifications", "Redirect Owner"],
  admin: ["Admin overview", "Admin users", "Admin listings", "Admin bookings", "Admin payments", "Admin analytics", "Admin logs", "Admin settings", "Admin notifications", "Redirect Admin", "Design system"],
};

export function requiredRole(page: string): UserRole | undefined {
  return (Object.keys(rolePages) as UserRole[]).find(role => rolePages[role].includes(page));
}

export function userInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

export function readPage() {
  try { return decodeURIComponent(window.location.hash.slice(1).split("?")[0]) || "Home"; }
  catch { return "Home"; }
}
