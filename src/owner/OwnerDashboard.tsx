import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import { workspaceService, type NotificationRecord, type PaymentRecord } from "../services/workspace";
import type { Property } from "../services/properties";

type Booking = {
  id: number;
  bookingCode: string | null;
  propertyId: number;
  title: string | null;
  location: string | null;
  renterName: string;
  startDate: string;
  endDate: string;
  totalRent: number;
  currency: string;
  status: "pending" | "approved" | "confirmed" | "rejected" | "cancelled";
};

type Props = {
  go: (page: string) => void;
  onViewProperty: (id: number) => void;
};

function money(amount: number, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function OwnerDashboard({ go, onViewProperty }: Props) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [draft, setDraft] = useState({ title: "", location: "", type: "apartment", monthlyRent: "", depositAmount: "" });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest<{ properties: Property[] }>("/owner/properties", { signal: controller.signal }),
      apiRequest<{ bookings: Booking[] }>("/bookings", { signal: controller.signal }),
      workspaceService.payments("owner"),
      apiRequest<{ notifications: NotificationRecord[] }>("/notifications"),
    ]).then(([listingResult, bookingResult, paymentResult, notificationResult]) => {
      if (controller.signal.aborted) return;
      setProperties(listingResult.properties);
      setBookings(bookingResult.bookings);
      setPayments(paymentResult);
      setNotifications(notificationResult.notifications);
    }).catch((requestError) => {
      if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Unable to load your owner dashboard.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [retry]);

  const pending = bookings.filter((booking) => booking.status === "pending");
  const active = bookings.filter((booking) => booking.status === "approved" || booking.status === "confirmed");
  const earnings = payments.filter((payment) => payment.recordType === "charge" && payment.status === "completed")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const recentProperties = useMemo(() => properties.slice(0, 3), [properties]);

  async function createProperty(event: React.FormEvent) {
    event.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await apiRequest("/owner/properties", {
        method: "POST",
        csrf: true,
        body: {
          title: draft.title,
          location: draft.location,
          type: draft.type,
          monthlyRent: Number(draft.monthlyRent),
          depositAmount: Number(draft.depositAmount || 0),
          moderationStatus: "pending",
        },
      });
      setCreateOpen(false);
      setDraft({ title: "", location: "", type: "apartment", monthlyRent: "", depositAmount: "" });
      go("Owner listings");
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : "Unable to create the listing.");
    } finally {
      setCreating(false);
    }
  }

  return <div className="owner-dashboard">
    <div className="owner-page-head">
      <div><p className="eyebrow">PROPERTY OWNER OVERVIEW</p><h1>Your rental business</h1><p>Monitor performance, manage properties, and respond to renters.</p></div>
      <button className="button button-primary" onClick={() => setCreateOpen(true)}>+ Add New Property</button>
    </div>
    {error ? <div className="listing-state" role="alert"><p>{error}</p><button className="button button-secondary" onClick={() => setRetry((value) => value + 1)}>Retry dashboard</button></div> : <>
      <section className="owner-summary" aria-busy={loading}>
        {[["TOTAL LISTINGS", String(properties.length), "Properties"], ["ACTIVE BOOKINGS", String(active.length), "Current rentals"], ["PENDING REQUESTS", String(pending.length), "Waiting approval"], ["MONTHLY EARNINGS", money(earnings), "Completed charges"]].map(([label, value, detail]) => <article key={label}><div><small>{label}</small></div><strong>{loading ? "—" : value}</strong><p>{detail}</p></article>)}
      </section>
      <section className="owner-quick"><div className="owner-section-head"><div><h2>Quick Actions</h2><p>Common property management tasks</p></div></div><div>
        {[["Add New Property", "Create and submit a new listing", () => setCreateOpen(true)], ["Manage Listings", "Edit availability and property details", () => go("Owner listings")], ["View Requests", "Review pending booking requests", () => go("Owner booking requests")], ["Messages", "Reply to prospective renters", () => go("Owner messages")]].map(([title, description, action]) => <button key={title as string} onClick={action as () => void}><span>+</span><div><strong>{title as string}</strong><small>{description as string}</small></div><b>→</b></button>)}
      </div></section>
      <div className="owner-dashboard-grid"><section className="owner-properties-section"><div className="owner-section-head"><div><h2>Your Properties</h2><p>Recently updated listings</p></div><button className="button button-ghost" onClick={() => go("Owner listings")}>Manage Listings →</button></div>
        {loading ? <p>Loading listings…</p> : recentProperties.length ? <div className="owner-property-grid">{recentProperties.map((property) => <article className="owner-property-card" key={property.id}><div className="owner-property-image">{property.primaryImage ? <img src={property.primaryImage} alt="" /> : <div className="property-image-placeholder">No image</div>}<span className="badge">{property.moderationStatus}</span></div><div><h3>{property.title || "Untitled property"}</h3><p>{property.location || "Location not set"}</p><strong>{money(Number(property.monthlyRent || 0), property.currency)}<small> / month</small></strong><div className="owner-property-actions"><button onClick={() => onViewProperty(property.id)}>View</button><button onClick={() => go("Owner listings")}>Manage</button></div></div></article>)}</div> : <p>No listings yet. Create your first property to start receiving requests.</p>}</section>
        <aside className="owner-activity-card"><div className="owner-section-head"><div><h2>Activity Feed</h2><p>Latest business updates</p></div></div><div className="owner-feed">{notifications.slice(0, 5).map((notification) => <article key={notification.id}><div><strong>{notification.title}</strong><p>{notification.message}</p><small>{timeAgo(notification.createdAt)}</small></div></article>)}{!loading && !notifications.length && <p>No activity yet.</p>}</div></aside></div>
      <section className="owner-requests"><div className="owner-section-head"><div><h2>Recent Booking Requests</h2><p>Review the latest renter requests</p></div><button className="button button-ghost" onClick={() => go("Owner booking requests")}>View All Requests →</button></div>
        {loading ? <p>Loading booking requests…</p> : pending.length ? <div className="owner-request-list">{pending.slice(0, 5).map((booking) => <article key={booking.id}><span className="avatar">{initials(booking.renterName)}</span><div className="request-renter"><strong>{booking.renterName}</strong><small>{booking.startDate} to {booking.endDate}</small></div><div className="request-property"><span>{booking.title || "Property"}</span></div><span className="badge">Pending</span><button className="button button-secondary" onClick={() => go("Owner booking requests")}>Review request</button></article>)}</div> : <p>No pending booking requests.</p>}
      </section>
    </>}
    {createOpen && <div className="modal-backdrop" onMouseDown={() => !creating && setCreateOpen(false)}><form className="modal rental-booking-modal" onSubmit={createProperty} onMouseDown={(event) => event.stopPropagation()}><h2>Add New Property</h2><p>Create a listing and submit it for administrator approval.</p><div className="booking-date-fields"><label>Title<input autoFocus required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>Location<input required maxLength={255} value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><label>Property type<select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })}>{["apartment", "flat", "studio", "room", "office", "parking"].map((type) => <option key={type} value={type}>{type}</option>)}</select></label><label>Monthly rent (BDT)<input required type="number" min="1" step="0.01" value={draft.monthlyRent} onChange={(event) => setDraft({ ...draft, monthlyRent: event.target.value })} /></label><label>Deposit (BDT)<input type="number" min="0" step="0.01" value={draft.depositAmount} onChange={(event) => setDraft({ ...draft, depositAmount: event.target.value })} /></label></div>{createError && <p role="alert">{createError}</p>}<div className="modal-actions"><button type="button" className="button button-secondary" disabled={creating} onClick={() => setCreateOpen(false)}>Cancel</button><button className="button button-primary" disabled={creating}>{creating ? "Creating…" : "Create listing"}</button></div></form></div>}
  </div>;
}
