import {apiRequest} from "../lib/api";
import type {Amenity, Page, Property, PropertyInput, Query} from "../types/rentals";

<<<<<<< Updated upstream
export function queryString(filters: Query = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
=======
export interface Property {
  privatePreview?: boolean
  ownerName?: string
  ownerId?: number
  moderationStatus?: string
  isAvailable?: boolean
  owner?: PropertyOwner
  id: number
  title: string | null
  description: string | null
  location: string | null
  propertyType: string
  monthlyRent: number | null
  currency: string
  sizeSqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  furnished: boolean
  bachelorAllowed: boolean
  familyAllowed: boolean
  primaryImage: string | null
  depositAmount: number | null
  availableFrom: string | null
  createdAt: string
  amenities?: {id:number;name:string}[]
  images?: string[]
}
export const propertyTypes = [
  "room",
  "studio",
  "flat",
  "apartment",
  "office",
  "parking",
]
export const sortOptions = [
  ["newest", "Recently added"],
  ["oldest", "Oldest first"],
  ["rent_asc", "Monthly rent: low to high"],
  ["rent_desc", "Monthly rent: high to low"],
  ["size_desc", "Size: largest first"],
]
export type Criteria = {
  search: string
  location: string
  minRent: string
  maxRent: string
  type: string
  bedrooms: string
  furnishing: string
  eligibility: string
  sort: string
}
export const emptyCriteria: Criteria = {
  search: "",
  location: "",
  minRent: "",
  maxRent: "",
  type: "",
  bedrooms: "",
  furnishing: "",
  eligibility: "",
  sort: "newest",
}
export interface ListingResult {
  properties: Property[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
export interface PropertyLocation {
  location: string
  count: number
>>>>>>> Stashed changes
}
export type PropertyScope = "public" | "owner" | "admin";
const base = (scope: PropertyScope) => scope === "public" ? "/properties" : `/${scope}/properties`;
export const propertyService = {
<<<<<<< Updated upstream
  list: (filters?: Query, scope: PropertyScope = "public") => apiRequest<Page<Property>>(base(scope) + queryString(filters)),
  get: async (id: number, scope: PropertyScope = "public") => (await apiRequest<{property: Property}>(`${base(scope)}/${id}`)).property,
  create: async (body: PropertyInput) => (await apiRequest<{property: Property}>("/owner/properties", {method: "POST", body, csrf: true})).property,
  update: async (id: number, body: PropertyInput) => (await apiRequest<{property: Property}>(`/owner/properties/${id}`, {method: "PATCH", body, csrf: true})).property,
  archive: (id: number) => apiRequest(`/owner/properties/${id}`, {method: "DELETE", csrf: true}),
  moderate: (id: number, status: "approved" | "rejected", reason?: string) => apiRequest(`/admin/properties/${id}/moderation`, {method: "PATCH", body: {status, reason}, csrf: true}),
  amenities: async () => (await apiRequest<{items: Amenity[]}>("/amenities")).items,
};
=======
  list(criteria: Criteria, page = 1, signal?: AbortSignal) {
    const query = new URLSearchParams({ page: String(page), limit: "12" })
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    return apiRequest<ListingResult>(`/properties?${query}`, { signal })
  },
  async detail(id: number, signal?: AbortSignal, ownerPreview: boolean | "admin" = false) {
    try { return await apiRequest<{ property: Property }>(`/properties/${id}`, { signal }) }
    catch(error) {
      if(!ownerPreview || !(error instanceof Error) || !('status' in error) || error.status !== 404) throw error;
      const {property:p}=await apiRequest<{property:Omit<Property,"images"> & {type:string;available:boolean;images:{url:string}[];owner:PropertyOwner}}>(`/${ownerPreview==="admin"?"admin":"owner"}/properties/${id}`,{signal});
      return {property:{...p,privatePreview:true,propertyType:p.type,isAvailable:p.available,ownerId:p.owner.id,ownerName:p.owner.name,primaryImage:p.images[0]?.url||null,images:p.images.map(i=>i.url)} as Property};
    }
  },
  locations(signal?: AbortSignal) {
    return apiRequest<{ locations: PropertyLocation[] }>(
      "/properties/locations",
      { signal },
    )
  },
  favorites() {
    return apiRequest<{ properties: Property[] }>("/favorites")
  },
  save(id: number) {
    return apiRequest(`/favorites/${id}`, { method: "PUT", csrf: true })
  },
  unsave(id: number) {
    return apiRequest(`/favorites/${id}`, { method: "DELETE", csrf: true })
  },
}
>>>>>>> Stashed changes
