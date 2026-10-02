import {useAuth} from "../auth/AuthContext"
import { useEffect, useState } from "react"
import { apiRequest } from "../lib/api"
import { formatDate } from "../../shared/rental-dates.js"
type Availability = {
  earliestMoveIn: string
  nextMoveIn: string | null
  occupiedToday: boolean
}
export default function AvailabilitySummary({
  ownerMode = false,
  propertyId,
  months,
  onCheck,
}: {
  ownerMode?: boolean
  propertyId: number
  months: number
  onCheck: () => void
}) {
  const {user}=useAuth()
  const privatePrefix=user?.role==="admin"?"admin/":"owner/"
  const [data, setData] = useState<Availability | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0)
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
          `/${ownerMode ? privatePrefix : ""}properties/${propertyId}/availability?months=${months}`,
          { signal: controller.signal },
        )
        if (!controller.signal.aborted) {
          setData(result.availability)
          setError("")
        }
      } catch (caught) {
        if (!controller.signal.aborted)
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load availability",
          )
      } finally {
        fetching = false
      }
    }
    const update = () => void refresh()
    update()
    const timer = setInterval(update, 10000)
    window.addEventListener("focus", update)
    window.addEventListener("rentnest:data-changed", update)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("focus", update)
      window.removeEventListener("rentnest:data-changed", update)
    }
  }, [propertyId, months, retry, ownerMode, privatePrefix])
  return (
    <section className="availability-summary" aria-label="Availability summary">
      <h3>Availability</h3>
      {error ? (
        <p role="alert">
          {error}{" "}
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            Retry availability
          </button>
        </p>
      ) : !data ? (
        <p role="status">Loading availability…</p>
      ) : (
        <>
          <p>
            {data.occupiedToday
              ? "Occupied today; future free periods can still be requested."
              : "No reservation occupies today."}
          </p>
          <p>
            Next free move-in for {months} {months === 1 ? "month" : "months"}:{" "}
            <strong>
              {data.nextMoveIn
                ? formatDate(data.nextMoveIn)
                : "No valid period within the supported date range"}
            </strong>
            .
          </p>
        </>
      )}
      <button
        type="button"
        className="button button-secondary"
        onClick={onCheck}
      >
        Check availability
      </button>
    </section>
  )
}
