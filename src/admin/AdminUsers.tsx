import { useEffect, useMemo, useState } from "react"
import { Button, Modal, StatusBadge } from "../components/system"
import { workspaceService, type ManagedUser } from "../services/workspace"

type Role = "all" | "renter" | "owner" | "admin"
type Status = "all" | "active" | "suspended" | "banned"
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()
const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date))
const badgeTone = (status: string): "success" | "warning" | "danger" => status === "active" ? "success" : status === "suspended" ? "warning" : "danger"

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<Role>("all")
  const [status, setStatus] = useState<Status>("all")
  const [joinedAfter, setJoinedAfter] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [detail, setDetail] = useState<ManagedUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [menu, setMenu] = useState<number | null>(null)
  const [actionError, setActionError] = useState("")
  const [working, setWorking] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" })
  const [formError, setFormError] = useState("")
  const pageSize = 8

  useEffect(() => { let active = true; setLoading(true); workspaceService.users().then((items) => { if (active) { setUsers(items); setError("") } }).catch((requestError: Error) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [refresh])
  const filtered = useMemo(() => users.filter((user) => {
    const query = search.trim().toLowerCase()
    return (!query || [user.name, user.username, user.email].join(" ").toLowerCase().includes(query)) && (role === "all" || user.role === role) && (status === "all" || user.status === status) && (!joinedAfter || user.createdAt.slice(0, 10) >= joinedAfter)
  }), [users, search, role, status, joinedAfter])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const changeStatus = async (ids: number[], nextStatus: "active" | "suspended" | "banned") => {
    if (!ids.length || working) return
    setWorking(true); setActionError("")
    try { await Promise.all(ids.map((id) => workspaceService.userStatus(id, nextStatus))); setSelected([]); setMenu(null); setDetail(null); setRefresh((value) => value + 1) }
    catch (requestError) { setActionError(requestError instanceof Error ? requestError.message : "Unable to update account status") }
    finally { setWorking(false) }
  }
  const reset = () => { setSearch(""); setRole("all"); setStatus("all"); setJoinedAfter(""); setPage(1) }
  const createAdmin = async () => {
    setWorking(true); setFormError("")
    try { await workspaceService.createAdmin(form); setAdding(false); setForm({ name: "", username: "", email: "", password: "" }); setRefresh((value) => value + 1) }
    catch (requestError) { setFormError(requestError instanceof Error ? requestError.message : "Unable to create administrator") }
    finally { setWorking(false) }
  }
  const deleteUser = async () => {
    if (!deleteTarget || working) return
    setWorking(true); setActionError("")
    try { await workspaceService.deleteUser(deleteTarget.id); setDeleteTarget(null); setMenu(null); setDetail(null); setSelected((items) => items.filter((id) => id !== deleteTarget.id)); setRefresh((value) => value + 1) }
    catch (requestError) { setActionError(requestError instanceof Error ? requestError.message : "Unable to delete account") }
    finally { setWorking(false) }
  }
  return <div className="admin-users-page"><div className="admin-users-head"><div><p className="eyebrow">ADMINISTRATION</p><h1>User Management</h1><p>Live renter, owner, and administrator accounts from the database.</p></div><div><StatusBadge tone="neutral">{users.length} users</StatusBadge><Button onClick={() => { setAdding(true); setFormError("") }}>Add Administrator</Button></div></div>
    <section className="admin-user-filters"><label className="admin-user-search"><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search name, username, or email" /></label><label><span>Role</span><select value={role} onChange={(event) => { setRole(event.target.value as Role); setPage(1) }}><option value="all">All</option><option value="renter">Renter</option><option value="owner">Owner</option><option value="admin">Admin</option></select></label><label><span>Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as Status); setPage(1) }}><option value="all">All</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option></select></label><label><span>Joined after</span><input type="date" value={joinedAfter} onChange={(event) => { setJoinedAfter(event.target.value); setPage(1) }} /></label><Button variant="ghost" onClick={reset}>Reset</Button></section>
    {actionError && <p className="form-error-message" role="alert">{actionError}</p>}
    {selected.length > 0 && <div className="admin-bulk-bar"><span><strong>{selected.length}</strong> users selected</span><select defaultValue="" disabled={working} onChange={(event) => { const value = event.target.value as "active" | "suspended" | "banned"; if (value) void changeStatus(selected, value) }}><option value="" disabled>Bulk actions</option><option value="active">Restore access</option><option value="suspended">Suspend users</option><option value="banned">Ban users</option></select><button onClick={() => setSelected([])}>Clear selection</button></div>}
    <section className="admin-users-table-wrap">{error ? <div className="admin-users-empty"><h2>Users could not be loaded</h2><p>{error}</p><Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>Try again</Button></div> : loading ? <div className="admin-listing-loading">Loading user accounts from the database…</div> : visible.length ? <><div className="admin-users-table-head"><input type="checkbox" aria-label="Select visible users" checked={visible.length > 0 && visible.every((user) => selected.includes(user.id))} onChange={(event) => setSelected(event.target.checked ? [...new Set([...selected, ...visible.map((user) => user.id)])] : selected.filter((id) => !visible.some((user) => user.id === id)))} /><span>Avatar</span><span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Joined</span><span>Actions</span></div><div className="admin-users-table">{visible.map((user) => <article key={user.id}><input type="checkbox" aria-label={`Select ${user.name}`} checked={selected.includes(user.id)} onChange={() => setSelected((items) => items.includes(user.id) ? items.filter((id) => id !== user.id) : [...items, user.id])}/><span className="avatar">{initials(user.name)}</span><div className="admin-user-name"><strong>{user.name}</strong><small>@{user.username}</small></div><span className="admin-user-email">{user.email}</span><span className={`role-badge ${user.role}`}>{user.role}</span><StatusBadge tone={badgeTone(user.status)}>{user.status}</StatusBadge><span className="admin-joined">{dateLabel(user.createdAt)}</span><div className="admin-row-menu"><button className="icon-button" onClick={() => setMenu(menu === user.id ? null : user.id)} aria-label={`Actions for ${user.name}`}>•••</button>{menu === user.id && <div><button onClick={() => { setDetail(user); setMenu(null) }}>View details</button>{user.role !== "admin" && user.status === "active" && <button onClick={() => void changeStatus([user.id], "suspended")}>Suspend user</button>}{user.role !== "admin" && user.status !== "banned" && <button className="danger" onClick={() => void changeStatus([user.id], "banned")}>Ban user</button>}{user.role !== "admin" && user.status !== "active" && <button onClick={() => void changeStatus([user.id], "active")}>Restore access</button>}{user.role !== "admin" && <button className="danger" onClick={() => { setDeleteTarget(user); setMenu(null) }}>Delete account</button>}</div>}</div></article>)}</div><div className="admin-pagination"><p>Showing <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> users</p><div><Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="secondary" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></> : <div className="admin-users-empty"><h2>No users found</h2><p>Try changing the current search or filters.</p><Button variant="secondary" onClick={reset}>Clear filters</Button></div>}</section>
    <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="User details" variant="details" footer={<Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>}>{detail && <div className="admin-user-detail"><header><span className="avatar">{initials(detail.name)}</span><div><h3>{detail.name}</h3><p>@{detail.username} · {detail.email}</p><StatusBadge tone={badgeTone(detail.status)}>{detail.status}</StatusBadge></div></header><dl><div><dt>Role</dt><dd>{detail.role}</dd></div><div><dt>Phone</dt><dd>{detail.phone || "Not provided"}</dd></div><div><dt>Joined</dt><dd>{dateLabel(detail.createdAt)}</dd></div><div><dt>Properties</dt><dd>{detail.properties}</dd></div><div><dt>Bookings</dt><dd>{detail.bookings}</dd></div><div><dt>Messages sent</dt><dd>{detail.messages}</dd></div></dl>{detail.role !== "admin" && <div className="admin-user-detail-actions"><Button variant="secondary" disabled={working || detail.status === "suspended"} onClick={() => void changeStatus([detail.id], "suspended")}>Suspend</Button><Button variant={detail.status === "banned" ? "primary" : "destructive"} disabled={working} onClick={() => void changeStatus([detail.id], detail.status === "banned" ? "active" : "banned")}>{detail.status === "banned" ? "Restore access" : "Ban user"}</Button></div>}</div>}</Modal>
    <Modal open={adding} onClose={() => { if (!working) setAdding(false) }} title="Add administrator" variant="form" footer={<><Button variant="secondary" disabled={working} onClick={() => setAdding(false)}>Cancel</Button><Button disabled={working} onClick={() => void createAdmin()}>{working ? "Creating…" : "Create administrator"}</Button></>}><div className="admin-user-add-form"><p>The new account receives administrator access and can sign in with the password set here.</p><label>Name<input value={form.name} maxLength={150} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Username<input value={form.username} maxLength={50} onChange={(event) => setForm({ ...form, username: event.target.value })}/></label><label>Email<input type="email" value={form.email} maxLength={254} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label>Temporary password<input type="password" value={form.password} minLength={8} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>{formError && <p className="form-error-message" role="alert">{formError}</p>}</div></Modal>
    <Modal open={Boolean(deleteTarget)} onClose={() => { if (!working) setDeleteTarget(null) }} title="Delete user account" variant="confirmation" footer={<><Button variant="secondary" disabled={working} onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={working} onClick={() => void deleteUser()}>{working ? "Deleting…" : "Delete account"}</Button></>}><div className="admin-user-delete-confirm"><p>This removes <strong>{deleteTarget?.name}</strong> from the active platform. Their sessions will be revoked; booking and audit records are retained.</p></div></Modal>
  </div>
}
