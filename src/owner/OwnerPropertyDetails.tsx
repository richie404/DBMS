import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { Property } from "../services/properties";

type Props = { id: number; onBack: () => void };

function money(value: number | null, currency: string) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function OwnerPropertyDetails({ id, onBack }: Props) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ properties: Property[] }>("/owner/properties", { signal: controller.signal }).then(({ properties }) => {
      const record = properties.find((item) => item.id === id);
      if (!record) throw new Error("This listing is unavailable or no longer belongs to you.");
      if (!controller.signal.aborted) setProperty(record);
    }).catch((requestError) => {
      if (!controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Unable to load listing.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  async function save() {
    if (!property || saving) return;
    setSaving(true); setError(""); setSaved(false);
    try {
      await apiRequest(`/owner/properties/${id}`, { method: "PATCH", csrf: true, body: {
        title: property.title || "", description: property.description || "", location: property.location || "",
        monthlyRent: Number(property.monthlyRent || 0), depositAmount: Number(property.depositAmount || 0),
        availableFrom: property.availableFrom || null, isAvailable: Boolean(property.isAvailable),
      } });
      setSaved(true);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to save listing."); }
    finally { setSaving(false); }
  }

  async function archive() {
    if (archiving) return;
    setArchiving(true); setError("");
    try { await apiRequest(`/owner/properties/${id}`, { method: "DELETE", csrf: true }); onBack(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to archive listing."); setArchiveOpen(false); }
    finally { setArchiving(false); }
  }

  if (loading) return <div className="listing-state"><p>Loading your listing…</p></div>;
  if (!property) return <div className="listing-state" role="alert"><h1>Listing unavailable</h1><p>{error}</p><button className="button button-secondary" onClick={onBack}>Back to My Listings</button></div>;
  return <div className="owner-property-details">
    <button className="button button-ghost" onClick={onBack}>← Back to My Listings</button>
    <header className="owner-detail-header"><div><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>{property.title || "Untitled property"}</h1><p>Owner controls for this listing. Renters cannot see this management page.</p></div><span className="badge">{property.moderationStatus}</span></header>
    <div className="owner-detail-layout"><section className="owner-detail-form"><h2>Listing details</h2><div className="booking-date-fields"><label>Title<input maxLength={200} value={property.title || ""} onChange={(event) => setProperty({ ...property, title: event.target.value })} /></label><label>Location<input maxLength={255} value={property.location || ""} onChange={(event) => setProperty({ ...property, location: event.target.value })} /></label><label>Monthly rent (BDT)<input type="number" min="0" step="0.01" value={property.monthlyRent || ""} onChange={(event) => setProperty({ ...property, monthlyRent: Number(event.target.value) })} /></label><label>Deposit (BDT)<input type="number" min="0" step="0.01" value={property.depositAmount || ""} onChange={(event) => setProperty({ ...property, depositAmount: Number(event.target.value) })} /></label><label>Earliest move-in<input type="date" value={property.availableFrom || ""} onChange={(event) => setProperty({ ...property, availableFrom: event.target.value || null })} /></label></div><label className="listing-publication-toggle"><input type="checkbox" checked={Boolean(property.isAvailable)} onChange={(event) => setProperty({ ...property, isAvailable: event.target.checked })} />Accept future booking requests</label><label className="owner-description-field">Description<textarea maxLength={10000} value={property.description || ""} onChange={(event) => setProperty({ ...property, description: event.target.value })} /></label>{error && <p className="form-error-message" role="alert">{error}</p>}<div className="modal-actions"><button className="button button-secondary" onClick={onBack} disabled={saving}>Cancel</button><button className="button button-primary" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : saved ? "Saved" : "Save changes"}</button></div></section>
      <aside className="owner-detail-summary"><h2>Listing status</h2>{property.primaryImage ? <img src={property.primaryImage} alt="" /> : <div className="property-image-placeholder">No image uploaded</div>}<dl><div><dt>Publication</dt><dd>{property.moderationStatus}</dd></div><div><dt>Requests</dt><dd>{property.isAvailable ? "Open" : "Paused"}</dd></div><div><dt>Monthly rent</dt><dd>{money(property.monthlyRent, property.currency)}</dd></div><div><dt>Type</dt><dd>{property.propertyType}</dd></div></dl><button className="button button-destructive" onClick={() => setArchiveOpen(true)}>Archive listing</button><small>Archived listings are hidden from renters. Active bookings must be resolved first.</small></aside></div>
    {archiveOpen && <div className="modal-backdrop" onMouseDown={() => !archiving && setArchiveOpen(false)}><section className="modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><h2>Archive this listing?</h2><p>It will no longer appear in owner or renter listings. This cannot be undone from the app.</p><div className="modal-actions"><button className="button button-secondary" disabled={archiving} onClick={() => setArchiveOpen(false)}>Cancel</button><button className="button button-destructive" disabled={archiving} onClick={() => void archive()}>{archiving ? "Archiving…" : "Archive listing"}</button></div></section></div>}
  </div>;
}
