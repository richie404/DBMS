export interface PropertyOwner {
  id: number
  name: string
  avatarUrl: string | null
}
import { apiRequest } from "../lib/api"

export interface Property {
  ownerName?: string
  ownerId?: number
  moderationStatus?: string
  isAvailable?: boolean
  rejectionReason?: string | null
  reviewedAt?: string | null
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
}
export const propertyService = {
  list(criteria: Criteria, page = 1, signal?: AbortSignal) {
    const query = new URLSearchParams({ page: String(page), limit: "12" })
    Object.entries(criteria).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    return apiRequest<ListingResult>(`/properties?${query}`, { signal })
  },
  detail(id: number, signal?: AbortSignal) {
    return apiRequest<{ property: Property }>(`/properties/${id}`, { signal })
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
