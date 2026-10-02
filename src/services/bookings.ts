import {apiRequest} from "../lib/api";
const queryString = (filters?: Query) => {
  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.size ? `?${params}` : "";
};
import type {Booking, BookingPage, Query} from "../types/rentals";
export type BookingScope = "renter" | "owner" | "admin";
const base = (scope: BookingScope) => scope === "renter" ? "/bookings" : `/${scope}/bookings`;
export const bookingService = {
  list: (filters?: Query, scope: BookingScope = "renter") => apiRequest<BookingPage>(base(scope) + queryString(filters)),
  get: async (id: number, scope: BookingScope = "renter") => (await apiRequest<{booking: Booking}>(`${base(scope)}/${id}`)).booking,
  create: async (body: {propertyId: number; startDate: string; endDate: string}) => (await apiRequest<{booking: Booking}>("/bookings", {method: "POST", body, csrf: true})).booking,
  action: async (id: number, action: "approve" | "reject" | "cancel", scope: "renter" | "owner", reason?: string) => (await apiRequest<{booking: Booking}>(`${base(scope)}/${id}/${action}`, {method: "POST", body: {reason}, csrf: true})).booking,
};
