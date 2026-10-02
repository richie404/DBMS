import {apiRequest} from "../lib/api";
import type {Amenity, Page, Property, PropertyInput, Query} from "../types/rentals";

export function queryString(filters: Query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
}
export type PropertyScope = "public" | "owner" | "admin";
const base = (scope: PropertyScope) => scope === "public" ? "/properties" : `/${scope}/properties`;
export const propertyService = {
  list: (filters?: Query, scope: PropertyScope = "public") => apiRequest<Page<Property>>(base(scope) + queryString(filters)),
  get: async (id: number, scope: PropertyScope = "public") => (await apiRequest<{property: Property}>(`${base(scope)}/${id}`)).property,
  create: async (body: PropertyInput) => (await apiRequest<{property: Property}>("/owner/properties", {method: "POST", body, csrf: true})).property,
  update: async (id: number, body: PropertyInput) => (await apiRequest<{property: Property}>(`/owner/properties/${id}`, {method: "PATCH", body, csrf: true})).property,
  archive: (id: number) => apiRequest(`/owner/properties/${id}`, {method: "DELETE", csrf: true}),
  moderate: (id: number, status: "approved" | "rejected", reason?: string) => apiRequest(`/admin/properties/${id}/moderation`, {method: "PATCH", body: {status, reason}, csrf: true}),
  amenities: async () => (await apiRequest<{items: Amenity[]}>("/amenities")).items,
};
