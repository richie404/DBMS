import type { ReactNode } from "react"
import type { useDashboardSummary } from "./useDashboardSummary"
interface Props {
  icons: ReactNode[]
  arrow: ReactNode
  state: ReturnType<typeof useDashboardSummary>
  onOpen: (kind: string) => void
}
export default function DashboardCards({ state, onOpen, icons, arrow }: Props) {
  if (state.error)
    return (
      <div className="listing-state" role="alert">
        <p>{state.error}</p>
        <button className="button button-secondary" onClick={state.refresh}>
          Retry dashboard counts
        </button>
      </div>
    )
  const cards = [
    {
      label: "Saved Properties",
      key: "savedProperties",
      note: "Homes you love",
    },
    {
      label: "Active Bookings",
      key: "activeBookings",
      note: "Approved and confirmed rentals",
    },
    {
      label: "Pending Requests",
      key: "pendingRequests",
      note: "Waiting for owner approval",
    },
    {
      label: "Unread Messages",
      key: "unreadMessages",
      note: `Across ${state.summary?.unreadConversations ?? "…"} ${
        state.summary?.unreadConversations === 1
          ? "conversation"
          : "conversations"
      }`,
    },
  ] as const
  return (
    <section className="renter-summary" aria-label="Rental summary">
      {cards.map((card, i) => (
        <article key={card.key}>
          <button
            className="summary-card-link"
            onClick={() => onOpen(card.key)}
            aria-label={card.label}
          >
            <span className={`summary-icon summary-${i}`} aria-hidden="true">
              {icons[i]}
            </span>
            <div>
              <small>{card.label}</small>
              {state.summary ? (
                <strong>{state.summary[card.key]}</strong>
              ) : (
                <span
                  className="skeleton line"
                  role="status"
                  aria-label="Loading count"
                />
              )}
              <p>{card.note}</p>
            </div>
            <span aria-hidden="true">{arrow}</span>
          </button>
        </article>
      ))}
    </section>
  )
}
