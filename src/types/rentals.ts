export type PropertyType = "room" | "studio" | "flat" | "apartment" | "office" | "parking";
export type ModerationStatus = "draft" | "pending" | "approved" | "rejected";
export type BookingStatus = "pending" | "approved" | "confirmed" | "rejected" | "cancelled";
export interface Person { id: number; name: string; username?: string; avatarUrl?: string | null }
export interface Amenity { id: number; code: string; name: string }
export interface Property {
  id: number; title: string | null; description: string | null; location: string | null; type: PropertyType;
  monthlyRent: number | null; depositAmount: number | null; currency: string; sizeSqft: number | null;
  bedrooms: number | null; bathrooms: number | null; furnished: boolean; bachelorAllowed: boolean; familyAllowed: boolean;
  moderationStatus: ModerationStatus; available: boolean; availableFrom: string | null; archived: boolean;
  createdAt: string; updatedAt: string; owner: Person; rejectionReason?: string | null;
  images: {id: number; url: string; primary: boolean; sortOrder: number}[]; amenities: Amenity[];
}
export interface PropertyInput {
  title?: string | null; description?: string | null; location?: string | null; type?: PropertyType;
  monthlyRent?: number | null; depositAmount?: number | null; currency?: string; sizeSqft?: number | null;
  bedrooms?: number | null; bathrooms?: number | null; furnished?: boolean; bachelorAllowed?: boolean; familyAllowed?: boolean;
  available?: boolean; availableFrom?: string | null; moderationStatus?: "draft" | "pending";
  images?: string[]; amenityIds?: number[];
}
export interface Booking {
  id: number; code: string; startDate: string; endDate: string; monthlyRent: number; depositAmount: number;
  totalAmount: number; currency: string; status: BookingStatus; createdAt: string;
  decisionReason: string | null; cancellationReason: string | null;
  property: {id: number; title: string | null; location: string | null; type: PropertyType; image: string | null};
  renter: Person; owner: Person;
  events?: {id: number; previousStatus: BookingStatus | null; status: BookingStatus; reason: string | null; createdAt: string; actorName: string | null}[];
}
export interface Page<T> { items: T[]; pagination: {page: number; limit: number; total: number; pages: number} }
export interface BookingPage extends Page<Booking> {summary: Partial<Record<BookingStatus, number>>}
export type Query = Record<string, string | number | undefined>;
