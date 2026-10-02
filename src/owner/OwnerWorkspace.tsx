import { useEffect, useRef, useState } from "react"
import { apiRequest } from "../lib/api"
import { useAuth } from "../auth/AuthContext"
import { authService } from "../services/auth"
import type { Notice } from "../services/rentals"
import { propertyTypes } from "../services/properties"
import {PropertyPhoto} from "../properties/PropertyCard"
import AvailabilityCalendar from "../properties/AvailabilityCalendar"
import "./owner.css"
export const changed = () =>
  window.dispatchEvent(new Event("rentnest:data-changed"))
export function useOwnerData<T>(path: string, enabled = true) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!enabled) {
      setData(null)
      return
    }
    const controller = new AbortController()
    let busy = false,
      again = false
    setData(null)
    setError("")
    const load = async () => {
      if (busy) {
        again = true
        return
      }
      busy = true
      try {
        const result = await apiRequest<T>(path, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setData(result)
          setError("")
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Unable to load owner records",
          )
      } finally {
        busy = false
        if (again && !controller.signal.aborted) {
          again = false
          void load()
        }
      }
    }
    const refresh = () => void load()
    refresh()
    const timer = setInterval(refresh, 10000)
    window.addEventListener("rentnest:data-changed", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("rentnest:data-changed", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [path, enabled, retry])
  return { data, error, retry: () => setRetry((n) => n + 1) }
}
function State({
  state,
}: {
  state: { error: string; data: unknown; retry: () => void }
}) {
  return state.error ? (
    <div className="listing-state" role="alert">
      <p>{state.error}</p>
      <button className="button button-secondary" onClick={state.retry}>
        Retry
      </button>
    </div>
  ) : !state.data ? (
    <p role="status">Loading owner records…</p>
  ) : null
}
interface Summary {
  counts: {
    totalProperties: number
    availableProperties: number
    pendingRequests: number
    activeBookings: number
    unreadMessages: number
  }
  payments: { currency: string; amount: string }[]
}
export function useOwnerSummary(enabled: boolean) {
  return useOwnerData<Summary>("/owner/summary", enabled)
}
interface Listing {
  id: number
  title: string | null
  location: string | null
  monthlyRent: number | null
  currency: string
  moderationStatus: string
  isAvailable: boolean
  occupiedToday: boolean
  availableFrom: string | null
  primaryImage: string | null
  rejectionReason: string | null
}
type Go = (
  page: string,
  options?: { filter?: string; property?: number; conversation?: number },
) => void
function OwnerDashboard({
  state,
  go,
  onView,
  onRead,
}: {
  state: ReturnType<typeof useOwnerSummary>
  go: Go
  onView: (id: number) => void
  onRead: (id:number)=>void
}) {
  const listings = useOwnerData<{ properties: Listing[] }>("/owner/properties")
  const notices = useOwnerData<{ notifications: Notice[] }>("/notifications")
  return (
    <div className="owner-dashboard owner-live">
      <div className="owner-page-head">
        <div>
          <h1>Your rental business</h1>
          <p>Manage your listings, requests and conversations.</p>
        </div>
        <button
          className="button button-primary"
          onClick={() => go("Owner add property")}
        >
          Add Property
        </button>
      </div>
      <State state={state} />
      {state.data && !state.error && (
        <div className="owner-metric-grid">
          {([
            [
              "Total Properties",
              state.data.counts.totalProperties,
              "Owner listings",
              "",
            ],
            [
              "Published · accepting requests",
              state.data.counts.availableProperties,
              "Owner listings",
              "available",
            ],
            [
              "Pending Requests",
              state.data.counts.pendingRequests,
              "Owner booking requests",
              "pending",
            ],
            [
              "Active Bookings",
              state.data.counts.activeBookings,
              "Owner booking requests",
              "active",
            ],
            [
              "Unread incoming messages",
              state.data.counts.unreadMessages,
              "Owner messages",
              "unread",
            ],
          ] as const).map(([label, count, page, filter]) => (
            <button
              className="metric-card"
              key={label}
              onClick={() => go(page, { filter })}
            >
              <span>{label}</span>
              <strong>{count}</strong>
              <small>View records →</small>
            </button>
          ))}
          {state.data.payments.length > 0 && (
            <button
              className="metric-card"
              onClick={() => go("Owner earnings")}
            >
              <span>Completed payouts received</span>
              {state.data.payments.map((p) => (
                <strong key={p.currency}>
                  {Number(p.amount).toLocaleString()} {p.currency}
                </strong>
              ))}
              <small>View payment records →</small>
            </button>
          )}
        </div>
      )}
      <p className="owner-help">
        Publication and accepting requests are separate from occupancy. Occupied
        properties can accept future free periods. Active bookings are
        approved/confirmed reservations ending after today.
      </p>
      <section>
        <div className="owner-page-head">
          <h2>Your Properties</h2>
          <button
            className="button button-secondary"
            onClick={() => go("Owner listings")}
          >
            Manage Listings
          </button>
        </div>
        <State state={listings} />
        {listings.data && !listings.error && (
          <div className="owner-property-grid">
            {listings.data.properties.slice(0, 3).map((p) => (
              <ListingCard
                key={p.id}
                property={p}
                onView={onView}
                onEdit={(id) => go("Owner edit property", { property: id })}
              />
            ))}
            {!listings.data.properties.length && (
              <p>No properties yet. Create your first listing.</p>
            )}
          </div>
        )}
      </section>
      <section>
        <div className="owner-page-head">
          <h2>Recent activity</h2>
          <button
            className="button button-secondary"
            onClick={() => go("Owner notifications")}
          >
            All Notifications
          </button>
        </div>
        <State state={notices} />
        {notices.data && !notices.error && (
          <div className="owner-activity">
            {notices.data.notifications.slice(0, 5).map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  onRead(n.id)
                  if (n.conversationId)
                    go("Owner messages", { conversation: n.conversationId })
                  else if (n.bookingId)
                    go("Owner booking requests", {
                      filter: "booking:" + n.bookingId,
                    })
                  else if (n.propertyId) onView(n.propertyId)
                }}
              >
                <strong>{n.title}</strong>
                <span>{n.body}</span>
                <time>{new Date(n.createdAt).toLocaleString()}</time>
              </button>
            ))}
            {!notices.data.notifications.length && (
              <p>No recent activity yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
function ListingCard({
  property: p,
  onView,
  onEdit,
}: {
  property: Listing
  onView: (id: number) => void
  onEdit: (id: number) => void
}) {
  return (
    <article className="owner-property-card">
      <div className="owner-property-image"><PropertyPhoto url={p.primaryImage} title={p.title||"Property"}/></div>
      <div>
        <span className="badge">
          {p.moderationStatus === "pending"
            ? "Awaiting approval"
            : p.moderationStatus === "approved"
              ? "Published"
              : p.moderationStatus}
        </span>
        {!p.isAvailable && <span className="badge">Withdrawn</span>}
        <h3>{p.title || "Untitled draft"}</h3>
        <p>{p.location || "Location not supplied"}</p>
        <strong>
          {p.monthlyRent == null
            ? "Rent not supplied"
            : Number(p.monthlyRent).toLocaleString() +
              " " +
              p.currency +
              " / month"}
        </strong>
        <p>
          {p.occupiedToday
            ? "Occupied today · check future availability"
            : p.availableFrom
              ? "Earliest move-in: " + p.availableFrom
              : "Check calendar for free rental periods"}
        </p>
        {p.rejectionReason && (
          <p role="note">Rejection reason: {p.rejectionReason}</p>
        )}
        <div className="owner-property-actions">
          <button onClick={() => onView(p.id)}>View</button>
          <button onClick={() => onEdit(p.id)}>Edit</button>
        </div>
      </div>
    </article>
  )
}
function OwnerListings({
  filter,
  onFilter,
  go,
  onView,
}: {
  filter: string
  onFilter: (v: string) => void
  go: Go
  onView: (id: number) => void
}) {
  const state = useOwnerData<{ properties: Listing[] }>("/owner/properties")
  let initial: { status?: string; search?: string; sort?: string; page?: number } =
    {}
  try {
    initial = JSON.parse(filter)
  } catch {
    initial = { status: filter }
  }
  const criteria = {
    status: typeof initial?.status === "string" && ["available","draft","pending","approved","rejected","withdrawn"].includes(initial.status) ? initial.status : "",
    search: typeof initial?.search === "string" ? initial.search.slice(0,255) : "",
    sort: typeof initial?.sort === "string" && ["latest","rent_asc","rent_desc"].includes(initial.sort) ? initial.sort : "latest",
    page: Math.max(1, Number(initial?.page) || 1),
  }
  const update = (value: Partial<typeof criteria>) =>
    onFilter(JSON.stringify({ ...criteria, page: 1, ...value }))
  let visible = (state.data?.properties || []).filter(
    (p) =>
      (!criteria.search ||
        (p.title + " " + p.location)
          .toLowerCase()
          .includes(criteria.search.toLowerCase())) &&
      (!criteria.status ||
        (criteria.status === "available"
          ? p.moderationStatus === "approved" && Boolean(p.isAvailable)
          : criteria.status === "withdrawn"
            ? !p.isAvailable
            : p.moderationStatus === criteria.status)),
  )
  if (criteria.sort !== "latest")
    visible.sort(
      (a, b) =>
        (Number(a.monthlyRent) - Number(b.monthlyRent)) *
        (criteria.sort === "rent_desc" ? -1 : 1),
    )
  const pages = Math.max(1, Math.ceil(visible.length / 12)),
    page = Math.min(criteria.page, pages)
  return (
    <div className="owner-live">
      <div className="owner-page-head">
        <div>
          <h1>My Properties</h1>
          <p>
            {state.error
              ? "Listing counts unavailable"
              : !state.data
                ? "Loading listings"
                : visible.length + " matching listings"}
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => go("Owner add property",{filter})}
        >
          Add Property
        </button>
      </div>
      <div className="owner-filter-bar">
        <label>
          Search
          <input
            value={criteria.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Title or location"
          />
        </label>
        <label>
          Status
          <select
            value={criteria.status}
            onChange={(e) => update({ status: e.target.value })}
          >
            {[
              ["", "All listings"],
              ["available", "Published · accepting requests"],
              ["draft", "Draft"],
              ["pending", "Awaiting approval"],
              ["approved", "Published"],
              ["rejected", "Rejected"],
              ["withdrawn", "Withdrawn"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={criteria.sort}
            onChange={(e) => update({ sort: e.target.value })}
          >
            <option value="latest">Recently updated</option>
            <option value="rent_asc">Rent: low to high</option>
            <option value="rent_desc">Rent: high to low</option>
          </select>
        </label>
      </div>
      <State state={state} />
      {state.data && !state.error && (
        <>
          <div className="owner-property-grid">
            {visible.slice((page - 1) * 12, page * 12).map((p) => (
              <ListingCard
                key={p.id}
                property={p}
                onView={onView}
                onEdit={(id) => go("Owner edit property", { property: id,filter })}
              />
            ))}
          </div>
          {!visible.length && (
            <div className="listing-state">
              <h2>No matching properties</h2>
              <p>Try another filter or create a listing.</p>
            </div>
          )}
          <div className="owner-pagination">
            <button
              className="button button-secondary"
              disabled={page <= 1}
              onClick={() => update({ page: page - 1 })}
            >
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              className="button button-secondary"
              disabled={page >= pages}
              onClick={() => update({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
interface Editable {
  id: number
  title: string | null
  description: string | null
  location: string | null
  type: string
  monthlyRent: number | null
  depositAmount: number | null
  currency: string
  sizeSqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  furnished: boolean
  bachelorAllowed: boolean
  familyAllowed: boolean
  available: boolean
  availableFrom: string | null
  moderationStatus: string
  rejectionReason: string | null
  images: { url: string }[]
  amenities: { id: number }[]
}
const blank = {
  title: "",
  description: "",
  location: "",
  type: "apartment",
  monthlyRent: "",
  depositAmount: "0",
  currency: "BDT",
  sizeSqft: "",
  bedrooms: "",
  bathrooms: "",
  furnished: true,
  bachelorAllowed: true,
  familyAllowed: true,
  available: true,
  availableFrom: "",
  images: [] as string[],
  amenityIds: [] as number[],
}

function useArchiveDialog(open:boolean,busy:boolean,close:()=>void){useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement|null;const dialog=document.querySelector<HTMLElement>('[aria-labelledby="archive-title"]');const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!busy)close();if(e.key==='Tab'&&dialog){const controls=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled])')];const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()};},[open,busy]);}
function OwnerPropertyForm({ id, go }: { id: number | null; go: Go }) {
  const state = useOwnerData<{ property: Editable }>(
      `/owner/properties/${id}`,
      Boolean(id),
    ),
    amenities = useOwnerData<{ items: { id: number; name: string }[] }>(
      "/owner/amenities",
    )
  const [form, setForm] = useState(blank),
    [loaded, setLoaded] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [image, setImage] = useState(""),
    [notice, setNotice] = useState(""),
    [archive, setArchive] = useState(false),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    if (state.data && !loaded) {
      const p = state.data.property
      setForm({
        ...blank,
        ...p,
        title: p.title || "",
        description: p.description || "",
        location: p.location || "",
        monthlyRent: String(p.monthlyRent ?? ""),
        depositAmount: String(p.depositAmount ?? 0),
        sizeSqft: String(p.sizeSqft ?? ""),
        bedrooms: String(p.bedrooms ?? ""),
        bathrooms: String(p.bathrooms ?? ""),
        availableFrom: p.availableFrom || "",
        images: p.images.map((i) => i.url),
        amenityIds: p.amenities.map((a) => a.id),
      })
      setLoaded(true)
    }
  }, [state.data, loaded])
  useArchiveDialog(archive,busy,()=>setArchive(false))
  const field = (
    key: "title" | "description" | "location" | "monthlyRent" | "depositAmount" | "sizeSqft" | "bedrooms" | "bathrooms" | "availableFrom",
  ) => ({
    value: form[key],
    disabled: busy,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })
  const save = async (status: "draft" | "pending") => {
    if (busy) return
    const errors: Record<string, string> = {}
    for (const k of ["title", "location", "description"] as const)
      if (status === "pending" && !form[k].trim()) errors[k] = "This field is required"
    if ((!form.monthlyRent && status === "pending") || (form.monthlyRent !== "" && Number(form.monthlyRent) <= 0))
      errors.monthlyRent = "Enter a positive monthly rent"
    if (Number(form.depositAmount) < 0)
      errors.depositAmount = "Deposit cannot be negative"
    setFieldErrors(errors)
    if (Object.keys(errors).length) return
    setBusy(true)
    setError("")
    try {
      const body = {
        ...Object.fromEntries(
          Object.keys(blank).map((k) => [k, form[(k as keyof typeof blank)]]),
        ),
        moderationStatus: status,
        monthlyRent: form.monthlyRent === "" ? null : Number(form.monthlyRent),
        depositAmount: Number(form.depositAmount),
        sizeSqft: form.sizeSqft === "" ? null : Number(form.sizeSqft),
        bedrooms: form.bedrooms === "" ? null : Number(form.bedrooms),
        bathrooms: form.bathrooms === "" ? null : Number(form.bathrooms),
        availableFrom: form.availableFrom || null,
      }
      const { property } = await apiRequest<{ property: Editable }>(
        id ? `/owner/properties/${id}` : "/owner/properties",
        { method: id ? "PATCH" : "POST", csrf: true, body },
      )
      if (alive.current) {
        changed()
        go("Owner edit property", { property: property.id })
        setNotice(
          status === "draft"
            ? "Draft saved."
            : "Saved and submitted for admin approval.",
        )
      }
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Unable to save listing")
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  const availability = async () => {
    if (!id || busy) return
    setBusy(true)
    setError("")
    try {
      await apiRequest(`/owner/properties/${id}`, {
        method: "PATCH",
        csrf: true,
        body: {
          available: form.available,
          availableFrom: form.availableFrom || null,
        },
      })
      if (alive.current) {
        changed()
        setNotice("Availability saved. Existing reservations remain valid.")
      }
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : "Unable to save availability")
    } finally {
      if (alive.current) setBusy(false)
    }
  }
  if (id && !loaded) return <State state={state} />
  return (
    <div className="owner-editor owner-live">
      <div className="owner-page-head">
        <div>
          <button
            className="button button-secondary"
            onClick={() => go("Owner listings")}
          >
            Back to Listings
          </button>
          <h1>{id ? "Edit Property #" + id : "Add New Property"}</h1>
          <p>
            Content edits require admin approval. Save a draft or submit your
            listing.
          </p>
        </div>
        {state.data && (
          <span className="badge">{state.data.property.moderationStatus}</span>
        )}
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="form-error-message">
          {error}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void save("pending")
        }}
      >
        <div className="owner-form-grid">
          {(["title", "location"] as const).map((k) => (
            <label key={k}>
              {k === "title" ? "Title" : "Location"}
              <input
                required
                maxLength={k === "title" ? 200 : 255}
                {...field(k)}
              />
              {fieldErrors[k] && <small role="alert">{fieldErrors[k]}</small>}
            </label>
          ))}
          <label>
            Property type
            <select
              disabled={busy}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {propertyTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          {([
            "monthlyRent",
            "depositAmount",
            "sizeSqft",
            "bedrooms",
            "bathrooms",
          ] as const).map((k) => (
            <label key={k}>
              {
                {
                  monthlyRent: "Monthly rent (BDT)",
                  depositAmount: "Separate deposit (BDT)",
                  sizeSqft: "Size (sq ft)",
                  bedrooms: "Bedrooms",
                  bathrooms: "Bathrooms",
                }[k]
              }
              <input
                type="number"
                min={k === "monthlyRent" ? "0.01" : "0"}
                step={["bedrooms", "bathrooms"].includes(k) ? "1" : "0.01"}
                required={["monthlyRent", "depositAmount"].includes(k)}
                {...field(k)}
              />
              {fieldErrors[k] && <small role="alert">{fieldErrors[k]}</small>}
            </label>
          ))}
          <label>
            Earliest move-in
            <input type="date" {...field("availableFrom")} />
          </label>
          <label className="owner-wide">
            Description
            <textarea required maxLength={10000} {...field("description")} />
            {fieldErrors.description && (
              <small role="alert">{fieldErrors.description}</small>
            )}
          </label>
        </div>
        <div className="owner-filter-bar">
          {([
            "furnished",
            "bachelorAllowed",
            "familyAllowed",
            "available",
          ] as const).map((k) => (
            <label key={k}>
              <input
                type="checkbox"
                disabled={busy}
                checked={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.checked })}
              />
              {
                {
                  furnished: "Furnished",
                  bachelorAllowed: "Bachelor allowed",
                  familyAllowed: "Family allowed",
                  available: "Accept future requests (uncheck to withdraw)",
                }[k]
              }
            </label>
          ))}
        </div>
        <h2>Amenities</h2>
        <State state={amenities} />
        <div className="owner-filter-bar">
          {amenities.data?.items.map((a) => (
            <label key={a.id}>
              <input
                type="checkbox"
                disabled={busy}
                checked={form.amenityIds.includes(a.id)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amenityIds: e.target.checked
                      ? [...form.amenityIds, a.id]
                      : form.amenityIds.filter((v) => v !== a.id),
                  })
                }
              />
              {a.name}
            </label>
          ))}
        </div>
        <h2>Property photos</h2>
        <p>
          Use image URLs. The first photo is the primary photo; reorder to
          change it.
        </p>
        <div className="owner-filter-bar">
          <label>
            Image URL
            <input
              type="url"
              disabled={busy}
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="button button-secondary"
            disabled={
              busy || !/^https?:\/\//.test(image) || form.images.length >= 20
            }
            onClick={() => {
              setForm({ ...form, images: [...form.images, image] })
              setImage("")
            }}
          >
            Add Photo
          </button>
        </div>
        <div className="owner-photo-grid">
          {form.images.map((url, i) => (
            <article key={i}>
              <PropertyPhoto url={url} title={"Photo " + (i + 1)} />
              <small>{i === 0 ? "Primary photo" : "Photo " + (i + 1)}</small>
              {i>0&&<button type="button" disabled={busy} onClick={()=>setForm({...form,images:[url,...form.images.filter((_,index)=>index!==i)]})}>Make primary</button>}
              <div>
                <button
                  type="button"
                  disabled={busy || !i}
                  onClick={() => {
                    const images = [...form.images]
                    ;[images[i - 1], images[i]] = [images[i], images[i - 1]]
                    setForm({ ...form, images })
                  }}
                >
                  Move earlier
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    setForm({
                      ...form,
                      images: form.images.filter((_, n) => n !== i),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={busy}
            onClick={() => void save("draft")}
          >
            Save as Draft
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Saving…" : "Submit for Approval"}
          </button>
          {id && (
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => void availability()}
            >
              Save availability only
            </button>
          )}
        </div>
      </form>
      {id && (
        <section>
          <h2>Reserved periods</h2>
          <p>
            Approved and confirmed reservations reserve dates; pending requests
            do not. Checkout is excluded. Availability changes cannot exclude an
            existing reservation.
          </p>
          <AvailabilityCalendar propertyId={id} ownerMode />
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={() => setArchive(true)}
          >
            Archive Listing
          </button>
          <p>
            Archiving preserves records. Resolve pending or reserved future
            bookings first. Withdrawal stops new requests without deleting
            bookings or conversations.
          </p>
        </section>
      )}
      {archive && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
          >
            <h2 id="archive-title">Archive this listing?</h2>
            <p>
              It will leave public browsing. Historical bookings and
              conversations remain.
            </p>
            <div className="modal-actions">
              <button
                autoFocus
                className="button button-secondary"
                disabled={busy}
                onClick={() => setArchive(false)}
              >
                Back
              </button>
              <button
                className="button button-primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    await apiRequest(`/owner/properties/${id}`, {
                      method: "DELETE",
                      csrf: true,
                    })
                    if (alive.current) {
                      changed()
                      go("Owner listings")
                    }
                  } catch (e) {
                    if (alive.current) {
                      setError(
                        e instanceof Error ? e.message : "Unable to archive",
                      )
                      setArchive(false)
                    }
                  } finally {
                    if (alive.current) setBusy(false)
                  }
                }}
              >
                Confirm Archive
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
function OwnerPayments() {
  const state = useOwnerData<{
    items: {
      id: number
      reference: string | null
      title: string | null
      amount: string
      currency: string
      recordType: string
      status: string
      transactionAt: string | null
    }[]
  }>("/owner/payments")
  return (
    <div>
      <h1>Payments</h1>
      <p>
        Actual payment records assigned to your account. Booking values are not
        money received.
      </p>
      <State state={state} />
      {state.data &&
        !state.error &&
        (state.data.items.length ? (
          <div className="live-booking-list">
            {state.data.items.map((p) => (
              <article className="live-booking-card" key={p.id}>
                <h2>{p.reference || "Payment #" + p.id}</h2>
                <p>
                  {p.title || "Account payment"} · {p.recordType} · {p.status}
                </p>
                <strong>
                  {Number(p.amount).toLocaleString()} {p.currency}
                </strong>
                <p>
                  {p.transactionAt
                    ? new Date(p.transactionAt).toLocaleString()
                    : "Not settled"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="listing-state">
            <h2>No payment records yet</h2>
            <p>Completed payouts will appear here when recorded.</p>
          </div>
        ))}
    </div>
  )
}
function OwnerProfile({ go }: { go: Go }) {
  const { user, setAuthenticatedUser } = useAuth()
  const [form, setForm] = useState({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatarUrl: user?.avatarUrl || "",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const prefs = useOwnerData<{ preferences: Record<string, number> }>(
    "/owner/preferences",
  )
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  return (
    <div className="owner-editor owner-live">
      <h1>Profile & Settings</h1>
      <section className="account-profile-header"><div className="account-avatar">{(user?.name||"").trim().split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join("").toUpperCase()||"?"}</div><div><h2>{user?.name}</h2><p>{user?.email}</p><span className="role-badge owner">Owner</span></div></section>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (busy) return
          setBusy(true)
          setError("")
          setSaved(false)
          try {
            const updated = await authService.updateProfile(form)
            if (alive.current) {
              setAuthenticatedUser(updated)
              setSaved(true)
            }
          } catch (e) {
            if (alive.current)
              setError(
                e instanceof Error ? e.message : "Unable to save profile",
              )
          } finally {
            if (alive.current) setBusy(false)
          }
        }}
      >
        <div className="owner-form-grid">
          {Object.entries(form).map(([key, value]) => (
            <label key={key}>
              {
                {
                  name: "Full name",
                  username: "Username",
                  email: "Email",
                  phone: "Phone",
                  avatarUrl: "Avatar URL",
                }[key]
              }
              <input
                required={["name", "email", "username"].includes(key)}
                type={
                  key === "email"
                    ? "email"
                    : key === "avatarUrl"
                      ? "url"
                      : "text"
                }
                disabled={busy}
                value={value}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        {saved && <p role="status">Profile saved.</p>}
        <button className="button button-primary" disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </button>
      </form>
      <h2>Notifications</h2>
      <State state={prefs} />
      {prefs.data && !prefs.error && (
        <div className="owner-filter-bar">
          {Object.entries(prefs.data.preferences || {}).map(([key, value]) => (
            <label key={key}>
              <input
                type="checkbox"
                disabled={busy}
                checked={Boolean(value)}
                onChange={async (e) => {
                  setBusy(true)
                  setError("")
                  try {
                    await apiRequest("/owner/preferences", {
                      method: "PATCH",
                      csrf: true,
                      body: { [key]: e.target.checked },
                    })
                    if (alive.current) prefs.retry()
                  } catch (e) {
                    if (alive.current)
                      setError(
                        e instanceof Error
                          ? e.message
                          : "Unable to save preferences",
                      )
                  } finally {
                    if (alive.current) setBusy(false)
                  }
                }}
              />
              {key.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      )}
      <h2>Session & Security</h2>
      <button
        className="button button-secondary"
        onClick={() => go("Session and security")}
      >
        Manage sessions and password
      </button>
    </div>
  )
}

export default function OwnerWorkspace({view,propertyId,go,filter,onFilter,onView,onRead,summary}:{
 view:"dashboard"|"listings"|"property"|"payments"|"profile"
 propertyId:number|null
 go:Go
 filter:string
 onFilter:(value:string)=>void
 onView:(id:number)=>void
 onRead:(id:number)=>void
 summary:ReturnType<typeof useOwnerSummary>
}) {
 if(view==="dashboard")return <OwnerDashboard state={summary} go={go} onView={onView} onRead={onRead}/>;
 if(view==="property")return <OwnerPropertyForm key={propertyId??"new"} id={propertyId} go={(page,options)=>go(page, {filter,...options})}/>;
 if(view==="payments")return <OwnerPayments/>;
 if(view==="profile")return <OwnerProfile go={go}/>;
 return <OwnerListings filter={filter} onFilter={onFilter} go={go} onView={onView}/>;
}
