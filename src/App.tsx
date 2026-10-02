import RenterRecords from "./rentals/RenterRecords"
import { type Criteria, propertyTypes } from "./services/properties"
import AdminWorkspace, { useAdminOverview } from "./admin/AdminWorkspace"
import AccountSettings from "./auth/AccountSettings"
import OwnerWorkspace, { useOwnerSummary } from "./owner/OwnerWorkspace"
import SessionSecurity from "./auth/SessionSecurity"
import { requiredRole, safeReturnPath } from "./auth/navigation"
import ListingCollection from "./properties/ListingCollection"
import DashboardCards from "./rentals/DashboardCards"
import { useWorkspaceNavigation } from "./rentals/useWorkspaceNavigation"
import { useDashboardSummary } from "./rentals/useDashboardSummary"
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import LiveMessages from "./rentals/Messages"
import LiveBookings from "./rentals/Bookings"
import { rentalService } from "./services/rentals"
import { useNotifications } from "./rentals/useNotifications"

function consumePropertyReturn() {
  try {
    const value = JSON.parse(
      sessionStorage.getItem("rentnest:property-return") || "null",
    )
    sessionStorage.removeItem("rentnest:property-return")
    return value &&
      Number.isSafeInteger(value.propertyId) &&
      value.propertyId > 0 &&
      value.expiresAt > Date.now()
      ? value as { propertyId: number; action: string }
      : null
  } catch {
    return null
  }
}

import Discovery from "./properties/Discovery"
import DatabasePropertyDetails from "./properties/PropertyDetails"
import FavoritesPage from "./properties/FavoritesPage"
import { FavoritesProvider, useFavorites } from "./properties/FavoritesContext"
import { useAuth } from "./auth/AuthContext"
import { authService } from "./services/auth"

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  )
}
function dashboard(role: string) {
  return role === "owner"
    ? "Owner workspace"
    : role === "admin"
      ? "Admin overview"
      : role === "renter"
        ? "Renter dashboard"
        : "Access denied"
}

import { Button, StatusBadge as Badge } from "./components/system"

type IconName = "home" | "heart" | "calendar" | "message" | "bell" | "search" | "sliders" | "chevron" | "pin" | "star" | "building" | "users" | "settings" | "plus" | "more" | "eye" | "mail" | "lock" | "logout" | "paperclip" | "arrow"

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    message: (
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="8" cy="6" r="2" />
        <circle cx="16" cy="12" r="2" />
        <circle cx="10" cy="18" r="2" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    pin: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    star: (
      <path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8Z" />
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 8h2M14 8h2M9 12h2M14 12h2M10 21v-4h4v4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a4 4 0 0 1 0 8M17 15a6 6 0 0 1 4 6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.5 1A7 7 0 0 0 15 6l-.4-3h-4l-.4 3a7 7 0 0 0-1.5 1L6.2 6 4.1 9.5 6.5 11a7 7 0 0 0 0 2L4 14.5 6 18l2.6-1a7 7 0 0 0 1.5 1l.4 3h4l.4-3a7 7 0 0 0 1.5-1l2.5 1 2-3.5-2-1.5a7 7 0 0 0 .1-1Z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H8" />
      </>
    ),
    paperclip: (
      <path d="m20 12-8 8a6 6 0 0 1-8-8l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8" />
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function LoadingButton({
  loading,
  children,
  loadingText = "Saving...",
  onClick,
  variant = "primary",
}: {
  loading: boolean
  children: ReactNode
  loadingText?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "destructive"
}) {
  return (
    <button
      className={`button button-${variant} loading-button`}
      onClick={onClick}
      disabled={loading}
    >
      {loading && <span className="button-spinner" />}
      {loading ? loadingText : children}
    </button>
  )
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="loader-brand">
        <span className="brand-mark">
          <i />
          <i />
        </span>
        <strong>RentNest</strong>
      </div>
      <span className="page-loader-indicator">
        <i />
        <i />
        <i />
      </span>
      <p>Loading RentNest...</p>
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <article className="property-card-skeleton" aria-hidden="true">
      <div className="skeleton skeleton-property-image" />
      <div>
        <span className="skeleton skeleton-title" />
        <span className="skeleton skeleton-copy" />
        <span className="skeleton skeleton-copy short" />
        <div>
          <span className="skeleton skeleton-price" />
          <span className="skeleton skeleton-action" />
        </div>
      </div>
    </article>
  )
}

function DashboardCardSkeleton() {
  return (
    <article className="dashboard-card-skeleton" aria-hidden="true">
      <span className="skeleton" />
      <div>
        <i className="skeleton" />
        <i className="skeleton" />
        <i className="skeleton" />
      </div>
    </article>
  )
}

function NotificationSkeleton() {
  return (
    <article className="notification-skeleton" aria-hidden="true">
      <span className="skeleton" />
      <div>
        <i className="skeleton" />
        <i className="skeleton" />
        <i className="skeleton" />
      </div>
    </article>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <article key={index}>
          <span className="skeleton table-avatar-skeleton" />
          <div>
            <i className="skeleton" />
            <i className="skeleton" />
          </div>
          <span className="skeleton table-cell-skeleton" />
          <span className="skeleton table-cell-skeleton short" />
          <span className="skeleton table-action-skeleton" />
        </article>
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  compact = false,
}: {
  icon: IconName
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: "default" | "favorites" | "bookings" | "messages" | "notifications" | "listings"
  compact?: boolean
}) {
  return (
    <div
      className={`empty-state-system empty-${variant} ${
        compact ? "compact" : ""
      }`}
    >
      <div className="empty-state-illustration">
        <i />
        <span>
          <Icon name={icon} size={compact ? 25 : 34} />
        </span>
        <b />
      </div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel} <Icon name="arrow" size={14} />
        </Button>
      )}
    </div>
  )
}

function ErrorState({
  type,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  fullPage = false,
}: {
  type: "network" | "server" | "not-found" | "permission"
  title: string
  description?: string
  primaryLabel: string
  onPrimary: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  fullPage?: boolean
}) {
  const icon: IconName =
    type === "permission"
      ? "lock"
      : type === "not-found"
        ? "home"
        : type === "network"
          ? "search"
          : "settings"
  return (
    <div
      className={`error-state-system error-${type} ${
        fullPage ? "full-page" : ""
      }`}
      role="alert"
    >
      <div className="error-state-illustration">
        <i />
        <span>
          <Icon name={icon} size={34} />
        </span>
        <b>{type === "not-found" ? "404" : "!"}</b>
      </div>
      <p className="eyebrow">
        {type === "network"
          ? "CONNECTION ERROR"
          : type === "server"
            ? "SYSTEM ERROR"
            : type === "permission"
              ? "ACCESS RESTRICTED"
              : "NOT FOUND"}
      </p>
      <h1>{title}</h1>
      {description && <p className="error-state-description">{description}</p>}
      <div className="error-state-actions">
        <Button onClick={onPrimary}>{primaryLabel}</Button>
        {secondaryLabel && onSecondary && (
          <Button variant="secondary" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

function FormError({ message }: { message: string }) {
  return (
    <small className="form-error-message" role="alert">
      <span>!</span>
      {message}
    </small>
  )
}

function ConfirmationModal({
  type,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
  reason,
  onReasonChange,
  reasonLabel = "Reason",
}: {
  type: "delete" | "approve" | "reject" | "cancel" | "ban"
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
  reason?: string
  onReasonChange?: (value: string) => void
  reasonLabel?: string
}) {
  const destructive = type !== "approve"
  const icon: IconName =
    type === "ban"
      ? "users"
      : type === "delete"
        ? "logout"
        : type === "cancel"
          ? "calendar"
          : type === "approve"
            ? "settings"
            : "more"
  return (
    <div
      className="modal-backdrop confirmation-modal-backdrop"
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className={`modal confirmation-modal confirmation-${type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`confirmation-${type}-title`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div
          className={`confirmation-icon ${destructive ? "danger" : "success"}`}
        >
          <Icon name={icon} size={22} />
        </div>
        <div className="confirmation-copy">
          <p className="eyebrow">{type.toUpperCase()} CONFIRMATION</p>
          <h2 id={`confirmation-${type}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
        {children && <div className="confirmation-context">{children}</div>}
        {onReasonChange && (
          <label className="confirmation-reason">
            <span>{reasonLabel}</span>
            <textarea
              value={reason || ""}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={
                type === "ban"
                  ? "Explain why this user is being banned..."
                  : "Explain rejection reason"
              }
            />
          </label>
        )}
        <div className="confirmation-separator" />
        <div className="confirmation-actions">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: IconName
  label: string
  active?: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
      {badge && <b>{badge}</b>}
    </button>
  )
}

function MobileBottomNav({
  role,
  page,
  go,
}: {
  role: "Renter" | "Owner" | "Admin" | "Guest"
  page: string
  go: (page: string) => void
}) {
  const items =
    role === "Renter"
      ? [
          ["home", "Home", "Renter dashboard"],
          ["search", "Search", "Discover"],
          ["calendar", "Bookings", "Bookings"],
          ["message", "Messages", "Messages"],
          ["users", "Profile", "Settings"],
        ]
      : role === "Owner"
        ? [
            ["home", "Home", "Owner workspace"],
            ["building", "Listings", "Owner listings"],
            ["calendar", "Requests", "Owner booking requests"],
            ["message", "Messages", "Owner messages"],
            ["users", "Profile", "Owner profile"],
          ]
        : [
            ["home", "Home", "Admin overview"],
            ["users", "Users", "Admin users"],
            ["building", "Listings", "Admin listings"],
            ["calendar", "Bookings", "Admin bookings"],
            ["settings", "More", "Admin settings"],
          ]
  const active = (destination: string) =>
    page === destination ||
    (destination === "Bookings" && page === "Booking details") ||
    (destination === "Owner listings" &&
      ["Owner add property", "Owner edit property"].includes(page)) ||
    (destination === "Owner booking requests" &&
      page === "Owner booking details")
  return (
    <nav
      className={`mobile-bottom-nav mobile-${role.toLowerCase()}`}
      aria-label={`${role} mobile navigation`}
    >
      {items.map((item) => (
        <button
          className={active(item[2]) ? "active" : ""}
          onClick={() => go(item[2])}
          key={item[1]}
        >
          <Icon name={item[0] as IconName} size={19} />
          <span>{item[1]}</span>
        </button>
      ))}
    </nav>
  )
}

function Header({
  title,
  eyebrow,
  action,
}: {
  title: string
  eyebrow?: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  )
}

function RenterDashboard({
  go,
  viewProperty,
  summaryState,
  onSummary,
  notifications,
}: {
  notifications: AppNotification[]
  summaryState: ReturnType<typeof useDashboardSummary>
  onSummary: (kind: string) => void
  go: (page: string) => void
  viewProperty: (id: number) => void
}) {
  const { favorites, error: favoritesError } = useFavorites()
  return (
    <div className="renter-dashboard">
      <div className="renter-page-head">
        <div>
          <p className="eyebrow">RENTER OVERVIEW</p>
          <h1>Your rental journey</h1>
          <p>
            Everything you're following, booking, and discussing in one place.
          </p>
        </div>
        <Button onClick={() => go("Discover")}>
          <Icon name="search" /> Browse Homes
        </Button>
      </div>
      <DashboardCards
        state={summaryState}
        onOpen={onSummary}
        icons={["heart", "calendar", "settings", "message"].map((name) => (
          <Icon key={name} name={name as IconName} />
        ))}
        arrow={<Icon name="chevron" size={16} />}
      />
      <section className="quick-actions">
        <div className="dashboard-section-head">
          <div>
            <h2>Quick actions</h2>
            <p>Jump back into what matters</p>
          </div>
        </div>
        <div className="quick-action-grid">
          {[
            [
              "search",
              "Browse Homes",
              "Discover verified properties that fit your life.",
              "Discover",
            ],
            [
              "calendar",
              "View Bookings",
              "Track requests, dates, and approval status.",
              "Bookings",
            ],
            [
              "message",
              "Message Owners",
              "Continue conversations about your next home.",
              "Messages",
            ],
          ].map((item) => (
            <button key={item[1]} onClick={() => go(item[3])}>
              <span>
                <Icon name={item[0] as IconName} />
              </span>
              <div>
                <strong>{item[1]}</strong>
                <small>{item[2]}</small>
              </div>
              <Icon name="arrow" size={17} />
            </button>
          ))}
        </div>
      </section>
      <RenterRecords
        onProperty={viewProperty}
        onBookings={() => go("Bookings")}
        onLogin={() => go("Login")}
      />
      <div className="dashboard-main-grid">
        <FavoritesPage
          compact
          onView={viewProperty}
          onLogin={() => go("Login")}
          onBrowse={() => go("Discover")}
        />
        <aside className="recent-activity">
          <div className="dashboard-section-head">
            <div>
              <h2>Recent Activity</h2>
              <p>Your latest updates</p>
            </div>
          </div>
          <div className="activity-timeline">
            {notifications.length ? notifications.slice(0, 3).map((item) => (
                <article key={item.id}>
                  <span className={"timeline-icon " + item.tone}>
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.message}</p>
                    <small>{item.time}</small>
                  </div>
                </article>
              )) : <p>No recent account updates.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

type AppNotification = {
  id: number
  icon: IconName
  title: string
  message: string
  time: string
  read: boolean
  tone: "success" | "warning" | "brand" | "neutral"
  category: "Booking" | "Messages" | "Listings"
}

function NotificationsPage({
  go,
  notifications,
  setNotifications,
  dashboardPage,
  onOpen,
  onMarkAll,
  activeFilter,
  onFilter,
}: {
  activeFilter?: string
  onFilter?: (filter: string) => void
  onMarkAll?: () => void
  onOpen?: (id: number) => void
  go: (page: string) => void
  notifications: AppNotification[]
  setNotifications: Dispatch<SetStateAction<AppNotification[]>>
  dashboardPage: string
}) {
  type NotificationFilter = "All" | "Unread" | "Booking" | "Messages" | "Listings"
  const [localFilter, setLocalFilter] = useState<NotificationFilter>("All")
  const filter: NotificationFilter =
    activeFilter === undefined
      ? localFilter
      : ["All", "Unread", "Booking", "Messages", "Listings"].includes(
            activeFilter,
          )
        ? activeFilter as NotificationFilter
        : "All"
  const setFilter = (value: NotificationFilter) =>
    onFilter ? onFilter(value) : setLocalFilter(value)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 320)
    return () => window.clearTimeout(timer)
  }, [])
  const visible = notifications.filter(
    (item) =>
      filter === "All" ||
      (filter === "Unread" && !item.read) ||
      item.category === filter,
  )
  const unread = notifications.filter((item) => !item.read).length
  const markAll = () =>
    onMarkAll
      ? onMarkAll()
      : setNotifications((items) =>
          items.map((item) => ({ ...item, read: true })),
        )
  const markRead = (id: number) =>
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    )
  if (loading)
    return (
      <div className="notification-center">
        <div className="notification-center-head">
          <div>
            <p className="eyebrow">ACCOUNT UPDATES</p>
            <h1>Notifications</h1>
            <p>Loading your latest updates.</p>
          </div>
        </div>
        <div className="notification-list notification-loading-list">
          {[0, 1, 2, 3, 4].map((index) => (
            <NotificationSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  return (
    <div className="notification-center">
      <div className="notification-center-head">
        <div>
          <p className="eyebrow">ACCOUNT UPDATES</p>
          <h1>Notifications</h1>
          <p>Stay informed about bookings, messages, and property activity.</p>
        </div>
        <Button variant="secondary" onClick={markAll} disabled={!unread}>
          <span className="button-check">✓</span> Mark all as read
        </Button>
      </div>
      <div className="notification-toolbar">
        <div className="notification-tabs">
          {([
            "All",
            "Unread",
            "Booking",
            "Messages",
            "Listings",
          ] as NotificationFilter[]).map((value) => (
            <button
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
              key={value}
            >
              {value}{" "}
              <span>
                {value === "All"
                  ? notifications.length
                  : value === "Unread"
                    ? unread
                    : notifications.filter((item) => item.category === value)
                        .length}
              </span>
            </button>
          ))}
        </div>
        {unread > 0 && (
          <p>
            <i /> {unread} unread{" "}
            {unread === 1 ? "notification" : "notifications"}
          </p>
        )}
      </div>
      {visible.length ? (
        <div className="notification-list">
          <div className="notification-list-label">
            {filter === "Unread"
              ? "UNREAD UPDATES"
              : filter === "All"
                ? "RECENT UPDATES"
                : `${filter.toUpperCase()} UPDATES`}
          </div>
          {visible.map((item) => (
            <article
              className={`notification-item ${item.read ? "read" : "unread"}`}
              key={item.id}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  markRead(item.id)
                  onOpen?.(item.id)
                }
              }}
              onClick={() => {
                markRead(item.id)
                onOpen?.(item.id)
              }}
            >
              <span className={`notification-type ${item.tone}`}>
                <Icon name={item.icon} />
              </span>
              <div>
                <span className="notification-category">{item.category}</span>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <time>{item.time}</time>
              </div>
              {!item.read && <i className="unread-dot" />}
              <button className="icon-button" aria-label="Notification options">
                <Icon name="more" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="bell"
          variant="notifications"
          title="No notifications yet."
          description={
            filter === "Unread"
              ? "You're all caught up. New updates will appear here."
              : "Important account and platform updates will appear here."
          }
          actionLabel="Return to Dashboard"
          onAction={() => go(dashboardPage)}
        />
      )}
    </div>
  )
}

function PublicHeader({ go }: { go: (page: string) => void }) {
  return (
    <header className="public-header">
      <button className="brand public-brand" onClick={() => go("Home")}>
        <span className="brand-mark">
          <i />
          <i />
        </span>
        <strong>RentNest</strong>
      </button>
      <nav className="public-nav">
        <button onClick={() => go("Discover")}>Browse Properties</button>
        <button onClick={() => go("Home")}>How It Works</button>
      </nav>
      <div className="public-actions">
        <Button variant="ghost" onClick={() => go("Login")}>
          Login
        </Button>
        <Button onClick={() => go("Register")}>Register</Button>
      </div>
    </header>
  )
}

function Landing({
  go,
  viewProperty,
  onSearch,
}: {
  onSearch: (criteria: Partial<Criteria>) => void
  viewProperty: (id: number) => void
  go: (page: string) => void
}) {
  const [search, setSearch] = useState({
    location: "",
    type: "",
    maxRent: "",
    bedrooms: "",
  })
  return (
    <div className="public-page">
      <PublicHeader go={go} />
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">RENT WITH CONFIDENCE</p>
          <h1>
            Find Your
            <br />
            Perfect Home
          </h1>
          <p>
            Discover verified rental properties, connect with owners, and manage
            your rental journey easily.
          </p>
          <div className="hero-actions">
            <Button onClick={() => go("Discover")}>
              Browse Properties <Icon name="arrow" />
            </Button>
            <Button variant="secondary" onClick={() => go("Owner workspace")}>
              List Your Property
            </Button>
          </div>
          <div className="hero-proof">
            <span>
              <strong>Reviewed listings</strong>
              <small>Explore actual available homes</small>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1758448511578-ec292173b70c?auto=format&fit=crop&w=1400&q=85"
            alt="Premium modern apartment building at sunset"
          />
          <div className="floating-home">
            <span className="verified-mark">✓</span>
            <span>
              <small>VERIFIED LISTINGS</small>
              <strong>Homes you can trust</strong>
              <b>Reviewed before publishing</b>
            </span>
          </div>
        </div>
        <div className="hero-search">
          <label>
            <span>Location</span>
            <div>
              <Icon name="pin" />
              <input
                value={search.location}
                onChange={(e) =>
                  setSearch({ ...search, location: e.target.value })
                }
                placeholder="Where do you want to live?"
              />
            </div>
          </label>
          <label>
            <span>Property type</span>
            <select
              aria-label="Property type"
              value={search.type}
              onChange={(e) => setSearch({ ...search, type: e.target.value })}
            >
              <option value="">All types</option>
              {propertyTypes.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Maximum rent (BDT)</span>
            <input
              type="number"
              min="0"
              value={search.maxRent}
              onChange={(e) =>
                setSearch({ ...search, maxRent: e.target.value })
              }
              placeholder="Any price"
            />
          </label>
          <label>
            <span>Bedrooms</span>
            <input
              type="number"
              min="0"
              max="50"
              value={search.bedrooms}
              onChange={(e) =>
                setSearch({ ...search, bedrooms: e.target.value })
              }
              placeholder="Any bedrooms"
            />
          </label>
          <Button onClick={() => onSearch(search)}>
            <Icon name="search" /> Search Properties
          </Button>
        </div>
      </section>
      <section className="public-section">
        <div className="section-title featured-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOU</p>
            <h2>Featured Properties</h2>
            <p>Published properties accepting future rental requests.</p>
          </div>
          <Button variant="ghost" onClick={() => go("Discover")}>
            Explore all properties <Icon name="arrow" />
          </Button>
        </div>
        <ListingCollection onView={viewProperty} onLogin={() => go("Login")} />
      </section>
      <section className="how-section">
        <div className="how-intro">
          <p className="eyebrow">HOW RENTNEST WORKS</p>
          <h2>
            Your next home,
            <br />
            in three simple steps.
          </h2>
          <p>
            We bring everything you need into one clear, trusted rental
            experience.
          </p>
        </div>
        <div className="steps">
          {[
            [
              "search",
              "Browse Properties",
              "Explore available rental listings that match your needs.",
            ],
            [
              "home",
              "View Details",
              "Check photos, amenities, and property information.",
            ],
            [
              "message",
              "Book or Contact Owner",
              "Request a booking or communicate directly with owners.",
            ],
          ].map((step, i) => (
            <article className="step" key={step[1]}>
              <span>
                <Icon name={step[0] as IconName} />
              </span>
              <small>0{i + 1}</small>
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="why-section">
        <div className="why-heading">
          <p className="eyebrow">BUILT AROUND TRUST</p>
          <h2>
            Why renters and owners
            <br />
            choose RentNest
          </h2>
        </div>
        <div className="why-grid">
          {[
            [
              "building",
              "Verified Listings",
              "Every property is reviewed before it appears on the marketplace.",
            ],
            [
              "message",
              "Secure Communication",
              "Connect with renters and owners in one protected conversation.",
            ],
            [
              "calendar",
              "Easy Booking",
              "Send and manage rental requests without confusing paperwork.",
            ],
            [
              "settings",
              "Property Management",
              "Powerful tools help owners manage listings, bookings, and more.",
            ],
          ].map((feature) => (
            <article key={feature[1]}>
              <span>
                <Icon name={feature[0] as IconName} />
              </span>
              <h3>{feature[1]}</h3>
              <p>{feature[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="join-banner">
        <div>
          <p className="eyebrow">MAKE YOUR MOVE</p>
          <h2>Ready to find your next home?</h2>
          <p>Find your next home or manage your rental property.</p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => go("Discover")}>
            Explore Properties
          </Button>
          <Button onClick={() => go("Register")}>
            Sign Up Now <Icon name="arrow" />
          </Button>
        </div>
      </section>
      <footer className="public-footer">
        <div className="footer-brand">
          <button className="brand">
            <span className="brand-mark">
              <i />
              <i />
            </span>
            <strong>RentNest</strong>
          </button>
          <p>A simpler, safer rental journey for everyone.</p>
        </div>
        {[
          ["Company", "Careers"],
          ["Support", "Help Center", "Contact"],
          ["Legal", "Privacy Policy", "Terms"],
        ].map((column) => (
          <div key={column[0]}>
            <strong>{column[0]}</strong>
            {column.slice(1).map((item) => (
              <button key={item}>{item}</button>
            ))}
          </div>
        ))}
        <p className="copyright">
          © {new Date().getFullYear()} RentNest. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

function AuthPage({
  mode,
  go,
}: {
  mode: "login" | "register"
  go: (page: string) => void
}) {
  const register = mode === "register"
  const { setAuthenticatedUser } = useAuth()
  const [loginError, setLoginError] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] =
    useState<"idle" | "loading" | "error" | "success">("idle")
  const emailError =
    submitted && !email
      ? "Required field"
      : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Invalid email"
        : ""
  const passwordError =
    submitted && !password
      ? "Required field"
      : status === "error"
        ? loginError
        : ""
  const login = async () => {
    setSubmitted(true)
    setLoginError("")
    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setStatus("loading")
    try {
      const user = await authService.login({ email, password })
      setAuthenticatedUser(user)
      setStatus("success")
      let target: string | null = null
      try {
        target = safeReturnPath(sessionStorage.getItem("rentnest:login-return"))
        sessionStorage.removeItem("rentnest:login-return")
      } catch {}
      if (target) window.location.assign(target)
      else go(dashboard(user.role))
    } catch (error) {
      setStatus("error")
      setLoginError(error instanceof Error ? error.message : "Unable to login")
    }
  }
  return (
    <div className="auth-page">
      <button className="auth-back" onClick={() => go("Home")}>
        <Icon name="arrow" /> Back to Home
      </button>
      <div className="auth-form-panel">
        <button className="brand" onClick={() => go("Home")}>
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>RentNest</strong>
        </button>
        <div className="auth-form">
          <p className="eyebrow">
            {register ? "CREATE YOUR ACCOUNT" : "SECURE ACCOUNT ACCESS"}
          </p>
          <h1>{register ? "Find your place on RentNest." : "Welcome Back"}</h1>
          <p>
            {register
              ? "Join renters and property owners building a better rental experience."
              : "Login to continue your RentNest journey."}
          </p>
          {register ? (
            <RegistrationPage go={go} />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                login()
              }}
              noValidate
            >
              <label className={`auth-field ${emailError ? "has-error" : ""}`}>
                <span>Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setStatus("idle")
                  }}
                  placeholder="example@email.com"
                  aria-invalid={!!emailError}
                />
                {emailError && <FormError message={emailError} />}{" "}
              </label>
              <label
                className={`auth-field ${passwordError ? "has-error" : ""}`}
              >
                <span>Password</span>
                <div className="password-control">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setStatus("idle")
                    }}
                    placeholder="Enter password"
                    aria-invalid={!!passwordError}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Icon name="eye" size={18} />
                  </button>
                </div>
                {passwordError && <FormError message={passwordError} />}{" "}
              </label>
              <div className="auth-options">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button" onClick={() => go("Forgot password")}>
                  Forgot Password?
                </button>
              </div>
              <button
                className={`button button-primary login-submit ${
                  status === "loading" ? "is-loading" : ""
                }`}
                disabled={status === "loading" || status === "success"}
              >
                {status === "loading" ? (
                  <>
                    <i /> Logging in...
                  </>
                ) : status === "success" ? (
                  <>
                    Login successful <span>✓</span>
                  </>
                ) : (
                  <>
                    Log In <Icon name="arrow" />
                  </>
                )}
              </button>
            </form>
          )}
          <p className="auth-switch">
            {register ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => go(register ? "Login" : "Register")}>
              {register ? "Log In" : "Create Account"}
            </button>
          </p>
          {!register && (
            <div className="admin-access">
              <span>Administrator?</span>
              <button className="admin-login">Admin Login</button>
            </div>
          )}
        </div>
      </div>
      <div className="auth-visual">
        <img
          src="https://images.unsplash.com/photo-1680416124510-5eae1beca412?auto=format&fit=crop&w=1400&q=85"
          alt="Warm, premium modern apartment interior"
        />
        <div>
          <span className="quote-mark">“</span>
          <blockquote>
            Find a home, connect with its owner, and manage your rental journey.
          </blockquote>
        </div>
        {status === "success" && (
          <div className="auth-success">
            <span>✓</span>
            <strong>Welcome back</strong>
            <small>Taking you to your account…</small>
          </div>
        )}
      </div>
    </div>
  )
}

function RegistrationPage({ go }: { go: (page: string) => void }) {
  const [role, setRole] = useState<"renter" | "owner">("renter")
  const [fields, setFields] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")
  const setField = (key: keyof typeof fields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }))
    setStatus("idle")
  }
  const errors = {
    name: submitted && !fields.name ? "Full name is required" : "",
    username: submitted && !fields.username ? "Username is required" : "",
    email:
      submitted && !fields.email
        ? "Email address is required"
        : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)
          ? "Enter a valid email address"
          : "",
    password:
      submitted && !fields.password
        ? "Password is required"
        : submitted && fields.password.length < 8
          ? "Password is too weak. Use at least 8 characters"
          : "",
    confirm:
      submitted && !fields.confirm
        ? "Please confirm your password"
        : submitted && fields.password !== fields.confirm
          ? "Passwords don't match"
          : "",
  }
  const [registrationError, setRegistrationError] = useState("")
  const createAccount = async () => {
    setSubmitted(true)
    if (
      !fields.name ||
      !fields.username ||
      !fields.email ||
      !fields.password ||
      !fields.confirm ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
      fields.password.length < 8 ||
      fields.password !== fields.confirm
    )
      return
    setStatus("loading")
    setRegistrationError("")
    try {
      await authService.register({
        name: fields.name,
        username: fields.username,
        email: fields.email,
        password: fields.password,
        confirmPassword: fields.confirm,
        role,
      })
      setStatus("success")
    } catch (error) {
      setStatus("idle")
      setRegistrationError(
        error instanceof Error ? error.message : "Unable to create account",
      )
    }
  }
  if (status === "success")
    return (
      <div className="registration-page">
        <button className="auth-back" onClick={() => go("Home")}>
          <Icon name="arrow" /> Back to Home
        </button>
        <section className="registration-success">
          <span>✓</span>
          <p className="eyebrow">WELCOME TO RENTNEST</p>
          <h1>Account created successfully</h1>
          <p>
            Your {role === "renter" ? "renter" : "property owner"} account is
            ready. Let's take you to the right place.
          </p>
          <div className={`success-role role-${role}`}>
            <Icon name={role === "renter" ? "search" : "building"} />
            <div>
              <small>YOUR ACCOUNT TYPE</small>
              <strong>{role === "renter" ? "Renter" : "Property Owner"}</strong>
            </div>
          </div>
          <Button onClick={() => go("Login")}>
            Log in to your account <Icon name="arrow" />
          </Button>
        </section>
      </div>
    )
  return (
    <div className="registration-page">
      <button className="auth-back" onClick={() => go("Home")}>
        <Icon name="arrow" /> Back to Home
      </button>
      <div className="registration-glow glow-one" />
      <div className="registration-glow glow-two" />
      <section className="registration-card">
        <button className="brand registration-brand" onClick={() => go("Home")}>
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>RentNest</strong>
        </button>
        <div className="registration-heading">
          <p className="eyebrow">CREATE YOUR ACCOUNT</p>
          <h1>Start your RentNest journey</h1>
          <p>
            Choose how you'd like to use RentNest, then tell us a little about
            yourself.
          </p>
        </div>
        <div className="registration-roles">
          <button
            className={role === "renter" ? "selected" : ""}
            onClick={() => setRole("renter")}
          >
            <span>
              <Icon name="search" />
            </span>
            <div>
              <small>RENTER</small>
              <strong>I want to find a home</strong>
              <p>Search properties and request bookings.</p>
            </div>
            <i />
          </button>
          <button
            className={role === "owner" ? "selected" : ""}
            onClick={() => setRole("owner")}
          >
            <span>
              <Icon name="building" />
            </span>
            <div>
              <small>PROPERTY OWNER</small>
              <strong>I want to rent out my property</strong>
              <p>Create listings and manage rentals.</p>
            </div>
            <i />
          </button>
        </div>
        {registrationError && <FormError message={registrationError} />}
        <form
          className="registration-form"
          onSubmit={(e) => {
            e.preventDefault()
            createAccount()
          }}
          noValidate
        >
          <label className={`auth-field ${errors.name ? "has-error" : ""}`}>
            <span>Full Name</span>
            <input
              value={fields.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter your full name"
            />
            {errors.name && <small>{errors.name}</small>}
          </label>
          <label className={`auth-field ${errors.username ? "has-error" : ""}`}>
            <span>Username</span>
            <input
              value={fields.username}
              onChange={(e) => setField("username", e.target.value)}
              placeholder="Choose a username"
            />
            {errors.username && <small>{errors.username}</small>}
          </label>
          <label
            className={`auth-field wide ${errors.email ? "has-error" : ""}`}
          >
            <span>Email Address</span>
            <input
              type="email"
              value={fields.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="example@email.com"
            />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label className={`auth-field ${errors.password ? "has-error" : ""}`}>
            <span>Password</span>
            <input
              type="password"
              value={fields.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="At least 8 characters"
            />
            {errors.password && <small>{errors.password}</small>}
          </label>
          <label className={`auth-field ${errors.confirm ? "has-error" : ""}`}>
            <span>Confirm Password</span>
            <input
              type="password"
              value={fields.confirm}
              onChange={(e) => setField("confirm", e.target.value)}
              placeholder="Repeat your password"
            />
            {errors.confirm && <small>{errors.confirm}</small>}
          </label>
          <button
            className={`button button-primary registration-submit ${
              status === "loading" ? "is-loading" : ""
            }`}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <i /> Creating account...
              </>
            ) : (
              <>
                Create Account <Icon name="arrow" />
              </>
            )}
          </button>
        </form>
        <p className="registration-login">
          Already have an account?{" "}
          <button onClick={() => go("Login")}>Login</button>
        </p>
      </section>
    </div>
  )
}

function ForgotPasswordPage({ go }: { go: (page: string) => void }) {
  const token = new URLSearchParams(location.search).get("token") || ""
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false)
  const submit = async () => {
    setBusy(true)
    setError("")
    try {
      if (token)
        await authService.resetPassword({
          token,
          newPassword: password,
          confirmNewPassword: confirm,
        })
      else await authService.forgotPassword({ email })
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to process request")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="recovery-page">
      <section className="recovery-card">
        <h1>{token ? "Reset password" : "Forgot password?"}</h1>
        {error && <p role="alert">{error}</p>}
        {saved ? (
          <>
            <p>
              {token
                ? "Password updated."
                : "If an eligible account exists, the backend generated a reset token. Email delivery is not configured in this development environment."}
            </p>
            <Button onClick={() => go("Login")}>Return to login</Button>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            {token ? (
              <>
                <label className="auth-field">
                  <span>New password</span>
                  <input
                    required
                    minLength={8}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="auth-field">
                  <span>Confirm password</span>
                  <input
                    required
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="auth-field">
                <span>Email address</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            <button className="button button-primary" disabled={busy}>
              {busy
                ? "Processing…"
                : token
                  ? "Update password"
                  : "Request reset"}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}

function AccessDeniedPage({ go }: { go: (page: string) => void }) {
  const { user } = useAuth()
  return (
    <ErrorState
      type="permission"
      fullPage
      title="Access denied"
      description="Your current account role cannot open this workspace. Contact RentNest support if you believe this is a mistake."
      primaryLabel="Return Dashboard"
      onPrimary={() => go(user ? dashboard(user.role) : "Home")}
    />
  )
}

function SessionExpiredPage({ go }: { go: (page: string) => void }) {
  return (
    <div className="session-expired-page">
      <header>
        <button className="brand" onClick={() => go("Home")}>
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>RentNest</strong>
        </button>
      </header>
      <section className="session-expired-card">
        <div className="session-expired-icon">
          <Icon name="lock" size={30} />
          <span>!</span>
        </div>
        <p className="eyebrow">ACCOUNT SECURITY</p>
        <h1>Session Expired</h1>
        <p>Please login again to continue.</p>
        <div className="expired-message">
          <Icon name="settings" size={16} />
          <span>
            Your session ended to help keep your RentNest account secure.
          </span>
        </div>
        <Button onClick={() => go("Login")}>
          Login Again <Icon name="arrow" />
        </Button>
        <button className="session-home" onClick={() => go("Home")}>
          Return to homepage
        </button>
      </section>
    </div>
  )
}

function RoleRedirectPage({
  role,
  go,
}: {
  role: "Renter" | "Owner" | "Admin"
  go: (page: string) => void
}) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const progress = window.setInterval(
      () => setPhase((current) => Math.min(current + 1, 2)),
      480,
    )
    const destination =
      role === "Renter"
        ? "Renter dashboard"
        : role === "Owner"
          ? "Owner workspace"
          : "Admin overview"
    const redirect = window.setTimeout(() => go(destination), 1650)
    return () => {
      window.clearInterval(progress)
      window.clearTimeout(redirect)
    }
  }, [role, go])
  return (
    <div className="redirect-page">
      <div className="redirect-halo halo-one" />
      <div className="redirect-halo halo-two" />
      <section className="redirect-content">
        <div className="redirect-logo">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>RentNest</strong>
          <span className="redirect-pulse" />
        </div>
        <div className="redirect-loader">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">WELCOME BACK · {role.toUpperCase()}</p>
        <h1>Preparing your dashboard...</h1>
        <p>Securely connecting your account</p>
        <div className="redirect-progress">
          <div className={phase >= 0 ? "complete" : ""}>
            <span>{phase > 0 ? "✓" : "1"}</span>
            <p>
              <strong>Account validated</strong>
              <small>Your credentials are secure</small>
            </p>
          </div>
          <i />
          <div className={phase >= 1 ? "complete" : ""}>
            <span>{phase > 1 ? "✓" : "2"}</span>
            <p>
              <strong>Role confirmed</strong>
              <small>{role} access applied</small>
            </p>
          </div>
          <i />
          <div className={phase >= 2 ? "complete" : ""}>
            <span>3</span>
            <p>
              <strong>Dashboard ready</strong>
              <small>Taking you there now</small>
            </p>
          </div>
        </div>
        <div className="redirect-security">
          <Icon name="lock" size={14} /> Encrypted and secure
        </div>
      </section>
    </div>
  )
}

function DesignSystem() {
  const sidebarSets = [
    [
      "Renter",
      "Discover Properties",
      "Favorites",
      "My Bookings",
      "Messages",
      "Notifications",
      "Profile",
    ],
    [
      "Owner",
      "Dashboard",
      "My Listings",
      "Booking Requests",
      "Messages",
      "Payments",
      "Profile",
    ],
    [
      "Admin",
      "Dashboard",
      "User Management",
      "Listing Management",
      "Booking Management",
      "Payments & Reports",
      "Analytics",
    ],
  ]
  return (
    <div className="ds-page">
      <Header
        eyebrow="01 · DESIGN SYSTEM"
        title="RentNest Foundations"
        action={<Badge>v1.0 · Production</Badge>}
      />
      <p className="ds-intro">
        A shared visual language for property discovery, owner operations, and
        platform administration. Built to map cleanly to reusable React
        components.
      </p>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>01</span>
          <div>
            <h2>Brand color</h2>
            <p>One recognizable maroon system, balanced by warm neutrals.</p>
          </div>
        </div>
        <div className="swatch-grid">
          {[
            ["Deep Maroon", "#591734", "swatch-brand"],
            ["Dark Wine", "#660033", "swatch-wine"],
            ["Light Lilac", "#E6D5E9", "swatch-lilac"],
            ["Background", "#FAF8F9", "swatch-bg"],
            ["Surface", "#FFFFFF", "swatch-surface"],
            ["Charcoal", "#1F1F1F", "swatch-ink"],
            ["Secondary", "#6B7280", "swatch-muted"],
            ["Border", "#E5E7EB", "swatch-line"],
          ].map((s) => (
            <article className="swatch" key={s[0]}>
              <div className={s[2]} />
              <strong>{s[0]}</strong>
              <small>{s[1]}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>02</span>
          <div>
            <h2>Typography</h2>
            <p>
              Manrope provides clarity at marketplace and dashboard densities.
            </p>
          </div>
        </div>
        <div className="type-specimen">
          <div>
            <small>DISPLAY · 48 / BOLD</small>
            <p className="type-display">Find a place to belong.</p>
          </div>
          <div>
            <small>H1 · 36 / BOLD</small>
            <p className="type-h1">Your property portfolio</p>
          </div>
          <div>
            <small>H2 · 28 / BOLD</small>
            <p className="type-h2">Booking requests</p>
          </div>
          <div>
            <small>H3 · 20 / SEMIBOLD</small>
            <p className="type-h3">Sunlit apartment</p>
          </div>
          <div>
            <small>BODY · 16 / REGULAR</small>
            <p className="type-body">
              Thoughtful spaces, trusted owners, and simple bookings.
            </p>
          </div>
          <div>
            <small>CAPTION · 14 / REGULAR</small>
            <p className="type-caption">Gulshan, Dhaka · Apartment</p>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>03</span>
          <div>
            <h2>Buttons & status</h2>
            <p>Actions and states remain predictable across every role.</p>
          </div>
        </div>
        <div className="ds-component-grid">
          <div className="component-board">
            <p className="component-label">BUTTON VARIANTS</p>
            <div className="button-showcase">
              <Button>Book property</Button>
              <Button variant="secondary">View details</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="destructive">Delete listing</Button>
              <button className="button button-primary" disabled>
                Disabled
              </button>
              <button className="button button-primary loading-button">
                <i /> Saving
              </button>
            </div>
          </div>
          <div className="component-board">
            <p className="component-label">STATUS BADGES</p>
            <div className="badge-showcase">
              <Badge tone="warning">Pending</Badge>
              <Badge>Approved</Badge>
              <Badge>Confirmed</Badge>
              <Badge tone="danger">Rejected</Badge>
              <Badge tone="neutral">Cancelled</Badge>
              <span className="badge draft">Draft</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>04</span>
          <div>
            <h2>Form system</h2>
            <p>
              Clear labels and visible interaction states reduce input errors.
            </p>
          </div>
        </div>
        <div className="form-showcase">
          <label className="ds-field">
            <span>Default input</span>
            <input placeholder="Property title" />
          </label>
          <label className="ds-field focus">
            <span>Focused input</span>
            <input defaultValue="Sunlit apartment" />
          </label>
          <label className="ds-field error">
            <span>Email address</span>
            <input defaultValue="incorrect-email" />
            <small>Enter a valid email address.</small>
          </label>
          <label className="ds-field success">
            <span>Location</span>
            <input defaultValue="Gulshan, Dhaka" />
            <small>Location verified.</small>
          </label>
          <label className="ds-field">
            <span>Property type</span>
            <select defaultValue="Apartment">
              <option>Apartment</option>
              <option>Flat</option>
              <option>Room</option>
            </select>
          </label>
          <label className="ds-field disabled">
            <span>Account ID</span>
            <input disabled defaultValue="RN-2048" />
          </label>
        </div>
        <div className="choice-row">
          <label>
            <input type="checkbox" defaultChecked /> Furnished
          </label>
          <label>
            <input type="checkbox" /> Pets allowed
          </label>
          <label>
            <input type="radio" name="role-demo" defaultChecked /> Renter
          </label>
          <label>
            <input type="radio" name="role-demo" /> Owner
          </label>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>05</span>
          <div>
            <h2>Property cards</h2>
            <p>
              A responsive marketplace primitive with consistent information
              hierarchy.
            </p>
          </div>
        </div>
        <ListingCollection onView={() => {}} onLogin={() => {}} />
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>06</span>
          <div>
            <h2>Role navigation</h2>
            <p>
              Purpose-built menus make each workspace immediately recognizable.
            </p>
          </div>
        </div>
        <div className="sidebar-showcase">
          {sidebarSets.map((set, index) => (
            <article
              className={`mini-sidebar mini-${set[0].toLowerCase()}`}
              key={set[0]}
            >
              <div className="mini-sidebar-head">
                <span className="brand-mark">
                  <i />
                  <i />
                </span>
                <strong>{set[0]}</strong>
                <small className={`role-badge ${set[0].toLowerCase()}`}>
                  {set[0]}
                </small>
              </div>
              {set.slice(1).map((item, i) => (
                <div className={i === 0 ? "selected" : ""} key={item}>
                  <Icon
                    name={
                      [
                        "home",
                        "heart",
                        "calendar",
                        "message",
                        "bell",
                        "settings",
                      ][i % 6] as IconName
                    }
                  />
                  <span>{item}</span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>07</span>
          <div>
            <h2>Global states</h2>
            <p>
              Every workflow accounts for delay, absence, failure, and
              restricted access.
            </p>
          </div>
        </div>
        <div className="state-grid">
          <article>
            <span className="state-icon">
              <Icon name="search" />
            </span>
            <h3>No properties found</h3>
            <p>Try adjusting your filters or search another area.</p>
            <Button variant="secondary">Reset filters</Button>
          </article>
          <article>
            <span className="state-icon error-icon">!</span>
            <h3>Something went wrong</h3>
            <p>We couldn't load this information right now.</p>
            <Button variant="secondary">Try again</Button>
          </article>
          <article>
            <span className="state-icon denied-icon">
              <Icon name="settings" />
            </span>
            <h3>Access denied</h3>
            <p>You do not have permission to access this page.</p>
            <Button>Return to dashboard</Button>
          </article>
          <article className="loading-state">
            <div className="skeleton state-skeleton" />
            <div>
              <div className="skeleton line wide" />
              <div className="skeleton line" />
            </div>
          </article>
        </div>
      </section>

      <section className="ds-section">
        <div className="ds-section-head">
          <span>08</span>
          <div>
            <h2>Data table</h2>
            <p>
              Dense, scannable management interfaces for owners and
              administrators.
            </p>
          </div>
        </div>
        <TableSkeleton rows={2} />
        <p>Component loading-state example; no application records.</p>
      </section>
    </div>
  )
}

function Empty({
  icon,
  title,
  text,
}: {
  icon: IconName
  title: string
  text: string
}) {
  return (
    <div className="empty">
      <span>
        <Icon name={icon} size={28} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Button>Explore homes</Button>
    </div>
  )
}

export default function App() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  return (
    <FavoritesProvider key={user?.id ?? "guest"}>
      <Workspace />
    </FavoritesProvider>
  )
}

function Workspace() {
  const { user, logout, error, sessionExpired, refreshUser } = useAuth()
  const { favorites, error: favoritesError } = useFavorites()
  const [propertyReturn] = useState(() =>
    user ? consumePropertyReturn() : null,
  )
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    propertyReturn?.propertyId ?? null,
  )
  const navigation = useWorkspaceNavigation(
    user ? (propertyReturn ? "Listing details" : dashboard(user.role)) : "Home",
    propertyReturn?.propertyId,
  )
  const {
    page,
    setPage,
    navigate,
    filter,
    conversation: selectedConversationId,
    selectConversation: setSelectedConversationId,
  } = navigation
  const ownerSummary = useOwnerSummary(user?.role === "owner")
  const summaryState = useDashboardSummary(user?.role === "renter")
  const openSummary = (kind: string) => {
    if (kind === "savedProperties") navigate("Saved homes")
    else if (kind === "activeBookings")
      navigate("Bookings", { filter: "active" })
    else if (kind === "pendingRequests")
      navigate("Bookings", { filter: "pending" })
    else
      navigate("Messages", {
        filter: "unread",
        conversation: summaryState.summary?.latestUnreadConversationId,
      })
  }
  useEffect(() => {
    if (navigation.property) setSelectedPropertyId(navigation.property)
  }, [navigation.property])
  const openConversation = (id: number) => {
    navigate(user?.role === "owner" ? "Owner messages" : "Messages", {
      conversation: id,
    })
  }
  const loginForProperty = (propertyId: number, action = "view") => {
    try {
      sessionStorage.setItem(
        "rentnest:property-return",
        JSON.stringify({
          propertyId,
          action,
          expiresAt: Date.now() + 15 * 60 * 1000,
        }),
      )
    } catch {}
    setPage("Login")
  }
  const chatForProperty = async (id: number) => {
    try {
      const result = await rentalService.startConversation(id)
      openConversation(result.conversationId)
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unable to open chat",
      )
    }
  }
  const viewProperty = (id: number) => {
    setSelectedPropertyId(id)
    navigate("Listing details", {
      property: id,
      filter:
        user?.role === "owner" && page === "Owner listings"
          ? filter
          : undefined,
    })
  }
  const [appLoading, setAppLoading] = useState(true)

  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const noticeState = useNotifications(Boolean(user))
  const notifications: AppNotification[] = (
    noticeState.error ? [] : noticeState.notices
  ).map((item) => ({
    id: item.id,
    icon:
      item.category === "booking"
        ? "calendar"
        : item.category === "message"
          ? "message"
          : "building",
    title: item.title,
    message: item.body,
    time: new Date(item.createdAt).toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
    }),
    read: Boolean(item.readAt),
    tone: "brand",
    category:
      item.category === "booking"
        ? "Booking"
        : item.category === "message"
          ? "Messages"
          : "Listings",
  }))
  const setNotifications: Dispatch<SetStateAction<AppNotification[]>> = (
    next,
  ) => {
    const updated = typeof next === "function" ? next(notifications) : next
    const changed = updated.filter(
      (item) =>
        item.read && !notifications.find((old) => old.id === item.id)?.read,
    )
    changed.forEach((item) => void noticeState.markRead(item.id))
  }
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setAppLoading(false), 520)
    return () => window.clearTimeout(timer)
  }, [])
  const role =
    user?.role === "owner"
      ? "Owner"
      : user?.role === "admin"
        ? "Admin"
        : user?.role === "renter"
          ? "Renter"
          : "Guest"
  const accountName = user?.name ?? ""
  const accountInitials = initials(accountName)
  const unreadNotificationCount = noticeState.error ? 0 : noticeState.unread
  const adminSummary = useAdminOverview(user?.role === "admin")
  const ownerPage = (
    view: "dashboard" | "listings" | "property" | "payments" | "profile",
    id: number | null = null,
  ) => (
    <OwnerWorkspace
      view={view}
      propertyId={id}
      go={navigate}
      filter={filter}
      onFilter={navigation.setFilter}
      onView={viewProperty}
      onRead={(id) => void noticeState.markRead(id)}
      summary={ownerSummary}
    />
  )
  const pages: Record<string, ReactNode> = {
    Discover: (
      <Discovery
        key={filter}
        initialFilter={filter}
        onView={viewProperty}
        onLogin={() => setPage("Login")}
      />
    ),
    "Listing details": selectedPropertyId ? (
      <DatabasePropertyDetails
        key={selectedPropertyId}
        id={selectedPropertyId}
        onBack={() => {
          const parent = history.state?.fromView
          if (
            user?.role === "owner" &&
            [
              "Owner listings",
              "Owner workspace",
              "Owner booking requests",
              "Owner booking details",
            ].includes(parent)
          )
            navigate(parent, {
              filter:
                typeof history.state?.fromFilter === "string"
                  ? history.state.fromFilter
                  : "",
            })
          else setPage("Discover")
        }}
        onLogin={(action) => loginForProperty(selectedPropertyId, action)}
        onChat={openConversation}
        onBookings={() => setPage("Bookings")}
      />
    ) : null,
    "Renter dashboard": (
      <RenterDashboard
        go={setPage}
        viewProperty={viewProperty}
        summaryState={summaryState}
        onSummary={openSummary}
        notifications={notifications}
      />
    ),
    "Saved homes": (
      <FavoritesPage
        onView={viewProperty}
        onLogin={() => setPage("Login")}
        onBrowse={() => setPage("Discover")}
      />
    ),
    Bookings: (
      <LiveBookings
        filter={filter}
        onFilter={navigation.setFilter}
        onProperty={viewProperty}
        onChat={(id) => void chatForProperty(id)}
      />
    ),
    "Booking details": (
      <LiveBookings
        filter={filter}
        onFilter={navigation.setFilter}
        onProperty={viewProperty}
        onChat={(id) => void chatForProperty(id)}
      />
    ),
    Messages: (
      <LiveMessages
        filter={filter}
        onFilter={navigation.setFilter}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
        onProperty={viewProperty}
      />
    ),
    "Owner messages": (
      <LiveMessages
        filter={filter}
        onFilter={navigation.setFilter}
        selectedId={selectedConversationId}
        onSelect={setSelectedConversationId}
        onProperty={viewProperty}
      />
    ),
    "Owner earnings": ownerPage("payments"),
    Notifications: noticeState.error ? (
      <ErrorState
        type="network"
        title="Unable to load notifications"
        description={noticeState.error}
        primaryLabel="Retry"
        onPrimary={noticeState.refresh}
      />
    ) : (
      <NotificationsPage
        onMarkAll={() => void noticeState.markRead()}
        go={setPage}
        notifications={notifications}
        setNotifications={setNotifications}
        dashboardPage="Renter dashboard"
      />
    ),
    "Owner notifications": noticeState.error ? (
      <ErrorState
        type="network"
        title="Unable to load notifications"
        description={noticeState.error}
        primaryLabel="Retry"
        onPrimary={noticeState.refresh}
      />
    ) : (
      <NotificationsPage
        activeFilter={filter}
        onFilter={navigation.setFilter}
        onMarkAll={() => void noticeState.markRead()}
        onOpen={(id) => {
          const n = noticeState.notices.find((n) => n.id === id)
          if (n?.conversationId) openConversation(n.conversationId)
          else if (n?.bookingId)
            navigate("Owner booking requests", {
              filter: "booking:" + n.bookingId,
            })
          else if (n?.propertyId) viewProperty(n.propertyId)
        }}
        go={setPage}
        notifications={notifications}
        setNotifications={setNotifications}
        dashboardPage="Owner workspace"
      />
    ),
    "Admin notifications": noticeState.error ? (
      <ErrorState
        type="network"
        title="Unable to load notifications"
        description={noticeState.error}
        primaryLabel="Retry"
        onPrimary={noticeState.refresh}
      />
    ) : (
      <NotificationsPage
        onMarkAll={() => void noticeState.markRead()}
        go={setPage}
        notifications={notifications}
        setNotifications={setNotifications}
        dashboardPage="Admin overview"
      />
    ),
    "Owner workspace": ownerPage("dashboard"),
    "Owner listings": ownerPage("listings"),
    "Owner add property": ownerPage("property"),
    "Owner edit property": navigation.property
      ? ownerPage("property", navigation.property)
      : ownerPage("listings"),
    "Owner booking requests": (
      <LiveBookings
        onConversation={openConversation}
        filter={filter}
        onFilter={navigation.setFilter}
        onProperty={viewProperty}
        onChat={(id) => void chatForProperty(id)}
      />
    ),
    "Owner booking details": (
      <LiveBookings
        onConversation={openConversation}
        filter={filter}
        onFilter={navigation.setFilter}
        onProperty={viewProperty}
        onChat={(id) => void chatForProperty(id)}
      />
    ),
    "Admin overview": (
      <AdminWorkspace
        view="Admin overview"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    "Admin users": (
      <AdminWorkspace
        view="Admin users"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    "Admin listings": (
      <ListingCollection
        filter={filter}
        onFilter={navigation.setFilter}
        mode="admin"
        onView={viewProperty}
        onLogin={() => setPage("Login")}
      />
    ),
    "Admin bookings": (
      <LiveBookings
        filter={filter}
        onFilter={navigation.setFilter}
        onProperty={viewProperty}
        onChat={() => {}}
      />
    ),
    "Admin payments": (
      <AdminWorkspace
        view="Admin payments"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    "Admin analytics": (
      <AdminWorkspace
        view="Admin analytics"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    "Admin logs": (
      <AdminWorkspace
        view="Admin logs"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    "Admin settings": (
      <AdminWorkspace
        view="Admin settings"
        state={adminSummary}
        filter={filter}
        go={(page, filter) => navigate(page, { filter })}
      />
    ),
    Settings: <AccountSettings />,
    "Owner profile": ownerPage("profile"),
    "Design system": <DesignSystem />,
    "Session and security": <SessionSecurity />,
  }
  if (appLoading) return <PageLoader />
  const publicPages = [
    "Discover",
    "Listing details",
    "Home",
    "Property details",
    "Login",
    "Register",
    "Forgot password",
    "Access denied",
    "Session expired",
  ]
  if (!user && !publicPages.includes(page)) {
    try {
      const path = safeReturnPath("/" + location.search)
      if (path) sessionStorage.setItem("rentnest:login-return", path)
    } catch {}
    return (
      <>
        {sessionExpired && (
          <p className="form-error-message" role="alert">
            Your session expired. Sign in again to continue.
          </p>
        )}
        {error ? (
          <ErrorState
            type="network"
            fullPage
            title="Unable to check your session"
            description={error.message}
            primaryLabel="Retry"
            onPrimary={() => void refreshUser()}
          />
        ) : (
          <AuthPage mode="login" go={setPage} />
        )}
      </>
    )
  }
  if (error && user && !publicPages.includes(page))
    return (
      <ErrorState
        type="network"
        fullPage
        title="Unable to check your session"
        description={error.message}
        primaryLabel="Retry"
        onPrimary={() => void refreshUser()}
      />
    )
  if (user && requiredRole(page) && requiredRole(page) !== user.role)
    return <AccessDeniedPage go={setPage} />
  if (page === "Discover" || page === "Listing details")
    return (
      <div className="public-listings-page">
        <header className="public-listings-nav">
          <button className="brand" onClick={() => setPage("Home")}>
            <span className="brand-mark">
              <i />
              <i />
            </span>
            <strong>RentNest</strong>
          </button>
          <button
            className="button button-secondary"
            onClick={() => setPage(user ? dashboard(user.role) : "Login")}
          >
            {user ? "My dashboard" : "Login"}
          </button>
        </header>
        {error && (
          <p role="alert" className="form-error-message">
            {error.message}{" "}
            <button onClick={() => void refreshUser()}>
              Retry session check
            </button>
          </p>
        )}
        {pages[page]}
      </div>
    )
  if (page === "Home")
    return (
      <>
        {error && (
          <p className="form-error-message" role="alert">
            {error.message}{" "}
            <button onClick={() => void refreshUser()}>
              Retry session check
            </button>
          </p>
        )}
        <Landing
          onSearch={(criteria) =>
            navigate("Discover", { filter: JSON.stringify(criteria) })
          }
          go={setPage}
          viewProperty={viewProperty}
        />
      </>
    )
  if (page === "Property details")
    return selectedPropertyId ? (
      <DatabasePropertyDetails
        id={selectedPropertyId}
        onBack={() => setPage("Discover")}
        onLogin={(action) => loginForProperty(selectedPropertyId, action)}
        onChat={openConversation}
        onBookings={() => setPage("Bookings")}
      />
    ) : (
      <ErrorState
        type="not-found"
        title="Property not found"
        primaryLabel="Browse properties"
        onPrimary={() => setPage("Discover")}
      />
    )
  if (page === "Login") return <AuthPage mode="login" go={setPage} />
  if (page === "Register") return <RegistrationPage go={setPage} />
  if (page === "Forgot password") return <ForgotPasswordPage go={setPage} />
  if (page === "Access denied") return <AccessDeniedPage go={setPage} />
  if (page === "Session expired")
    return user ? <SessionSecurity /> : <SessionExpiredPage go={setPage} />
  if (page.startsWith("Redirect "))
    return (
      <RoleRedirectPage
        role={page.replace("Redirect ", "") as "Renter" | "Owner" | "Admin"}
        go={setPage}
      />
    )
  if (!pages[page])
    return (
      <ErrorState
        type="not-found"
        fullPage
        title="Page not found."
        description="The page may have moved or the address may be incorrect."
        primaryLabel="Go Home"
        onPrimary={() => setPage("Home")}
        secondaryLabel="Back"
        onSecondary={() => window.history.back()}
      />
    )
  return (
    <div className={`app-shell role-${role.toLowerCase()}`}>
      <aside className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <button className="brand" onClick={() => setPage("Home")}>
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <strong>{role === "Admin" ? "RentNest Admin" : "RentNest"}</strong>
        </button>
        <nav onClick={() => setMobileNavOpen(false)}>
          {role === "Renter" ? (
            <>
              <p>RENTER</p>
              <NavItem
                icon="home"
                label="Dashboard"
                active={page === "Renter dashboard"}
                onClick={() => setPage("Renter dashboard")}
              />
              <NavItem
                icon="search"
                label="Discover Properties"
                onClick={() => setPage("Discover")}
              />
              <NavItem
                icon="heart"
                label="Favorites"
                active={page === "Saved homes"}
                onClick={() => setPage("Saved homes")}
                badge={favoritesError ? undefined : String(favorites.length)}
              />
              <NavItem
                icon="calendar"
                label="My Bookings"
                active={page === "Bookings" || page === "Booking details"}
                onClick={() => setPage("Bookings")}
              />
              <NavItem
                icon="message"
                label="Messages"
                badge={
                  !summaryState.error && summaryState.summary?.unreadMessages
                    ? String(summaryState.summary.unreadMessages)
                    : undefined
                }
                active={page === "Messages"}
                onClick={() => setPage("Messages")}
              />
              <NavItem
                icon="bell"
                label="Notifications"
                active={page === "Notifications"}
                onClick={() => setPage("Notifications")}
                badge={
                  unreadNotificationCount
                    ? String(unreadNotificationCount)
                    : undefined
                }
              />
              <NavItem
                icon="users"
                label="Profile"
                active={page === "Settings"}
                onClick={() => setPage("Settings")}
              />
            </>
          ) : role === "Owner" ? (
            <>
              <p>OWNER</p>
              <NavItem
                icon="home"
                label="Dashboard"
                active={page === "Owner workspace"}
                onClick={() => setPage("Owner workspace")}
              />
              <NavItem
                icon="building"
                label="My Listings"
                active={
                  page === "Owner listings" ||
                  page === "Owner add property" ||
                  page === "Owner edit property"
                }
                onClick={() => setPage("Owner listings")}
              />
              <NavItem
                icon="calendar"
                label="Booking Requests"
                active={
                  page === "Owner booking requests" ||
                  page === "Owner booking details"
                }
                onClick={() => setPage("Owner booking requests")}
              />
              <NavItem
                icon="message"
                label="Messages"
                badge={
                  !ownerSummary.error &&
                  ownerSummary.data?.counts.unreadMessages
                    ? String(ownerSummary.data.counts.unreadMessages)
                    : undefined
                }
                active={page === "Owner messages"}
                onClick={() => setPage("Owner messages")}
              />
              <NavItem
                icon="star"
                label="Payments"
                active={page === "Owner earnings"}
                onClick={() => setPage("Owner earnings")}
              />
              <NavItem
                icon="bell"
                label="Notifications"
                active={page === "Owner notifications"}
                onClick={() => setPage("Owner notifications")}
                badge={
                  unreadNotificationCount
                    ? String(unreadNotificationCount)
                    : undefined
                }
              />
              <NavItem
                icon="users"
                label="Profile"
                active={page === "Owner profile"}
                onClick={() => setPage("Owner profile")}
              />
            </>
          ) : (
            <>
              <p>ADMINISTRATION</p>
              <NavItem
                icon="home"
                label="Dashboard"
                active={page === "Admin overview"}
                onClick={() => setPage("Admin overview")}
              />
              <NavItem
                icon="users"
                label="User Management"
                active={page === "Admin users"}
                onClick={() => setPage("Admin users")}
              />
              <NavItem
                icon="building"
                label="Listing Management"
                active={page === "Admin listings"}
                onClick={() => setPage("Admin listings")}
                badge={
                  adminSummary.error
                    ? undefined
                    : adminSummary.data?.counts.pendingListings
                      ? String(adminSummary.data.counts.pendingListings)
                      : undefined
                }
              />
              <NavItem
                icon="calendar"
                label="Booking Management"
                active={page === "Admin bookings"}
                onClick={() => setPage("Admin bookings")}
              />
              <NavItem
                icon="star"
                label="Payments & Reports"
                active={page === "Admin payments"}
                onClick={() => setPage("Admin payments")}
              />
              <NavItem
                icon="sliders"
                label="Analytics"
                active={page === "Admin analytics"}
                onClick={() => setPage("Admin analytics")}
              />
              <NavItem
                icon="more"
                label="Activity Logs"
                active={page === "Admin logs"}
                onClick={() => setPage("Admin logs")}
              />
              <NavItem
                icon="settings"
                label="Settings"
                active={page === "Admin settings"}
                onClick={() => setPage("Admin settings")}
              />
            </>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-card">
            <span className="avatar profile">{accountInitials}</span>
            <span>
              <strong>{accountName}</strong>
              <small className={`role-badge ${role.toLowerCase()}`}>
                {role}
              </small>
            </span>
            <button
              className="sidebar-logout"
              onClick={() => setLogoutOpen(true)}
            >
              <Icon name="logout" size={16} />
              <small>Logout</small>
            </button>
          </div>
        </div>
      </aside>
      {mobileNavOpen && (
        <button
          className="sidebar-drawer-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="mobile-top">
        <div className="mobile-brand-group">
          <button
            className="hamburger-button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <i />
            <i />
            <i />
          </button>
          <button
            className="brand"
            onClick={() =>
              setPage(
                role === "Renter"
                  ? "Renter dashboard"
                  : role === "Owner"
                    ? "Owner workspace"
                    : "Admin overview",
              )
            }
          >
            <span className="brand-mark">
              <i />
              <i />
            </span>
            <strong>{role === "Admin" ? "RentNest Admin" : "RentNest"}</strong>
          </button>
        </div>
        <div>
          <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
          <button
            className={`icon-button notification ${
              unreadNotificationCount ? "has-unread" : ""
            }`}
            onClick={() =>
              setPage(
                role === "Owner"
                  ? "Owner notifications"
                  : role === "Admin"
                    ? "Admin notifications"
                    : "Notifications",
              )
            }
          >
            <Icon name="bell" />
            {unreadNotificationCount > 0 && <b>{unreadNotificationCount}</b>}
          </button>
          <span className="avatar">{accountInitials}</span>
        </div>
      </div>
      <MobileBottomNav role={role} page={page} go={setPage} />
      <main>
        <div className="topbar">
          {page === "Renter dashboard" && (
            <div className="dashboard-greeting">
              <small>
                {new Date()
                  .toLocaleDateString("en-GB", {
                    timeZone: "Asia/Dhaka",
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })
                  .toUpperCase()}
              </small>
              <strong>Welcome back, {accountName}</strong>
            </div>
          )}
          {page === "Owner workspace" && (
            <div className="dashboard-greeting">
              <small>PROPERTY OWNER</small>
              <strong>Welcome back, {accountName}</strong>
            </div>
          )}
          {page === "Admin overview" && (
            <div className="dashboard-greeting admin-top-title">
              <small>PLATFORM ADMINISTRATION</small>
              <strong>Admin Dashboard</strong>
            </div>
          )}
          {page === "Admin users" && (
            <div className="dashboard-greeting admin-top-title">
              <small>ADMINISTRATION</small>
              <strong>User Management</strong>
            </div>
          )}
          {page === "Admin listings" && (
            <div className="dashboard-greeting admin-top-title">
              <small>CONTENT MODERATION</small>
              <strong>Listing Management</strong>
            </div>
          )}
          {page === "Admin bookings" && (
            <div className="dashboard-greeting admin-top-title">
              <small>PLATFORM OPERATIONS</small>
              <strong>Booking Management</strong>
            </div>
          )}
          {page === "Admin payments" && (
            <div className="dashboard-greeting admin-top-title">
              <small>FINANCIAL OPERATIONS</small>
              <strong>Payments & Reports</strong>
            </div>
          )}
          {page === "Admin analytics" && (
            <div className="dashboard-greeting admin-top-title">
              <small>BUSINESS INTELLIGENCE</small>
              <strong>Analytics Dashboard</strong>
            </div>
          )}
          {page === "Admin logs" && (
            <div className="dashboard-greeting admin-top-title">
              <small>SECURITY & COMPLIANCE</small>
              <strong>Activity Logs</strong>
            </div>
          )}
          {page === "Admin settings" && (
            <div className="dashboard-greeting admin-top-title">
              <small>PLATFORM CONFIGURATION</small>
              <strong>System Settings</strong>
            </div>
          )}
          <span
            className={`workspace-label ${
              page === "Renter dashboard" ||
              page === "Owner workspace" ||
              role === "Admin"
                ? "dashboard-hidden"
                : ""
            }`}
          >
            <i />
            {role} workspace
          </span>
          <div
            className={`global-search ${
              page === "Renter dashboard" || page === "Owner workspace"
                ? "dashboard-hidden"
                : ""
            }`}
          >
            <Icon name="search" />
            <input
              aria-label="Search workspace"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (role === "Owner")
                    navigate("Owner listings", {
                      filter: JSON.stringify({ search: e.currentTarget.value }),
                    })
                  else if (role === "Renter")
                    navigate("Discover", {
                      filter: JSON.stringify({ search: e.currentTarget.value }),
                    })
                  else
                    navigate("Admin users", { filter: e.currentTarget.value })
                }
              }}
              placeholder={
                role === "Admin"
                  ? "Search users, listings, bookings..."
                  : "Search homes, bookings, messages..."
              }
            />
          </div>
          {page === "Renter dashboard" && (
            <button
              className="icon-button header-search"
              onClick={() => setPage("Discover")}
            >
              <Icon name="search" />
            </button>
          )}
          <div className="notification-wrap">
            <button
              className={`icon-button notification ${
                unreadNotificationCount ? "has-unread" : ""
              }`}
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={
                noticeState.error
                  ? "Notifications unavailable"
                  : `${unreadNotificationCount} unread notifications`
              }
            >
              <Icon name="bell" />
              {unreadNotificationCount > 0 && (
                <b>
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </b>
              )}
            </button>
            {notificationsOpen && (
              <div className="notifications-popover">
                <div className="notification-popover-head">
                  <span>
                    <strong>Notifications</strong>
                    <small>{unreadNotificationCount} unread</small>
                  </span>
                  <button
                    onClick={() => void noticeState.markRead()}
                    disabled={!unreadNotificationCount}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="notification-popover-list">
                  {notifications.slice(0, 4).map((item) => (
                    <article
                      className={item.read ? "" : "unread"}
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const n = noticeState.notices.find(
                            (n) => n.id === item.id,
                          )
                          void noticeState.markRead(item.id)
                          if (n?.conversationId)
                            openConversation(n.conversationId)
                          else if (n?.bookingId)
                            navigate(
                              user?.role === "owner"
                                ? "Owner booking requests"
                                : "Bookings",
                              { filter: "booking:" + n.bookingId },
                            )
                          else if (n?.propertyId) viewProperty(n.propertyId)
                        }
                      }}
                      onClick={() => {
                        const n = noticeState.notices.find(
                          (n) => n.id === item.id,
                        )
                        void noticeState.markRead(item.id)
                        if (n?.conversationId)
                          openConversation(n.conversationId)
                        else if (n?.bookingId)
                          navigate(
                            user?.role === "owner"
                              ? "Owner booking requests"
                              : "Bookings",
                            { filter: "booking:" + n.bookingId },
                          )
                        else if (n?.propertyId) viewProperty(n.propertyId)
                        setNotificationsOpen(false)
                      }}
                    >
                      <span
                        className={`popover-notification-icon ${item.tone}`}
                      >
                        <Icon name={item.icon} />
                      </span>
                      <p>
                        <small>{item.category}</small>
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                        <time>{item.time}</time>
                      </p>
                    </article>
                  ))}
                </div>
                <button
                  className="view-notifications"
                  onClick={() => {
                    setPage(
                      role === "Owner"
                        ? "Owner notifications"
                        : role === "Admin"
                          ? "Admin notifications"
                          : "Notifications",
                    )
                    setNotificationsOpen(false)
                  }}
                >
                  View all notifications <Icon name="arrow" size={13} />
                </button>
              </div>
            )}
          </div>
          <div className="session-menu-wrap">
            <button
              className="topbar-profile"
              onClick={() => setSessionMenuOpen(!sessionMenuOpen)}
            >
              <span className="avatar">{accountInitials}</span>
              <span>
                <strong>{accountName}</strong>
                <small className={`role-badge ${role.toLowerCase()}`}>
                  {role}
                </small>
              </span>
              <Icon name="chevron" size={15} />
            </button>
            {sessionMenuOpen && (
              <div className="session-menu">
                <div className="session-menu-user">
                  <span className="avatar profile">{accountInitials}</span>
                  <p>
                    <strong>{accountName}</strong>
                    <small>{user?.email}</small>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPage(
                      role === "Renter"
                        ? "Renter dashboard"
                        : role === "Owner"
                          ? "Owner workspace"
                          : "Admin overview",
                    )
                    setSessionMenuOpen(false)
                  }}
                >
                  <Icon name="home" /> Dashboard
                </button>
                <button
                  onClick={() => {
                    setPage(
                      role === "Owner"
                        ? "Owner profile"
                        : role === "Admin"
                          ? "Admin settings"
                          : "Settings",
                    )
                    setSessionMenuOpen(false)
                  }}
                >
                  <Icon name="settings" /> Account settings
                </button>
                <button
                  onClick={() => {
                    setPage("Session and security")
                    setSessionMenuOpen(false)
                  }}
                >
                  <Icon name="lock" /> Session & security
                </button>
                <button
                  className="session-logout"
                  onClick={() => {
                    setLogoutOpen(true)
                    setSessionMenuOpen(false)
                  }}
                >
                  <Icon name="logout" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="content">
          {noticeState.error && (
            <p className="form-error-message" role="alert">
              {noticeState.error}{" "}
              <button onClick={noticeState.refresh}>Retry notifications</button>
            </p>
          )}
          {pages[page]}
        </div>
      </main>
      {logoutOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setLogoutOpen(false)}
        >
          <section
            className="modal logout-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-icon danger">
              <Icon name="logout" />
            </div>
            <h2>Logout from RentNest?</h2>
            <p className="modal-description">
              You will need to login again to access your account.
            </p>
            <div className="logout-account">
              <span className="avatar profile">{accountInitials}</span>
              <p>
                <strong>{accountName}</strong>
                <small className={`role-badge ${role.toLowerCase()}`}>
                  {role}
                </small>
              </p>
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  void logout()
                    .then(() => setPage("Home"))
                    .catch((error) => window.alert(error.message))
                }
              >
                Logout
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
