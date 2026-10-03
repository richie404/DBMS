import { useEffect, useMemo, useState } from "react"
import { Button, Modal, StatusBadge } from "../components/system"
import { apiRequest } from "../lib/api"
import type { Property } from "../services/properties"

type ModerationStatus = "all" | "draft" | "pending" | "approved" | "rejected"

const formatMoney = (value: number | null, currency: string) =>
  `${currency} ${Number(value ?? 0).toLocaleString()}`

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

const toneFor = (status?: string) =>
  status === "approved" ? "success" : status === "rejected" ? "danger" : status === "pending" ? "warning" : "neutral"

export default function AdminListings() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ModerationStatus>("all")
  const [selected, setSelected] = useState<Property | null>(null)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    apiRequest<{ properties: Property[] }>("/admin/properties", { signal: controller.signal })
      .then((data) => { if (!controller.signal.aborted) setProperties(data.properties) })
      .catch((requestError: Error) => { if (!controller.signal.aborted) setError(requestError.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [refresh])

  const counts = useMemo(() => ({
    all: properties.length,
    pending: properties.filter((property) => property.moderationStatus === "pending").length,
    approved: properties.filter((property) => property.moderationStatus === "approved").length,
    rejected: properties.filter((property) => property.moderationStatus === "rejected").length,
  }), [properties])
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return properties.filter((property) => {
      const matchesStatus = status === "all" || property.moderationStatus === status
      const haystack = [property.title, property.location, property.ownerName, property.owner?.name, property.id].join(" ").toLowerCase()
      return matchesStatus && (!term || haystack.includes(term))
    })
  }, [properties, search, status])

  const openReview = (property: Property) => {
    setSelected(property)
    setReason(property.rejectionReason ?? "")
    setActionError("")
  }
  const decide = async (decision: "approved" | "rejected") => {
    if (!selected || busy) return
    setBusy(true)
    setActionError("")
    try {
      await apiRequest(`/admin/properties/${selected.id}/moderation`, {
        method: "PATCH", csrf: true,
        body: { status: decision, reason: decision === "rejected" ? reason : undefined },
      })
      setSelected(null)
      setRefresh((value) => value + 1)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Unable to save the review")
    } finally { setBusy(false) }
  }

  return <section className="admin-listing-workspace">
    <header className="admin-listings-head">
      <div><p className="eyebrow">CONTENT MODERATION</p><h1>Listing Management</h1><p>Review every database listing. Approval publishes a listing; rejection returns it to its owner with your feedback.</p></div>
      <Button variant="secondary" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>{loading ? "Refreshing…" : "Refresh listings"}</Button>
    </header>
    <div className="admin-listing-metrics" aria-label="Listing totals">
      {([['all', 'All listings', counts.all], ['pending', 'Needs review', counts.pending], ['approved', 'Published', counts.approved], ['rejected', 'Needs changes', counts.rejected]] as const).map(([key, label, count]) =>
        <button key={key} className={status === key || key === "all" && status === "all" ? "active" : ""} onClick={() => setStatus(key)}><strong>{count}</strong><span>{label}</span></button>
      )}
    </div>
    <div className="admin-listing-filters">
      <label>Search listings<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, location, owner, or ID" /></label>
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as ModerationStatus)}><option value="all">All statuses</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="draft">Draft</option></select></label>
      <p>{visible.length} of {properties.length} listings shown</p>
    </div>
    {error ? <div className="listing-state" role="alert"><h2>Listings could not be loaded</h2><p>{error}</p><Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>Try again</Button></div> : loading ? <div className="admin-listing-loading">Loading listings from the database…</div> : visible.length ? <div className="admin-listing-grid">
      {visible.map((property) => <article className="admin-listing-card" key={property.id}>
        <div className="admin-listing-photo">{property.primaryImage ? <img src={property.primaryImage} alt="" /> : <span>No photo uploaded</span>}<StatusBadge tone={toneFor(property.moderationStatus)}>{property.moderationStatus ?? "draft"}</StatusBadge></div>
        <div className="admin-listing-card-body"><div className="admin-listing-card-title"><div><p>PROPERTY #{property.id}</p><h2>{property.title || "Untitled listing"}</h2></div><span>{property.propertyType}</span></div>
          <p className="admin-listing-location">{property.location || "Location not provided"}</p>
          <dl><div><dt>Owner</dt><dd>{property.ownerName || property.owner?.name || "Unknown owner"}</dd></div><div><dt>Monthly rent</dt><dd>{formatMoney(property.monthlyRent, property.currency)}</dd></div><div><dt>Submitted</dt><dd>{formatDate(property.createdAt)}</dd></div></dl>
          <footer><Button variant="secondary" onClick={() => openReview(property)}>View details</Button>{property.moderationStatus === "pending" && <Button onClick={() => openReview(property)}>Review now</Button>}</footer>
        </div>
      </article>)}
    </div> : <div className="listing-state"><h2>No listings match these filters</h2><p>Change the status or search text to see other database listings.</p></div>}
    <Modal open={Boolean(selected)} onClose={() => { if (!busy) setSelected(null) }} title={selected ? `Review listing #${selected.id}` : "Review listing"} variant="details" footer={selected?.moderationStatus === "pending" ? <><Button variant="destructive" disabled={busy} onClick={() => void decide("rejected")}>{busy ? "Saving…" : "Reject listing"}</Button><Button disabled={busy} onClick={() => void decide("approved")}>{busy ? "Saving…" : "Approve listing"}</Button></> : <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}>
      {selected && <div className="admin-listing-review"><div className="listing-review-top"><StatusBadge tone={toneFor(selected.moderationStatus)}>{selected.moderationStatus ?? "draft"}</StatusBadge><span>Owner: <strong>{selected.ownerName || selected.owner?.name || "Unknown"}</strong></span></div><h3>{selected.title || "Untitled listing"}</h3><p className="admin-listing-location">{selected.location || "Location not provided"} · {selected.propertyType} · {formatMoney(selected.monthlyRent, selected.currency)} per month</p><div className="listing-review-facts"><span><b>{selected.bedrooms ?? "—"}</b> Bedrooms</span><span><b>{selected.bathrooms ?? "—"}</b> Bathrooms</span><span><b>{selected.sizeSqft ?? "—"}</b> Sq ft</span><span><b>{selected.furnished ? "Yes" : "No"}</b> Furnished</span></div><p className="listing-review-description">{selected.description || "The owner did not provide a description."}</p>{selected.moderationStatus === "pending" && <label className="listing-rejection-field">Rejection reason <small>Required only if you reject this listing. It will be sent to the owner.</small><textarea value={reason} maxLength={1000} disabled={busy} onChange={(event) => setReason(event.target.value)} placeholder="Explain what the owner needs to change" /></label>}{selected.moderationStatus === "rejected" && <div className="listing-existing-rejection"><strong>Reason sent to owner</strong><p>{selected.rejectionReason || "No reason recorded."}</p></div>}{actionError && <p className="form-error-message" role="alert">{actionError}</p>}</div>}
    </Modal>
  </section>
}
