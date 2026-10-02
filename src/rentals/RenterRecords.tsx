import { useAdminData } from "../hooks/useDatabaseData"
import type { Booking } from "../services/rentals"
import ListingCollection from "../properties/ListingCollection"
export default function RenterRecords({
  onProperty,
  onBookings,
  onLogin,
}: {
  onProperty: (id: number) => void
  onBookings: () => void
  onLogin: () => void
}) {
  const state = useAdminData<{ bookings: Booking[] }>("/bookings")
  return (
    <>
      <section className="account-card">
        <div className="dashboard-section-head">
          <h2>Recent bookings</h2>
          <button className="button button-secondary" onClick={onBookings}>
            All bookings
          </button>
        </div>
        {state.error ? (
          <p role="alert">
            {state.error} <button onClick={state.refresh}>Retry</button>
          </p>
        ) : !state.data ? (
          <p role="status">Loading bookings…</p>
        ) : state.data.bookings.length ? (
          state.data.bookings.slice(0, 3).map((b) => (
            <article key={b.id}>
              <button
                className="button button-ghost"
                onClick={() => onProperty(b.propertyId)}
              >
                {b.title || "Property name not provided"}
              </button>
              <p>
                Booking #{b.id} · {b.status} · {b.startDate} to {b.endDate}
              </p>
            </article>
          ))
        ) : (
          <p>No bookings yet.</p>
        )}
      </section>
      <section className="account-card">
        <h2>Available properties</h2>
        <p>Published properties currently accepting future requests.</p>
        <ListingCollection compact onView={onProperty} onLogin={onLogin} />
      </section>
    </>
  )
}
