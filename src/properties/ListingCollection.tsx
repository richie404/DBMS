import { useEffect, useState } from "react"
import { apiRequest } from "../lib/api"
import {
  propertyService,
  emptyCriteria,
  type Property,
} from "../services/properties"
import PropertyCard, { ListingSkeletons } from "./PropertyCard"
interface Props {
  mode?: "public" | "owner" | "admin"
  onView: (id: number) => void
  onLogin: () => void
  compact?: boolean
}
export default function ListingCollection({
  mode = "public",
  onView,
  onLogin,
  compact = false,
}: Props) {
  const [properties, setProperties] = useState<Property[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [edit, setEdit] = useState<Property | null>(null),
    [busy, setBusy] = useState(false),
    [editError, setEditError] = useState("")
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    const load =
      mode === "public"
        ? propertyService.list(emptyCriteria, 1, controller.signal)
        : apiRequest<{ properties: Property[] }>(`/${mode}/properties`, {
            signal: controller.signal,
          })
    load
      .then((data) => {
        if (!controller.signal.aborted) setProperties(data.properties)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [mode, retry])
  const save = async () => {
    if (!edit || busy) return
    setBusy(true)
    setEditError("")
    try {
      await apiRequest(`/owner/properties/${edit.id}`, {
        method: "PATCH",
        csrf: true,
        body: {
          title: edit.title,
          monthlyRent: edit.monthlyRent,
          depositAmount: edit.depositAmount ?? 0,
          availableFrom: edit.availableFrom || null,
          isAvailable: Boolean(edit.isAvailable),
        },
      })
      setEdit(null)
      setRetry((n) => n + 1)
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Unable to update listing",
      )
    } finally {
      setBusy(false)
    }
  }
  const resubmit = async (property: Property) => {
    if (busy) return
    setBusy(true)
    setError("")
    try {
      await apiRequest(`/owner/properties/${property.id}`, {
        method: "PATCH",
        csrf: true,
        body: { resubmitForReview: true },
      })
      setRetry((n) => n + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to submit listing for review")
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="listing-collection">
      {mode !== "public" && (
        <div className="listing-section-heading">
          <div>
            <h1>
              {mode === "owner" ? "Your Properties" : "Listing Management"}
            </h1>
            <p>
              {properties.length} database listings. Occupancy is managed by
              reservations, separately from publication.
            </p>
          </div>
        </div>
      )}
      {error ? (
        <div role="alert" className="listing-state">
          <p>{error}</p>
          <button
            className="button button-secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry listings
          </button>
        </div>
      ) : loading ? (
        <div className="database-property-grid">
          <ListingSkeletons />
        </div>
      ) : properties.length ? (
        <div className="database-property-grid">
          {properties
            .slice(0, mode === "public" ? 6 : compact ? 3 : properties.length)
            .map((property) => (
              <div key={property.id}>
                <PropertyCard
                  property={property}
                  onView={onView}
                  onLogin={onLogin}
                />
                {mode !== "public" && (
                  <div className="management-listing-controls">
                    <p>
                      Property #{property.id} · {property.moderationStatus} ·{" "}
                      {property.isAvailable
                        ? "Accepting future requests"
                        : "Withdrawn by owner"}
                    </p>
                    {mode === "owner" && (
                      <>
                        <button
                          className="button button-secondary"
                          onClick={() => {
                            setEdit(property)
                            setEditError("")
                          }}
                        >
                          Edit listing availability
                        </button>
                        {["draft", "rejected"].includes(property.moderationStatus ?? "") && (
                          <button className="button button-primary" disabled={busy} onClick={() => void resubmit(property)}>
                            {busy ? "Submitting…" : "Submit for admin review"}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      ) : (
        <div className="listing-state">
          <h2>No properties yet</h2>
          <p>Database listings will appear here.</p>
        </div>
      )}
      {edit && (
        <div className="modal-backdrop">
          <section
            className="modal rental-booking-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-edit-title"
            onKeyDown={(event) => {
              if (event.key === "Escape" && !busy) setEdit(null)
            }}
          >
            <h2 id="listing-edit-title">Edit listing #{edit.id}</h2>
            <p>Listed by {edit.ownerName}. Ownership cannot be changed here.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void save()
              }}
            >
              <div className="booking-date-fields">
                <label>
                  Title
                  <input
                    autoFocus
                    required
                    value={edit.title ?? ""}
                    maxLength={200}
                    disabled={busy}
                    onChange={(e) =>
                      setEdit({ ...edit, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  Monthly rent (BDT)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={edit.monthlyRent ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      setEdit({ ...edit, monthlyRent: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Separate deposit (BDT)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={edit.depositAmount ?? 0}
                    disabled={busy}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        depositAmount: Number(e.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Earliest move-in date
                  <input
                    type="date"
                    value={edit.availableFrom ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      setEdit({ ...edit, availableFrom: e.target.value })
                    }
                  />
                </label>
              </div>
              <label className="listing-publication-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(edit.isAvailable)}
                  disabled={busy}
                  onChange={(e) =>
                    setEdit({ ...edit, isAvailable: e.target.checked })
                  }
                />
                Accept requests for future free periods (uncheck to withdraw)
              </label>
              {editError && <p role="alert">{editError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => setEdit(null)}
                >
                  Cancel
                </button>
                <button className="button button-primary" disabled={busy}>
                  {busy ? "Saving…" : "Save listing"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}
