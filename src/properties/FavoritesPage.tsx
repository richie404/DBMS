import { useFavorites } from "./FavoritesContext"
import DatabasePropertyCard, { ListingSkeletons } from "./PropertyCard"

export default function FavoritesPage({
  onView,
  onLogin,
  onBrowse,
  compact = false,
}: {
  onView: (id: number) => void
  onLogin: () => void
  onBrowse: () => void
  compact?: boolean
}) {
  const { favorites, loading, error, refresh } = useFavorites()
  const items = compact ? favorites.slice(0, 3) : favorites
  return (
    <section
      className={compact ? "saved-dashboard-section" : "database-favorites"}
    >
      <div className="listing-section-heading">
        <div>
          <p className="eyebrow">YOUR SHORTLIST</p>
          <h2>{compact ? "Saved Properties" : "Favorites"}</h2>
          <p>
            {favorites.length} saved{" "}
            {favorites.length === 1 ? "property" : "properties"}
          </p>
        </div>
        <button className="button button-secondary" onClick={onBrowse}>
          Browse properties
        </button>
      </div>
      {loading ? (
        <div
          className="database-property-grid"
          aria-label="Loading favorites"
          role="status"
        >
          <ListingSkeletons />
        </div>
      ) : error ? (
        <div className="listing-state" role="alert">
          <p>{error}</p>
          <button
            className="button button-primary"
            onClick={() => void refresh()}
          >
            Retry
          </button>
        </div>
      ) : items.length ? (
        <div className="database-property-grid">
          {items.map((property) => (
            <DatabasePropertyCard
              key={property.id}
              property={property}
              onView={onView}
              onLogin={onLogin}
            />
          ))}
        </div>
      ) : (
        <div className="listing-state">
          <h3>You haven't saved any properties.</h3>
          <p>Explore properties and save the places you love.</p>
          <button className="button button-primary" onClick={onBrowse}>
            Explore properties
          </button>
        </div>
      )}
    </section>
  )
}
