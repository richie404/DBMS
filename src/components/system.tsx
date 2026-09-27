import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

export type ComponentCategory = "global" | "public" | "renter" | "owner" | "admin";

export type ComponentDefinition = {
  name: string;
  category: ComponentCategory;
  variants: readonly string[];
  states: readonly string[];
  responsive: string;
};

const define = (
  category: ComponentCategory,
  name: string,
  variants: readonly string[],
  states: readonly string[],
  responsive: string,
): ComponentDefinition => ({ category, name, variants, states, responsive });

export const componentCatalog: readonly ComponentDefinition[] = [
  define("global", "Navbar", ["public", "app", "admin"], ["default", "scrolled", "menu-open"], "Desktop links collapse to a hamburger header on tablet and mobile."),
  define("global", "Sidebar", ["renter", "owner", "admin"], ["default", "active-item", "drawer-open"], "Persistent on desktop and an off-canvas drawer below 1200px."),
  define("global", "Button", ["primary", "secondary", "ghost", "destructive"], ["default", "hover", "focus", "disabled", "loading"], "Full width where actions stack on mobile."),
  define("global", "Input", ["text", "email", "password", "search", "date"], ["default", "focus", "filled", "error", "disabled"], "Uses full available width and preserves a minimum touch target."),
  define("global", "Modal", ["confirmation", "form", "details"], ["open", "closing", "submitting"], "Centered on desktop and nearly full width on mobile."),
  define("global", "Toast", ["success", "warning", "error", "neutral"], ["entering", "visible", "leaving"], "Top-right on desktop and edge-to-edge with safe margins on mobile."),
  define("global", "Notification", ["booking", "message", "listing", "system"], ["read", "unread", "hover"], "Compact dropdown item and expanded full-page row."),
  define("global", "PropertyCard", ["marketplace", "favorite", "owner"], ["default", "saved", "unavailable", "loading"], "Property grids scale from four columns to two and then one."),
  define("global", "StatusBadge", ["success", "warning", "danger", "neutral"], ["default"], "Content-sized at all breakpoints."),
  define("global", "Table", ["standard", "selectable", "moderation"], ["default", "loading", "empty", "row-selected"], "Dense rows become independently labeled cards below 820px."),
  define("global", "Pagination", ["numbered", "simple"], ["default", "first-page", "last-page", "disabled"], "Buttons expand while labels remain compact on mobile."),
  define("global", "Avatar", ["initials", "image", "status"], ["online", "offline", "blocked"], "Uses compact and regular sizes according to available space."),
  define("global", "Dropdown", ["select", "menu", "filter"], ["closed", "open", "selected", "disabled"], "Menu width is constrained to the viewport on mobile."),
  define("public", "HomeHero", ["default", "search-focused"], ["default", "loading"], "Two-column desktop composition stacks into one column on mobile."),
  define("public", "SearchBar", ["hero", "page", "compact"], ["default", "focused", "searching", "error"], "Fields stack and the submit action becomes full width on mobile."),
  define("public", "PropertyGrid", ["marketplace", "featured", "similar"], ["loading", "results", "empty", "error"], "Four columns on desktop, two on tablet, and one on mobile."),
  define("public", "PropertyDetails", ["available", "unavailable"], ["loading", "ready", "not-found"], "Gallery and booking summary stack on tablet and mobile."),
  define("public", "Footer", ["full", "compact"], ["default"], "Four-column desktop layout becomes two columns and then one."),
  define("renter", "RenterDashboard", ["default"], ["loading", "ready", "empty", "error"], "Summary and content grids collapse progressively to one column."),
  define("renter", "FavoriteCard", ["saved", "removed"], ["default", "removing"], "Uses the property-card grid behavior."),
  define("renter", "BookingCard", ["pending", "approved", "confirmed", "rejected", "cancelled"], ["default", "updating"], "Table row becomes a stacked reservation card."),
  define("renter", "MessagePanel", ["conversation", "empty", "blocked"], ["loading", "selected", "sending"], "Two panels become a single navigable panel on mobile."),
  define("renter", "NotificationList", ["all", "filtered"], ["loading", "ready", "empty"], "Rows compact while filters scroll horizontally."),
  define("owner", "OwnerDashboard", ["default"], ["loading", "ready", "empty", "error"], "Multi-column metrics and management regions stack on mobile."),
  define("owner", "ListingCard", ["grid", "table"], ["approved", "pending", "rejected", "draft"], "Table variant becomes cards below 820px."),
  define("owner", "ListingForm", ["create", "edit"], ["pristine", "dirty", "validating", "saving", "success"], "Two-column fields collapse to one column."),
  define("owner", "BookingRequestCard", ["pending", "approved", "rejected", "cancelled"], ["default", "updating"], "Dense row becomes a mobile action card."),
  define("owner", "EarningsChart", ["bar", "summary"], ["loading", "ready", "empty"], "Chart labels and columns adapt to narrow viewports."),
  define("admin", "AdminSidebar", ["expanded", "drawer"], ["default", "active-item", "open"], "Persistent dark rail on desktop and drawer on tablet/mobile."),
  define("admin", "DataTable", ["users", "listings", "bookings", "payments"], ["loading", "ready", "empty", "selected"], "Columns compact on tablet and rows become cards on mobile."),
  define("admin", "UserDrawer", ["details", "moderation"], ["open", "updating"], "Right drawer becomes full width on mobile."),
  define("admin", "ModerationPanel", ["listing", "booking"], ["pending", "approved", "rejected"], "Actions remain sticky and stack on mobile."),
  define("admin", "AnalyticsChart", ["line", "bar", "donut"], ["loading", "ready", "empty", "error"], "Two-column BI grid collapses to one chart per row."),
  define("admin", "ActivityLog", ["security", "platform"], ["loading", "ready", "empty"], "Audit rows become security-focused cards on mobile."),
] as const;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`button button-${variant} ${className}`.trim()}
      data-component="Button"
      data-variant={variant}
      data-state={props.disabled ? "disabled" : "default"}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className={`system-field ${error ? "has-error" : ""} ${className}`.trim()}>
      <span>{label}</span>
      <input aria-invalid={!!error} data-component="Input" data-state={error ? "error" : "default"} {...props} />
      {error && <small role="alert">{error}</small>}
    </label>
  );
}

export function Avatar({
  initials,
  image,
  alt = "",
  status,
  size = "regular",
}: {
  initials: string;
  image?: string;
  alt?: string;
  status?: "online" | "offline" | "blocked";
  size?: "compact" | "regular" | "large";
}) {
  return (
    <span className={`system-avatar avatar-${size} ${status ? `is-${status}` : ""}`} data-component="Avatar" data-state={status || "default"}>
      {image ? <img src={image} alt={alt} /> : initials}
      {status && <i />}
    </span>
  );
}

export function StatusBadge({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  return <span className={`badge ${tone}`} data-component="StatusBadge" data-variant={tone}>{children}</span>;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  variant = "form",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  variant?: "confirmation" | "form" | "details";
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className={`modal system-modal modal-${variant}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={event => event.stopPropagation()}>
        <div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </section>
    </div>
  );
}

export function Toast({
  children,
  tone = "neutral",
  visible = true,
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "error" | "neutral";
  visible?: boolean;
}) {
  if (!visible) return null;
  return <div className={`system-toast toast-${tone}`} role="status" data-component="Toast" data-state="visible">{children}</div>;
}

export function Notification({
  icon,
  title,
  description,
  timestamp,
  unread = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  timestamp: string;
  unread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`system-notification ${unread ? "unread" : "read"}`} onClick={onClick} data-component="Notification" data-state={unread ? "unread" : "read"}>
      <span>{icon}</span><span><strong>{title}</strong><small>{description}</small><time>{timestamp}</time></span>{unread && <i />}
    </button>
  );
}

export type TableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
};

export function DataTable<Row>({
  rows,
  columns,
  rowKey,
  empty,
}: {
  rows: readonly Row[];
  columns: readonly TableColumn<Row>[];
  rowKey: (row: Row) => string;
  empty?: ReactNode;
}) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="system-table" data-component="Table" data-state="ready">
      <div className="system-table-head">{columns.map(column => <span key={column.key}>{column.header}</span>)}</div>
      {rows.map(row => <article key={rowKey(row)}>{columns.map(column => <div key={column.key} data-label={typeof column.header === "string" ? column.header : column.key}>{column.render(row)}</div>)}</article>)}
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  return (
    <nav className="system-pagination" aria-label="Pagination" data-component="Pagination">
      <Button variant="secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</Button>
      <span>Page {page} of {pageCount}</span>
      <Button variant="secondary" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Next</Button>
    </nav>
  );
}

export function Dropdown({
  label,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: readonly { label: string; value: string }[] }) {
  return (
    <label className="system-field system-dropdown">
      <span>{label}</span>
      <select data-component="Dropdown" data-state={props.disabled ? "disabled" : "default"} {...props}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function Navbar({ brand, navigation, actions }: { brand: ReactNode; navigation: ReactNode; actions?: ReactNode }) {
  return <header className="system-navbar" data-component="Navbar"><div>{brand}</div><nav>{navigation}</nav><aside>{actions}</aside></header>;
}

export function Sidebar({ brand, navigation, footer, variant = "renter", open = false }: { brand: ReactNode; navigation: ReactNode; footer?: ReactNode; variant?: "renter" | "owner" | "admin"; open?: boolean }) {
  return <aside className={`system-sidebar sidebar-${variant} ${open ? "is-open" : ""}`} data-component={variant === "admin" ? "AdminSidebar" : "Sidebar"} data-state={open ? "drawer-open" : "default"}><header>{brand}</header><nav>{navigation}</nav>{footer && <footer>{footer}</footer>}</aside>;
}

export function PropertyCard({
  image,
  title,
  location,
  price,
  meta,
  action,
}: {
  image: string;
  title: string;
  location: string;
  price: string;
  meta?: string;
  action?: ReactNode;
}) {
  return <article className="system-property-card" data-component="PropertyCard"><img src={image} alt="" /><div><h3>{title}</h3><p>{location}</p>{meta && <small>{meta}</small>}<footer><strong>{price}</strong>{action}</footer></div></article>;
}

export function PropertyGrid({ children, state = "results" }: { children: ReactNode; state?: "loading" | "results" | "empty" | "error" }) {
  return <div className="system-property-grid" data-component="PropertyGrid" data-state={state}>{children}</div>;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = "Search properties, locations..." }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder?: string }) {
  return <form className="system-search-bar" onSubmit={event => { event.preventDefault(); onSubmit(); }} data-component="SearchBar"><input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /><Button type="submit">Search</Button></form>;
}

export default componentCatalog;
