import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "../auth/AuthContext"
import {
  emptyCriteria,
  propertyService,
  propertyTypes,
  sortOptions,
  type Criteria,
  type ListingResult,
} from "../services/properties"
import DatabasePropertyCard, { ListingSkeletons } from "./PropertyCard"

const labels: Record<string, string> = {
  search: "Search",
  location: "Location",
  minRent: "Min rent (BDT)",
  maxRent: "Max rent (BDT)",
  type: "Type",
  bedrooms: "Bedrooms",
  furnishing: "Furnishing",
  eligibility: "Eligibility",
}
type FilterKey = Exclude<keyof Criteria, "sort">
function readHistory(key: string): Criteria[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) || "[]")
    if (!Array.isArray(stored)) return []
    return stored
      .filter(
        (item) =>
          item &&
          typeof item === "object" &&
          Object.keys(emptyCriteria).every(
            (key) => typeof item[key] === "string" && item[key].length <= 255,
          ),
      )
      .slice(0, 4)
  } catch {
    return []
  }
}
function summary(criteria: Criteria) {
  return (
    Object.entries(criteria)
      .filter(([key, value]) => value && key !== "sort")
      .map(([key, value]) => `${labels[key]}: ${value}`)
      .join(" · ") || "All properties"
  )
}
function validation(criteria: Criteria) {
  for (const field of ["minRent", "maxRent"] as const) {
    if (
      criteria[field] &&
      (!/^\d+(?:\.\d{1,2})?$/.test(criteria[field]) ||
        Number(criteria[field]) > 9999999999.99)
    )
      return "Enter a non-negative monthly rent with up to two decimal places."
  }
  if (
    criteria.minRent &&
    criteria.maxRent &&
    Number(criteria.minRent) > Number(criteria.maxRent)
  )
    return "Minimum monthly rent cannot exceed maximum monthly rent."
  return ""
}
export default function Discovery({
  onView,
  onLogin,
}: {
  onView: (id: number) => void
  onLogin: () => void
}) {
  const { user } = useAuth()
  const historyKey = `rentnest:searches:${user?.id ?? "guest"}`
  const [recent, setRecent] = useState<Criteria[]>(() =>
    readHistory(historyKey),
  )
  const [draft, setDraft] = useState<Criteria>({ ...emptyCriteria })
  const [criteria, setCriteria] = useState<Criteria>({ ...emptyCriteria })
  const [result, setResult] = useState<ListingResult>({
    properties: [],
    total: 0,
    page: 0,
    limit: 12,
    hasMore: false,
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState("")
  const [filterError, setFilterError] = useState("")
  const [locations, setLocations] = useState<{
    location: string
    count: number
  }[]>([])
  const [locationError, setLocationError] = useState(false)
  const version = useRef(0)
  const abort = useRef<AbortController | null>(null)
  const busy = useRef(false)
  const requestPage = useCallback(
    async (page: number, append = false) => {
      abort.current?.abort()
      const controller = new AbortController()
      abort.current = controller
      const request = ++version.current
      busy.current = true
      setError("")
      if (append) setLoadingMore(true)
      else {
        setLoading(true)
        setLoadingMore(false)
        setResult({
          properties: [],
          total: 0,
          page: 0,
          limit: 12,
          hasMore: false,
        })
      }
      try {
        const response = await propertyService.list(
          criteria,
          page,
          controller.signal,
        )
        if (request !== version.current || controller.signal.aborted) return
        setResult((current) => ({
          ...response,
          properties: append
            ? [
                ...current.properties,
                ...response.properties.filter(
                  (item) =>
                    !current.properties.some(
                      (existing) => existing.id === item.id,
                    ),
                ),
              ]
            : response.properties,
        }))
      } catch (error) {
        if (request === version.current && !controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load properties",
          )
      } finally {
        if (request === version.current) {
          busy.current = false
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [criteria],
  )
  useEffect(() => {
    void requestPage(1)
    return () => {
      abort.current?.abort()
      version.current++
      busy.current = false
    }
  }, [requestPage])
  const loadLocations = useCallback(async (signal?: AbortSignal) => {
    setLocationError(false)
    try {
      const response = await propertyService.locations(signal)
      if (!signal?.aborted) setLocations(response.locations)
    } catch {
      if (!signal?.aborted) setLocationError(true)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void loadLocations(controller.signal)
    return () => controller.abort()
  }, [loadLocations])
  const apply = (next: Criteria, remember = true) => {
    const normalized = {
      ...next,
      search: next.search.trim(),
      location: next.location.trim(),
    }
    const error = validation(normalized)
    setFilterError(error)
    if (error) return
    abort.current?.abort()
    version.current++
    setDraft(normalized)
    setCriteria(normalized)
    if (
      remember &&
      Object.entries(normalized).some(([key, value]) => key !== "sort" && value)
    ) {
      setRecent((current) => {
        const updated = [
          normalized,
          ...current.filter(
            (item) => JSON.stringify(item) !== JSON.stringify(normalized),
          ),
        ].slice(0, 4)
        try {
          localStorage.setItem(historyKey, JSON.stringify(updated))
        } catch {
          /* Browsing works when storage is unavailable. */
        }
        return updated
      })
    }
  }
  const clear = () => apply({ ...emptyCriteria }, false)
  const changeSort = (sort: string) => {
    abort.current?.abort()
    version.current++
    setCriteria((current) => ({ ...current, sort }))
    setDraft((current) => ({ ...current, sort }))
  }
  const field = (key: FilterKey) => ({
    value: draft[key],
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
      setDraft((current) => ({ ...current, [key]: event.target.value }))
      setFilterError("")
    },
  })
  const chips = (Object.entries(criteria) as [keyof Criteria, string][]).filter(
    ([key, value]) => key !== "sort" && value,
  )
  return (
    <div className="search-experience database-discovery">
      <div className="search-experience-head">
        <p className="eyebrow">FIND YOUR NEXT HOME</p>
        <h1>Search homes made for living.</h1>
        <p>Explore available rentals across all locations.</p>
      </div>
      <form
        className="property-search-bar"
        onSubmit={(event) => {
          event.preventDefault()
          apply(draft)
        }}
      >
        <span aria-hidden="true">⌕</span>
        <input
          {...field("search")}
          maxLength={255}
          placeholder="Search properties, locations..."
          aria-label="Search properties and locations"
        />
        {draft.search && (
          <button
            type="button"
            className="clear-search"
            onClick={() => apply({ ...criteria, search: "" }, false)}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        <button className="button button-primary" type="submit">
          Search
        </button>
      </form>
      <section className="search-suggestions">
        <div>
          <div className="suggestion-heading">
            <span aria-hidden="true">⌕</span>
            <div>
              <h2>Recent searches</h2>
              <p>Continue where you left off</p>
            </div>
          </div>
          <div className="suggestion-list">
            {recent.length ? (
              recent.map((item, index) => (
                <button key={index} onClick={() => apply(item)}>
                  <span aria-hidden="true">⌕</span>
                  <p>
                    <strong>
                      {item.search || item.location || "Filtered properties"}
                    </strong>
                    <small>{summary(item)}</small>
                  </p>
                  <span aria-hidden="true">→</span>
                </button>
              ))
            ) : (
              <p className="suggestions-empty">
                Your recent searches will appear here.
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="suggestion-heading">
            <span aria-hidden="true">⌖</span>
            <div>
              <h2>Popular locations</h2>
              <p>Browse locations with available homes</p>
            </div>
          </div>
          <div className="popular-location-grid">
            {locations.map((item) => (
              <button
                key={item.location}
                onClick={() => apply({ ...criteria, location: item.location })}
              >
                <span aria-hidden="true">⌖</span>
                <span>
                  <strong>{item.location}</strong>
                  <small>
                    {item.count} {item.count === 1 ? "property" : "properties"}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {locationError && (
            <button
              className="button button-ghost"
              onClick={() => void loadLocations()}
            >
              Retry popular locations
            </button>
          )}
          {!locations.length && !locationError && (
            <p className="suggestions-empty">
              Locations will appear when properties are available.
            </p>
          )}
        </div>
      </section>
      <section
        className="all-properties"
        aria-labelledby="all-properties-title"
      >
        <div className="listing-section-heading">
          <div>
            <h2 id="all-properties-title">All Properties</h2>
            <p role="status" aria-live="polite">
              {loading
                ? "Loading properties…"
                : `${result.total} matching ${
                    result.total === 1 ? "property" : "properties"
                  }`}
            </p>
          </div>
          <label className="listing-sort">
            <span>Sort by</span>
            <select
              value={criteria.sort}
              onChange={(event) => changeSort(event.target.value)}
            >
              {sortOptions.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <form
          className="listing-filter-toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            apply(draft)
          }}
          aria-label="Property filters"
        >
          <div className="listing-filter-title">Filter properties</div>
          <label>
            <span>Minimum monthly rent (BDT)</span>
            <input
              {...field("minRent")}
              type="number"
              min="0"
              max="9999999999.99"
              step="0.01"
              placeholder="No minimum"
              aria-describedby={filterError ? "rent-filter-error" : undefined}
            />
          </label>
          <label>
            <span>Maximum monthly rent (BDT)</span>
            <input
              {...field("maxRent")}
              type="number"
              min="0"
              max="9999999999.99"
              step="0.01"
              placeholder="No maximum"
              aria-describedby={filterError ? "rent-filter-error" : undefined}
            />
          </label>
          <label>
            <span>Property type</span>
            <select {...field("type")}>
              <option value="">Any type</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Bedrooms</span>
            <select {...field("bedrooms")}>
              <option value="">Any</option>
              {["1", "2", "3", "4+"].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Furnishing</span>
            <select {...field("furnishing")}>
              <option value="">Any</option>
              <option value="furnished">Furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </select>
          </label>
          <label>
            <span>Renter eligibility</span>
            <select {...field("eligibility")}>
              <option value="">Any</option>
              <option value="bachelor">Bachelor allowed</option>
              <option value="family">Family allowed</option>
            </select>
          </label>
          <label>
            <span>Location (optional)</span>
            <input
              {...field("location")}
              maxLength={255}
              placeholder="All locations"
            />
          </label>
          <div className="listing-filter-actions">
            <button type="submit" className="button button-primary">
              Apply filters
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={clear}
            >
              Clear all
            </button>
          </div>
          {filterError && (
            <p
              className="listing-filter-error"
              id="rent-filter-error"
              role="alert"
            >
              {filterError}
            </p>
          )}
        </form>
        {chips.length > 0 && (
          <div className="listing-filter-chips" aria-label="Active filters">
            {chips.map(([key, value]) => (
              <button
                key={key}
                onClick={() => apply({ ...criteria, [key]: "" }, false)}
                aria-label={`Remove ${labels[key]} filter`}
              >
                <span>
                  {labels[key]}: {value}
                </span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div
            className="database-property-grid"
            role="status"
            aria-label="Loading properties"
          >
            <ListingSkeletons />
          </div>
        ) : (
          <>
            <div className="database-property-grid" aria-busy={loadingMore}>
              {result.properties.map((property) => (
                <DatabasePropertyCard
                  key={property.id}
                  property={property}
                  onView={onView}
                  onLogin={onLogin}
                />
              ))}
            </div>
            {error ? (
              <div className="listing-state" role="alert">
                <h3>Unable to load properties</h3>
                <p>{error}</p>
                <button
                  className="button button-primary"
                  onClick={() =>
                    void requestPage(
                      result.page ? result.page + 1 : 1,
                      Boolean(result.page),
                    )
                  }
                >
                  Retry
                </button>
              </div>
            ) : !result.properties.length ? (
              <div className="listing-state">
                <h3>No properties match your filters</h3>
                <p>
                  Try a broader search or clear your filters to see all
                  available properties.
                </p>
                <button className="button button-secondary" onClick={clear}>
                  Clear filters
                </button>
              </div>
            ) : (
              result.hasMore && (
                <div className="listing-load-more">
                  <p>
                    Showing {result.properties.length} of {result.total}{" "}
                    properties
                  </p>
                  <button
                    className="button button-secondary"
                    disabled={loadingMore}
                    onClick={() => {
                      if (!busy.current) void requestPage(result.page + 1, true)
                    }}
                  >
                    {loadingMore ? "Loading more…" : "Load more"}
                  </button>
                </div>
              )
            )}
          </>
        )}
      </section>
    </div>
  )
}
