import { useEffect, useMemo, useState } from "react"
import { StatusBadge } from "../components/system"
import { workspaceService, type Analytics } from "../services/workspace"

type Range = "Today" | "This Week" | "This Month" | "This Year"
type Point = { day: string; value: number }

const amount = (value: number) => `BDT ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const label = (day: string, range: Range) => new Intl.DateTimeFormat("en", range === "This Year" ? { month: "short" } : range === "Today" ? { hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric" }).format(new Date(`${day}T00:00:00`))
const total = (items: Point[]) => items.reduce((sum, item) => sum + Number(item.value), 0)

function chartPoints(items: Point[], fallbackStart: string, fallbackEnd: string) {
  if (items.length > 1) return items
  if (items.length === 1) return [{ day: fallbackStart, value: 0 }, items[0]]
  return [{ day: fallbackStart, value: 0 }, { day: fallbackEnd, value: 0 }]
}

function LiveChart({ title, description, data, range, type, valueLabel, start, end }: { title: string; description: string; data: Point[]; range: Range; type: "line" | "bar"; valueLabel: (value: number) => string; start: string; end: string }) {
  const points = chartPoints(data, start, end)
  const max = Math.max(1, ...points.map((item) => Number(item.value)))
  const polyline = points.map((item, index) => `${(index * 100) / (points.length - 1)},${92 - (Number(item.value) / max) * 72}`).join(" ")
  const periodTotal = total(data)
  return <section className="analytics-chart-card"><div className="analytics-chart-head"><div><h2>{title}</h2><p>{description}</p></div><StatusBadge tone="neutral">Live data</StatusBadge></div><div className={`analytics-visual ${type}`} role="img" aria-label={`${title}: ${points.map((item) => valueLabel(Number(item.value))).join(", ")}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none"><g className="analytics-grid-lines"><line x1="0" y1="20" x2="100" y2="20"/><line x1="0" y1="44" x2="100" y2="44"/><line x1="0" y1="68" x2="100" y2="68"/><line x1="0" y1="92" x2="100" y2="92"/></g>{type === "line" ? <><polygon className="analytics-area" points={`0,92 ${polyline} 100,92`}/><polyline className="analytics-line" points={polyline}/>{points.map((item, index) => <circle key={`${item.day}-${index}`} cx={(index * 100) / (points.length - 1)} cy={92 - (Number(item.value) / max) * 72} r="1.5"><title>{valueLabel(Number(item.value))}</title></circle>)}</> : points.map((item, index) => { const width = 70 / points.length; const height = (Number(item.value) / max) * 72; return <rect key={`${item.day}-${index}`} x={(index * (100 / points.length)) + 4} y={92 - height} width={width} height={height} rx="1"><title>{valueLabel(Number(item.value))}</title></rect> })}</svg></div><div className="analytics-axis">{points.map((item, index) => <span key={`${item.day}-${index}`}>{label(item.day, range)}</span>)}</div><div className="analytics-chart-summary"><span><small>PERIOD TOTAL</small><strong>{valueLabel(periodTotal)}</strong></span><span><small>AVERAGE</small><strong>{valueLabel(Math.round(periodTotal / Math.max(1, data.length)))}</strong></span><span><small>PEAK</small><strong>{valueLabel(Math.max(0, ...data.map((item) => Number(item.value))))}</strong></span></div></section>
}

export default function AdminAnalyticsLive() {
  const [range, setRange] = useState<Range>("This Month")
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    workspaceService.analytics(range).then((result) => { if (active) { setData(result); setError("") } }).catch((requestError: Error) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [range, refresh])
  const metrics = useMemo(() => data ? [
    ["TOTAL USERS", data.totalUsers.toLocaleString(), "Current database accounts"],
    ["NEW USERS", total(data.series.users).toLocaleString(), `Added during ${range.toLowerCase()}`],
    ["NEW LISTINGS", total(data.series.listings).toLocaleString(), `Submitted during ${range.toLowerCase()}`],
    ["BOOKINGS", total(data.series.bookings).toLocaleString(), `Created during ${range.toLowerCase()}`],
    ["REVENUE", amount(total(data.series.revenue)), "Completed charge payments"],
  ] : [], [data, range])
  return <div className="admin-analytics-page"><div className="admin-analytics-head"><div><p className="eyebrow">BUSINESS INTELLIGENCE</p><h1>Analytics Dashboard</h1><p>Live growth, activity, and revenue calculated from database records.</p></div><div className="analytics-range">{(["Today", "This Week", "This Month", "This Year"] as Range[]).map((value) => <button className={range === value ? "active" : ""} disabled={loading} onClick={() => setRange(value)} key={value}>{value}</button>)}</div></div>{error ? <div className="listing-state" role="alert"><h2>Analytics could not be loaded</h2><p>{error}</p><button className="button button-secondary" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div> : loading || !data ? <div className="admin-listing-loading">Calculating analytics from the database…</div> : <><section className="analytics-metrics">{metrics.map(([title, value, description]) => <article key={title}><span>{title === "REVENUE" ? "৳" : title === "BOOKINGS" ? "□" : "+"}</span><div><small>{title}</small><strong>{value}</strong><p>{description}</p></div></article>)}</section><div className="analytics-chart-grid"><LiveChart title="User Growth" description={`New account acquisition · ${range}`} data={data.series.users} range={range} type="line" valueLabel={(value) => value.toLocaleString()} start={data.start} end={data.end}/><LiveChart title="Listing Growth" description={`Property submissions · ${range}`} data={data.series.listings} range={range} type="bar" valueLabel={(value) => value.toLocaleString()} start={data.start} end={data.end}/><LiveChart title="Booking Trend" description={`Reservations created · ${range}`} data={data.series.bookings} range={range} type="bar" valueLabel={(value) => value.toLocaleString()} start={data.start} end={data.end}/><LiveChart title="Revenue" description={`Completed charge payments · ${range}`} data={data.series.revenue} range={range} type="line" valueLabel={amount} start={data.start} end={data.end}/></div></>}</div>
}
