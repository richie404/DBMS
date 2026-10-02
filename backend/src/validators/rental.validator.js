import { assert } from "../utils/api-error.js";

export const propertyTypes = ["room", "studio", "flat", "apartment", "office", "parking"];
export const bookingStatuses = ["pending", "approved", "confirmed", "rejected", "cancelled"];
export const moderationStatuses = ["draft", "pending", "approved", "rejected"];

export function id(value) {
  assert(/^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) <= 4294967295, 400, "Invalid ID");
  return Number(value);
}

export function date(value, name = "date") {
  assert(typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= "1000-01-01" && value <= "9999-12-31", 400, `Invalid ${name}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  assert(!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 400, `Invalid ${name}`);
  return value;
}

export function text(value, name, max, nullable = false) {
  if (nullable && (value === null || value === "")) return null;
  assert(typeof value === "string" && value.trim().length > 0 && value.length <= max, 400, `Invalid ${name}`);
  return value.trim();
}

function number(value, name, max, integer = false) {
  assert((typeof value === "number" || typeof value === "string" && /^\d+(?:\.\d{1,2})?$/.test(value)) && value !== "", 400, `Invalid ${name}`);
  const n = Number(value);
  assert(Number.isFinite(n) && n >= 0 && n <= max && (integer ? Number.isInteger(n) : Math.abs(n * 100 - Math.round(n * 100)) < 0.001), 400, `Invalid ${name}`);
  return n;
}

export function filters(query = {}, kind = "property") {
  const result = { page: 1, limit: 12 };
  for (const key of ["page", "limit"]) if (query[key] !== undefined) {
    assert(/^\d+$/.test(String(query[key])), 400, `Invalid ${key}`);
    result[key] = number(query[key], key, key === "limit" ? 100 : 1000000, true);
    assert(result[key] >= 1, 400, `Invalid ${key}`);
  }
  for (const key of ["search", "location"]) if (query[key] !== undefined) result[key] = text(query[key], key, 255);
  if (query.status !== undefined) {
    const options = kind === "booking" ? bookingStatuses : moderationStatuses;
    assert(options.includes(query.status), 400, "Invalid status");
    result.status = query.status;
  }
  if (kind === "property") {
    if (query.createdAfter !== undefined) result.createdAfter = date(query.createdAfter, "created after");
    if (query.type !== undefined) { assert(propertyTypes.includes(query.type), 400, "Invalid property type"); result.type = query.type; }
    for (const key of ["minPrice", "maxPrice"]) if (query[key] !== undefined) result[key] = number(query[key], key, 9999999999.99);
    assert(result.minPrice === undefined || result.maxPrice === undefined || result.minPrice <= result.maxPrice, 400, "Minimum price exceeds maximum price");
    if (query.bedrooms !== undefined) result.bedrooms = number(query.bedrooms, "bedrooms", 65535, true);
    if (query.availability !== undefined) { assert(["available", "unavailable", "now", "future"].includes(query.availability), 400, "Invalid availability"); result.availability = query.availability; }
    if (query.sort !== undefined) { assert(["latest", "price_asc", "price_desc"].includes(query.sort), 400, "Invalid sort"); result.sort = query.sort; }
  } else {
    if (query.propertyId !== undefined) result.propertyId = id(query.propertyId);
    for (const key of ["from", "to"]) if (query[key] !== undefined) result[key] = date(query[key], key);
    assert(!result.from || !result.to || result.from <= result.to, 400, "Invalid date range");
  }
  return result;
}

const columns = { title: "title", description: "description", location: "location", type: "property_type", monthlyRent: "monthly_rent", depositAmount: "deposit_amount", currency: "currency", sizeSqft: "size_sqft", bedrooms: "bedrooms", bathrooms: "bathrooms", furnished: "furnished", bachelorAllowed: "bachelor_allowed", familyAllowed: "family_allowed", available: "is_available", availableFrom: "available_from", moderationStatus: "moderation_status" };

export function propertyInput(body, creating = false) {
  assert(body && typeof body === "object" && !Array.isArray(body), 400, "Invalid property body");
  assert(Object.keys(body).every(key => Object.hasOwn(columns, key) || ["images", "amenityIds"].includes(key)), 400, "Unknown property field");
  const fields = {};
  for (const [key, column] of Object.entries(columns)) if (body[key] !== undefined) {
    const value = body[key];
    if (["monthlyRent", "depositAmount", "sizeSqft", "bedrooms", "bathrooms"].includes(key)) fields[column] = value === null ? null : number(value, key, ["bedrooms", "bathrooms"].includes(key) ? 65535 : key === "sizeSqft" ? 99999999.99 : 9999999999.99, ["bedrooms", "bathrooms"].includes(key));
    else if (["furnished", "bachelorAllowed", "familyAllowed", "available"].includes(key)) { assert(typeof value === "boolean", 400, `Invalid ${key}`); fields[column] = value; }
    else if (key === "type") { assert(propertyTypes.includes(value), 400, "Invalid property type"); fields[column] = value; }
    else if (key === "moderationStatus") { assert(["draft", "pending"].includes(value), 400, "Owners can only save drafts or submit pending listings"); fields[column] = value; }
    else if (key === "availableFrom") fields[column] = value === null || value === "" ? null : date(value, key);
    else if (key === "currency") { assert(typeof value === "string" && /^[A-Z]{3}$/.test(value), 400, "Invalid currency"); fields[column] = value; }
    else fields[column] = text(value, key, key === "title" ? 200 : key === "description" ? 10000 : 255, true);
  }
  if (fields.monthly_rent !== undefined && fields.monthly_rent !== null) assert(fields.monthly_rent > 0,400,"Monthly rent must be positive");
  if (creating) assert(fields.property_type, 400, "Property type is required");
  let images;
  if (body.images !== undefined) {
    assert(Array.isArray(body.images) && body.images.length <= 20, 400, "Up to 20 image URLs are allowed");
    images = body.images.map(value => {
      const path = text(value, "image URL", 2048);
      assert(/^https?:\/\//i.test(path) || /^\/(?!\/)/.test(path), 400, "Images must use HTTP(S) URLs or local paths");
      return path;
    });
  }
  let amenityIds;
  if (body.amenityIds !== undefined) { assert(Array.isArray(body.amenityIds) && body.amenityIds.length <= 50, 400, "Invalid amenities"); amenityIds = [...new Set(body.amenityIds.map(id))]; }
  assert(creating || Object.keys(fields).length || images !== undefined || amenityIds !== undefined, 400, "No property changes supplied");
  return { fields, images, amenityIds };
}

export function publishable(property) {
  assert(property.title?.trim() && property.location?.trim() && property.monthly_rent !== null && Number(property.monthly_rent) > 0, 400, "Published listings require a title, location, and positive monthly rent");
}
