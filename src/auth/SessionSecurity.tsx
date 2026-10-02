import { useEffect, useState } from "react"
import { apiRequest } from "../lib/api"
import { useAuth } from "./AuthContext"
type Session = {
  id: number
  device: string | null
  expiresAt: string
  lastUsedAt: string | null
  current: boolean
}
export default function SessionSecurity() {
  const { clearAuthenticatedUser } = useAuth()
  const [items, setItems] = useState<Session[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    apiRequest<{ items: Session[] }>("/auth/sessions", { signal: abort.signal })
      .then((value) => {
        if (!abort.signal.aborted) {
          setItems(value.items)
          setError("")
        }
      })
      .catch((caught) => {
        if (!abort.signal.aborted) setError(caught.message)
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [revision])
  const revoke = async (id?: number) => {
    setBusy(true)
    setError("")
    try {
      const result = await apiRequest<{ current?: boolean }>(
        id ? `/auth/sessions/${id}` : "/auth/sessions/revoke-others",
        { method: id ? "DELETE" : "POST", csrf: true },
      )
      if (result.current) {
        history.replaceState(null, "", "/?view=Home")
        clearAuthenticatedUser()
        try {
          localStorage.setItem("rentnest:auth-change", String(Date.now()))
        } catch {}
      } else setRevision((n) => n + 1)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to revoke session",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="account-card">
      <div className="account-card-head">
        <div>
          <h2>Session and Security</h2>
          <p>
            Sessions verified by the RentNest API. Revoking this session signs
            you out.
          </p>
        </div>
      </div>
      {error && (
        <p className="form-error-message" role="alert">
          {error}{" "}
          <button onClick={() => setRevision((n) => n + 1)}>Retry</button>
        </p>
      )}
      {loading ? (
        <p role="status">Loading authenticated sessions…</p>
      ) : (
        <div className="sessions-list">
          {items.map((item) => (
            <article key={item.id}>
              <div>
                <strong>
                  {item.device || "Device description unavailable"}
                </strong>
                <p>
                  {item.current
                    ? "Current browser session"
                    : "Other signed-in session"}{" "}
                  · Expires {new Date(item.expiresAt).toLocaleString()}
                </p>
              </div>
              <button disabled={busy} onClick={() => void revoke(item.id)}>
                {item.current ? "Sign out this session" : "Revoke session"}
              </button>
            </article>
          ))}
        </div>
      )}
      <button
        className="button button-secondary"
        disabled={busy || loading}
        onClick={() => void revoke()}
      >
        Sign out other sessions
      </button>
    </section>
  )
}
