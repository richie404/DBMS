import AvailabilityCalendar from "./AvailabilityCalendar"

import { useAuth } from "../auth/AuthContext"

import { addMonths, formatDate } from "../../shared/rental-dates.js"

import { ApiError } from "../lib/api"

import { useEffect, useRef, useState } from "react"

import { type Property } from "../services/properties"

import { rentalService, type BookingQuote } from "../services/rentals"

import { rentLabel } from "./PropertyCard"

export default function BookingForm({
  property,

  onClose,

  onBookings,

  onLogin,

  initialStart = "",

  initialMonths = 1,

  onPeriodChange,
}: {
  property: Property

  onClose: () => void

  onBookings: () => void

  onLogin: () => void

  initialStart?: string

  initialMonths?: number

  onPeriodChange?: (start: string, months: number) => void
}) {
  const { user } = useAuth()

  const [moveIn, setMoveIn] = useState(initialStart)

  const [months, setMonths] = useState(initialMonths)

  const [calendarRefresh, setCalendarRefresh] = useState(0)

  let checkout = ""

  try {
    if (moveIn) checkout = addMonths(moveIn, months)
  } catch {}

  const dates = { startDate: moveIn, endDate: checkout }

  const [quote, setQuote] = useState<BookingQuote | null>(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const busy = useRef(false)

  const revision = useRef(0)

  const abort = useRef<AbortController | null>(null)

  const root = useRef<HTMLElement | null>(null)

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  }).format(new Date())

  const minStart =
    property.availableFrom && property.availableFrom.slice(0, 10) > today
      ? property.availableFrom.slice(0, 10)
      : today

  useEffect(() => {
    const old = document.activeElement as HTMLElement | null

    root.current?.querySelector<HTMLElement>("button,input")?.focus()

    return () => {
      abort.current?.abort()

      revision.current++

      old?.focus()
    }
  }, [])

  const change = (key: "startDate" | "months", value: string) => {
    revision.current++

    abort.current?.abort()

    busy.current = false

    setLoading(false)

    if (key === "startDate") {
      setMoveIn(value)

      onPeriodChange?.(value, months)
    } else {
      setMonths(Number(value))

      onPeriodChange?.(moveIn, Number(value))
    }

    setQuote(null)

    setError("")
  }

  const review = async () => {
    if (!user) {
      onLogin()
      return
    }

    if (user.role !== "renter") return

    if (busy.current) return

    busy.current = true

    setLoading(true)

    setError("")

    const current = ++revision.current

    const controller = new AbortController()

    abort.current = controller

    try {
      const result = await rentalService.quote(
        property.id,

        dates.startDate,

        months,

        controller.signal,
      )

      if (current === revision.current) setQuote(result.quote)
    } catch (error) {
      if (
        current === revision.current &&
        error instanceof ApiError &&
        error.status === 409
      ) {
        setCalendarRefresh((n) => n + 1)

        setQuote(null)
      }

      if (current === revision.current)
        setError(
          error instanceof Error
            ? error.message
            : "Unable to calculate booking",
        )
    } finally {
      if (current === revision.current) {
        setLoading(false)

        busy.current = false
      }
    }
  }

  const submit = async () => {
    if (!user) {
      onLogin()
      return
    }

    if (user.role !== "renter") return

    if (busy.current || !quote) return

    busy.current = true

    setLoading(true)

    setError("")

    const current = ++revision.current

    try {
      const result = await rentalService.book(property.id, quote)

      if (current === revision.current) setSuccess(result.booking.bookingCode)
    } catch (error) {
      if (
        current === revision.current &&
        error instanceof ApiError &&
        error.status === 409
      ) {
        setQuote(null)

        setCalendarRefresh((n) => n + 1)
      }

      if (current === revision.current)
        setError(
          error instanceof Error ? error.message : "Unable to request booking",
        )
    } finally {
      if (current === revision.current) {
        busy.current = false

        setLoading(false)
      }
    }
  }

  const close = () => {
    if (!loading) onClose()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <section
        ref={root}
        className="modal rental-booking-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rental-booking-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault()

            close()
          }

          if (event.key === "Tab") {
            const controls = root.current?.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input:not(:disabled), a[href]",
            )

            if (controls?.length) {
              const first = controls[0],
                last = controls[controls.length - 1]

              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()

                last.focus()
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()

                first.focus()
              }
            }
          }
        }}
      >
        <div className="modal-header">
          <h2 id="rental-booking-title">
            {success ? "Booking request sent" : "Request Booking"}
          </h2>
          <button
            className="icon-button"
            aria-label="Close booking form"
            disabled={loading}
            onClick={close}
          >
            ×
          </button>
        </div>
        <h3>{property.title || "Property"}</h3>
        <p>
          {rentLabel(property)} / month · Deposit:{" "}
          {property.depositAmount == null
            ? "Not specified"
            : `${property.depositAmount.toLocaleString()} ${property.currency}`}
        </p>
        <p className="booking-owner">
          Listed by:{" "}
          <strong>
            {quote?.owner?.name ||
              property.owner?.name ||
              "Owner details unavailable"}
          </strong>
        </p>
        {success ? (
          <>
            <p role="status">
              Request {success} is pending the owner's review. Your booking is
              not confirmed.
            </p>
            <button className="button button-primary" onClick={onBookings}>
              View My Bookings
            </button>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault()

              void (quote ? submit() : review())
            }}
          >
            <p className="booking-policy">
              Rent is charged for whole calendar months. The deposit is separate
              from the rental total. If no deposit is specified, the request
              records zero deposit. No payment is taken when requesting.
            </p>
            <div className="booking-date-fields">
              <label>
                <span>Move-in date</span>
                <input
                  type="date"
                  value={dates.startDate}
                  min={minStart}
                  required
                  disabled={loading}
                  onChange={(event) => change("startDate", event.target.value)}
                />
              </label>
              <label>
                <span>Rental duration (whole months)</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  value={months || ""}
                  required
                  disabled={loading}
                  onChange={(event) => change("months", event.target.value)}
                />
              </label>
            </div>
            <p>
              Checkout date (not occupied):{" "}
              <output aria-live="polite">
                {checkout
                  ? formatDate(checkout)
                  : "Choose a move-in date and duration"}
              </output>
            </p>
            <p>
              Dates use YYYY-MM-DD without timezone conversion. Month ends clamp
              to the last day of the target month.
            </p>
            <AvailabilityCalendar ownerMode={Boolean(property.privatePreview)}
              propertyId={property.id}
              months={months}
              start={moveIn}
              onSelect={
                loading ? undefined : (date) => change("startDate", date)
              }
              refreshToken={calendarRefresh}
            />
            {!user && checkout && property.monthlyRent != null && (
              <div className="booking-quote">
                <p>
                  {months} {months === 1 ? "month" : "months"} · Move-in:{" "}
                  {formatDate(moveIn)} · Checkout: {formatDate(checkout)}{" "}
                  (excluded)
                </p>
                <strong>
                  Estimated rental total:{" "}
                  {((property.monthlyRent ?? 0) * months).toLocaleString()}{" "}
                  {property.currency}
                </strong>
                <p>
                  Separate deposit:{" "}
                  {(property.depositAmount ?? 0).toLocaleString()}{" "}
                  {property.currency}. The server rechecks dates and prices
                  after sign-in.
                </p>
              </div>
            )}
            {!user && (
              <p>
                Sign in with a renter account to review and submit a booking.
                Checking availability does not reserve dates.
              </p>
            )}
            {quote && (
              <div className="booking-quote" role="status">
                <p>
                  Move-in: {formatDate(quote.startDate)} | Checkout:{" "}
                  {formatDate(quote.endDate)} (excluded)
                </p>
                <p>
                  Listed by:{" "}
                  {quote.owner?.name ||
                    property.owner?.name ||
                    "Owner details unavailable"}
                </p>
                <p>
                  {quote.months} {quote.months === 1 ? "month" : "months"} ×{" "}
                  {quote.monthlyRent.toLocaleString()} {quote.currency}
                </p>
                <strong>
                  Rental total: {quote.totalRent.toLocaleString()}{" "}
                  {quote.currency}
                </strong>
                <p>
                  Separate deposit: {quote.depositAmount.toLocaleString()}{" "}
                  {quote.currency}
                </p>
              </div>
            )}
            {error && (
              <p className="form-error-message" role="alert">
                {error}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setQuote(null)

                    setError("")
                  }}
                >
                  Review dates and price
                </button>
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                disabled={loading}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={
                  loading ||
                  Boolean(user && user.role !== "renter") ||
                  property.monthlyRent == null
                }
              >
                {!user
                  ? "Sign in to request booking"
                  : user.role !== "renter"
                    ? "A renter account is required"
                    : loading
                      ? quote
                        ? "Sending request…"
                        : "Calculating…"
                      : quote
                        ? "Confirm Booking Request"
                        : "Review request"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
