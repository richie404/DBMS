import { useEffect, useMemo, useState } from "react";
import { workspaceService, type PaymentRecord } from "../services/workspace";

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function OwnerPayments() {
  const [items, setItems] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let current = true;
    setLoading(true);
    workspaceService.payments("owner").then((records) => {
      if (current) setItems(records);
    }).catch((requestError) => {
      if (current) setError(requestError instanceof Error ? requestError.message : "Unable to load payments.");
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [retry]);

  const visible = useMemo(() => status === "all" ? items : items.filter((item) => item.status === status), [items, status]);
  const completed = items.filter((item) => item.status === "completed" && item.recordType === "charge").reduce((sum, item) => sum + Number(item.amount), 0);
  const pending = items.filter((item) => ["pending", "processing"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount), 0);

  return <div className="owner-earnings-page">
    <div className="earnings-head"><div><p className="eyebrow">FINANCIAL OVERVIEW</p><h1>Payments</h1><p>Track payment activity for your rental properties.</p></div></div>
    <div className="earnings-summary"><article><div><small>COMPLETED PAYMENTS</small></div><strong>{money(completed, "BDT")}</strong><p>Recorded completed charges</p></article><article><div><small>PENDING PAYMENTS</small></div><strong>{money(pending, "BDT")}</strong><p>Pending or processing records</p></article><article><div><small>PAYMENT RECORDS</small></div><strong>{items.length}</strong><p>Across your properties</p></article></div>
    {error ? <div className="listing-state" role="alert"><p>{error}</p><button className="button button-secondary" onClick={() => setRetry((value) => value + 1)}>Retry payments</button></div> : <section className="transactions-section"><div className="transactions-head"><div><h2>Transactions</h2><p>Payment records stored in RentNest.</p></div><label className="listing-sort"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["pending", "processing", "completed", "failed", "refunded"].map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>
      {loading ? <p>Loading payment records…</p> : visible.length ? <div className="earnings-table"><div className="earnings-table-head"><span>Date</span><span>Property</span><span>Payer</span><span>Amount</span><span>Status</span></div>{visible.map((item) => <article key={item.id}><div><strong>{new Date(item.transactionAt || item.createdAt).toLocaleDateString()}</strong><small>{item.reference || `Payment #${item.id}`}</small></div><div><strong>{item.title || "Unassigned payment"}</strong><small>{item.location || ""}</small></div><div><strong>{item.payerName || "—"}</strong></div><strong className="transaction-amount">{money(Number(item.amount), item.currency)}</strong><span className="badge">{item.status}</span></article>)}</div> : <div className="listing-state"><h2>No payment records found.</h2><p>Payments linked to your bookings will appear here.</p></div>}</section>}
  </div>;
}
