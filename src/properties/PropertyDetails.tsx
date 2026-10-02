import AvailabilitySummary from "./AvailabilitySummary"

import { formatDate } from "../../shared/rental-dates.js"

import { useEffect, useRef, useState } from "react"

import { useAuth } from "../auth/AuthContext"

import { rentalService } from "../services/rentals"

import BookingForm from "./BookingForm"

import { propertyService, type Property } from "../services/properties"

import {
  ListingSkeletons,
  PropertyBadges,
  PropertyFacts,
  PropertyPhoto,
  rentLabel,
  SavePropertyButton,
} from "./PropertyCard"

interface OwnerAvatarProps {
  name: string

  url: string | null
}

function OwnerAvatar({ name, url }: OwnerAvatarProps) {
  const [failed, setFailed] = useState(false)

  const initials =
    name

      .trim()

      .split(/\s+/)

      .slice(0, 2)

      .map((part) => part[0])

      .join("")

      .toUpperCase() || "?"

  return (
    <span className="listed-by-avatar">
      {url && !failed ? (
        <img src={url} alt={name} onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  )
}

export default function PropertyDetails({
  id,

  onBack,

  onLogin,

  onChat,

  onBookings,
}: {
  id: number

  onBack: () => void

  onLogin: (action?: string) => void

  onChat: (conversationId: number) => void

  onBookings: () => void
}) {
  const { user } = useAuth()

  const [bookingOpen, setBookingOpen] = useState(false)

  const [proposedStart, setProposedStart] = useState("")

  const [proposedMonths, setProposedMonths] = useState(1)

  const [chatBusy, setChatBusy] = useState(false)

  const [actionError, setActionError] = useState("")

  const allowed = !user || user.role === "renter"

  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])

  const chat = async () => {
    if (!user) {
      onLogin("chat")

      return
    }

    if (!allowed || chatBusy) return

    setChatBusy(true)

    setActionError("")

    try {
      const result = await rentalService.startConversation(id)

      if (mounted.current) onChat(result.conversationId)
    } catch (error) {
      if (mounted.current)
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to start conversation",
        )
    } finally {
      if (mounted.current) setChatBusy(false)
    }
  }

  const requestBooking = () => {
    if (allowed) setBookingOpen(true)
  }

  const [property, setProperty] = useState<Property | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)

    setError("")

    setProperty(null)

    propertyService

      .detail(id, controller.signal, user?.role === "admin"?"admin":user?.role === "owner")

      .then((response) => {
        if (!controller.signal.aborted) setProperty(response.property)
      })

      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message)
      })

      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [id, retry, user?.role])

  return (
    <div className="database-property-details">
      {property?.privatePreview && <p role="note">Private authorised preview · this listing is not available in public browsing.</p>}
      <button className="button button-ghost" onClick={onBack}>
        ← Back to properties
      </button>
      {loading ? (
        <div
          className="database-property-grid"
          role="status"
          aria-label="Loading property"
        >
          <ListingSkeletons />
        </div>
      ) : error ? (
        <div className="listing-state" role="alert">
          <h1>Unable to load property</h1>
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      ) : (
        property && (
          <>
            <p className="eyebrow">{property.propertyType}</p>
            <h1>{property.title || "Untitled property"}</h1>
            <p className="location">
              {property.location || "Location not provided"}
            </p>
            <div className="database-detail-layout">
              <section>
                <div className="database-detail-image">
                  <PropertyPhoto
                    url={property.primaryImage}
                    title={property.title || "Property"}
                  />
                  <SavePropertyButton
                    property={property}
                    onLogin={() => onLogin("favorite")}
                  />
                </div>
                {property.images && property.images.length > 1 && (
                  <div className="database-detail-gallery">
                    {property.images.slice(1).map((url, index) => (
                      <PropertyPhoto
                        key={`${url}-${index}`}
                        url={url}
                        title={`${property.title || "Property"} photo ${index + 2}`}
                      />
                    ))}
                  </div>
                )}
                <section className="detail-section">
                  <h2>About this property</h2>
                  <p className="listing-description">
                    {property.description || "No description provided."}
                  </p>
                  <PropertyFacts property={property} />
                  {Boolean(property.amenities?.length)&&<><h3>Amenities</h3><div className="property-badges">{property.amenities?.map(a=><span className="badge" key={a.id}>{a.name}</span>)}</div></>}
                  <PropertyBadges property={property} />
                  {property.owner && (
                    <div className="listed-by-card">
                      <OwnerAvatar
                        name={property.owner.name}
                        url={property.owner.avatarUrl}
                      />
                      <div>
                        <small>LISTED BY · PROPERTY OWNER</small>
                        <h3>{property.owner.name}</h3>
                      </div>
                      <button
                        className="button button-secondary"
                        disabled={!allowed || chatBusy}
                        onClick={() => void chat()}
                      >
                        {chatBusy ? "Opening chat…" : "Chat with Owner"}
                      </button>
                    </div>
                  )}
                </section>
                <AvailabilitySummary ownerMode={Boolean(property.privatePreview)}
                  propertyId={property.id}
                  months={proposedMonths}
                  onCheck={() => setBookingOpen(true)}
                />
              </section>
              <aside className="booking-card">
                <div className="booking-price">
                  <strong>{rentLabel(property)}</strong>
                  {property.monthlyRent != null && <span> / month</span>}
                </div>
                <p>
                  Deposit:{" "}
                  {property.depositAmount == null
                    ? "Not provided"
                    : `${property.depositAmount.toLocaleString()} ${property.currency}`}
                </p>
                <p>
                  Available from:{" "}
                  {property.availableFrom
                    ? formatDate(property.availableFrom)
                    : "Not specified"}
                </p>
                <div className="rental-action-buttons">
                  <button
                    className="button button-primary"
                    disabled={!allowed || property.monthlyRent == null}
                    onClick={requestBooking}
                  >
                    Request Booking
                  </button>
                  <SavePropertyButton
                    panel
                    property={property}
                    onLogin={() => onLogin("favorite")}
                  />
                  <button
                    className="button button-secondary"
                    disabled={!allowed || chatBusy}
                    onClick={() => void chat()}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                    </svg>
                    {chatBusy ? "Opening chat…" : "Chat with Owner"}
                  </button>
                </div>
                {!allowed && (
                  <p className="booking-help">
                    {user?.id === property.owner?.id
                      ? "This is your listing. Manage booking requests and renter conversations in your owner workspace."
                      : "Booking, favorites, and owner chat require a renter account."}
                  </p>
                )}
                {property.monthlyRent == null && (
                  <p className="booking-help">
                    Booking is unavailable until the owner specifies a monthly
                    rent.
                  </p>
                )}
                {actionError && (
                  <p className="form-error-message" role="alert">
                    {actionError}
                  </p>
                )}
              </aside>
            </div>
            {bookingOpen && (
              <BookingForm
                property={property}
                initialStart={proposedStart}
                initialMonths={proposedMonths}
                onPeriodChange={(start, months) => {
                  setProposedStart(start)

                  setProposedMonths(months)
                }}
                onClose={() => setBookingOpen(false)}
                onBookings={onBookings}
                onLogin={() => onLogin("booking")}
              />
            )}
          </>
        )
      )}
    </div>
  )
}
