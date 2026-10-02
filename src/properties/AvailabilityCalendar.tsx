import {useAuth} from "../auth/AuthContext"
import { useEffect, useState } from "react"
import "./availability.css"
import { apiRequest } from "../lib/api"
import { addMonths, formatDate, overlaps } from "../../shared/rental-dates.js"
interface Period {
  startDate: string
  endDate: string
}
interface Availability {
  earliestMoveIn: string
  reserved: Period[]
  nextMoveIn: string | null
  months: number
  occupiedToday: boolean
}
interface Props {
  ownerMode?: boolean
  propertyId: number
  months?: number
  start?: string
  onSelect?: (date: string) => void
  refreshToken?: number
}
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
export default function AvailabilityCalendar({
  ownerMode = false,
  propertyId,
  months = 1,
  start = "",
  onSelect,
  refreshToken = 0,
}: Props) {
  const {user}=useAuth()
  const privatePrefix=user?.role==="admin"?"admin/":"owner/"
  const [data, setData] = useState<Availability | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [month, setMonth] = useState((start || today()).slice(0, 7))
  useEffect(() => {
    if (start) setMonth(start.slice(0, 7))
  }, [start])
  useEffect(() => {
    const controller = new AbortController()
    let fetching = false
    setData(null)
    setError("")
    const refresh = async () => {
      if (fetching) return
      fetching = true
      try {
        const result = await apiRequest<{ availability: Availability }>(
          `/${ownerMode ? privatePrefix : ""}properties/${propertyId}/availability?${new URLSearchParams({ months: String(months), from: start || today() })}`,
          { signal: controller.signal },
        )
        if (!controller.signal.aborted) {
          setData(result.availability)
          setError("")
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load availability",
          )
      } finally {
        fetching = false
      }
    }
    const update = () => void refresh()
    update()
    const timer = setInterval(update, 10000)
    window.addEventListener("rentnest:data-changed", update)
    window.addEventListener("focus", update)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("rentnest:data-changed", update)
      window.removeEventListener("focus", update)
    }
  }, [propertyId, months, start, retry, refreshToken, ownerMode, privatePrefix])
  const changeMonth = (offset: number) => {
    const date = new Date(month + "-01T00:00:00Z")
    date.setUTCMonth(date.getUTCMonth() + offset)
    setMonth(date.toISOString().slice(0, 7))
  }
  const first = new Date(month + "-01T00:00:00Z"),
    days = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate()
  let end = ""
  try {
    if (start) end = addMonths(start, months)
  } catch {}
  const clash =
    data && end
      ? data.reserved.some((p) => overlaps(start, end, p.startDate, p.endDate))
      : false
  return (
    <section
      className="availability-calendar"
      aria-label="Property availability calendar"
    >
      <h3>Availability calendar</h3>
      <p>
        Move-in is included. Checkout is excluded; the property can be booked
        again on checkout day. Approved and confirmed bookings reserve dates.
        Pending requests do not.
      </p>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry availability
          </button>
        </div>
      ) : !data ? (
        <div className="calendar-skeleton" role="status">
          Loading availability…
        </div>
      ) : (
        <>
          <p>
            {data.occupiedToday
              ? "Occupied today; future free periods can still be requested."
              : "No reservation occupies today."}{" "}
            Earliest move-in: {formatDate(data.earliestMoveIn)}.
          </p>
          <div className="calendar-navigation">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => changeMonth(-1)}
            >
              ←
            </button>
            <strong aria-live="polite">
              {new Intl.DateTimeFormat("en-GB", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(first)}
            </strong>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => changeMonth(1)}
            >
              →
            </button>
          </div>
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span className="calendar-weekday" key={day}>
                {day}
              </span>
            ))}
            {Array.from({ length: first.getUTCDay() }, (_, i) => (
              <span key={"blank" + i} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const date = month + "-" + String(index + 1).padStart(2, "0"),
                occupied = data.reserved.some(
                  (p) => date >= p.startDate && date < p.endDate,
                ),
                early = date < data.earliestMoveIn
              let fits = false
              try {
                fits = !data.reserved.some((p) =>
                  overlaps(
                    date,
                    addMonths(date, months),
                    p.startDate,
                    p.endDate,
                  ),
                )
              } catch {}
              const proposed = start && date >= start && date < end
              const label = early
                ? "Before earliest move-in"
                : occupied
                  ? "Reserved / occupied"
                  : !fits
                    ? "Free date, selected duration does not fit"
                    : "Selectable move-in"
              return (
                <button
                  type="button"
                  key={date}
                  className={`calendar-day ${
                    occupied
                      ? "reserved"
                      : early || !fits
                        ? "unavailable"
                        : "selectable"
                  } ${proposed ? "proposed" : ""}`}
                  disabled={early || occupied || !fits || !onSelect}
                  aria-label={`${formatDate(date)}: ${label}${
                    proposed ? ", proposed period" : ""
                  }`}
                  aria-pressed={Boolean(proposed)}
                  onClick={() => onSelect?.(date)}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
          <div className="calendar-legend">
            <span className="reserved">Reserved / occupied</span>
            <span className="selectable">Selectable move-in</span>
            <span className="unavailable">
              Before availability / duration does not fit
            </span>
            <span className="proposed">Proposed rental period</span>
          </div>
          {start && (
            <p role="status">
              Proposed: {formatDate(start)} → {formatDate(end)} checkout.{" "}
              {clash
                ? "This period overlaps a reservation."
                : "The server rechecks the full period before submission."}
            </p>
          )}
          <p>
            Next free move-in for {months} {months === 1 ? "month" : "months"}:{" "}
            <strong>
              {data.nextMoveIn
                ? formatDate(data.nextMoveIn)
                : "No valid period within the supported date range"}
            </strong>
          </p>
          {onSelect && data.nextMoveIn && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => data.nextMoveIn && onSelect(data.nextMoveIn)}
            >
              Use next free date
            </button>
          )}
        </>
      )}
    </section>
  )
}
