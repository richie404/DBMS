import { useAdminData } from "../hooks/useDatabaseData"
import { useEffect, useRef, useState } from "react"
import { apiRequest, ApiError } from "../lib/api"
import { useAuth } from "../auth/AuthContext"
import AccountSettings from "../auth/AccountSettings"
import "./admin.css"
export interface Overview {
  counts: Record<"users" | "renters" | "owners" | "admins" | "listings" | "pendingListings" | "activeBookings" | "activityToday", number>
  items: Activity[]
  hourly: { hour: number; count: number }[]
  timezone: string
  day: string
  policy: string
}
interface Activity {
  id: number
  action: string
  targetType: string | null
  targetId: number | null
  outcome: string
  description: string | null
  sourceIp: string | null
  createdAt: string
  actorName: string | null
  actorRole: string | null
}
interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  phone: string | null
  createdAt: string
  properties: number
  bookings: number
  messages: number
}
interface Payment {
  id: number
  reference: string | null
  bookingId: number | null
  recordType: string
  amount: number | string
  currency: string
  status: string
  transactionAt: string | null
  createdAt: string
  title: string | null
  payerName: string | null
  payeeName: string | null
  notes: string | null
}
interface Analytics {
  series: Record<string, { day: string; value: number }[]>
  start: string
  end: string
  timezone: string
  currency: string
}
interface Settings {
  platformName: string
  supportEmail: string | null
  currency: string
  timezone: string
  reviewTargetHours: number
  sessionTimeoutMinutes: number
  maintenanceMode: boolean
}
export function useAdminOverview(enabled: boolean) {
  return useAdminData<Overview>("/admin/overview", enabled)
}
const changed = () => window.dispatchEvent(new Event("rentnest:data-changed"))
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "Not provided"
const money = (value: number | string, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    Number(value),
  )
function exportCsv(name: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const cell = (v: unknown) => {
    let s = String(v ?? "")
    if (/^[=+@\-]/.test(s)) s = "'" + s
    return '"' + s.replace(/"/g, '""') + '"'
  }
  const csv = [
    keys.map(cell).join(","),
    ...rows.map((r) => keys.map((k) => cell(r[k])).join(",")),
  ].join("\r\n")
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  )
  const a = document.createElement("a")
  a.href = url
  a.download = name + ".csv"
  a.click()
  URL.revokeObjectURL(url)
}
function State({ error, refresh }: { error?: string; refresh: () => void }) {
  return error ? (
    <div className="listing-state" role="alert">
      <h2>{error === "Access denied" ? error : "Unable to load records"}</h2>
      <p>{error}</p>
      <button className="button button-secondary" onClick={refresh}>
        Retry
      </button>
    </div>
  ) : (
    <p role="status">Loading database records…</p>
  )
}
function Bars({
  data,
  label,
}: {
  data: { label: string; value: number }[]
  label: string
}) {
  const max = Math.max(1, ...data.map((x) => x.value))
  return (
    <div className="db-chart" role="img" aria-label={label}>
      <div className="db-bars">
        {data.map((x) => (
          <div key={x.label} title={`${x.label}: ${x.value}`}>
            <span>{x.value}</span>
            <i
              style={{
                height: Math.max(x.value ? 3 : 0, (100 * x.value) / max) + "px",
              }}
            />
            <small>{x.label}</small>
          </div>
        ))}
      </div>
      <p>{label}</p>
    </div>
  )
}
function OverviewPage({
  state,
  go,
}: {
  state: ReturnType<typeof useAdminOverview>
  go: (page: string, filter?: string) => void
}) {
  if (!state.data || state.error) return <State {...state} />
  const d = state.data
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-head">
        <div>
          <p className="eyebrow">PLATFORM CONTROL CENTER</p>
          <h1>Admin Dashboard</h1>
          <p>
            Database records · {d.day} · {d.timezone}
          </p>
        </div>
        <div className="admin-head-actions">
          <button
            className="button button-secondary"
            onClick={() => exportCsv("dashboard", [d.counts])}
          >
            Export Report
          </button>
          <button className="button button-primary" onClick={state.refresh}>
            Refresh Data
          </button>
        </div>
      </div>
      <div className="db-metrics">
        {[
          ["users", "Total users", "Admin users", ""],
          ["listings", "Total listings", "Admin listings", ""],
          ["pendingListings", "Pending approvals", "Admin listings", "pending"],
          ["activeBookings", "Active bookings", "Admin bookings", "active"],
          ["activityToday", "Today's activity", "Admin logs", d.day],
        ].map(([key, label, page, filter]) => (
          <button
            className="metric-card"
            key={key}
            data-metric={key}
            onClick={() => go(page, filter)}
          >
            <small>{label}</small>
            <strong>{d.counts[(key as keyof typeof d.counts)]}</strong>
          </button>
        ))}
      </div>
      <section className="account-card">
        <h2>User roles</h2>
        <div className="db-metrics">
          {["renters", "owners", "admins"].map((key) => (
            <div key={key} data-metric={key}>
              <small>{key}</small>
              <strong>{d.counts[(key as keyof typeof d.counts)]}</strong>
            </div>
          ))}
        </div>
        <p>{d.policy}</p>
      </section>
      <section className="account-card">
        <h2>Recorded activity today</h2>
        <Bars
          label={`Events per hour · ${d.day} · ${d.timezone}`}
          data={d.hourly.map((x) => ({
            label: String(x.hour).padStart(2, "0"),
            value: x.count,
          }))}
        />
      </section>
      <section className="account-card">
        <h2>Recent recorded activity</h2>
        {d.items.length ? (
          d.items.map((x) => (
            <article key={x.id}>
              <strong>{x.description || x.action}</strong>
              <p>
                {x.actorName || "Not provided"} · {date(x.createdAt)} ·{" "}
                {x.targetType || "No target"} {x.targetId ?? ""}
              </p>
            </article>
          ))
        ) : (
          <p>No recorded activity.</p>
        )}
      </section>
    </div>
  )
}
function Users({ initialSearch = "" }: { initialSearch?: string }) {
  const state = useAdminData<{ items: User[] }>("/admin/users")
  const { user } = useAuth()
  const [search, setSearch] = useState(initialSearch),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<User | null>(null),
    [decision, setDecision] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const mounted = useRef(true)
  useEffect(
    () => () => {
      mounted.current = false
    },
    [],
  )
  if (!state.data || state.error) return <State {...state} />
  const rows = state.data.items.filter(
    (x) =>
      (!role || x.role === role) &&
      (!status || x.status === status) &&
      `${x.id} ${x.name} ${x.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(rows.length / 12)),
    current = Math.min(page, pages)
  const save = async () => {
    if (!selected) return
    setBusy(true)
    setError("")
    try {
      await apiRequest(`/admin/users/${selected.id}/status`, {
        method: "PATCH",
        csrf: true,
        body: { status: decision, reason },
      })
      if (mounted.current) {
        setSelected(null)
        changed()
        state.refresh()
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Unable to update user")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <>
      <div className="admin-users-head">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>User Management</h1>
          <p>{rows.length} matching existing users</p>
        </div>
        <button
          className="button button-secondary"
          disabled={!rows.length}
          onClick={() =>
            exportCsv("users", rows as unknown as Record<string, unknown>[])
          }
        >
          Export users
        </button>
      </div>
      <div className="db-filters">
        <input
          aria-label="Search users"
          placeholder="Search name, email or ID"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <select
          aria-label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All roles</option>
          {["renter", "owner", "admin"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Account status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {["active", "suspended", "banned"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button className="button button-secondary" onClick={state.refresh}>
          Refresh Data
        </button>
      </div>
      <div className="db-table">
        <table>
          <thead>
            <tr>
              {[
                "ID",
                "Name",
                "Email",
                "Role",
                "Status",
                "Joined",
                "Listings",
                "Bookings",
                "Messages",
                "Actions",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((current - 1) * 12, current * 12).map((x) => (
              <tr key={x.id} data-record-id={x.id}>
                <td>{x.id}</td>
                <td>{x.name || "Not provided"}</td>
                <td>{x.email}</td>
                <td>{x.role}</td>
                <td>{x.status}</td>
                <td>{date(x.createdAt)}</td>
                <td>{x.properties}</td>
                <td>{x.bookings}</td>
                <td>{x.messages}</td>
                <td>
                  {x.role !== "admin" && x.id !== user?.id ? (
                    <button
                      className="button button-secondary"
                      onClick={() => {
                        setSelected(x)
                        setDecision(x.status)
                        setReason("")
                        setError("")
                      }}
                    >
                      Manage status
                    </button>
                  ) : (
                    "Administrator"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p>No matching users.</p>}
      </div>
      <div className="db-pagination">
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>
          Previous
        </button>
        <span>
          Page {current} of {pages} · {rows.length} users
        </span>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Next
        </button>
      </div>
      {selected && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Manage user status"
          >
            <h2>{selected.name}</h2>
            <p>
              Account #{selected.id}. Restricting access revokes active
              sessions.
            </p>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              {["active", "suspended", "banned"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <label>
              Reason
              <input
                value={reason}
                maxLength={1000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={() => setSelected(null)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={busy || decision === selected.status}
                onClick={() => void save()}
              >
                {busy ? "Saving…" : "Confirm status"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
function Payments() {
  const state = useAdminData<{ items: Payment[] }>("/admin/payments")
  const [status, setStatus] = useState(""),
    [type, setType] = useState(""),
    [page, setPage] = useState(1)
  if (!state.data || state.error) return <State {...state} />
  const rows = state.data.items.filter(
    (x) => (!status || status === x.status) && (!type || type === x.recordType),
  )
  const totals = new Map<string, number>()
  for (const x of rows) {
    const key = x.currency + " · " + x.recordType + " · " + x.status
    totals.set(key, (totals.get(key) || 0) + Number(x.amount))
  }
  const pages = Math.max(1, Math.ceil(rows.length / 12)),
    current = Math.min(page, pages)
  return (
    <>
      <h1>Payments & Reports</h1>
      <p>
        Stored payment records. Charges, payouts and refunds are separate;
        booking values are not payments. Deposit allocation and outstanding
        balances are not tracked by this schema.
      </p>
      <div className="db-filters">
        <select
          aria-label="Payment status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All statuses</option>
          {["pending", "processing", "completed", "failed", "refunded"].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
        <select
          aria-label="Record type"
          value={type}
          onChange={(e) => {
            setType(e.target.value)
            setPage(1)
          }}
        >
          <option value="">All record types</option>
          {["charge", "payout", "refund"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button className="button button-secondary" onClick={state.refresh}>
          Refresh Data
        </button>
        <button
          className="button button-secondary"
          disabled={!rows.length}
          onClick={() =>
            exportCsv("payments", rows as unknown as Record<string, unknown>[])
          }
        >
          Export records
        </button>
      </div>
      <div className="db-metrics">
        {[...totals].map(([label, total]) => (
          <article className="metric-card" key={label}>
            <small>{label}</small>
            <strong>{money(total, label.slice(0, 3))}</strong>
          </article>
        ))}
      </div>
      {!rows.length ? (
        <div className="listing-state">
          No payment records match these filters.
        </div>
      ) : (
        <div className="db-table">
          <table>
            <thead>
              <tr>
                {[
                  "ID",
                  "Reference",
                  "Booking",
                  "Property",
                  "Payer",
                  "Payee",
                  "Type",
                  "Amount",
                  "Status",
                  "Date",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice((current - 1) * 12, current * 12).map((x) => (
                <tr key={x.id} data-record-id={x.id}>
                  <td>{x.id}</td>
                  <td>{x.reference || "Not provided"}</td>
                  <td>{x.bookingId ?? "Not provided"}</td>
                  <td>{x.title || "Not provided"}</td>
                  <td>{x.payerName || "Not provided"}</td>
                  <td>{x.payeeName || "Not provided"}</td>
                  <td>{x.recordType}</td>
                  <td>{money(x.amount, x.currency)}</td>
                  <td>{x.status}</td>
                  <td>{date(x.transactionAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="db-pagination">
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>
          Previous
        </button>
        <span>
          Page {current} of {pages} · {rows.length} records
        </span>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}
function AnalyticsPage() {
  const [range, setRange] = useState("This Month")
  const state = useAdminData<Analytics>(
    "/admin/analytics?range=" + encodeURIComponent(range),
  )
  return (
    <>
      <h1>Analytics</h1>
      <div className="db-filters">
        <select
          aria-label="Reporting period"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          {["Today", "This Week", "This Month", "This Year"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <button className="button button-secondary" onClick={state.refresh}>
          Refresh Data
        </button>
        {state.data && !state.error && (
          <button
            className="button button-secondary"
            onClick={() =>
              exportCsv(
                "analytics",
                Object.entries(state.data!.series).flatMap(([metric, rows]) =>
                  rows.map((x) => ({ metric, ...x })),
                ),
              )
            }
          >
            Export report
          </button>
        )}
      </div>
      {!state.data || state.error ? (
        <State {...state} />
      ) : (
        <>
          <p>
            {state.data.start} to {state.data.end} · {state.data.timezone} ·
            daily buckets, including zero days.
          </p>
          {Object.entries(state.data.series).map(([key, values]) => (
            <section className="account-card" key={key}>
              <h2>
                {key === "revenue"
                  ? `Completed charges (${state.data!.currency})`
                  : `New ${key}`}
              </h2>
              <strong>
                {key === "revenue"
                  ? money(
                      values.reduce((sum, x) => sum + x.value, 0),
                      state.data!.currency,
                    )
                  : values.reduce((sum, x) => sum + x.value, 0)}
              </strong>
              <Bars
                label={`${
                  key === "revenue" ? "Completed charges" : "New " + key
                } per day`}
                data={values.map((x) => ({ label: x.day, value: x.value }))}
              />
            </section>
          ))}
        </>
      )}
    </>
  )
}
function Logs({ filter }: { filter?: string }) {
  const state = useAdminData<{ items: Activity[]; timezone: string }>(
    "/admin/activity",
  )
  const [search, setSearch] = useState(""),
    [from, setFrom] = useState(filter || ""),
    [page, setPage] = useState(1)
  if (!state.data || state.error) return <State {...state} />
  const rows = state.data.items.filter(
    (x) =>
      (!from ||
        new Intl.DateTimeFormat("en-CA", {
          timeZone: state.data!.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date(x.createdAt)) === from) &&
      `${x.action} ${x.description || ""} ${x.actorName || ""} ${x.targetId || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(rows.length / 12)),
    current = Math.min(page, pages)
  return (
    <>
      <h1>Activity Logs</h1>
      <p>Recorded events only. No reconstructed historical events.</p>
      <div className="db-filters">
        <input
          aria-label="Search activity"
          placeholder="Search recorded activity"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <input
          aria-label="Activity day"
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
        />
        <button
          className="button button-secondary"
          onClick={() => {
            setSearch("")
            setFrom("")
            setPage(1)
          }}
        >
          Clear filters
        </button>
        <button className="button button-secondary" onClick={state.refresh}>
          Refresh Data
        </button>
        <button
          className="button button-secondary"
          disabled={!rows.length}
          onClick={() =>
            exportCsv("activity", rows as unknown as Record<string, unknown>[])
          }
        >
          Export records
        </button>
      </div>
      <div className="db-table">
        <table>
          <thead>
            <tr>
              {[
                "ID",
                "Timestamp",
                "Actor",
                "Action",
                "Target",
                "Description",
                "Outcome",
                "Source IP",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice((current - 1) * 12, current * 12).map((x) => (
              <tr key={x.id} data-record-id={x.id}>
                <td>{x.id}</td>
                <td>{date(x.createdAt)}</td>
                <td>{x.actorName || "Not provided"}</td>
                <td>{x.action}</td>
                <td>
                  {x.targetType || "Not provided"} {x.targetId ?? ""}
                </td>
                <td>{x.description || "Not provided"}</td>
                <td>{x.outcome}</td>
                <td>{x.sourceIp || "Not provided"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p>No recorded activity matches these filters.</p>}
      </div>
      <div className="db-pagination">
        <button disabled={current === 1} onClick={() => setPage(current - 1)}>
          Previous
        </button>
        <span>
          Page {current} of {pages} · {rows.length} events
        </span>
        <button
          disabled={current === pages}
          onClick={() => setPage(current + 1)}
        >
          Next
        </button>
      </div>
    </>
  )
}
function PlatformSettings() {
  const state = useAdminData<{ settings: Settings | null }>("/admin/settings")
  const [draft, setDraft] = useState<Settings | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const mounted = useRef(true)
  useEffect(
    () => () => {
      mounted.current = false
    },
    [],
  )
  useEffect(() => {
    if (state.data?.settings && !draft) setDraft(state.data.settings)
  }, [state.data, draft])
  if (!state.data || state.error) return <State {...state} />
  if (!state.data.settings || !draft)
    return <p>Platform settings are not initialized.</p>
  const save = async () => {
    setBusy(true)
    setError("")
    setSaved(false)
    try {
      const { maintenanceMode, ...body } = draft
      await apiRequest("/admin/settings", { method: "PATCH", csrf: true, body })
      if (mounted.current) {
        setSaved(true)
        changed()
        state.refresh()
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Unable to save settings")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <>
      <AccountSettings />
      <section className="account-card">
        <h2>Platform configuration</h2>
        <p>
          Stored configuration. Session lifetime is controlled by backend
          environment; maintenance access enforcement is not implemented.
        </p>
        <div className="account-form-grid">
          {[
            "platformName",
            "supportEmail",
            "currency",
            "timezone",
            "reviewTargetHours",
          ].map((key) => (
            <label key={key}>
              <span>{key}</span>
              <input
                value={draft[(key as keyof Settings)] as string | number ?? ""}
                type={key === "reviewTargetHours" ? "number" : "text"}
                onChange={(e) => {
                  setSaved(false)
                  setDraft({
                    ...draft,
                    [key]:
                      key === "reviewTargetHours"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }}
              />
            </label>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        {saved && <p>Configuration saved.</p>}
        <button
          className="button button-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save configuration"}
        </button>
      </section>
    </>
  )
}
export default function AdminWorkspace({
  view,
  state,
  go,
  filter,
}: {
  view: string
  state: ReturnType<typeof useAdminOverview>
  go: (page: string, filter?: string) => void
  filter?: string
}) {
  return (
    <div className="admin-live">
      {view === "Admin overview" ? (
        <OverviewPage state={state} go={go} />
      ) : view === "Admin users" ? (
        <Users key={filter} initialSearch={filter} />
      ) : view === "Admin payments" ? (
        <Payments />
      ) : view === "Admin analytics" ? (
        <AnalyticsPage />
      ) : view === "Admin logs" ? (
        <Logs key={filter} filter={filter} />
      ) : (
        <PlatformSettings />
      )}
    </div>
  )
}
