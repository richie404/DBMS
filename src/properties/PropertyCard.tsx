import { useEffect, useState } from "react"
import { useAuth } from "../auth/AuthContext"
import { useFavorites } from "./FavoritesContext"
import type { Property } from "../services/properties"

export function PropertyPhoto({
  url,
  title,
}: {
  url: string | null
  title: string
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [url])
  const safeUrl = url && /^(https?:\/\/|\/(?!\/))/.test(url) ? url : null
  return safeUrl && !failed ? (
    <img
      src={safeUrl}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="property-photo-fallback">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
      </svg>
      <span>No photo available</span>
    </div>
  )
}
export function rentLabel(property: Property) {
  return property.monthlyRent == null
    ? "Rent not provided"
    : `${property.monthlyRent.toLocaleString("en-BD", { maximumFractionDigits: 2 })} ${property.currency}`
}
export function PropertyFacts({ property }: { property: Property }) {
  const facts = [
    property.bedrooms != null
      ? `${property.bedrooms} ${
          property.bedrooms === 1 ? "bedroom" : "bedrooms"
        }`
      : null,
    property.bathrooms != null
      ? `${property.bathrooms} ${
          property.bathrooms === 1 ? "bathroom" : "bathrooms"
        }`
      : null,
    property.sizeSqft != null
      ? `${property.sizeSqft.toLocaleString()} sq ft`
      : null,
  ].filter(Boolean)
  return (
    <p className="meta">
      {facts.length ? facts.join(" · ") : "Dimensions not provided"}
    </p>
  )
}
export function PropertyBadges({ property }: { property: Property }) {
  return (
    <div className="listing-badges">
      <span className="badge">
        {property.furnished ? "Furnished" : "Unfurnished"}
      </span>
      {property.bachelorAllowed && (
        <span className="badge">Bachelor allowed</span>
      )}
      {property.familyAllowed && <span className="badge">Family allowed</span>}
    </div>
  )
}
export function SavePropertyButton({
  property,
  onLogin,
  panel = false,
}: {
  property: Property
  onLogin: () => void
  panel?: boolean
}) {
  const { user } = useAuth()
  const { favorites, toggle, pending, loading, error, refresh } = useFavorites()
  const [saveError, setSaveError] = useState("")
  const saved = favorites.some((item) => item.id === property.id)
  const save = async () => {
    if (!user) {
      onLogin()
      return
    }
    setSaveError("")
    try {
      await toggle(property)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to update favorites",
      )
    }
  }
  return (
    <>
      <button
        type="button"
        className={
          panel ? "button button-secondary" : `heart ${saved ? "saved" : ""}`
        }
        disabled={
          pending.has(property.id) ||
          (Boolean(user) && loading) ||
          Boolean(user && user.role !== "renter")
        }
        title={
          user && user.role !== "renter"
            ? "A renter account is required"
            : undefined
        }
        onClick={() => void save()}
        aria-pressed={saved}
        aria-label={`${
          saved ? "Remove" : "Save"
        } ${property.title || "property"}${
          saved ? " from favorites" : " to favorites"
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        {panel &&
          (pending.has(property.id)
            ? "Saving…"
            : saved
              ? "Remove from Favorites"
              : "Add to Favorites")}
      </button>
      {saveError && (
        <div
          className={panel ? "form-error-message" : "listing-save-error"}
          role="alert"
        >
          {saveError}
          {error && <button onClick={() => void refresh()}>Retry</button>}
        </div>
      )}
    </>
  )
}
export default function DatabasePropertyCard({
  property,
  onView,
  onLogin,
}: {
  property: Property
  onView: (id: number) => void
  onLogin: () => void
}) {
  return (
    <article className="property-card database-property-card">
      <div className="property-image">
        <PropertyPhoto
          url={property.primaryImage}
          title={property.title || "Property"}
        />
        <SavePropertyButton property={property} onLogin={onLogin} />
      </div>
      <div className="property-body">
        <div className="property-row">
          <h3>{property.title || "Untitled property"}</h3>
        </div>
        <p className="location">
          {property.location || "Location not provided"}
        </p>
        {property.ownerName && (
          <p className="listing-owner">
            Listed by <strong>{property.ownerName}</strong>
          </p>
        )}
        <PropertyFacts property={property} />
        <p className="listing-type">{property.propertyType}</p>
        <PropertyBadges property={property} />
        <div className="property-row price-row">
          <p>
            <strong>{rentLabel(property)}</strong>
            {property.monthlyRent != null && " / month"}
          </p>
          <button className="card-cta" onClick={() => onView(property.id)}>
            View details <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </article>
  )
}
export function ListingSkeletons() {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <article
          className="property-card-skeleton"
          key={index}
          aria-hidden="true"
        >
          <div className="skeleton skeleton-property-image" />
          <div>
            <span className="skeleton skeleton-title" />
            <span className="skeleton skeleton-copy" />
            <span className="skeleton skeleton-copy short" />
          </div>
        </article>
      ))}
    </>
  )
}
