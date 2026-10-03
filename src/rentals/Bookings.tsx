import { useEffect, useState } from "react"
import { useAuth } from "../auth/AuthContext"
import { rentalService, type Booking } from "../services/rentals"

export default function Bookings({
  filter,
  onFilter,
  onProperty,
  onChat,
}: {
  filter: string
  onFilter: (filter: string) => void
  onProperty: (id: number) => void
  onChat: (id: number) => void
}) {
  const { user } = useAuth()
  const owner = user?.role === "owner"
  const renter = user?.role === "renter"
  const admin = user?.role === "admin"
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const status = filter,
    setStatus = onFilter
  const [total, setTotal] = useState(0)
  const [confirmation, setConfirmation] = useState<{
    booking: Booking
    action: string
  } | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    setLoading(true)
    const controller = new AbortController()
    let fetching = false
    const refresh = async () => {
      if (fetching) return
      fetching = true
      try {
        const result = await rentalService.bookings(controller.signal, status)
        if (!controller.signal.aborted) {
          setBookings(result.bookings)
          setTotal(result.total)
          setError("")
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Unable to load bookings",
          )
      } finally {
        fetching = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [retry, status])
  const act = async () => {
    if (!confirmation || busy) return
    setBusy(true)
    setError("")
    try {
      if (confirmation.action === "cancelled")
        await rentalService.cancel(confirmation.booking.id)
      else
        await rentalService.decision(
          confirmation.booking.id,
          confirmation.action,
          reason,
        )
      setConfirmation(null)
      setRetry((value) => value + 1)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update booking",
      )
    } finally {
      setBusy(false)
    }
  }
  const visible = bookings
  return (
    <div
      className={
        owner
          ? "owner-bookings-page live-bookings"
          : "bookings-page live-bookings"
      }
    >
      <div className="listing-section-heading">
        <div>
          <p className="eyebrow">
            {owner ? "OWNER WORKSPACE" : "YOUR RENTALS"}
          </p>
          <h1>
            {admin
              ? "Booking Management"
              : owner
                ? "Booking Requests"
                : "My Bookings"}
          </h1>
          <p>{total} matching bookings · Updated automatically</p>
        </div>
        <label className="listing-sort">
          <span>Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            {[
              "active",
              "pending",
              "approved",
              "confirmed",
              "rejected",
              "cancelled",
            ].map((value) => (
              <option value={value} key={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <div className="listing-state" role="alert">
          <p>{error}</p>
          <button
            className="button button-secondary"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p role="status">Loading bookings…</p>
      ) : visible.length ? (
        <div className="live-booking-list">
          {visible.map((booking) => (
            <article className="live-booking-card" key={booking.id}>
              <header>
                <div>
                  <small>{booking.bookingCode || `RN-${booking.id}`}</small>
                  <h2>{booking.title || "Property"}</h2>
                  <p>{booking.location}</p>
                </div>
                <span className="badge">{booking.status}</span>
              </header>
              <div className="live-booking-facts">
                <p>
                  {owner ? "Renter" : "Owner"}:{" "}
                  <strong>
                    {owner ? booking.renterName : booking.ownerName}
                  </strong>
                </p>
                <p>
                  Move-in: {booking.startDate} · Checkout: {booking.endDate}{" "}
                  (excluded)
                </p>
                <p>
                  Rental total:{" "}
                  <strong>
                    {Number(booking.totalRent).toLocaleString()}{" "}
                    {booking.currency}
                  </strong>
                </p>
                <p>
                  Separate deposit:{" "}
                  {Number(booking.depositAmount).toLocaleString()}{" "}
                  {booking.currency}
                </p>
              </div>
              {booking.decisionReason && (
                <p>Owner's reason: {booking.decisionReason}</p>
              )}
              <details className="live-booking-details">
                <summary>Booking details</summary>
                <p>
                  Booking: {booking.bookingCode || `RN-${booking.id}`} · Status:{" "}
                  {booking.status}
                </p>
                <p>
                  Monthly rent at booking:{" "}
                  {Number(booking.monthlyRent).toLocaleString()}{" "}
                  {booking.currency}
                </p>
                <p>
                  Rental period: {booking.startDate} to {booking.endDate}.
                  Checkout is not occupied; an adjacent rental may start that
                  day.
                </p>
              </details>
              <footer>
                <button
                  className="button button-secondary"
                  onClick={() => onProperty(booking.propertyId)}
                >
                  View Property
                </button>
                {owner && booking.status === "pending" ? (
                  <>
                    <button
                      className="button button-primary"
                      onClick={() => {
                        setConfirmation({ booking, action: "approved" })
                        setReason("")
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="button button-secondary"
                      onClick={() => {
                        setConfirmation({ booking, action: "rejected" })
                        setReason("")
                      }}
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  renter &&
                  ["pending", "approved"].includes(booking.status) && (
                    <button
                      className="button button-secondary"
                      onClick={() =>
                        setConfirmation({ booking, action: "cancelled" })
                      }
                    >
                      Cancel request
                    </button>
                  )
                )}
                {owner && booking.status === "approved" && (
                  <button
                    className="button button-primary"
                    onClick={() =>
                      setConfirmation({ booking, action: "confirmed" })
                    }
                  >
                    Confirm booking
                  </button>
                )}
                {renter && (
                  <button
                    className="button button-secondary"
                    onClick={() => onChat(booking.propertyId)}
                  >
                    Chat with Owner
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="listing-state">
            <h2>
              {status === "active"
                ? "No active bookings."
                : status === "pending"
                  ? "No pending requests."
                  : "No booking requests found."}
            </h2>
            <p>
              {status
                ? "Try another status filter."
                : owner
                  ? "Requests for your properties will appear here."
                  : "Open a property and choose Request Booking."}
            </p>
            {status && (
              <button
                className="button button-secondary"
                onClick={() => onFilter("")}
              >
                View all bookings
              </button>
            )}
          </div>
        )
      )}
      {confirmation && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-decision-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !busy) setConfirmation(null)
            }}
          >
            <h2 id="booking-decision-title">
              {confirmation.action === "confirmed"
                ? "Confirm this approved booking?"
                : confirmation.action === "approved"
                  ? "Approve this booking request?"
                  : confirmation.action === "rejected"
                    ? "Reject this booking request?"
                    : "Cancel this booking request?"}
            </h2>
            <p>
              {confirmation.booking.title} · {confirmation.booking.startDate} –{" "}
              {confirmation.booking.endDate} (checkout, excluded)
            </p>
            {confirmation.action === "rejected" && (
              <label className="rental-reason">
                <span>Reason (optional)</span>
                <textarea
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            )}
            {error && <p role="alert">{error}</p>}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                autoFocus
                disabled={busy}
                onClick={() => setConfirmation(null)}
              >
                Back
              </button>
              <button
                className="button button-primary"
                disabled={busy}
                onClick={() => void act()}
              >
                {busy ? "Updating…" : "Confirm"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
