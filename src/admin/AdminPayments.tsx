import { useEffect, useMemo, useState } from "react"
import { Button, StatusBadge } from "../components/system"
import { workspaceService, type PaymentRecord } from "../services/workspace"

type PaymentStatus = "all" | "completed" | "pending" | "processing" | "failed" | "refunded"
type UserType = "all" | "renter" | "owner" | "admin"

const money = (amount: number, currency = "BDT") => `${currency} ${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const recordDate = (payment: PaymentRecord) => payment.transactionAt || payment.createdAt
const recordDay = (payment: PaymentRecord) => recordDate(payment).slice(0, 10)
const displayDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
const initials = (value: string | null) => (value || "Unknown").split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()
const badgeTone = (value: string): "success" | "warning" | "danger" | "neutral" => value === "completed" ? "success" : ["pending", "processing"].includes(value) ? "warning" : value === "failed" ? "danger" : "neutral"
const csvCell = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [status, setStatus] = useState<PaymentStatus>("all")
  const [userType, setUserType] = useState<UserType>("all")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    workspaceService.payments("admin").then((items) => {
      if (active) { setPayments(items); setError("") }
    }).catch((requestError: Error) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  const visible = useMemo(() => payments.filter((payment) =>
    (status === "all" || payment.status === status) &&
    (userType === "all" || payment.payerRole === userType) &&
    (!from || recordDay(payment) >= from) && (!to || recordDay(payment) <= to),
  ), [payments, status, userType, from, to])
  const completedCharges = useMemo(() => payments.filter((payment) => payment.status === "completed" && payment.recordType === "charge"), [payments])
  const latestTime = payments.reduce((result, payment) => Math.max(result, Date.parse(recordDate(payment))), 0)
  const latestMonth = latestTime ? new Date(latestTime) : new Date()
  const months = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latestMonth.getFullYear(), latestMonth.getMonth() - 5 + index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    return { label: new Intl.DateTimeFormat("en", { month: "short" }).format(date), amount: completedCharges.filter((payment) => recordDay(payment).startsWith(key)).reduce((sum, payment) => sum + Number(payment.amount), 0) }
  }), [completedCharges, latestMonth.getFullYear(), latestMonth.getMonth()])
  const totalRevenue = completedCharges.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const completedAmount = payments.filter((payment) => payment.status === "completed").reduce((sum, payment) => sum + Number(payment.amount), 0)
  const pendingAmount = payments.filter((payment) => ["pending", "processing"].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount), 0)
  const refundedAmount = payments.filter((payment) => payment.status === "refunded").reduce((sum, payment) => sum + Number(payment.amount), 0)
  const settledPercent = totalAmount ? Math.round((completedAmount / totalAmount) * 1000) / 10 : 0
  const maxMonth = Math.max(1, ...months.map((month) => month.amount))
  const notify = (message: string) => { setNotice(message); window.setTimeout(() => setNotice(""), 2500) }
  const downloadCsv = () => {
    const rows = [["Reference", "Record type", "Payer", "Payer role", "Payee", "Property", "Amount", "Currency", "Status", "Date"], ...visible.map((payment) => [payment.reference || `PAY-${payment.id}`, payment.recordType, payment.payerName, payment.payerRole, payment.payeeName, payment.title, payment.amount, payment.currency, payment.status, recordDay(payment)])]
    const url = URL.createObjectURL(new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv" }))
    const link = document.createElement("a"); link.href = url; link.download = "rentnest-payments.csv"; link.click(); URL.revokeObjectURL(url)
    notify("Downloaded the current database report")
  }
  const clear = () => { setFrom(""); setTo(""); setStatus("all"); setUserType("all") }

  return <div className="admin-finance-page">
    {notice && <div className="admin-report-toast">{notice}</div>}
    <div className="admin-finance-head"><div><p className="eyebrow">FINANCIAL OPERATIONS</p><h1>Payments & Reports</h1><p>Live payment records and settlement totals from the RentNest database.</p></div><div><Button variant="secondary" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>{loading ? "Refreshing…" : "Refresh data"}</Button><Button variant="secondary" onClick={() => { window.print(); notify("Use your browser’s Save as PDF option") }}>Generate PDF</Button><Button onClick={downloadCsv} disabled={!visible.length}>Download CSV</Button></div></div>
    {error ? <div className="listing-state" role="alert"><h2>Payments could not be loaded</h2><p>{error}</p><Button variant="secondary" onClick={() => setRefresh((value) => value + 1)}>Try again</Button></div> : loading ? <div className="admin-listing-loading">Loading payment records from the database…</div> : <>
      <section className="admin-finance-summary">{[["TOTAL REVENUE", money(totalRevenue), "Completed charge payments", "up"], ["LATEST MONTH", money(months.at(-1)?.amount ?? 0), `${months.at(-1)?.label || "Current"} completed charges`, "up"], ["COMPLETED TRANSACTIONS", String(payments.filter((payment) => payment.status === "completed").length), "Across all payment records", "neutral"], ["PENDING PAYMENTS", money(pendingAmount), `${payments.filter((payment) => ["pending", "processing"].includes(payment.status)).length} awaiting settlement`, "attention"]].map(([label, value, description, style]) => <article key={label}><span className={`admin-finance-icon ${style}`}>{label === "TOTAL REVENUE" ? "৳" : label === "COMPLETED TRANSACTIONS" ? "✓" : "•"}</span><div><small>{label}</small><strong>{value}</strong><p className={style}>{description}</p></div></article>)}</section>
      <div className="admin-finance-overview"><section className="admin-revenue-chart-card"><div className="admin-panel-head"><div><h2>Revenue Performance</h2><p>Completed charge payments over the latest six months in the database.</p></div></div><div className="admin-revenue-total"><strong>{money(months.reduce((sum, month) => sum + month.amount, 0))}</strong><span>Six-month processed revenue</span></div><div className="admin-revenue-chart" role="img" aria-label="Monthly revenue chart"><div className="finance-chart-scale"><span>{money(maxMonth)}</span><span>{money(Math.round(maxMonth / 2))}</span><span>{money(0)}</span></div><div className="finance-chart-bars">{months.map((month) => <div key={month.label}><span>{money(month.amount)}</span><i style={{ height: `${Math.max(month.amount ? 8 : 2, (month.amount / maxMonth) * 100)}%` }} /><small>{month.label}</small></div>)}</div></div></section><aside className="admin-settlement-card"><div className="admin-panel-head"><div><h2>Settlement Overview</h2><p>Distribution of all recorded payment amounts.</p></div></div><div className="settlement-ring" style={{ background: `conic-gradient(var(--success) 0 ${settledPercent}%,#eadfe4 ${settledPercent}% 100%)` }}><div><strong>{settledPercent}%</strong><small>SETTLED</small></div></div><ul><li><i/><span>Completed</span><strong>{money(completedAmount)}</strong></li><li><i className="pending"/><span>Pending</span><strong>{money(pendingAmount)}</strong></li><li><i className="refunded"/><span>Refunded</span><strong>{money(refundedAmount)}</strong></li></ul></aside></div>
      <section className="admin-transactions-panel"><div className="admin-transactions-toolbar"><div><h2>Transactions</h2><p>{visible.length} of {payments.length} database records</p></div><div><label><span>From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span>To</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><label><span>Payment Status</span><select value={status} onChange={(event) => setStatus(event.target.value as PaymentStatus)}><option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label><label><span>User Type</span><select value={userType} onChange={(event) => setUserType(event.target.value as UserType)}><option value="all">All user types</option><option value="renter">Renter</option><option value="owner">Owner</option><option value="admin">Admin</option></select></label></div></div>{visible.length ? <><div className="admin-transactions-head"><span>Transaction ID</span><span>User</span><span>Property</span><span>Amount</span><span>Payment Status</span><span>Date</span></div><div className="admin-transactions-table">{visible.map((payment) => <article key={payment.id}><strong>{payment.reference || `PAY-${payment.id}`}</strong><div className="finance-user"><span className="avatar">{initials(payment.payerName)}</span><p><strong>{payment.payerName || "System payment"}</strong><small>{payment.payerRole || payment.recordType}</small></p></div><div className="finance-property">{payment.image ? <img src={payment.image} alt="" /> : <span className="finance-property-empty">No image</span>}<p><strong>{payment.title || "No linked property"}</strong><small>{payment.location || "Not available"}</small></p></div><strong className="finance-amount">{money(payment.amount, payment.currency)}</strong><StatusBadge tone={badgeTone(payment.status)}>{payment.status}</StatusBadge><span className="finance-date">{displayDate(recordDate(payment))}</span></article>)}</div></> : <div className="admin-finance-empty"><h2>No transactions found</h2><p>Adjust the database filters to see other payment records.</p><Button variant="secondary" onClick={clear}>Clear Filters</Button></div>}</section>
    </>}
  </div>
}
