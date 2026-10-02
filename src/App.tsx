<<<<<<< Updated upstream
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button, StatusBadge as Badge } from "./components/system";
import { useAuth } from "./auth/AuthContext";
import {workspaceService, workspaceChanged, type MessageRecord, type PaymentRecord, type PlatformSettings} from "./services/workspace";
import { ApiError } from "./lib/api";
import { authService } from "./services/auth";
import type { AuthUser } from "./types/auth";
import { dashboards, requiredRole, userInitials, readPage } from "./auth/navigation";
import useApiData from "./hooks/useApiData";
import {propertyService, type PropertyScope} from "./services/properties";
import {bookingService, type BookingScope} from "./services/bookings";
import {favoriteService} from "./services/favorites";
import type {Property, PropertyInput, Page, Booking} from "./types/rentals";

const loginDestinations = dashboards;

function authErrorMessage(error: unknown) {
  return error instanceof ApiError && error.status < 500
    ? error.message
    : "Unable to complete your request. Please try again.";
}

const showcaseHomes = [
  {
    title: "Modern Apartment in Gulshan",
    place: "Gulshan, Dhaka · Apartment",
    price: "৳48,000",
    meta: "2 beds · 2 baths · 980 sq ft",
    image:
      "https://images.unsplash.com/photo-1564078516393-cf04bd966897?auto=format&fit=crop&w=1200&q=85",
    tag: "Available now",
    rating: "4.9",
  },
  {
    title: "Garden flat near the lake",
    place: "Dhanmondi, Dhaka · Flat",
    price: "৳36,500",
    meta: "2 beds · 1 bath · 840 sq ft",
    image:
      "https://images.unsplash.com/photo-1738168246881-40f35f8aba0a?auto=format&fit=crop&w=1200&q=85",
    tag: "Available 12 Jun",
    rating: "4.8",
  },
  {
    title: "Calm contemporary studio",
    place: "Banani, Dhaka · Room",
    price: "৳24,000",
    meta: "1 bed · 1 bath · 620 sq ft",
    image:
      "https://images.unsplash.com/photo-1665249934445-1de680641f50?auto=format&fit=crop&w=1200&q=85",
    tag: "Available now",
    rating: "4.7",
  },
  {
    title: "Lakeview family apartment",
    place: "Uttara, Dhaka · Apartment",
    price: "৳32,000",
    meta: "3 beds · 2 baths · 1,240 sq ft",
    image:
      "https://images.unsplash.com/photo-1707243794846-e9b391b07dcd?auto=format&fit=crop&w=1200&q=85",
    tag: "Available now",
    rating: "4.9",
  },
  {
    title: "Modern home in Bashundhara",
    place: "Bashundhara, Dhaka · Flat",
    price: "৳42,000",
    meta: "3 beds · 3 baths · 1,460 sq ft",
    image:
      "https://images.unsplash.com/photo-1758448511578-ec292173b70c?auto=format&fit=crop&w=1200&q=85",
    tag: "Available 20 Jun",
    rating: "4.8",
  },
  {
    title: "City-view serviced suite",
    place: "Mirpur, Dhaka · Apartment",
    price: "৳28,500",
    meta: "2 beds · 2 baths · 910 sq ft",
    image:
      "https://images.unsplash.com/photo-1671143483026-07786e8bba8e?auto=format&fit=crop&w=1200&q=85",
    tag: "Available now",
    rating: "4.6",
  },
];
=======
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
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
function TableSkeleton({ rows = 5 }: { rows?:number }) {
  return <div className="table-skeleton" aria-hidden="true">{Array.from({length:rows},(_,index)=><article key={index}><span className="skeleton table-avatar-skeleton"/><div><i className="skeleton"/><i className="skeleton"/></div><span className="skeleton table-cell-skeleton"/><span className="skeleton table-cell-skeleton short"/><span className="skeleton table-action-skeleton"/></article>)}</div>;
}

function EmptyState({ icon, title, description, actionLabel, onAction, variant = "default", compact = false }: { icon:IconName; title:string; description?:string; actionLabel?:string; onAction?:()=>void; variant?:"default"|"favorites"|"bookings"|"messages"|"notifications"|"listings"; compact?:boolean }) {
  return <div className={`empty-state-system empty-${variant} ${compact?"compact":""}`}><div className="empty-state-illustration"><i/><span><Icon name={icon} size={compact?25:34}/></span><b/></div><h2>{title}</h2>{description&&<p>{description}</p>}{actionLabel&&onAction&&<Button onClick={onAction}>{actionLabel} <Icon name="arrow" size={14}/></Button>}</div>;
}

function ErrorState({ type, title, description, primaryLabel, onPrimary, secondaryLabel, onSecondary, fullPage = false }: { type:"network"|"server"|"not-found"|"permission"; title:string; description?:string; primaryLabel:string; onPrimary:()=>void; secondaryLabel?:string; onSecondary?:()=>void; fullPage?:boolean }) {
  const icon:IconName=type==="permission"?"lock":type==="not-found"?"home":type==="network"?"search":"settings";
  return <div className={`error-state-system error-${type} ${fullPage?"full-page":""}`} role="alert"><div className="error-state-illustration"><i/><span><Icon name={icon} size={34}/></span><b>{type==="not-found"?"404":"!"}</b></div><p className="eyebrow">{type==="network"?"CONNECTION ERROR":type==="server"?"SYSTEM ERROR":type==="permission"?"ACCESS RESTRICTED":"NOT FOUND"}</p><h1>{title}</h1>{description&&<p className="error-state-description">{description}</p>}<div className="error-state-actions"><Button onClick={onPrimary}>{primaryLabel}</Button>{secondaryLabel&&onSecondary&&<Button variant="secondary" onClick={onSecondary}>{secondaryLabel}</Button>}</div></div>;
}

function FormError({ message }: { message:string }) {
  return <small className="form-error-message" role="alert"><span>!</span>{message}</small>;
}

function ConfirmationModal({ type, title, description, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel, children, reason, onReasonChange, reasonLabel = "Reason" }: { type:"delete"|"approve"|"reject"|"cancel"|"ban"; title:string; description:string; confirmLabel:string; cancelLabel?:string; onConfirm:()=>void; onCancel:()=>void; children?:ReactNode; reason?:string; onReasonChange?:(value:string)=>void; reasonLabel?:string }) {
  const destructive=type!=="approve";
  const icon:IconName=type==="ban"?"users":type==="delete"?"logout":type==="cancel"?"calendar":type==="approve"?"settings":"more";
  return <div className="modal-backdrop confirmation-modal-backdrop" role="presentation" onMouseDown={onCancel}><section className={`modal confirmation-modal confirmation-${type}`} role="dialog" aria-modal="true" aria-labelledby={`confirmation-${type}-title`} onMouseDown={event=>event.stopPropagation()}><div className={`confirmation-icon ${destructive?"danger":"success"}`}><Icon name={icon} size={22}/></div><div className="confirmation-copy"><p className="eyebrow">{type.toUpperCase()} CONFIRMATION</p><h2 id={`confirmation-${type}-title`}>{title}</h2><p>{description}</p></div>{children&&<div className="confirmation-context">{children}</div>}{onReasonChange&&<label className="confirmation-reason"><span>{reasonLabel}</span><textarea value={reason||""} onChange={event=>onReasonChange(event.target.value)} placeholder={type==="ban"?"Explain why this user is being banned...":"Explain rejection reason"}/></label>}<div className="confirmation-separator"/><div className="confirmation-actions"><Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button><Button variant={destructive?"destructive":"primary"} onClick={onConfirm}>{confirmLabel}</Button></div></section></div>;
}

function NavItem({ icon, label, active, onClick, badge }: { icon: IconName; label: string; active?: boolean; onClick: () => void; badge?: string }) {
  return <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}><Icon name={icon} /><span>{label}</span>{badge && <b>{badge}</b>}</button>;
}

function MobileBottomNav({ role, page, go }: { role:"Renter"|"Owner"|"Admin"; page:string; go:(page:string)=>void }) {
  const items = role==="Renter"?[["home","Home","Renter dashboard"],["search","Search","Discover"],["calendar","Bookings","Bookings"],["message","Messages","Messages"],["users","Profile","Settings"]]:role==="Owner"?[["home","Home","Owner workspace"],["building","Listings","Owner listings"],["calendar","Requests","Owner booking requests"],["message","Messages","Owner messages"],["users","Profile","Owner profile"]]:[["home","Home","Admin overview"],["users","Users","Admin users"],["building","Listings","Admin listings"],["calendar","Bookings","Admin bookings"],["settings","More","Admin settings"]];
  const active=(destination:string)=>page===destination||destination==="Bookings"&&page==="Booking details"||destination==="Owner listings"&&["Owner add property","Owner edit property"].includes(page)||destination==="Owner booking requests"&&page==="Owner booking details";
  return <nav className={`mobile-bottom-nav mobile-${role.toLowerCase()}`} aria-label={`${role} mobile navigation`}>{items.map(item=><button className={active(item[2])?"active":""} onClick={()=>go(item[2])} key={item[1]}><Icon name={item[0] as IconName} size={19}/><span>{item[1]}</span></button>)}</nav>;
}

function Header({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return <div className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div>{action}</div>;
}

type RentalNavigation = { go: (page: string) => void; viewHome: (id: number) => void };
const rentalImage = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#edf1ef"/><text x="50%" y="50%" text-anchor="middle" fill="#697570" font-size="24">No property photo</text></svg>');
function money(value: number | null, currency = "BDT") { return value === null ? "Not set" : new Intl.NumberFormat("en-BD", {style: "currency", currency, maximumFractionDigits: 2}).format(value); }
function statusLabel(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function statusTone(value: string): "success" | "warning" | "danger" | "neutral" { return ["approved", "confirmed"].includes(value) ? "success" : value === "pending" ? "warning" : value === "rejected" ? "danger" : "neutral"; }
function toHome(property: Property) {
  return { title: property.title || "Untitled draft", place: `${property.location || "Location not set"} · ${statusLabel(property.type)}`, price: money(property.monthlyRent, property.currency), meta: [property.bedrooms === null ? null : `${property.bedrooms} beds`, property.bathrooms === null ? null : `${property.bathrooms} baths`, property.sizeSqft === null ? null : `${property.sizeSqft} sq ft`].filter(Boolean).join(" · "), image: property.images[0]?.url || rentalImage, tag: property.archived ? "Archived" : property.moderationStatus !== "approved" ? statusLabel(property.moderationStatus) : !property.available ? "Unavailable" : property.availableFrom ? `Available from ${property.availableFrom}` : "Available now", rating: "" };
}
function RentalFailure({ error, retry }: { error: Error; retry: () => void }) {
  const code=error instanceof ApiError?error.status:0;
  return <ErrorState type={code===403?"permission":code===404?"not-found":code>=500?"server":"network"} title={code===403?"Access Denied":code===404?"Record not found.":"Unable to load data."} description={error.message} primaryLabel="Retry" onPrimary={retry}/>;
}
function RentalPagination({ pagination, onPage }: { pagination: Page<Property>["pagination"]; onPage: (page: number) => void }) { return <div className="browse-pagination"><Button variant="secondary" disabled={pagination.page <= 1} onClick={()=>onPage(pagination.page-1)}>Previous</Button><span>Page {pagination.page} of {Math.max(1,pagination.pages)} · {pagination.total} results</span><Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={()=>onPage(pagination.page+1)}>Next</Button></div>; }


function PropertyCard({ home, saved, onSave, onView }: { home: typeof showcaseHomes[0]; saved: boolean; onSave: () => void; onView?: () => void }) {
  return <article className="property-card">
    <div className="property-image">
      <img onError={event=>{event.currentTarget.src=rentalImage;}} src={home.image} alt={`${home.title} interior`} />
      <Badge>{home.tag}</Badge>
      <button className={`heart ${saved ? "saved" : ""}`} onClick={onSave} aria-label="Save property"><Icon name="heart" /></button>
    </div>
    <div className="property-body">
      <div className="property-row"><h3>{home.title}</h3>{home.rating&&<span className="rating"><Icon name="star" size={14} /> {home.rating}</span>}</div>
      <p className="location"><Icon name="pin" size={16} />{home.place}</p>
      <p className="meta">{home.meta}</p>
      <div className="property-row price-row"><p><strong>{home.price}</strong> / month</p><button className="card-cta" onClick={onView}>View details <Icon name="arrow" size={15} /></button></div>
    </div>
  </article>;
}

function Discover({ saved, toggleSaved, viewHome }: {saved:number[];toggleSaved:(id:number)=>void;viewHome:(id:number)=>void}) {return <BrowsePage go={()=>{}} saved={saved} toggleSaved={toggleSaved} viewHome={viewHome}/>;}

function RenterDashboard({ saved, toggleSaved, go, viewHome }: { saved: number[]; toggleSaved: (id: number) => void } & RentalNavigation) {
  const {user} = useAuth();
  const data = useApiData(async()=> {const [favorites,bookings,recommended] = await Promise.all([favoriteService.list(),bookingService.list({limit:3}),propertyService.list({limit:3})]);return {favorites,bookings,recommended};}, `renter-dashboard-${user?.id}-${saved.join(",")}`);
  if(data.loading)return <div className="renter-summary">{[0,1,2,3].map(i=><DashboardCardSkeleton key={i}/>)}</div>;
  if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  const favorites=data.data!.favorites, bookings=data.data!.bookings;
  const summary=bookings.summary;
  return <div className="renter-dashboard"><div className="renter-page-head"><div><p className="eyebrow">RENTER OVERVIEW</p><h1>Your rental journey</h1><p>Everything you're following and booking in one place.</p></div><Button onClick={()=>go("Discover")}><Icon name="search"/> Browse Homes</Button></div>
    <section className="renter-summary">{[["heart","Saved Properties",favorites.length,"Homes you love"],["calendar","Active Bookings",(summary.approved||0)+(summary.confirmed||0),"Approved rental requests"],["settings","Pending Requests",summary.pending||0,"Waiting for owner approval"],["calendar","Total Bookings",bookings.pagination.total,"Your rental history"]].map((item,i)=><article key={String(item[1])}><span className={`summary-icon summary-${i}`}><Icon name={item[0] as IconName}/></span><div><small>{item[1]}</small><strong>{item[2]}</strong><p>{item[3]}</p></div></article>)}</section>
    <section className="quick-actions"><div className="dashboard-section-head"><h2>Quick actions</h2></div><div className="quick-action-grid">{[["search","Browse Homes","Discover"],["calendar","View Bookings","Bookings"],["heart","Favorites","Saved homes"]].map(item=><button key={item[1]} onClick={()=>go(item[2])}><Icon name={item[0] as IconName}/><strong>{item[1]}</strong><Icon name="arrow"/></button>)}</div></section>
    <div className="dashboard-main-grid"><section className="saved-dashboard-section"><div className="dashboard-section-head"><h2>Saved Properties</h2><Button variant="ghost" onClick={()=>go("Saved homes")}>View all</Button></div>{favorites.length?<div className="dashboard-property-grid">{favorites.slice(0,3).map(property=><PropertyCard key={property.id} home={toHome(property)} saved onSave={()=>toggleSaved(property.id)} onView={()=>viewHome(property.id)}/>)}</div>:<EmptyState icon="heart" title="You haven't saved any properties." actionLabel="Explore Homes" onAction={()=>go("Discover")}/>}</section><aside className="recent-activity"><div className="dashboard-section-head"><h2>Recent Bookings</h2></div>{bookings.items.length?<div className="activity-timeline">{bookings.items.map(booking=><article key={booking.id}><Icon name="calendar"/><div><strong>{booking.property.title}</strong><p>{statusLabel(booking.status)}</p><small>{booking.startDate} – {booking.endDate}</small><Button variant="ghost" onClick={()=>go("Bookings")}>View bookings</Button></div></article>)}</div>:<EmptyState icon="calendar" compact title="No bookings yet."/>}</aside></div>
    <section className="saved-dashboard-section"><div className="dashboard-section-head"><h2>Available Properties</h2><Button variant="ghost" onClick={()=>go("Discover")}>Browse all</Button></div><div className="dashboard-property-grid">{data.data!.recommended.items.map(p=><PropertyCard key={p.id} home={toHome(p)} saved={saved.includes(p.id)} onSave={()=>toggleSaved(p.id)} onView={()=>viewHome(p.id)}/>)}</div></section>
  </div>;
}

function Saved({ saved, toggleSaved, go, viewHome }: { saved: number[]; toggleSaved: (id:number)=>void } & RentalNavigation) {
  const {user}=useAuth();
  const [sort,setSort]=useState("Recently Added");
  const data=useApiData(()=>favoriteService.list(),`favorites-${user?.id}-${saved.join(",")}`);
  const items=[...(data.data||[])].sort((a,b)=>sort==="Price Low to High"?(a.monthlyRent||0)-(b.monthlyRent||0):sort==="Price High to Low"?(b.monthlyRent||0)-(a.monthlyRent||0):0);
  return <div className="favorites-page"><div className="favorites-header"><div><p className="eyebrow">YOUR COLLECTION</p><h1>My Favorite Properties</h1><p>Your saved homes are collected here.</p></div><div className="favorites-count"><Icon name="heart"/><span><strong>{data.loading?"—":items.length}</strong><small>Saved homes</small></span></div></div><div className="favorites-toolbar"><p>Your property shortlist</p><label><span>Sort</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recently Added</option><option>Price Low to High</option><option>Price High to Low</option></select></label></div>{data.loading?<div className="favorites-grid">{[0,1,2].map(i=><PropertyCardSkeleton key={i}/>)}</div>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:items.length?<div className="favorites-grid">{items.map(property=><div className="favorite-card-wrap" key={property.id}><PropertyCard home={toHome(property)} saved onSave={()=>toggleSaved(property.id)} onView={()=>viewHome(property.id)}/><button className="remove-favorite" onClick={()=>toggleSaved(property.id)}>Remove Favorite</button></div>)}</div>:<EmptyState icon="heart" variant="favorites" title="You haven't saved any properties." actionLabel="Explore Homes" onAction={()=>go("Discover")}/>}</div>;
}

function Bookings({ go, viewBooking, scope="renter" }: {go:(page:string)=>void;viewBooking:(id:number)=>void;scope?:BookingScope}) {
  const {user}=useAuth();
  const [status,setStatus]=useState("");const [from,setFrom]=useState("");const [search,setSearch]=useState("");const [page,setPage]=useState(1);
  const data=useApiData(()=>bookingService.list({status,from,search,page},scope),`bookings-${user?.id}-${scope}-${status}-${from}-${search}-${page}`);
  const [target,setTarget]=useState<Booking|null>(null);const [action,setAction]=useState<"approve"|"reject"|"cancel">("approve");
  const owner=scope==="owner",admin=scope==="admin";
  return <div className={owner?"owner-booking-page":admin?"admin-bookings-page":"bookings-page"}><div className={owner?"owner-booking-head":admin?"admin-bookings-head":"bookings-header"}><div><p className="eyebrow">{owner?"OWNER WORKFLOW":admin?"PLATFORM OPERATIONS":"RENTAL ACTIVITY"}</p><h1>{owner?"Booking Requests":admin?"Booking Management":"My Bookings"}</h1><p>Review rental dates, requests, and booking status.</p></div>{!owner&&!admin&&<Button onClick={()=>go("Discover")}>Find a Property</Button>}</div>
    <div className="booking-filter-bar"><div className="status-filters">{["","pending","approved","confirmed","rejected","cancelled"].map(value=><button key={value} className={status===value?"active":""} onClick={()=>{setStatus(value);setPage(1);}}>{value?statusLabel(value):"All"}</button>)}</div><label className="date-filter"><span>From</span><input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPage(1);}}/></label><label className="global-search"><Icon name="search"/><input placeholder="Search property or booking" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label></div>
    {data.loading?<TableSkeleton/>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:data.data!.items.length?<>{owner?<div className="owner-booking-table"><div className="owner-booking-table-head"><span>Renter</span><span>Property</span><span>Requested dates</span><span>Duration</span><span>Total</span><span>Status</span><span>Actions</span></div>{data.data!.items.map(booking=><article key={booking.id}><div className="request-person"><span className="avatar">{userInitials(booking.renter.name)}</span><div><strong>{booking.renter.name}</strong><small>{booking.code}</small></div></div><div className="request-home"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={booking.property.image||rentalImage} alt=""/><div><strong>{booking.property.title}</strong><small>{booking.property.location}</small></div></div><span className="request-dates">{booking.startDate} ? {booking.endDate}</span><span>{Math.round((Date.parse(booking.endDate)-Date.parse(booking.startDate))/86400000)} days</span><strong>{money(booking.totalAmount,booking.currency)}</strong><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge><div className="owner-booking-actions">{booking.status==="pending"&&<><button className="approve" onClick={()=>{setTarget(booking);setAction("approve");}}>Approve</button><button className="reject" onClick={()=>{setTarget(booking);setAction("reject");}}>Reject</button></>}<button onClick={()=>viewBooking(booking.id)}>View Details</button></div></article>)}</div>:admin?<section className="admin-bookings-table-wrap"><div className="admin-bookings-table-head"><span>Booking ID</span><span>Property</span><span>Renter</span><span>Owner</span><span>Start Date</span><span>End Date</span><span>Amount</span><span>Status</span><span>Actions</span></div><div className="admin-bookings-table">{data.data!.items.map(booking=><article key={booking.id}><strong className="admin-booking-id">{booking.code}</strong><div className="admin-booking-property"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={booking.property.image||rentalImage} alt=""/><div><strong>{booking.property.title}</strong><small>{booking.property.location}</small></div></div><div className="admin-booking-person"><span className="avatar">{userInitials(booking.renter.name)}</span><strong>{booking.renter.name}</strong></div><div className="admin-booking-person"><span className="avatar">{userInitials(booking.owner.name)}</span><strong>{booking.owner.name}</strong></div><span>{booking.startDate}</span><span>{booking.endDate}</span><strong className="admin-booking-amount">{money(booking.totalAmount,booking.currency)}</strong><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge><div className="admin-booking-actions"><button onClick={()=>viewBooking(booking.id)}>View Details</button></div></article>)}</div></section>:<div className="booking-list"><div className="booking-list-head"><span>Property</span><span>Rental period</span><span>Total amount</span><span>Status</span><span>Actions</span></div>{data.data!.items.map(booking=><article className="booking-row" key={booking.id}><div className="booking-property"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={booking.property.image||rentalImage} alt=""/><div><small>{booking.code}</small><strong>{booking.property.title||"Archived property"}</strong><p>{booking.property.location} · {owner?booking.renter.name:booking.owner.name}</p>{admin&&<small>Renter: {booking.renter.name}</small>}</div></div><div className="booking-dates"><span>{booking.startDate}</span><i/><span>{booking.endDate}</span></div><strong className="booking-amount">{money(booking.totalAmount,booking.currency)}<small>Total</small></strong><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge><div className="booking-actions"><Button variant="secondary" onClick={()=>viewBooking(booking.id)}>View Details</Button>{booking.status==="pending"&&<button className="cancel-request" onClick={()=>{setTarget(booking);setAction("cancel");}}>Cancel Request</button>}</div></article>)}</div>}<RentalPagination pagination={data.data!.pagination} onPage={setPage}/></>:<EmptyState icon="calendar" variant="bookings" title="No bookings found." description="Rental requests will appear here."/>}
    {target&&scope!=="admin"&&<BookingActionDialog booking={target} action={action} scope={scope} onClose={()=>setTarget(null)} onSaved={()=>{setTarget(null);data.reload();workspaceChanged();}}/>}
  </div>;
}

function BookingActionDialog({booking,action,scope,onClose,onSaved}:{booking:Booking;action:"approve"|"reject"|"cancel";scope:"owner"|"renter";onClose:()=>void;onSaved:()=>void}) {
 const [pending,setPending]=useState(false);const lock=useRef(false);const [reason,setReason]=useState("");const [error,setError]=useState("");
 const save=async()=>{if(lock.current)return;lock.current=true;setPending(true);setError("");try{await bookingService.action(booking.id,action,scope,reason);onSaved();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);lock.current=false;}};
 return <div className="modal-backdrop"><section className="modal owner-request-modal" role="dialog" aria-modal="true"><h2>{statusLabel(action)} booking request?</h2><p className="modal-description">{booking.property.title} ? {booking.startDate} ? {booking.endDate}</p><div className="approval-renter"><span className="avatar">{userInitials(booking.renter.name)}</span><div><small>RENTER</small><strong>{booking.renter.name}</strong></div><b>{money(booking.totalAmount,booking.currency)}</b></div>{action!=="approve"&&<label className="reject-reason"><span>Reason (optional)</span><textarea value={reason} onChange={e=>setReason(e.target.value)}/></label>}{error&&<FormError message={error}/>}<div className="modal-actions"><Button variant="secondary" disabled={pending} onClick={onClose}>Cancel</Button><Button disabled={pending} variant={action==="approve"?"primary":"destructive"} onClick={()=>void save()}>{pending?"Saving...":action==="approve"?"Confirm Approval":action==="reject"?"Confirm Rejection":"Confirm Cancellation"}</Button></div></section></div>;
}

function BookingDetailsPage({ bookingId, go, viewHome, scope="renter" }: RentalNavigation & {bookingId:number;scope?:BookingScope}) {
  const {user}=useAuth();const data=useApiData(()=>bookingService.get(bookingId,scope),`booking-${user?.id}-${scope}-${bookingId}`);
  const [pending,setPending]=useState(false);const [error,setError]=useState("");const [action,setAction]=useState<"approve"|"reject"|"cancel"|null>(null);const [reason,setReason]=useState("");
  if(data.loading)return <PageLoader/>;
  if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  const booking=data.data!;
  const mutate=async()=>{if(!action||pending||scope==="admin")return;setPending(true);setError("");try{await bookingService.action(booking.id,action,scope,reason);setAction(null);data.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  return <div className="booking-details-page"><button className="booking-back" onClick={()=>go(scope==="owner"?"Owner booking requests":scope==="admin"?"Admin bookings":"Bookings")}><Icon name="arrow"/> Back to Bookings</button><div className="booking-details-head"><div><p className="eyebrow">BOOKING {booking.code}</p><h1>Booking Details</h1><p>Review your property, rental dates, and booking progress.</p></div><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge></div>
    <section className="booking-property-summary"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={booking.property.image||rentalImage} alt=""/><div><small>RENTAL PROPERTY</small><h2>{booking.property.title||"Archived property"}</h2><p>{booking.property.location}</p><div className="summary-owner"><span className="avatar">{userInitials(booking.owner.name)}</span><p><small>PROPERTY OWNER</small><strong>{booking.owner.name}</strong></p></div></div><div className="summary-rent"><small>MONTHLY RENT</small><strong>{money(booking.monthlyRent,booking.currency)}</strong><span>/ month</span><Button variant="secondary" onClick={()=>viewHome(booking.property.id)}>View Property</Button></div></section>
    <section className="booking-info-section"><div className="dashboard-section-head"><h2>Booking Information</h2></div><div className="booking-info-grid">{[["Renter",booking.renter.name],["Start date",booking.startDate],["End date",booking.endDate],["Deposit",money(booking.depositAmount,booking.currency)],["Total amount",money(booking.totalAmount,booking.currency)]].map(item=><article key={item[0]}><small>{item[0]}</small><strong>{item[1]}</strong></article>)}</div><p>Rent is prorated using a 30-day month, plus the deposit. The end date is exclusive.</p>{booking.decisionReason&&<p>Decision: {booking.decisionReason}</p>}{booking.cancellationReason&&<p>Cancellation: {booking.cancellationReason}</p>}</section>
    <section className="booking-info-section"><h2>Booking History</h2><div className="activity-timeline">{booking.events?.map(event=><article key={event.id}><Icon name="calendar"/><div><strong>{statusLabel(event.status)}</strong><p>{event.reason||event.actorName}</p><small>{new Date(event.createdAt).toLocaleString()}</small></div></article>)}</div></section>
    <div className="modal-actions">{scope==="owner"&&booking.status==="pending"&&<><Button onClick={()=>{setAction("approve");setError("");}}>Approve</Button><Button variant="destructive" onClick={()=>{setAction("reject");setError("");}}>Reject</Button></>}{scope!=="admin"&&["pending","approved","confirmed"].includes(booking.status)&&<Button variant="secondary" onClick={()=>{setAction("cancel");setError("");}}>Cancel Booking</Button>}</div>
    {action&&<div className="modal-backdrop"><section className="modal owner-request-modal" role="dialog" aria-modal="true"><h2>{statusLabel(action)} booking?</h2><p className="modal-description">{booking.property.title} · {booking.startDate} – {booking.endDate}</p><label className="reject-reason"><span>Reason (optional)</span><textarea value={reason} onChange={e=>setReason(e.target.value)}/></label>{error&&<FormError message={error}/>}<div className="modal-actions"><Button variant="secondary" disabled={pending} onClick={()=>setAction(null)}>Keep Booking</Button><Button disabled={pending} variant={action==="approve"?"primary":"destructive"} onClick={()=>void mutate()}>{pending?"Saving...":`Confirm ${statusLabel(action)}`}</Button></div></section></div>}
  </div>;
}

function Messages({ viewHome, ownerMode = false, go }: { viewHome: (i: number) => void; ownerMode?: boolean; go?: (page:string)=>void }) {
  const {user}=useAuth();
  const list=useApiData(()=>workspaceService.conversations(),"conversations-"+user?.id);
  const [active,setActive]=useState<number|null>(()=>Number(sessionStorage.getItem("rentnest:conversation-id"))||null);
  const [draft,setDraft]=useState("");const [query,setQuery]=useState("");const [sending,setSending]=useState(false);const [error,setError]=useState("");
  const conversations=(list.data||[]).map(c=>({...c,owner:c.participantName,initials:userInitials(c.participantName),role:statusLabel(c.participantRole),blocked:!!c.disabledAt,time:new Date(c.updatedAt).toLocaleDateString()}));
  const current=conversations.find(c=>c.id===active)||null;
  const thread=useApiData(()=>active?workspaceService.messages(active):Promise.resolve([] as MessageRecord[]),"messages-"+user?.id+"-"+active);
  useEffect(()=>{if(active&&thread.data)void workspaceService.readMessages(active).then(()=>{list.reload();workspaceChanged();}).catch(e=>setError(authErrorMessage(e)));},[active,thread.data?.map(m=>m.id).join(",")]);
  useEffect(()=>{const timer=window.setInterval(()=>{list.reload();thread.reload();},10000);return()=>window.clearInterval(timer);},[list.reload,thread.reload]);
  const messageRows=(thread.data||[]).map(m=>({from:m.senderId===user?.id?"me":"them",text:m.text,time:new Date(m.sentAt).toLocaleString(),status:m.readAt?"Read":m.deliveredAt?"Delivered":"Sent"}));
  const unread=Object.fromEntries(conversations.map(c=>[c.id,c.unread]));
  const unreadTotal=conversations.reduce((sum,c)=>sum+c.unread,0);const loading=list.loading&&!list.data;
  const filtered=conversations.map(conversation=>({conversation,index:conversation.id})).filter(item=>
    (item.conversation.owner+" "+item.conversation.title).toLowerCase().includes(query.toLowerCase()));
  const selectConversation=(id:number)=>{setActive(id);sessionStorage.setItem("rentnest:conversation-id",String(id));setError("");};
  const send=async()=>{if(!current||!draft.trim()||sending||current.blocked)return;setSending(true);setError("");try{await workspaceService.sendMessage(current.id,draft.trim());setDraft("");thread.reload();list.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setSending(false);}};
  return <div className={`messages-page global-messaging-page ${ownerMode?"owner-messages-page":""}`}><div className="messages-page-head"><div><p className="eyebrow">{ownerMode?"OWNER COMMUNICATIONS":"RENTER MESSAGES"}</p><h1>Messages</h1><p>{ownerMode?"Manage renter conversations for all of your properties.":"Keep every property conversation in one secure place."}</p></div><Badge tone={unreadTotal?"warning":"neutral"}>{unreadTotal?`${unreadTotal} unread`:`${conversations.length} conversations`}</Badge></div>{error&&<FormError message={error}/>} {list.error?<RentalFailure error={list.error} retry={list.reload}/>:loading?<div className="messages message-loading"><aside><div className="skeleton loading-title" />{[0,1,2,3].map(i=><div className="loading-conversation" key={i}><span className="skeleton" /><div><i className="skeleton" /><i className="skeleton" /><i className="skeleton" /></div></div>)}</aside><section><span className="skeleton loading-chat-title" /><div className="skeleton loading-bubble one" /><div className="skeleton loading-bubble two" /><div className="skeleton loading-bubble three" /></section></div>:<div className={`messages ${active===null?"no-active":""}`}>
    <aside className="conversation-list"><div className="conversation-title"><strong>Conversations</strong><button className="icon-button"><Icon name="more" /></button></div><div className="message-search"><Icon name="search" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search conversations" /></div>
      {!conversations.length?<EmptyState icon="message" variant="messages" compact title="No conversations yet." description="Start a conversation with an owner about a property." actionLabel="Browse Properties" onAction={()=>go?.("Discover")}/>:<>{filtered.map(({conversation,index})=><button className={`conversation ${active===index?"active":""} ${conversation.blocked?"blocked":""}`} onClick={()=>selectConversation(index)} key={conversation.id}><span className="conversation-avatar"><span className="avatar">{conversation.initials}</span></span><span className="conversation-copy"><span><strong>{conversation.owner}</strong><time>{conversation.time}</time></span><span className={`conversation-role role-badge ${conversation.role.toLowerCase()}`}>{conversation.role}</span><b><img onError={event=>{event.currentTarget.src=rentalImage;}} src={conversation.image||rentalImage} alt="" />{conversation.title}</b><small>{conversation.preview}</small></span>{unread[index]>0&&<em>{unread[index]}</em>}</button>)}
      {!filtered.length&&<div className="conversation-search-empty"><Icon name="search"/><strong>No conversations found</strong></div>}</>}
    </aside>
    {current?<section className="chat"><div className="chat-header"><button className="mobile-chat-back" onClick={()=>setActive(null)}><Icon name="arrow" size={16} /></button><span className="avatar">{current.initials}</span><div><strong>{current.owner}</strong><small>{current.blocked?"Unavailable":"Conversation"} · <span className={`role-badge ${current.role.toLowerCase()}`}>{current.role}</span></small></div><button className="icon-button desktop-close-chat" onClick={()=>setActive(null)} aria-label="Close conversation">×</button></div>
      <div className="chat-property-bar"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={current.image||rentalImage} alt="" /><div><small>RELATED PROPERTY</small><strong>{current.title}</strong><span>{money(Number(current.monthlyRent),current.currency)} / month · {current.location}</span></div><Button variant="secondary" onClick={()=>viewHome(current.propertyId)}>View Property</Button></div>
      <div className="thread">{thread.loading?<p>Loading messages...</p>:thread.error?<RentalFailure error={thread.error} retry={thread.reload}/>:null}{current.blocked?<div className="blocked-conversation"><span><Icon name="lock" size={25}/></span><h3>This conversation is unavailable.</h3><p>Messaging has been disabled for this conversation. Contact RentNest support if you need assistance.</p></div>:messageRows.length?messageRows.map((message,i)=><div className={`message-wrap ${message.from}`} key={`${message.time}-${i}`}><div className={`bubble ${message.from==="me"?"mine":"theirs"}`}>{message.text}</div><div className="message-meta"><time>{message.time}</time>{message.from==="me"&&<span className={`message-status ${message.status?.toLowerCase()}`}>✓{message.status==="Read"&&"✓"} {message.status}</span>}</div></div>):<div className="no-messages"><span><Icon name="message" size={26} /></span><h3>No messages yet.</h3><p>Start the conversation.</p></div>}</div>
      {!current.blocked&&<><div className="typing-indicator"></div><form className="composer" onSubmit={e=>{e.preventDefault();send();}}><button type="button" className="icon-button" aria-label="Attachments are not supported" disabled><Icon name="paperclip" /></button><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write a message..." /><Button disabled={!draft.trim()||sending}>Send <Icon name="arrow" /></Button></form></>}
    </section>:<section className="chat-empty"><span><Icon name="message" size={32} /></span><h2>Select a conversation to start messaging</h2><p>Choose a property conversation from the list to view messages.</p></section>}
  </div>}</div>;
}

type AppNotification = { id:number; icon:IconName; title:string; message:string; time:string; read:boolean; tone:"success"|"warning"|"brand"|"neutral"; category:"Booking"|"Messages"|"Listings" };

function NotificationsPage({ go, notifications, markRead, markAll, loading, error, retry, dashboardPage }: { go:(page:string)=>void; notifications:AppNotification[]; markRead:(id:number)=>void; markAll:()=>void; loading:boolean; error?:Error; retry:()=>void; dashboardPage:string }) {
  type NotificationFilter="All"|"Unread"|"Booking"|"Messages"|"Listings";
  const [filter, setFilter] = useState<NotificationFilter>("All");
  const visible = notifications.filter(item=>filter==="All"||(filter==="Unread"&&!item.read)||item.category===filter);
  const unread = notifications.filter(item=>!item.read).length;
  if(error)return <RentalFailure error={error} retry={retry}/>;
  if(loading)return <div className="notification-center"><div className="notification-center-head"><div><p className="eyebrow">ACCOUNT UPDATES</p><h1>Notifications</h1><p>Loading your latest updates.</p></div></div><div className="notification-list notification-loading-list">{[0,1,2,3,4].map(index=><NotificationSkeleton key={index}/>)}</div></div>;
  return <div className="notification-center"><div className="notification-center-head"><div><p className="eyebrow">ACCOUNT UPDATES</p><h1>Notifications</h1><p>Stay informed about bookings, messages, and property activity.</p></div><Button variant="secondary" onClick={markAll} disabled={!unread}><span className="button-check">✓</span> Mark all as read</Button></div>
    <div className="notification-toolbar"><div className="notification-tabs">{(["All","Unread","Booking","Messages","Listings"] as NotificationFilter[]).map(value=><button className={filter===value?"active":""} onClick={()=>setFilter(value)} key={value}>{value} <span>{value==="All"?notifications.length:value==="Unread"?unread:notifications.filter(item=>item.category===value).length}</span></button>)}</div>{unread>0&&<p><i /> {unread} unread {unread===1?"notification":"notifications"}</p>}</div>
    {visible.length?<div className="notification-list"><div className="notification-list-label">{filter==="Unread"?"UNREAD UPDATES":filter==="All"?"RECENT UPDATES":`${filter.toUpperCase()} UPDATES`}</div>{visible.map(item=><article className={`notification-item ${item.read?"read":"unread"}`} key={item.id} onClick={()=>markRead(item.id)}><span className={`notification-type ${item.tone}`}><Icon name={item.icon} /></span><div><span className="notification-category">{item.category}</span><strong>{item.title}</strong><p>{item.message}</p><time>{item.time}</time></div>{!item.read&&<i className="unread-dot" />}<button className="icon-button" aria-label="Notification options"><Icon name="more" /></button></article>)}</div>
    :<EmptyState icon="bell" variant="notifications" title="No notifications yet." description={filter==="Unread"?"You're all caught up. New updates will appear here.":"Important account and platform updates will appear here."} actionLabel="Return to Dashboard" onAction={()=>go(dashboardPage)}/>}
  </div>;
}

function Owner({go,viewHome,editHome}:RentalNavigation&{editHome:(id:number)=>void}) {
  const {user}=useAuth();const data=useApiData(async()=>{const [properties,bookings]=await Promise.all([propertyService.list({limit:4},"owner"),bookingService.list({limit:4},"owner")]);return{properties,bookings};},`owner-dashboard-${user?.id}`);
  if(data.loading)return <div className="renter-summary">{[0,1,2,3].map(i=><DashboardCardSkeleton key={i}/>)}</div>;
  if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  const {properties,bookings}=data.data!;
  return <div className="owner-dashboard"><div className="owner-page-head"><div><p className="eyebrow">OWNER OVERVIEW</p><h1>Your property workspace</h1><p>Manage listings and review rental requests.</p></div><Button onClick={()=>go("Owner add property")}><Icon name="plus"/> Add Property</Button></div><section className="owner-summary">{[["building","Your Properties",properties.pagination.total],["calendar","Pending Requests",bookings.summary.pending||0],["calendar","Approved Bookings",(bookings.summary.approved||0)+(bookings.summary.confirmed||0)],["calendar","Total Bookings",bookings.pagination.total]].map((item,i)=><article key={String(item[1])}><div><span className={`owner-stat-icon owner-stat-${i}`}><Icon name={item[0] as IconName}/></span><small>{item[1]}</small></div><strong>{item[2]}</strong><p>Current records</p></article>)}</section><section className="owner-quick"><div className="owner-section-head"><h2>Quick Actions</h2></div><div>{[["plus","Add New Property","Owner add property"],["building","Manage Listings","Owner listings"],["calendar","View Requests","Owner booking requests"],["message","Messages","Owner messages"]].map(item=><button key={item[1]} onClick={()=>go(item[2])}><span><Icon name={item[0] as IconName}/></span><div><strong>{item[1]}</strong></div><Icon name="arrow"/></button>)}</div></section><div className="owner-dashboard-grid"><section className="owner-properties-section"><div className="owner-section-head"><h2>Your Properties</h2><Button variant="ghost" onClick={()=>go("Owner listings")}>Manage Listings</Button></div>{properties.items.length?<div className="owner-property-grid">{properties.items.map(property=><article className="owner-property-card" key={property.id}><div className="owner-property-image"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={property.images[0]?.url||rentalImage} alt=""/><Badge tone={statusTone(property.moderationStatus)}>{statusLabel(property.moderationStatus)}</Badge></div><div><h3>{property.title||"Untitled draft"}</h3><p>{property.location}</p><strong>{money(property.monthlyRent,property.currency)}</strong><div className="owner-property-actions"><button onClick={()=>editHome(property.id)}>Edit</button><button onClick={()=>viewHome(property.id)}>View</button></div></div></article>)}</div>:<EmptyState icon="building" variant="listings" title="You haven't created any listings." actionLabel="Create Listing" onAction={()=>go("Owner add property")}/>}</section><aside className="recent-activity"><h2>Booking Requests</h2>{bookings.items.length?bookings.items.map(booking=><article key={booking.id}><strong>{booking.renter.name}</strong><p>{booking.property.title}</p><Badge tone={statusTone(booking.status)}>{statusLabel(booking.status)}</Badge><Button variant="ghost" onClick={()=>go("Owner booking requests")}>Review requests</Button></article>):<EmptyState icon="calendar" compact title="No booking requests yet."/>}</aside></div></div>;
}

function OwnerListingsPage({go,viewHome,editHome,scope="owner"}:RentalNavigation&{editHome:(id:number)=>void;scope?:"owner"|"admin"}) {
  const {user}=useAuth();const [search,setSearch]=useState("");const [status,setStatus]=useState("");const [page,setPage]=useState(1);const [view,setView]=useState("table");
  const data=useApiData(()=>propertyService.list({search,status,page},scope),`listings-${user?.id}-${scope}-${search}-${status}-${page}`);
  const [selected,setSelected]=useState<Property|null>(null);const [action,setAction]=useState<"archive"|"approved"|"rejected"|null>(null);const [reason,setReason]=useState("");const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const mutate=async()=>{if(!selected||!action||pending)return;setPending(true);setError("");try{if(action==="archive")await propertyService.archive(selected.id);else await propertyService.moderate(selected.id,action,reason);setAction(null);setSelected(null);data.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  const buttons=(p:Property)=><div className="listing-row-actions"><button onClick={()=>viewHome(p.id)}>View Details</button>{scope==="owner"?<><button onClick={()=>editHome(p.id)}>Edit Listing</button><button onClick={()=>{setSelected(p);setAction("archive");setError("");}}>Archive</button></>:p.moderationStatus==="pending"&&<><button onClick={()=>{setSelected(p);setAction("approved");setError("");}}>Approve</button><button onClick={()=>{setSelected(p);setAction("rejected");setError("");setReason("");}}>Reject</button></>}</div>;
  return <div className="owner-listings-page"><div className="owner-listings-head"><div><p className="eyebrow">{scope==="admin"?"CONTENT MODERATION":"PROPERTY MANAGEMENT"}</p><h1>{scope==="admin"?"Listing Management":"My Listings"}</h1><p>Manage property availability and listing status.</p></div>{scope==="owner"&&<Button onClick={()=>go("Owner add property")}><Icon name="plus"/> Add Property</Button>}</div><div className="listings-toolbar"><label className="global-search"><Icon name="search"/><input placeholder="Search listings..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></label><select value={status} onChange={e=>{setStatus(e.target.value);setPage(1);}}><option value="">All Statuses</option>{["draft","pending","approved","rejected"].map(value=><option key={value} value={value}>{statusLabel(value)}</option>)}</select><div className="view-toggle"><button onClick={()=>setView("table")}>Table</button><button onClick={()=>setView("grid")}>Grid</button></div></div>
    {data.loading?<TableSkeleton/>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:data.data!.items.length?<>{view==="table"?<div className="listings-table"><div className="listings-table-head"><span>Property</span><span>Type</span><span>Price / month</span><span>Size</span><span>Status</span><span>Actions</span></div>{data.data!.items.map(p=><article key={p.id}><div className="listing-property-cell"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={p.images[0]?.url||rentalImage} alt=""/><div><strong>{p.title||"Untitled draft"}</strong><small>{p.location}{scope==="admin"&&` · ${p.owner.name}`}</small></div></div><span className="listing-type">{statusLabel(p.type)}</span><strong className="listing-price">{money(p.monthlyRent,p.currency)}</strong><span className="listing-size">{p.sizeSqft??"—"} sq ft</span><div className="listing-status"><Badge tone={statusTone(p.moderationStatus)}>{statusLabel(p.moderationStatus)}</Badge><small>{p.rejectionReason||(!p.available?"Unavailable":"")}</small></div>{buttons(p)}</article>)}</div>:<div className="owner-listing-grid">{data.data!.items.map(p=><article key={p.id}><div className="listing-grid-image"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={p.images[0]?.url||rentalImage} alt=""/><Badge>{statusLabel(p.moderationStatus)}</Badge></div><div className="listing-grid-body"><h3>{p.title||"Untitled draft"}</h3><p>{p.location}</p><strong>{money(p.monthlyRent,p.currency)}</strong>{buttons(p)}</div></article>)}</div>}<RentalPagination pagination={data.data!.pagination} onPage={setPage}/></>:<EmptyState icon="building" variant="listings" title="No listings found."/>}
    {action&&selected&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true"><h2>{action==="archive"?"Archive":action==="approved"?"Approve":"Reject"} listing?</h2><p className="modal-description">{selected.title}</p>{action==="rejected"&&<label className="reject-reason"><span>Rejection reason</span><textarea value={reason} onChange={e=>setReason(e.target.value)}/></label>}{error&&<FormError message={error}/>}<div className="modal-actions"><Button variant="secondary" disabled={pending} onClick={()=>setAction(null)}>Cancel</Button><Button disabled={pending} onClick={()=>void mutate()}>{pending?"Saving...":"Confirm"}</Button></div></section></div>}
  </div>;
}

function AddPropertyWizard({ go }: { go: (page:string)=>void }) {
  const catalog=useApiData(()=>propertyService.amenities(), "amenity-catalog");
  const [listingId,setListingId]=useState<number|null>(null);
  const [apiError,setApiError]=useState("");
  const [photoUrl,setPhotoUrl]=useState("");
  const saveLock=useRef(false);
  const saveListing=async(status:"draft"|"pending")=>{
    if(saveLock.current)return;saveLock.current=true;setSaving(true);setApiError("");
    try{
      const numeric=(value:string|boolean)=>String(value).trim()?Number(String(value).replace(/,/g,"")):null;
      const input:PropertyInput={title:String(fields.title)||null,description:String(fields.description)||null,location:String(fields.location)||null,type:fields.type as Property["type"],monthlyRent:numeric(fields.rent),depositAmount:numeric(fields.deposit),sizeSqft:numeric(fields.size),bedrooms:numeric(fields.bedrooms),bathrooms:numeric(fields.bathrooms),furnished:fields.furnished==="Yes",bachelorAllowed:Boolean(fields.bachelor),familyAllowed:Boolean(fields.family),images:[...photos.slice(primary,primary+1),...photos.filter((_,i)=>i!==primary)],amenityIds:(catalog.data||[]).filter(a=>amenities.includes(a.name)).map(a=>a.id),moderationStatus:status};
      const property=listingId?await propertyService.update(listingId,input):await propertyService.create(input);
      setListingId(property.id);if(status==="draft")setDraftSaved(true);else setSubmitted(true);workspaceChanged();
    }catch(error){setApiError(authErrorMessage(error));}finally{setSaving(false);saveLock.current=false;}
  };
  const steps = ["Basic Information","Property Details","Amenities","Photos","Preview & Submit"];
  const [step,setStep] = useState(0);
  const [fields,setFields] = useState<Record<string,string|boolean>>({title:"",location:"",type:"apartment",description:"",rent:"",deposit:"",size:"",bedrooms:"",bathrooms:"",furnished:"Yes",bachelor:true,family:true});
  const [amenities,setAmenities] = useState<string[]>([]);
  const [photos,setPhotos] = useState<string[]>([]);
  const [primary,setPrimary] = useState(0);
  const [attempted,setAttempted] = useState(false);

  const [draftSaved,setDraftSaved] = useState(false);
  const [submitted,setSubmitted] = useState(false);
  const [saving,setSaving] = useState(false);
  const setField = (key:string,value:string|boolean) => setFields(current=>({...current,[key]:value}));
  const valid = step===0 ? fields.title&&fields.location&&fields.description : step===1 ? fields.rent&&fields.size&&fields.bedrooms&&fields.bathrooms : true;
  const next = () => {setAttempted(true);if(valid){setStep(current=>Math.min(current+1,4));setAttempted(false);}};
  const addPhotos = () => {if(photoUrl.trim()&&photos.length<20){setPhotos(current=>[...current,photoUrl.trim()]);setPhotoUrl("");}};
  const movePhoto = (index:number,direction:number) => {const target=index+direction;if(target<0||target>=photos.length)return;setPhotos(items=>{const copy=[...items];[copy[index],copy[target]]=[copy[target],copy[index]];return copy;});if(primary===index)setPrimary(target);else if(primary===target)setPrimary(index);};
  if(submitted) return <div className="wizard-success"><div className="wizard-success-icon"><Icon name="building" size={34} /><span>✓</span></div><p className="eyebrow">SUBMISSION COMPLETE</p><h1>Your property has been submitted.</h1><p>Your listing is now in the moderation queue. We'll notify you as soon as an administrator reviews it.</p><div className="pending-approval-card"><Badge tone="warning">Pending Admin Approval</Badge><span>Most listings are reviewed within 24–48 hours.</span></div><div><Button variant="secondary" onClick={()=>go("Owner workspace")}>Back to Dashboard</Button><Button onClick={()=>go("Owner listings")}>View My Listings <Icon name="arrow" /></Button></div></div>;
  return <div className="property-wizard"><div className="wizard-head"><div><button className="wizard-back" onClick={()=>step?setStep(step-1):go("Owner listings")}><Icon name="arrow" size={15} /> {step?"Previous step":"Back to listings"}</button><p className="eyebrow">CREATE PROPERTY LISTING</p><h1>Add New Property</h1><p>Build a complete listing in a few guided steps.</p></div><Button variant="secondary" disabled={saving} onClick={()=>void saveListing("draft")}>{draftSaved?"✓ Draft saved":"Save as Draft"}</Button></div>
    <div className="wizard-progress">{steps.map((label,i)=><div className={`${i===step?"active":""} ${i<step?"complete":""}`} key={label}><span>{i<step?"✓":i+1}</span><p><small>STEP {i+1}</small><strong>{label}</strong></p>{i<steps.length-1&&<i />}</div>)}</div>
    {apiError&&<FormError message={apiError}/>}<div className="wizard-card"><div className="wizard-card-head"><span>0{step+1}</span><div><h2>{steps[step]}</h2><p>{["Tell renters where the property is and what makes it special.","Add pricing, space, and occupancy details.","Select everything renters can expect at the property.","Upload clear images and choose the primary listing photo.","Review the complete listing before sending it for approval."][step]}</p></div></div>
      {step===0&&<div className="wizard-form"><label className={attempted&&!fields.title?"invalid":""}><span>Property Title</span><input value={fields.title as string} onChange={e=>setField("title",e.target.value)} placeholder="e.g. Modern Apartment in Gulshan" />{attempted&&!fields.title&&<small>Property title is required</small>}</label><label className={attempted&&!fields.location?"invalid":""}><span>Location</span><input value={fields.location as string} onChange={e=>setField("location",e.target.value)} placeholder="Area, city" />{attempted&&!fields.location&&<small>Location is required</small>}</label><label><span>Property Type</span><select value={fields.type as string} onChange={e=>setField("type",e.target.value)}>{["room","studio","flat","apartment","office","parking"].map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</select></label><label className={`wide ${attempted&&!fields.description?"invalid":""}`}><span>Description</span><textarea value={fields.description as string} onChange={e=>setField("description",e.target.value)} placeholder="Describe the property, neighborhood, and ideal renter..." />{attempted&&!fields.description&&<small>Description is required</small>}</label></div>}
      {step===1&&<div className="wizard-form details-form"><label className={attempted&&!fields.rent?"invalid":""}><span>Monthly Rent</span><div className="prefixed-input"><b>৳</b><input value={fields.rent as string} onChange={e=>setField("rent",e.target.value)} placeholder="25,000" /></div>{attempted&&!fields.rent&&<small>Monthly rent is required</small>}</label><label><span>Security Deposit</span><div className="prefixed-input"><b>৳</b><input value={fields.deposit as string} onChange={e=>setField("deposit",e.target.value)} placeholder="Optional" /></div></label><label className={attempted&&!fields.size?"invalid":""}><span>Size</span><div className="suffixed-input"><input value={fields.size as string} onChange={e=>setField("size",e.target.value)} placeholder="1,200" /><b>sqft</b></div></label><label className={attempted&&!fields.bedrooms?"invalid":""}><span>Bedrooms</span><input type="number" value={fields.bedrooms as string} onChange={e=>setField("bedrooms",e.target.value)} placeholder="2" /></label><label className={attempted&&!fields.bathrooms?"invalid":""}><span>Bathrooms</span><input type="number" value={fields.bathrooms as string} onChange={e=>setField("bathrooms",e.target.value)} placeholder="2" /></label><fieldset><legend>Furnished</legend><div className="wizard-choice">{["Yes","No"].map(x=><button type="button" className={fields.furnished===x?"selected":""} onClick={()=>setField("furnished",x)} key={x}>{x}</button>)}</div></fieldset><fieldset className="wide"><legend>Allowed Tenants</legend><div className="allowed-options"><label><input type="checkbox" checked={fields.bachelor as boolean} onChange={e=>setField("bachelor",e.target.checked)} /> Bachelor Allowed</label><label><input type="checkbox" checked={fields.family as boolean} onChange={e=>setField("family",e.target.checked)} /> Family Allowed</label></div></fieldset></div>}
      {step===2&&catalog.loading&&<PageLoader/>}{step===2&&catalog.error&&<RentalFailure error={catalog.error} retry={catalog.reload}/>} {step===2&&<div className="amenity-selector">{(catalog.data||[]).map(a=>["settings",a.name]).map(item=><button className={amenities.includes(item[1])?"selected":""} onClick={()=>setAmenities(current=>current.includes(item[1])?current.filter(x=>x!==item[1]):[...current,item[1]])} key={item[1]}><span><Icon name={item[0] as IconName} /></span><strong>{item[1]}</strong><i>{amenities.includes(item[1])?"✓":"+"}</i></button>)}</div>}
      {step===3&&<div className="photo-step"><label className={`photo-uploader ${attempted&&!photos.length?"invalid":""}`} ><span><Icon name="plus" size={25}/></span><strong>Property photo URL</strong><input type="url" value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://..."/></label><Button type="button" variant="secondary" onClick={addPhotos}>Add Photo</Button><p>Use hosted image URLs. Up to 20 images.</p>{photos.length>0&&<div className="photo-preview-grid">{photos.map((photo,i)=><article className={primary===i?"primary":""} key={photo}><img onError={event=>{event.currentTarget.src=rentalImage;}} src={photo} alt={`Property upload ${i+1}`} />{primary===i&&<Badge>Primary photo</Badge>}<div><button onClick={()=>movePhoto(i,-1)}>←</button><button onClick={()=>setPrimary(i)}>Set primary</button><button onClick={()=>movePhoto(i,1)}>→</button><button className="delete" onClick={()=>setPhotos(items=>items.filter((_,index)=>index!==i))}>×</button></div></article>)}</div>}{attempted&&!photos.length&&<p className="upload-error">Add at least one property photo to continue.</p>}</div>}
      {step===4&&<div className="listing-preview"><div className="preview-gallery">{photos.length?<img onError={event=>{event.currentTarget.src=rentalImage;}} src={photos[primary]} alt="" />:<div><Icon name="building" /></div>}<Badge tone="warning">Pending Approval</Badge></div><div className="preview-content"><p className="eyebrow">{fields.type as string || "PROPERTY"}</p><h2>{fields.title as string || "Untitled property"}</h2><p className="location"><Icon name="pin" size={15} />{fields.location as string || "Location not provided"}</p><strong>৳{fields.rent as string || "0"} <small>/ month</small></strong><div className="preview-stats"><span>{fields.bedrooms as string || "0"} Beds</span><span>{fields.bathrooms as string || "0"} Baths</span><span>{fields.size as string || "0"} sqft</span><span>{fields.furnished as string==="Yes"?"Furnished":"Unfurnished"}</span></div><h3>About this property</h3><p>{fields.description as string || "No description provided."}</p><h3>Amenities</h3><div className="preview-amenities">{amenities.length?amenities.map(x=><span key={x}>✓ {x}</span>):<small>No amenities selected</small>}</div></div></div>}
      <div className="wizard-actions"><Button variant="secondary" onClick={()=>step?setStep(step-1):go("Owner listings")}>{step?"Back":"Cancel"}</Button>{step<4?<Button onClick={next}>Continue <Icon name="arrow" /></Button>:<LoadingButton loading={saving} loadingText="Saving..." onClick={()=>void saveListing("pending")}>Save Listing <Icon name="arrow" /></LoadingButton>}</div>
    </div>
  </div>;
}

function EditPropertyPage({propertyId,go}:{propertyId:number;go:(page:string)=>void}) {
 const {user}=useAuth();const data=useApiData(()=>propertyService.get(propertyId,"owner"),"edit-"+user?.id+"-"+propertyId);
 if(data.loading)return <PageLoader/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
 return <EditPropertyForm key={data.data!.updatedAt} property={data.data!} go={go} onSaved={data.reload}/>;
}
function EditPropertyForm({property,go,onSaved}:{property:Property;go:(page:string)=>void;onSaved:()=>void}) {
 const catalog=useApiData(()=>propertyService.amenities(),"edit-amenities");const [apiError,setApiError]=useState("");const [saving,setSaving]=useState(false);const saveLock=useRef(false);const [photoUrl,setPhotoUrl]=useState("");const [available,setAvailable]=useState(property.available);const [availableFrom,setAvailableFrom]=useState(property.availableFrom||"");
  const original = {title:property.title||"",description:property.description||"",location:property.location||"",type:property.type,price:String(property.monthlyRent??""),deposit:String(property.depositAmount??""),size:String(property.sizeSqft??""),bedrooms:String(property.bedrooms??""),bathrooms:String(property.bathrooms??"")};
  const [fields,setFields] = useState(original);
  const [open,setOpen] = useState({basic:true,details:true,amenities:true,photos:true});
  const [amenities,setAmenities] = useState<string[]>(property.amenities.map(a=>a.name));
  const [photos,setPhotos] = useState(property.images.map(i=>i.url));
  const [primary,setPrimary] = useState(0);
  const [confirmOpen,setConfirmOpen] = useState(false);
  const [saved,setSaved] = useState(false);
  const setField = (key:keyof typeof fields,value:string) => setFields(current=>({...current,[key]:value}));
  const importantChanged = fields.title!==original.title||fields.location!==original.location||fields.type!==original.type||fields.price!==original.price;
  const persist=async()=>{
 if(saveLock.current)return;saveLock.current=true;setSaving(true);setApiError("");
 try{const numeric=(value:string)=>value.trim()?Number(value.replace(/,/g,"")):null;await propertyService.update(property.id,{title:fields.title||null,description:fields.description||null,location:fields.location||null,type:fields.type as Property["type"],monthlyRent:numeric(fields.price),depositAmount:numeric(fields.deposit),sizeSqft:numeric(fields.size),bedrooms:numeric(fields.bedrooms),bathrooms:numeric(fields.bathrooms),available,availableFrom:availableFrom||null,images:[...photos.slice(primary,primary+1),...photos.filter((_,i)=>i!==primary)],amenityIds:catalog.data?catalog.data.filter(a=>amenities.includes(a.name)).map(a=>a.id):property.amenities.map(a=>a.id)});setConfirmOpen(false);onSaved();workspaceChanged();}catch(error){setApiError(authErrorMessage(error));}finally{setSaving(false);saveLock.current=false;}
 };
 const save = () => importantChanged?setConfirmOpen(true):void persist();
  const toggleSection = (key:keyof typeof open) => setOpen(current=>({...current,[key]:!current[key]}));
  return <div className="edit-property-page"><div className="edit-property-head"><div><button onClick={()=>go("Owner listings")}><Icon name="arrow" size={15} /> Back to Listings</button><p className="eyebrow">PROPERTY MANAGEMENT</p><h1>Edit Property</h1><p>Update listing details, amenities, and property photos.</p></div><div><Badge tone={statusTone(property.moderationStatus)}>{statusLabel(property.moderationStatus)}</Badge><small>Last saved {new Date(property.updatedAt).toLocaleString()}</small></div></div>
    {saved&&<div className="edit-save-toast"><span>✓</span><div><strong>Changes saved</strong><p>Your property listing has been updated.</p></div></div>}
    {apiError&&<FormError message={apiError}/>}<label className="auth-field"><span>Description</span><textarea value={fields.description} onChange={e=>setField("description",e.target.value)}/></label><label><input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)}/> Available for rental</label><label className="auth-field"><span>Available from</span><input type="date" value={availableFrom} onChange={e=>setAvailableFrom(e.target.value)}/></label><div className="edit-sections">
      <section className={`edit-card ${open.basic?"open":""}`}><button className="edit-card-head" onClick={()=>toggleSection("basic")}><span><Icon name="building" /></span><div><strong>Basic Information</strong><small>Property identity and location</small></div><Icon name="chevron" /></button>{open.basic&&<div className="edit-card-body edit-form-grid"><label><span>Title</span><input value={fields.title} onChange={e=>setField("title",e.target.value)} /></label><label><span>Location</span><input value={fields.location} onChange={e=>setField("location",e.target.value)} /></label><label><span>Type</span><select value={fields.type} onChange={e=>setField("type",e.target.value)}>{["room","studio","flat","apartment","office","parking"].map(x=><option key={x} value={x}>{statusLabel(x)}</option>)}</select></label></div>}</section>
      <section className={`edit-card ${open.details?"open":""}`}><button className="edit-card-head" onClick={()=>toggleSection("details")}><span><Icon name="settings" /></span><div><strong>Property Details</strong><small>Pricing, space, and room information</small></div><Icon name="chevron" /></button>{open.details&&<div className="edit-card-body edit-form-grid detail-fields"><label><span>Price / month</span><div className="prefixed-input"><b>৳</b><input value={fields.price} onChange={e=>setField("price",e.target.value)} /></div></label><label><span>Deposit</span><div className="prefixed-input"><b>৳</b><input value={fields.deposit} onChange={e=>setField("deposit",e.target.value)} /></div></label><label><span>Size</span><div className="suffixed-input"><input value={fields.size} onChange={e=>setField("size",e.target.value)} /><b>sqft</b></div></label><label><span>Bedrooms</span><input type="number" value={fields.bedrooms} onChange={e=>setField("bedrooms",e.target.value)} /></label><label><span>Bathrooms</span><input type="number" value={fields.bathrooms} onChange={e=>setField("bathrooms",e.target.value)} /></label></div>}</section>
      <section className={`edit-card ${open.amenities?"open":""}`}><button className="edit-card-head" onClick={()=>toggleSection("amenities")}><span><Icon name="star" /></span><div><strong>Amenities</strong><small>Features included with this property</small></div><Icon name="chevron" /></button>{open.amenities&&<div className="edit-card-body edit-amenities">{(catalog.data||[]).map(a=>["settings",a.name]).map(item=><button className={amenities.includes(item[1])?"selected":""} onClick={()=>setAmenities(current=>current.includes(item[1])?current.filter(x=>x!==item[1]):[...current,item[1]])} key={item[1]}><Icon name={item[0] as IconName} /><span>{item[1]}</span><i>{amenities.includes(item[1])?"✓":"+"}</i></button>)}</div>}</section>
      <section className={`edit-card ${open.photos?"open":""}`}><button className="edit-card-head" onClick={()=>toggleSection("photos")}><span><Icon name="eye" /></span><div><strong>Photos</strong><small>Manage the listing gallery and primary image</small></div><Icon name="chevron" /></button>{open.photos&&<div className="edit-card-body"><div className="edit-photo-toolbar"><p><strong>{photos.length} images</strong><small>Drag images to reorder or select a new primary image.</small></p><label><input type="url" value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="Photo URL"/><Button type="button" variant="secondary" onClick={()=>{if(photoUrl.trim()&&photos.length<20){setPhotos(current=>[...current,photoUrl.trim()]);setPhotoUrl("");}}}>Add Photo</Button></label></div><div className="edit-photo-grid">{photos.map((photo,i)=><article className={primary===i?"primary":""} key={`${photo}-${i}`}><img onError={event=>{event.currentTarget.src=rentalImage;}} src={photo} alt="" />{primary===i&&<Badge>Primary</Badge>}<div><button onClick={()=>setPrimary(i)}>{primary===i?"Primary image":"Make primary"}</button><button className="delete" onClick={()=>{setPhotos(items=>items.filter((_,index)=>index!==i));if(primary>=i)setPrimary(0);}}>Remove</button></div></article>)}</div></div>}</section>
    </div>
    <div className="edit-sticky-bar"><div>{importantChanged?<><i /><span><strong>Unsaved changes</strong><small>Important listing details have been modified.</small></span></>:<span><strong>All changes saved</strong><small>Your listing is up to date.</small></span>}</div><div><Button variant="secondary" onClick={()=>go("Owner listings")}>Cancel</Button><Button disabled={saving} onClick={save}>{saving?"Saving...":"Save Changes"}</Button></div></div>
    {confirmOpen&&<div className="modal-backdrop" onMouseDown={()=>setConfirmOpen(false)}><section className="modal change-warning-modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-icon danger"><Icon name="settings" /></div><h2>Confirm important changes</h2><p className="modal-description">You changed public listing details such as the title, location, type, or price. These updates may require another admin review.</p><div className="change-summary"><span><strong>Previous price</strong><small>৳{original.price}</small></span><Icon name="arrow" /><span><strong>Updated price</strong><small>৳{fields.price}</small></span></div><div className="modal-actions"><Button variant="secondary" onClick={()=>setConfirmOpen(false)}>Review Changes</Button><Button disabled={saving} onClick={()=>void persist()}>Confirm & Save</Button></div></section></div>}
  </div>;
}

function OwnerBookingDetailsPage({go,viewHome,bookingId}:RentalNavigation&{bookingId:number}) {return <BookingDetailsPage go={go} viewHome={viewHome} bookingId={bookingId} scope="owner"/>;}

function OwnerBookingRequestsPage({go,viewBooking}:{go:(page:string)=>void;viewBooking:(id:number)=>void}) {return <Bookings go={go} viewBooking={viewBooking} scope="owner"/>;}

function paymentStats(records:PaymentRecord[]) {
  const now=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit"}).format(new Date());
  const thisMonth=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dhaka",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).slice(0,7);
  const charges=records.filter(p=>p.currency==="BDT"&&p.status==="completed"&&p.recordType==="charge");
  const monthMap=new Map<string,number>();for(const p of charges){const key=(p.transactionAt||p.createdAt).slice(0,7);monthMap.set(key,(monthMap.get(key)||0)+Number(p.amount));}
  const months=Array.from(monthMap).sort(([a],[b])=>a.localeCompare(b)).slice(-6).map(([label,value])=>({label,value}));if(!months.length)months.push({label:now,value:0});
  return{completed:charges.reduce((sum,p)=>sum+Number(p.amount),0)-records.filter(p=>p.currency==="BDT"&&p.recordType==="refund"&&["completed","refunded"].includes(p.status)).reduce((sum,p)=>sum+Number(p.amount),0),month:charges.filter(p=>(p.transactionAt||p.createdAt).slice(0,7)===thisMonth).reduce((sum,p)=>sum+Number(p.amount),0),pending:records.filter(p=>p.currency==="BDT"&&["pending","processing"].includes(p.status)&&p.recordType==="charge").reduce((sum,p)=>sum+Number(p.amount),0),bookings:new Set(charges.map(p=>p.bookingId)).size,months,nextPayout:records.find(p=>p.recordType==="payout"&&["pending","processing"].includes(p.status))};
}
function exportPayments(records:{id:number|string;title:string|null;amount:number|string;status:string;currency:string}[]) {
 const rows=[["ID","Property","Amount","Currency","Status"],...records.map(p=>[String(p.id),p.title||"",String(p.amount),p.currency,p.status])];downloadCsvRows("rentnest-payments.csv",rows);
}
function downloadCsvRows(name:string,rows:string[][]){const csv=rows.map(row=>row.map(value=>'"'+(/^[=+@-]/.test(value)?"'":"")+value.replace(/"/g,'""')+'"').join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const link=document.createElement("a");link.href=url;link.download=name;link.click();URL.revokeObjectURL(url);}

function OwnerEarningsPage() {
  const {user}=useAuth();const data=useApiData(()=>workspaceService.payments("owner"),"owner-payments-"+user?.id);
  const stats=paymentStats(data.data||[]);
  const transactions=(data.data||[]).map(p=>({...p,date:(p.transactionAt||p.createdAt).slice(0,10),label:new Date(p.transactionAt||p.createdAt).toLocaleDateString(),renter:p.payerName||"Not recorded",initials:userInitials(p.payerName||""),amount:money(Number(p.amount),p.currency),status:statusLabel(p.status)}));
  const [property,setProperty]=useState("All properties");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const visible=transactions.filter(item=>(property==="All properties"||item.title===property)&&(!from||item.date>=from)&&(!to||item.date<=to));
  if(data.loading)return <TableSkeleton/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  return <div className="owner-earnings-page">
    <div className="earnings-head"><div><p className="eyebrow">FINANCIAL OVERVIEW</p><h1>Earnings</h1><p>Track rental income and payment activity across your properties.</p></div><Button variant="secondary" onClick={()=>exportPayments(transactions)}><Icon name="arrow" size={16} /> Export Statement</Button></div>
    <div className="earnings-summary">{[["star","Recorded Income",money(stats.completed),"Completed BDT charges less refunds"],["calendar","This Month",money(stats.month),"Completed BDT charges this month"],["building","Paid Bookings",String(stats.bookings),"Distinct bookings with recorded charges"],["more","Pending Payments",money(stats.pending),"Pending or processing records"]].map(item=><article key={item[1]}><span className="earnings-icon neutral"><Icon name={item[0] as IconName}/></span><div><small>{item[1]}</small><strong>{item[2]}</strong><p>{item[3]}</p></div></article>)}</div>
    <div className="earnings-overview-grid"><AnalyticsChart title="Income Overview" description="Recorded completed BDT charges by month" data={stats.months.map(m=>m.value)} labels={stats.months.map(m=>m.label)} type="bar" valueLabel={value=>money(value)}/><aside className="next-payout"><h2>Pending payouts</h2>{stats.nextPayout?<><strong>{money(Number(stats.nextPayout.amount),stats.nextPayout.currency)}</strong><p>{stats.nextPayout.title}</p><Badge tone="warning">{statusLabel(stats.nextPayout.status)}</Badge></>:<p>No pending payout records.</p>}</aside></div>
    <section className="transactions-section"><div className="transactions-head"><div><h2>Transactions</h2><p>{visible.length} payment records</p></div><div className="earnings-filters"><label><span>From</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label><label><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)} /></label><label><span>Property</span><select value={property} onChange={e=>setProperty(e.target.value)}><option>All properties</option>{Array.from(new Set(transactions.map(p=>p.title).filter(Boolean))).map(title=><option key={title!}>{title}</option>)}</select></label></div></div>
      {visible.length?<div className="earnings-table"><div className="earnings-table-head"><span>Date</span><span>Property</span><span>Renter</span><span>Amount</span><span>Status</span></div>{visible.map(item=><article key={item.id}><div><strong>{item.label}</strong><small>{item.id}</small></div><div className="earnings-property"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={item.image||rentalImage} alt="" /><span><strong>{item.title||"Not linked"}</strong><small>{item.location||""}</small></span></div><div className="earnings-renter"><span className="avatar">{item.initials}</span><strong>{item.renter}</strong></div><strong className="transaction-amount">{item.amount}</strong><Badge tone={item.status==="Completed"?"success":item.status==="Pending"||item.status==="Processing"?"warning":"danger"}>{item.status}</Badge></article>)}</div>:<div className="earnings-empty"><span><Icon name="star" size={28} /></span><h2>No earnings yet.</h2><p>No transactions match the selected date range and property.</p><Button variant="secondary" onClick={()=>{setFrom("");setTo("");setProperty("All properties");}}>Clear Filters</Button></div>}
    </section>
  </div>;
}

function Admin({go}:{go:(page:string)=>void}) {
  const {user}=useAuth();
  const data=useApiData(()=>workspaceService.overview(),"admin-overview-"+user?.id);
  const state=data.loading?"loading":data.error?"error":"ready";
  const activities=(data.data?.items||[]).map(log=>["calendar",log.action,log.description||"",new Date(log.createdAt).toLocaleString(),log.outcome==="failure"?"danger":log.outcome==="warning"?"warning":"success",String(log.id)]);
  if(state==="loading") return <div className="admin-dashboard admin-loading"><div className="skeleton admin-loading-head"/><div className="admin-loading-stats">{[0,1,2,3,4].map(i=><div className="skeleton" key={i}/>)}</div><div className="admin-loading-grid"><div className="skeleton"/><div className="skeleton"/></div></div>;
  if(state==="error") return <ErrorState type="server" title="Something went wrong on our side." description="We could not retrieve current platform data." primaryLabel="Try Again" onPrimary={data.reload}/>;
  return <div className="admin-dashboard"><div className="admin-dashboard-head"><div><p className="eyebrow">PLATFORM CONTROL CENTER</p><h1>Admin Dashboard</h1><p>Monitor platform performance, moderation queues, and operational health.</p></div><div className="admin-head-actions"><Button variant="secondary" onClick={()=>downloadCsvRows("rentnest-overview.csv",[["Metric","Value"],...Object.entries(data.data!.counts).map(([k,v])=>[k,String(v)])])}><Icon name="arrow" size={15}/> Export Report</Button><Button onClick={data.reload}><Icon name="settings" size={15}/> Refresh Data</Button></div></div>
    <section className="admin-overview-stats">{[
      ["users","TOTAL USERS",String(data.data!.counts.users),"Users","Current accounts","up"],
      ["building","TOTAL LISTINGS",String(data.data!.counts.listings),"Properties","Current listings","up"],
      ["bell","PENDING APPROVALS",String(data.data!.counts.pendingListings),"Listings","Needs review","attention"],
      ["calendar","ACTIVE BOOKINGS",String(data.data!.counts.activeBookings),"Reservations","Approved and confirmed","up"],
      ["star","TODAY'S ACTIVITY",String(data.data!.counts.activityToday),"Events","Live platform events","neutral"],
    ].map(item=><article key={item[1]}><span className={`admin-stat-icon ${item[5]}`}><Icon name={item[0] as IconName}/></span><div><small>{item[1]}</small><strong>{item[2]} <b>{item[3]}</b></strong><p className={item[5]}>{item[4]}</p></div></article>)}</section>
    <div className="admin-primary-grid"><section className="admin-activity-panel"><div className="admin-panel-head"><div><h2>Recent Activity</h2><p>Latest administrative and platform events</p></div><Button variant="ghost" onClick={()=>go("Admin logs")}>View Activity Log <Icon name="arrow" size={14}/></Button></div>{activities.length?<div className="admin-activity-feed">{activities.map((item,i)=><article key={item[5]}><span className={`admin-feed-icon ${item[4]}`}><Icon name={item[0] as IconName} size={16}/></span><div><strong>{item[1]}</strong><p>{item[2]}</p></div><time>{item[3]}</time>{i<activities.length-1&&<i/>}</article>)}</div>:<div className="admin-no-activity"><Icon name="bell"/><strong>No activity yet</strong><p>New platform events will appear here.</p></div>}</section>
      <section className="admin-activity-chart"><div className="admin-panel-head"><div><h2>Platform Activity</h2><p>Events processed today</p></div><Badge tone="success">Live</Badge></div><div className="admin-metric"><strong>{data.data!.counts.activityToday}</strong><span>Recorded events today</span></div><div className="admin-spark-bars" aria-label="Hourly platform activity chart" role="img">{Array.from({length:24},(_,hour)=>{const value=data.data!.hourly.find(h=>h.hour===hour)?.count||0;const max=Math.max(1,...data.data!.hourly.map(h=>h.count));return <i key={hour} style={{height:`${Math.max(2,value/max*100)}%`}} title={`${hour}:00 - ${value} events`}/>;})}</div><div className="admin-chart-legend"><span>00:00</span><span>12:00</span><span>Now</span></div></section></div>
    <section className="admin-quick-section"><div className="admin-section-heading"><h2>Quick Actions</h2><p>Common administrative workflows</p></div><div className="admin-quick-grid">{[
      ["building","Review Pending Listings",`${data.data!.counts.pendingListings} listings need moderation`,"Review queue","attention"],
      ["users","Manage Users","Search, verify, or restrict accounts","Open users","neutral"],
      ["star","View Reports","Financial and operational reports","Open reports","neutral"],
      ["calendar","Review Bookings","Resolve booking issues and disputes","Open bookings","neutral"],
    ].map((item,index)=><button key={item[1]} onClick={()=>go(["Admin listings","Admin users","Admin payments","Admin bookings"][index])}><span className={item[4]}><Icon name={item[0] as IconName}/></span><div><strong>{item[1]}</strong><p>{item[2]}</p><small>{item[3]} <Icon name="arrow" size={12}/></small></div></button>)}</div></section>
    <section className="admin-health"><div className="admin-section-heading"><h2>System Health</h2><p>Measured service availability and authenticated sessions</p></div><div className="admin-health-grid"><article><span className="health-status online"><i/></span><div><small>DATABASE STATUS</small><strong>{data.data!.database}</strong><p>{data.data!.databaseResponseMs} ms for overview queries</p></div></article><article><span className="health-status online"><i/></span><div><small>API STATUS</small><strong>Responding</strong><p>Overview request completed successfully</p></div></article><article><span className="health-status active"><Icon name="users" size={16}/></span><div><small>SIGNED-IN ACCOUNTS</small><strong>{data.data!.counts.signedInUsers}</strong><p>Accounts with unexpired, unrevoked sessions</p></div></article></div></section>
  </div>;
}

function AdminUserManagement() {
  const {user:account}=useAuth();
  const data=useApiData(()=>workspaceService.users(),"admin-users-"+account?.id);
  const users=(data.data||[]).map(u=>({...u,id:String(u.id),initials:userInitials(u.name),role:statusLabel(u.role),status:statusLabel(u.status),joined:u.createdAt.slice(0,10),joinedLabel:new Date(u.createdAt).toLocaleDateString()}));
  const [error,setError]=useState("");const [pending,setPending]=useState(false);
  const [search,setSearch]=useState(()=>sessionStorage.getItem("rentnest:admin-user-search")||"");
  const [roleFilter,setRoleFilter]=useState("All");
  const [statusFilter,setStatusFilter]=useState("All");
  const [joinedAfter,setJoinedAfter]=useState("");
  const [sort,setSort]=useState<"name"|"joined">("joined");
  const [ascending,setAscending]=useState(false);
  const [page,setPage]=useState(1);
  const [selected,setSelected]=useState<string[]>([]);
  const [menu,setMenu]=useState<string|null>(null);
  const [detail,setDetail]=useState<string|null>(null);
  const [banTarget,setBanTarget]=useState<string|null>(null);
  const [banReason,setBanReason]=useState("");
  const loading=data.loading;
  const pageSize=5;
  const filtered=users.filter(user=>(!search||`${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()))&&(roleFilter==="All"||user.role===roleFilter)&&(statusFilter==="All"||user.status===statusFilter)&&(!joinedAfter||user.joined>=joinedAfter)).sort((a,b)=>(ascending?1:-1)*(sort==="name"?a.name.localeCompare(b.name):a.joined.localeCompare(b.joined)));
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const selectedUser=users.find(user=>user.id===detail);
  const banningUser=users.find(user=>user.id===banTarget);
  const setStatus=async(id:string,status:string)=>{if(pending)return;setPending(true);setError("");try{await workspaceService.userStatus(Number(id),status.toLowerCase(),banReason);setMenu(null);setBanTarget(null);data.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  const bulkStatus=async(status:string)=>{if(pending)return;setPending(true);setError("");try{for(const id of selected)await workspaceService.userStatus(Number(id),status.toLowerCase());setSelected([]);}catch(e){setError(authErrorMessage(e));}finally{data.reload();workspaceChanged();setPending(false);}};
  const toggleSort=(value:"name"|"joined")=>{if(sort===value)setAscending(current=>!current);else{setSort(value);setAscending(true);}};
  const reset=()=>{setSearch("");setRoleFilter("All");setStatusFilter("All");setJoinedAfter("");setPage(1);};
  if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  return <div className="admin-users-page">{error&&<FormError message={error}/>}
    <div className="admin-users-head"><div><p className="eyebrow">ADMINISTRATION</p><h1>User Management</h1><p>Manage renters, owners, and administrators.</p></div><div><Badge tone="neutral">{users.length.toLocaleString()} users</Badge><Button disabled title="Administrator provisioning is not available here"><Icon name="plus" size={15}/> Add Administrator</Button></div></div>
    <section className="admin-user-filters"><label className="admin-user-search"><Icon name="search" size={16}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search users by name or email" /></label><label><span>Role</span><select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1);}}><option>All</option><option>Renter</option><option>Owner</option><option>Admin</option></select></label><label><span>Status</span><select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}><option>All</option><option>Active</option><option>Suspended</option><option>Banned</option></select></label><label><span>Joined after</span><input type="date" value={joinedAfter} onChange={e=>{setJoinedAfter(e.target.value);setPage(1);}} /></label><Button variant="ghost" onClick={reset}>Reset</Button></section>
    {selected.length>0&&<div className="admin-bulk-bar"><span><strong>{selected.length}</strong> users selected</span><select defaultValue="" onChange={e=>{if(e.target.value)bulkStatus(e.target.value);}}><option value="" disabled>Bulk actions</option><option value="Active">Restore access</option><option value="Suspended">Suspend users</option><option value="Banned">Ban users</option></select><button onClick={()=>setSelected([])}>Clear selection</button></div>}
    <section className="admin-users-table-wrap">{loading?<TableSkeleton rows={5}/>:visible.length?<><div className="admin-users-table-head"><input type="checkbox" aria-label="Select all visible users" checked={visible.every(user=>selected.includes(user.id))} onChange={e=>setSelected(e.target.checked?[...new Set([...selected,...visible.map(user=>user.id)])]:selected.filter(id=>!visible.some(user=>user.id===id)))} /><span>Avatar</span><button onClick={()=>toggleSort("name")}>Name {sort==="name"&&(ascending?"↑":"↓")}</button><span>Email</span><span>Role</span><span>Status</span><button onClick={()=>toggleSort("joined")}>Joined Date {sort==="joined"&&(ascending?"↑":"↓")}</button><span>Actions</span></div><div className="admin-users-table">{visible.map(user=><article key={user.id}><input type="checkbox" aria-label={`Select ${user.name}`} checked={selected.includes(user.id)} onChange={()=>setSelected(current=>current.includes(user.id)?current.filter(id=>id!==user.id):[...current,user.id])}/><span className="avatar">{user.initials}</span><div className="admin-user-name"><strong>{user.name}</strong><small>{user.id}</small></div><span className="admin-user-email">{user.email}</span><span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span><Badge tone={user.status==="Active"?"success":user.status==="Suspended"?"warning":"danger"}>{user.status}</Badge><span className="admin-joined">{user.joinedLabel}</span><div className="admin-row-menu"><button className="icon-button" onClick={()=>setMenu(menu===user.id?null:user.id)} aria-label={`Actions for ${user.name}`}><Icon name="more"/></button>{menu===user.id&&<div><button onClick={()=>{setDetail(user.id);setMenu(null);}}><Icon name="eye" size={14}/> View Details</button>{user.status==="Active"&&<button disabled={pending||user.role==="Admin"} onClick={()=>void setStatus(user.id,"Suspended")}><Icon name="lock" size={14}/> Suspend User</button>}{user.status!=="Banned"?<button className="danger" onClick={()=>{setBanTarget(user.id);setBanReason("");setMenu(null);}}><Icon name="users" size={14}/> Ban User</button>:<button disabled={pending||user.role==="Admin"} onClick={()=>void setStatus(user.id,"Active")}><Icon name="users" size={14}/> Unban User</button>}{user.status==="Suspended"&&<button disabled={pending||user.role==="Admin"} onClick={()=>void setStatus(user.id,"Active")}><Icon name="settings" size={14}/> Restore Access</button>}</div>}</div></article>)}</div><div className="admin-pagination"><p>Showing <strong>{(page-1)*pageSize+1}–{Math.min(page*pageSize,filtered.length)}</strong> of <strong>{filtered.length}</strong> users</p><div><Button variant="secondary" disabled={page===1} onClick={()=>setPage(page-1)}>Previous</Button>{Array.from({length:pageCount},(_,i)=>i+1).map(number=><button className={page===number?"active":""} onClick={()=>setPage(number)} key={number}>{number}</button>)}<Button variant="secondary" disabled={page===pageCount} onClick={()=>setPage(page+1)}>Next</Button></div></div></>:<div className="admin-users-empty"><span><Icon name="users" size={28}/></span><h2>No users found</h2><p>Try changing your search terms or user filters.</p><Button variant="secondary" onClick={reset}>Clear Filters</Button></div>}</section>
    {selectedUser&&<div className="admin-drawer-backdrop" role="presentation" onMouseDown={()=>setDetail(null)}><aside className="admin-user-drawer" role="dialog" aria-modal="true" aria-label={`User details for ${selectedUser.name}`} onMouseDown={e=>e.stopPropagation()}><div className="admin-drawer-title"><div><p className="eyebrow">USER INSPECTION</p><h2>User Details</h2></div><button className="icon-button" onClick={()=>setDetail(null)} aria-label="Close drawer">×</button></div>
      <header className="admin-drawer-profile"><span className="avatar">{selectedUser.initials}</span><div><h3>{selectedUser.name}</h3><p>{selectedUser.id}</p><span><span className={`role-badge ${selectedUser.role.toLowerCase()}`}>{selectedUser.role}</span><Badge tone={selectedUser.status==="Active"?"success":selectedUser.status==="Suspended"?"warning":"danger"}>{selectedUser.status}</Badge></span></div></header>
      <section className="admin-drawer-section"><div className="admin-drawer-section-head"><h3>User Information</h3><p>Personal and account details</p></div><dl className="admin-user-information"><div><dt>Full Name</dt><dd>{selectedUser.name}</dd></div><div><dt>Username</dt><dd>@{selectedUser.username}</dd></div><div><dt>Email</dt><dd>{selectedUser.email}</dd></div><div><dt>Phone</dt><dd>{selectedUser.phone||"Not provided"}</dd></div><div><dt>Account Created</dt><dd>{selectedUser.joinedLabel}</dd></div><div><dt>Role</dt><dd>{selectedUser.role}</dd></div><div><dt>Status</dt><dd>{selectedUser.status}</dd></div></dl></section>
      <section className="admin-drawer-section"><div className="admin-drawer-section-head"><h3>Activity Summary</h3><p>Platform engagement at a glance</p></div><div className="admin-user-activity-grid"><article><span><Icon name="building" size={16}/></span><small>PROPERTIES CREATED</small><strong>{selectedUser.properties}</strong></article><article><span><Icon name="calendar" size={16}/></span><small>BOOKINGS MADE</small><strong>{selectedUser.bookings}</strong></article><article><span><Icon name="message" size={16}/></span><small>MESSAGES SENT</small><strong>{selectedUser.messages}</strong></article><article><span><Icon name="star" size={16}/></span><small>ACCOUNT ACTIVITY</small><strong>{selectedUser.status==="Active"?"Active":"Restricted"}</strong></article></div></section>
      <section className="admin-drawer-actions"><div className="admin-drawer-section-head"><h3>Admin Actions</h3><p>Changes take effect immediately</p></div><div>{selectedUser.status!=="Suspended"&&selectedUser.status!=="Banned"&&<Button variant="secondary" disabled={pending||selectedUser.role==="Admin"} onClick={()=>void setStatus(selectedUser.id,"Suspended")}><Icon name="lock" size={15}/> Suspend User</Button>}{selectedUser.status!=="Banned"?<Button variant="destructive" onClick={()=>{setBanTarget(selectedUser.id);setBanReason("");}}><Icon name="users" size={15}/> Ban User</Button>:<Button disabled={pending||selectedUser.role==="Admin"} onClick={()=>void setStatus(selectedUser.id,"Active")}><Icon name="users" size={15}/> Unban User</Button>}</div></section>
      <footer className="admin-drawer-footer"><Button variant="secondary" onClick={()=>setDetail(null)}>Close Drawer</Button></footer>
    </aside></div>}
    {banningUser&&<ConfirmationModal type="ban" title="Ban this user?" description="The user will lose access to RentNest until an administrator removes the ban." confirmLabel="Confirm Ban" onCancel={()=>setBanTarget(null)} onConfirm={()=>void setStatus(banningUser.id,"Banned")} reason={banReason} onReasonChange={setBanReason} reasonLabel="Reason for ban"><div className="confirmation-user"><span className="avatar">{banningUser.initials}</span><div><small>{banningUser.role.toUpperCase()}</small><strong>{banningUser.name}</strong><span>{banningUser.email}</span></div><Badge tone={banningUser.status==="Active"?"success":"warning"}>{banningUser.status}</Badge></div></ConfirmationModal>}
  </div>;
}

function AdminListingManagement({go,viewHome}:RentalNavigation) {
  const {user}=useAuth();const [status,setStatus]=useState("");const [type,setType]=useState("");const [createdAfter,setCreatedAfter]=useState("");const [page,setPage]=useState(1);
  const data=useApiData(()=>propertyService.list({status,type,createdAfter,page},"admin"),`admin-properties-${user?.id}-${status}-${type}-${createdAfter}-${page}`);
  const queue=useApiData(()=>propertyService.list({status:"pending",limit:1},"admin"),`admin-queue-${user?.id}-${data.data?.items.map(p=>p.updatedAt).join(",")}`);
  const [review,setReview]=useState<Property|null>(null);const [action,setAction]=useState<"approved"|"rejected"|null>(null);const [reason,setReason]=useState("");const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const decide=async()=>{if(!review||!action||pending)return;setPending(true);setError("");try{await propertyService.moderate(review.id,action,reason);setAction(null);setReview(null);data.reload();workspaceChanged();queue.reload();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  return <div className="admin-listings-page"><div className="admin-listings-head"><div><p className="eyebrow">CONTENT MODERATION</p><h1>Listing Management</h1><p>Review and approve property submissions.</p></div><div className="moderation-queue"><span>{queue.loading?"—":queue.data?.pagination.total??"—"}</span><p><strong>Pending review</strong><small>Requires a decision</small></p></div></div><section className="admin-listing-filters"><div className="admin-listing-status-tabs">{["","pending","approved","rejected","draft"].map(value=><button key={value} className={status===value?"active":""} onClick={()=>{setStatus(value);setPage(1);}}>{value?statusLabel(value):"All"}</button>)}</div><label><span>Property Type</span><select value={type} onChange={e=>{setType(e.target.value);setPage(1);}}><option value="">All types</option>{["room","studio","flat","apartment","office","parking"].map(value=><option key={value} value={value}>{statusLabel(value)}</option>)}</select></label><label><span>Created after</span><input type="date" value={createdAfter} onChange={e=>{setCreatedAfter(e.target.value);setPage(1);}}/></label></section>
    {data.loading?<TableSkeleton/>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:data.data!.items.length?<><section className="admin-listings-table-wrap"><div className="admin-listings-table-head"><span>Property</span><span>Title</span><span>Owner Name</span><span>Location</span><span>Type</span><span>Price</span><span>Created</span><span>Status</span><span>Actions</span></div><div className="admin-listings-table">{data.data!.items.map(p=><article key={p.id}><img onError={event=>{event.currentTarget.src=rentalImage;}} src={p.images[0]?.url||rentalImage} alt=""/><div className="moderation-title"><strong>{p.title||"Untitled draft"}</strong><small>#{p.id}</small></div><div className="moderation-owner"><span className="avatar">{userInitials(p.owner.name)}</span><strong>{p.owner.name}</strong></div><span className="moderation-location">{p.location||"—"}</span><span>{statusLabel(p.type)}</span><strong className="moderation-price">{money(p.monthlyRent,p.currency)}</strong><span className="moderation-date">{new Date(p.createdAt).toLocaleDateString()}</span><Badge tone={statusTone(p.moderationStatus)}>{statusLabel(p.moderationStatus)}</Badge><div className="moderation-actions"><button onClick={()=>{setReview(p);setAction(null);setError("");}}><Icon name="eye"/> View</button>{p.moderationStatus==="pending"&&<><button className="approve" onClick={()=>{setReview(p);setAction("approved");setError("");}}>Approve</button><button className="reject" onClick={()=>{setReview(p);setAction("rejected");setError("");setReason("");}}>Reject</button></>}</div></article>)}</div></section><RentalPagination pagination={data.data!.pagination} onPage={setPage}/></>:<EmptyState icon="building" title="No listings found."/>}
    {review&&!action&&<div className="admin-drawer-backdrop" onMouseDown={()=>setReview(null)}><aside className="admin-listing-drawer" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><div className="admin-drawer-title"><div><p className="eyebrow">LISTING REVIEW · {review.id}</p><h2>Review Submission</h2></div><button className="icon-button" onClick={()=>setReview(null)}>×</button></div><div className="moderation-gallery"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={review.images[0]?.url||rentalImage} alt=""/><div>{review.images.slice(1).map(image=><img onError={event=>{event.currentTarget.src=rentalImage;}} key={image.id} src={image.url} alt=""/>)}</div></div><div className="listing-drawer-content"><div className="listing-review-title"><div><h2>{review.title||"Untitled draft"}</h2><p>{review.location}</p></div><Badge>{statusLabel(review.moderationStatus)}</Badge></div><section className="listing-owner-review"><span className="avatar">{userInitials(review.owner.name)}</span><div><small>PROPERTY OWNER</small><strong>{review.owner.name}</strong></div></section><section className="listing-review-section"><h3>Description</h3><p>{review.description||"No description provided."}</p></section><section className="listing-review-section"><h3>Property Details</h3><div className="listing-review-facts"><span><small>TYPE</small><strong>{statusLabel(review.type)}</strong></span><span><small>MONTHLY PRICE</small><strong>{money(review.monthlyRent,review.currency)}</strong></span><span><small>DETAILS</small><strong>{toHome(review).meta}</strong></span></div></section><section className="listing-review-section"><h3>Amenities</h3><div className="amenity-chips">{review.amenities.length?review.amenities.map(a=><span key={a.id}>{a.name}</span>):<span>No amenities listed</span>}</div></section></div><footer className="listing-drawer-actions"><Button variant="secondary" onClick={()=>viewHome(review.id)}>View Property</Button>{review.moderationStatus==="pending"&&<><Button variant="destructive" onClick={()=>{setAction("rejected");setReason("");}}>Reject Listing</Button><Button onClick={()=>setAction("approved")}>Approve Listing</Button></>}</footer></aside></div>}
    {review&&action&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true"><h2>{action==="approved"?"Approve":"Reject"} listing?</h2><p className="modal-description">{review.title}</p>{action==="rejected"&&<label className="reject-reason"><span>Rejection reason</span><textarea value={reason} onChange={e=>setReason(e.target.value)}/></label>}{error&&<FormError message={error}/>}<div className="modal-actions"><Button variant="secondary" disabled={pending} onClick={()=>setAction(null)}>Cancel</Button><Button disabled={pending} onClick={()=>void decide()}>{pending?"Saving...":"Confirm"}</Button></div></section></div>}
  </div>;
}

function AdminBookingManagement({go,viewHome}:RentalNavigation) {const [selected,setSelected]=useState<number|null>(()=>Number(sessionStorage.getItem("rentnest:admin-booking-id"))||null);const choose=(id:number|null)=>{setSelected(id);if(id)sessionStorage.setItem("rentnest:admin-booking-id",String(id));else sessionStorage.removeItem("rentnest:admin-booking-id");};return selected?<BookingDetailsPage bookingId={selected} scope="admin" go={()=>choose(null)} viewHome={viewHome}/>:<Bookings scope="admin" go={go} viewBooking={id=>choose(id)}/>;}

function AdminPaymentsReports() {
  const {user}=useAuth();const data=useApiData(()=>workspaceService.payments("admin"),"admin-payments-"+user?.id);
  const stats=paymentStats(data.data||[]);
  const transactions=(data.data||[]).map(p=>({...p,id:String(p.id),user:p.payerName||"Not recorded",initials:userInitials(p.payerName||""),userType:statusLabel(p.payerRole||"unknown"),amount:money(Number(p.amount),p.currency),numeric:Number(p.amount),status:statusLabel(p.status),date:(p.transactionAt||p.createdAt).slice(0,10),dateLabel:new Date(p.transactionAt||p.createdAt).toLocaleDateString()}));
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [status,setStatus]=useState("All statuses");
  const [userType,setUserType]=useState("All user types");
  const [notice,setNotice]=useState("");
  const visible=transactions.filter(item=>(status==="All statuses"||item.status===status)&&(userType==="All user types"||item.userType===userType)&&(!from||item.date>=from)&&(!to||item.date<=to));
  const completed=transactions.filter(item=>item.status==="Completed");
  const tone=(value:string):"success"|"warning"|"danger"|"neutral"=>value==="Completed"?"success":value==="Pending"?"warning":value==="Failed"?"danger":"neutral";
  const notify=(message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(""),2200);};
  const downloadCsv=()=>{const rows=[["Transaction ID","User","User Type","Property","Amount","Status","Date"],...visible.map(item=>[item.id,item.user,item.userType,(item.title||"Not linked"),String(item.numeric),item.status,item.date])];const csv=rows.map(row=>row.map(value=>`"${value.replace(/"/g,'""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const link=document.createElement("a");link.href=url;link.download="rentnest-transactions.csv";link.click();URL.revokeObjectURL(url);notify("CSV report downloaded");};
  if(data.loading)return <TableSkeleton/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  return <div className="admin-finance-page">{notice&&<div className="admin-report-toast"><Icon name="settings" size={15}/>{notice}</div>}<div className="admin-finance-head"><div><p className="eyebrow">FINANCIAL OPERATIONS</p><h1>Payments & Reports</h1><p>Monitor platform revenue, settlements, and transaction activity.</p></div><div><Button variant="secondary" onClick={downloadCsv}><Icon name="arrow" size={14}/> Export Report</Button><Button variant="secondary" onClick={()=>window.print()}><Icon name="paperclip" size={14}/> Generate PDF</Button><Button onClick={downloadCsv}><Icon name="arrow" size={14}/> Download CSV</Button></div></div>
    <section className="admin-finance-summary">{[["star","RECORDED VOLUME",money(stats.completed),"Completed BDT charges less refunds"],["calendar","MONTHLY VOLUME",money(stats.month),"Recorded completed charges"],["settings","COMPLETED TRANSACTIONS",String(completed.length),"Completed payment records"],["more","PENDING PAYMENTS",money(stats.pending),"Pending and processing records"]].map(item=><article key={item[1]}><span className="admin-finance-icon neutral"><Icon name={item[0] as IconName}/></span><div><small>{item[1]}</small><strong>{item[2]}</strong><p>{item[3]}</p></div></article>)}</section>
    <div className="admin-finance-overview"><AnalyticsChart title="Revenue Performance" description="Recorded completed BDT charges by month" data={stats.months.map(m=>m.value)} labels={stats.months.map(m=>m.label)} type="bar" valueLabel={value=>money(value)}/><aside className="admin-settlement-card"><h2>Payment Distribution (BDT)</h2><ul>{["completed","pending","processing","failed","refunded"].map(status=><li key={status}><span>{statusLabel(status)}</span><strong>{money((data.data||[]).filter(p=>p.currency==="BDT"&&p.status===status).reduce((sum,p)=>sum+Number(p.amount),0))}</strong></li>)}</ul></aside></div>
    <section className="admin-transactions-panel"><div className="admin-transactions-toolbar"><div><h2>Transactions</h2><p>{visible.length} financial records</p></div><div><label><span>From</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><label><span>Payment Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option><option>Completed</option><option>Pending</option><option>Processing</option><option>Failed</option><option>Refunded</option></select></label><label><span>User Type</span><select value={userType} onChange={e=>setUserType(e.target.value)}><option>All user types</option><option>Renter</option><option>Owner</option><option>Admin</option></select></label></div></div>{visible.length?<><div className="admin-transactions-head"><span>Transaction ID</span><span>User</span><span>Property</span><span>Amount</span><span>Payment Status</span><span>Date</span></div><div className="admin-transactions-table">{visible.map(item=><article key={item.id}><strong>{item.id}</strong><div className="finance-user"><span className="avatar">{item.initials}</span><p><strong>{item.user}</strong><small>{item.userType}</small></p></div><div className="finance-property"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={item.image||rentalImage} alt=""/><p><strong>{(item.title||"Not linked")}</strong><small>{item.location||""}</small></p></div><strong className="finance-amount">{item.amount}</strong><Badge tone={tone(item.status)}>{item.status}</Badge><span className="finance-date">{item.dateLabel}</span></article>)}</div></>:<div className="admin-finance-empty"><Icon name="star" size={28}/><h2>No transactions found</h2><p>Adjust the date, status, or user-type filters.</p><Button variant="secondary" onClick={()=>{setFrom("");setTo("");setStatus("All statuses");setUserType("All user types");}}>Clear Filters</Button></div>}</section>
  </div>;
}

function AnalyticsChart({title,description,data,labels,type,valueLabel}:{title:string;description:string;data:number[];labels:string[];type:"line"|"bar";valueLabel:(value:number)=>string}) {
  const max=Math.max(1,...data)*1.12;
  const points=data.map((value,index)=>`${index*(100/Math.max(1,data.length-1))},${92-(value/max)*72}`).join(" ");
  return <section className="analytics-chart-card"><div className="analytics-chart-head"><div><h2>{title}</h2><p>{description}</p></div><Badge tone="neutral">Recorded data</Badge></div><div className={`analytics-visual ${type}`} role="img" aria-label={`${title}: ${data.map(valueLabel).join(", ")}`}><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g className="analytics-grid-lines"><line x1="0" y1="20" x2="100" y2="20"/><line x1="0" y1="44" x2="100" y2="44"/><line x1="0" y1="68" x2="100" y2="68"/><line x1="0" y1="92" x2="100" y2="92"/></g>{type==="line"?<><polygon className="analytics-area" points={`0,92 ${points} 100,92`}/><polyline className="analytics-line" points={points}/>{data.map((value,index)=><circle key={index} cx={index*(100/Math.max(1,data.length-1))} cy={92-(value/max)*72} r="1.5"><title>{valueLabel(value)}</title></circle>)}</>:data.map((value,index)=>{const width=70/data.length;const height=(value/max)*72;return <rect key={index} x={index*(100/data.length)+4} y={92-height} width={width} height={height} rx="1"><title>{valueLabel(value)}</title></rect>;})}</svg></div><div className="analytics-axis">{labels.map(label=><span key={label}>{label}</span>)}</div><div className="analytics-chart-summary"><span><small>PERIOD TOTAL</small><strong>{valueLabel(data.reduce((sum,value)=>sum+value,0))}</strong></span><span><small>AVERAGE</small><strong>{valueLabel(Math.round(data.reduce((sum,value)=>sum+value,0)/data.length))}</strong></span><span><small>PEAK</small><strong>{valueLabel(Math.max(...data))}</strong></span></div></section>;
}

function AdminAnalytics() {
  type Range="Today"|"This Week"|"This Month"|"This Year";
  const [range,setRange]=useState<Range>("This Month");
  const {user}=useAuth();const data=useApiData(()=>workspaceService.analytics(range),"analytics-"+user?.id+"-"+range);
  if(data.loading)return <TableSkeleton/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  const result=data.data!;const labels=Array.from(new Set(Object.values(result.series).flat().map(p=>p.day))).sort();if(!labels.length)labels.push(result.end);
  const values=(key:keyof typeof result.series)=>labels.map(day=>Number(result.series[key].find(p=>p.day===day)?.value||0));
  const users=values("users"),listings=values("listings"),bookings=values("bookings"),revenue=values("revenue");
  const current={labels,users,listings,bookings,revenue,metrics:[String(result.totalUsers),String(users.reduce((a,b)=>a+b,0)),String(listings.reduce((a,b)=>a+b,0)),String(bookings.reduce((a,b)=>a+b,0)),money(revenue.reduce((a,b)=>a+b,0))]};
  const metricData=[["users","TOTAL USERS","Platform accounts"],["plus","NEW USERS",`Added during ${range.toLowerCase()}`],["building","NEW LISTINGS","Submitted properties"],["calendar","BOOKINGS","Reservations created"],["star","REVENUE","Processed volume"]];
  return <div className="admin-analytics-page"><div className="admin-analytics-head"><div><p className="eyebrow">BUSINESS INTELLIGENCE</p><h1>Analytics Dashboard</h1><p>Understand platform growth, engagement, and financial performance.</p></div><div className="analytics-range">{(["Today","This Week","This Month","This Year"] as Range[]).map(value=><button className={range===value?"active":""} onClick={()=>setRange(value)} key={value}>{value}</button>)}</div></div>
    <section className="analytics-metrics">{metricData.map((item,index)=><article key={item[1]}><span><Icon name={item[0] as IconName}/></span><div><small>{item[1]}</small><strong>{current.metrics[index]}</strong><p>{item[2]}</p></div></article>)}</section>
    <div className="analytics-chart-grid"><AnalyticsChart title="User Growth" description={`New account acquisition · ${range}`} data={current.users} labels={current.labels} type="line" valueLabel={value=>value.toLocaleString()}/><AnalyticsChart title="Listing Growth" description={`Property submissions · ${range}`} data={current.listings} labels={current.labels} type="bar" valueLabel={value=>value.toLocaleString()}/><AnalyticsChart title="Booking Trend" description={`Reservations created · ${range}`} data={current.bookings} labels={current.labels} type="bar" valueLabel={value=>value.toLocaleString()}/><AnalyticsChart title="Revenue" description={`Completed BDT charge volume · ${range}`} data={current.revenue} labels={current.labels} type="line" valueLabel={value=>money(value)}/></div>
  </div>;
}

function AdminActivityLogs() {
  const {user}=useAuth();const data=useApiData(()=>workspaceService.activity(),"activity-"+user?.id);
  const logs=(data.data||[]).map(l=>({id:String(l.id),timestamp:l.createdAt,date:l.createdAt.slice(0,10),dateLabel:new Date(l.createdAt).toLocaleDateString(),time:new Date(l.createdAt).toLocaleTimeString(),actor:l.actorName||"System",initials:userInitials(l.actorName||"System"),actorType:statusLabel(l.actorRole||"system"),action:l.action,type:statusLabel(l.targetType||"system"),target:l.targetId===null?"-":String(l.targetId),description:l.description||"",status:l.outcome==="failure"?"Failed":statusLabel(l.outcome),ip:l.sourceIp||"Not recorded"}));
  const [type,setType]=useState("All actions");
  const [actor,setActor]=useState("");
  const [from,setFrom]=useState("");
  const [to,setTo]=useState("");
  const [notice,setNotice]=useState(false);
  const visible=logs.filter(log=>(type==="All actions"||log.type===type)&&(!actor||log.actor.toLowerCase().includes(actor.toLowerCase()))&&(!from||log.date>=from)&&(!to||log.date<=to));
  const clear=()=>{setType("All actions");setActor("");setFrom("");setTo("");};
  const exportLogs=()=>{const rows=[["Event ID","Timestamp","Actor","Actor Type","Action","Target","Description","Status","IP Address"],...visible.map(log=>[log.id,log.timestamp,log.actor,log.actorType,log.action,log.target,log.description,log.status,log.ip])];const csv=rows.map(row=>row.map(value=>`"${value.replace(/"/g,'""')}"`).join(",")).join("\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const link=document.createElement("a");link.href=url;link.download="rentnest-activity-logs.csv";link.click();URL.revokeObjectURL(url);setNotice(true);window.setTimeout(()=>setNotice(false),2000);};
  const tone=(value:string):"success"|"warning"|"danger"=>value==="Success"?"success":value==="Warning"?"warning":"danger";
  if(data.loading)return <TableSkeleton/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  return <div className="admin-logs-page">{notice&&<div className="admin-report-toast"><Icon name="lock" size={15}/>Audit log exported</div>}<div className="admin-logs-head"><div><p className="eyebrow">SECURITY & COMPLIANCE</p><h1>Activity Logs</h1><p>Track important system actions and administrative events.</p></div><Button variant="secondary" onClick={exportLogs}><Icon name="arrow" size={14}/> Export Audit Log</Button></div>
    <section className="audit-integrity-banner"><span><Icon name="lock" size={17}/></span><div><strong>Recorded activity</strong><p>Events are loaded from the platform activity log. This view is read-only.</p></div><Badge tone="success">Database records</Badge></section>
    <section className="admin-log-filters"><label><span>Action Type</span><select value={type} onChange={e=>setType(e.target.value)}><option>All actions</option><option>Listing</option><option>User</option><option>Booking</option><option>Property</option><option>Authentication</option><option>Payment</option></select></label><label className="audit-user-filter"><span>User / Actor</span><div><Icon name="search" size={14}/><input value={actor} onChange={e=>setActor(e.target.value)} placeholder="Search actor name"/></div></label><label><span>From</span><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label><span>To</span><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><Button variant="ghost" onClick={clear}>Reset</Button></section>
    {visible.length?<section className="admin-log-table-wrap"><div className="admin-log-table-head"><span>Timestamp</span><span>Admin / User</span><span>Action</span><span>Target</span><span>Description</span><span>Status</span></div><div className="admin-log-table">{visible.map(log=><article key={log.id}><div className="audit-timestamp"><strong>{log.dateLabel}</strong><span>{log.time}</span><small>{log.id}</small></div><div className="audit-actor"><span className="avatar">{log.initials}</span><p><strong>{log.actor}</strong><small>{log.actorType}</small></p></div><span className={`audit-action action-${log.type.toLowerCase()}`}><Icon name={log.type==="Listing"||log.type==="Property"?"building":log.type==="Booking"?"calendar":log.type==="Payment"?"star":log.type==="Authentication"?"lock":"users"} size={13}/>{log.action}</span><strong className="audit-target">{log.target}</strong><div className="audit-description"><p>{log.description}</p><small>Source IP: {log.ip}</small></div><Badge tone={tone(log.status)}>{log.status}</Badge></article>)}</div><footer className="audit-table-footer"><span>Showing {visible.length} of {logs.length} recorded events</span><p><Icon name="lock" size={12}/> Read-only security record</p></footer></section>:<div className="admin-log-empty"><span><Icon name="lock" size={27}/></span><h2>No activity logs found</h2><p>No audit events match the selected filters.</p><Button variant="secondary" onClick={clear}>Clear Filters</Button></div>}
  </div>;
}

﻿function Settings({ go, ownerMode = false, onLogout }: { go: (page: string) => void; ownerMode?: boolean; onLogout: () => void }) {
  const {user,setAuthenticatedUser}=useAuth();
  const data=useApiData(()=>workspaceService.account(),"account-"+user?.id);
  const [form,setForm]=useState({name:user?.name||"",username:user?.username||"",email:user?.email||"",phone:user?.phone||"",avatarUrl:user?.avatarUrl||""});
  const [securityModal,setSecurityModal]=useState<"password"|"sessions"|null>(null);
  const sessions=useApiData(()=>securityModal==="sessions"?workspaceService.sessions():Promise.resolve([]),"sessions-"+user?.id+"-"+securityModal);
  const [password,setPassword]=useState({currentPassword:"",newPassword:"",confirmNewPassword:""});
  const [pending,setPending]=useState(false);const [error,setError]=useState("");const [saved,setSaved]=useState(false);
  const perform=async(action:()=>Promise<unknown>)=>{if(pending)return;setPending(true);setError("");setSaved(false);try{await action();setSaved(true);data.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  const saveProfile=()=>perform(async()=>{const updated=await workspaceService.updateProfile({...form,phone:form.phone||null,avatarUrl:form.avatarUrl||null});setAuthenticatedUser(updated);});
  const preferences=data.data?.preferences||{};
  const options=user?.role==="admin"?[["security_alert_notifications","Security alerts","Account security updates"],["moderation_queue_notifications","Moderation queue","Listings requiring review"],["payment_incident_notifications","Payment incidents","Payment record updates"],["system_health_notifications","System health","Service updates"],["scheduled_report_notifications","Scheduled reports","Report preferences"]]:[["booking_notifications","Booking updates","Approvals, rejections, and booking reminders"],["message_notifications","New messages","Replies and property conversations"],["favorite_notifications","Favorite property updates","Saved property updates"],["marketing_notifications","RentNest news","Product updates and rental tips"]];
  if(data.loading&&!data.data)return <TableSkeleton/>;if(data.error)return <RentalFailure error={data.error} retry={data.reload}/>;
  return <div className={`account-page ${ownerMode?"owner-profile-page":""}`}><div className="account-title"><p className="eyebrow">{statusLabel(user?.role||"")} ACCOUNT</p><h1>Profile & Settings</h1><p>Manage your personal information, security, and account preferences.</p></div>
    {error&&<FormError message={error}/>}{saved&&<span className="saved-confirmation" role="status">Changes saved</span>}
    <section className="account-profile-header"><div className="account-avatar">{userInitials(user?.name||"")}</div><div><h2>{user?.name}</h2><p>{user?.email}</p><span className={`role-badge ${user?.role}`}>{statusLabel(user?.role||"")}</span></div><Button variant="secondary" onClick={()=>document.getElementById("avatar-url")?.focus()}>Change Photo URL</Button></section>
    <div className="account-layout"><aside className="account-section-nav"><button className="active" onClick={()=>document.getElementById("personal")?.scrollIntoView({behavior:"smooth"})}><Icon name="users"/>Personal Information</button>{ownerMode&&<button onClick={()=>document.getElementById("owner-information")?.scrollIntoView({behavior:"smooth"})}><Icon name="building"/>Owner Information</button>}<button onClick={()=>document.getElementById("security")?.scrollIntoView({behavior:"smooth"})}><Icon name="lock"/>Security</button><button onClick={()=>document.getElementById("preferences")?.scrollIntoView({behavior:"smooth"})}><Icon name="bell"/>Preferences</button></aside><div className="account-sections">
      <section className="account-card" id="personal"><div className="account-card-head"><div><h2>Personal Information</h2><p>Update the personal details connected to your account.</p></div></div><form onSubmit={e=>{e.preventDefault();void saveProfile();}}><div className="account-form-grid">{([["name","Full Name"],["username","Username"],["email","Email Address"],["phone","Phone Number"],["avatarUrl","Photo URL"]] as const).map(([key,label])=><label key={key}><span>{label}</span><input id={key==="avatarUrl"?"avatar-url":undefined} type={key==="email"?"email":key==="avatarUrl"?"url":"text"} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}</div><div className="account-card-actions"><Button type="button" variant="secondary" disabled={pending} onClick={()=>setForm({name:user?.name||"",username:user?.username||"",email:user?.email||"",phone:user?.phone||"",avatarUrl:user?.avatarUrl||""})}>Cancel</Button><Button disabled={pending}>{pending?"Saving...":"Save Changes"}</Button></div></form></section>
      {ownerMode&&<section className="account-card owner-information-card" id="owner-information"><div className="account-card-head"><div><h2>Owner Information</h2><p>Your property-hosting account overview.</p></div><Badge>{statusLabel(user?.status||"")}</Badge></div><div className="owner-information-grid"><article><span><Icon name="settings"/></span><div><small>ACCOUNT STATUS</small><strong>{statusLabel(user?.status||"")}</strong></div></article><article><span><Icon name="building"/></span><div><small>TOTAL PROPERTIES</small><strong>{data.data!.user.propertyCount} Properties</strong></div></article><article><span><Icon name="calendar"/></span><div><small>MEMBER SINCE</small><strong>{new Date(data.data!.user.createdAt).toLocaleDateString()}</strong></div></article></div></section>}
      <section className="account-card" id="security"><div className="account-card-head"><div><h2>Security</h2><p>Keep your account protected and review active access.</p></div></div><div className="settings-list"><article><span><Icon name="lock"/></span><div><strong>Change Password</strong><p>Update your account password</p></div><Button variant="secondary" onClick={()=>{setSecurityModal("password");setError("");setSaved(false);}}>Update Password</Button></article><article><span><Icon name="settings"/></span><div><strong>Sessions</strong><p>Review currently authenticated sessions</p></div><Button variant="secondary" onClick={()=>{setSecurityModal("sessions");setError("");setSaved(false);}}>Manage Sessions</Button></article></div></section>
      <section className="account-card" id="preferences"><div className="account-card-head"><div><h2>Notification Settings</h2><p>Choose which account updates you want to receive.</p></div></div><div className="preference-list">{options.map(([key,label,description])=><article key={key}><div><strong>{label}</strong><p>{description}</p></div><button disabled={pending} className={`toggle-switch ${preferences[key]?"on":""}`} aria-pressed={!!preferences[key]} aria-label={`Toggle ${label}`} onClick={()=>void perform(()=>workspaceService.preferences({[key]:!preferences[key]}))}><i/></button></article>)}</div></section>
      <section className="account-card account-actions-card"><div className="account-card-head"><div><h2>Account Actions</h2><p>Manage access to your account.</p></div></div><div className="logout-action"><span><Icon name="logout"/></span><div><strong>Logout</strong><p>Sign out on the current device.</p></div><Button variant="secondary" onClick={onLogout}>Logout</Button></div></section>
      <section className="account-card danger-zone"><div><span><Icon name="settings"/></span><div><h2>Delete Account</h2><p>Account deletion is not supported by this application.</p></div></div><Button variant="destructive" disabled>Delete Account</Button></section>
    </div></div>
    {securityModal&&<div className="modal-backdrop"><section className="modal security-modal" role="dialog" aria-modal="true"><div className="modal-header"><h2>{securityModal==="password"?"Change Password":"Manage Sessions"}</h2><button className="icon-button" disabled={pending} onClick={()=>setSecurityModal(null)}>×</button></div>{error&&<FormError message={error}/>}{securityModal==="password"?<form onSubmit={e=>{e.preventDefault();void perform(async()=>{await authService.changePassword(password);setPassword({currentPassword:"",newPassword:"",confirmNewPassword:""});setSecurityModal(null);});}}><div className="security-form">{([["currentPassword","Current Password"],["newPassword","New Password"],["confirmNewPassword","Confirm New Password"]] as const).map(([key,label])=><label key={key}><span>{label}</span><input type="password" value={password[key]} onChange={e=>setPassword({...password,[key]:e.target.value})}/></label>)}</div><div className="modal-actions"><Button type="button" variant="secondary" disabled={pending} onClick={()=>setSecurityModal(null)}>Cancel</Button><Button disabled={pending}>Update Password</Button></div></form>:<>{sessions.loading?<TableSkeleton/>:sessions.error?<RentalFailure error={sessions.error} retry={sessions.reload}/>:<div className="sessions-list">{sessions.data!.map(session=><article key={session.id}><span><Icon name="settings"/></span><div><strong>{session.device||"Device not recorded"}</strong><p>Last used: {new Date(session.lastUsedAt||session.createdAt).toLocaleString()}</p></div>{session.current?<Badge>Current</Badge>:<button disabled={pending} onClick={()=>void perform(async()=>{await workspaceService.revokeSession(session.id);sessions.reload();})}>Revoke</button>}</article>)}</div>}<div className="modal-actions"><Button variant="secondary" onClick={()=>setSecurityModal(null)}>Close</Button><Button variant="destructive" disabled={pending} onClick={()=>void perform(async()=>{await workspaceService.revokeOthers();sessions.reload();})}>Sign Out Other Sessions</Button></div></>}</section></div>}
  </div>;
}

function AdminSystemSettings() {
  const {user,clearAuthenticatedUser}=useAuth();
  const data=useApiData(()=>workspaceService.settings(),"platform-settings-"+user?.id);
  const [settings,setSettings]=useState<PlatformSettings|null>(null);const [pending,setPending]=useState(false);const [error,setError]=useState("");const [saved,setSaved]=useState(false);
  useEffect(()=>{if(data.data)setSettings(data.data);},[data.data]);
  const save=async()=>{if(!settings||pending)return;setPending(true);setSaved(false);setError("");try{await workspaceService.saveSettings({...settings,maintenanceMode:!!settings.maintenanceMode});setSaved(true);data.reload();workspaceChanged();}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  const logout=async()=>{try{await authService.logout();clearAuthenticatedUser();window.location.hash=encodeURIComponent("Home");}catch(e){setError(authErrorMessage(e));}};
  return <div className="admin-system-settings"><div className="admin-settings-head"><div><p className="eyebrow">PLATFORM ADMINISTRATION</p><h1>System Settings</h1><p>Manage administrator access and platform configuration.</p></div></div><Settings go={page=>window.location.hash=encodeURIComponent(page)} onLogout={()=>void logout()}/>
    <section className="admin-settings-card" id="admin-platform"><div className="admin-settings-card-head"><div><h2>General Configuration</h2><p>Database-backed platform defaults.</p></div></div>{data.loading&&!settings?<TableSkeleton/>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:!settings?<EmptyState icon="settings" title="Platform settings have not been initialized."/>:<><div className="admin-settings-form">{([["platformName","Platform Name"],["supportEmail","Support Email"],["currency","Default Currency"],["timezone","Time Zone"],["reviewTargetHours","Listing Review Target (hours)"],["sessionTimeoutMinutes","Session Timeout Setting (minutes)"]] as const).map(([key,label])=><label key={key}><span>{label}</span><input type={key==="supportEmail"?"email":["reviewTargetHours","sessionTimeoutMinutes"].includes(key)?"number":"text"} value={String(settings[key])} onChange={e=>setSettings({...settings,[key]:["reviewTargetHours","sessionTimeoutMinutes"].includes(key)?Number(e.target.value):e.target.value})}/></label>)}</div><div className="admin-settings-actions"><Button variant="secondary" disabled={pending} onClick={()=>{if(data.data)setSettings(data.data);}}>Cancel</Button><Button disabled={pending} onClick={()=>void save()}>{pending?"Saving...":"Save Configuration"}</Button></div></>}{error&&<FormError message={error}/>} {saved&&<span role="status">Settings saved successfully</span>}</section>
    <section className="admin-settings-card admin-system-danger"><div className="admin-settings-card-head"><div><h2>Danger Zone</h2><p>Platform maintenance configuration</p></div></div><article><span><Icon name="settings"/></span><div><strong>Maintenance Mode</strong><p>Stored configuration flag. Access enforcement is not implemented.</p><Badge tone={settings?.maintenanceMode?"warning":"success"}>{settings?.maintenanceMode?"Enabled":"Disabled"}</Badge></div><Button disabled title="Maintenance access enforcement is not implemented">Toggle Maintenance</Button></article><article><span><Icon name="more"/></span><div><strong>Delete System Data</strong><p>Destructive database operations are not available through this UI.</p></div><Button variant="destructive" disabled>Delete System Data</Button></article></section>
  </div>;
}

function PublicHeader({ go }: { go: (page: string) => void }) {
  const { user } = useAuth();
  return <header className="public-header">
    <button className="brand public-brand" onClick={() => go("Home")}><span className="brand-mark"><i /><i /></span><strong>RentNest</strong></button>
    <nav className="public-nav"><button onClick={() => go("Discover")}>Browse Properties</button><button onClick={() => go("About")}>About</button><button onClick={() => go("Home")}>How It Works</button></nav>
    <div className="public-actions">{user ? <Button onClick={()=>go(dashboards[user.role])}>Dashboard</Button> : <><Button variant="ghost" onClick={() => go("Login")}>Login</Button><Button onClick={() => go("Register")}>Register</Button></>}</div>
  </header>;
}

function Landing({ go, saved, toggleSaved, viewHome, listProperty }: { listProperty: () => void; go: (page: string) => void; saved: number[]; toggleSaved: (i: number) => void; viewHome: (i: number) => void }) {
  const [search,setSearch]=useState({location:"",type:"",minPrice:"",maxPrice:"",bedrooms:""});
  const findProperties=()=>{sessionStorage.setItem("rentnest:browse-filters",JSON.stringify(search));go("Discover");};
  const featured = useApiData(()=>propertyService.list({limit:6}), "featured-properties");
  return <div className="public-page"><PublicHeader go={go} />
    <section className="landing-hero">
      <div className="hero-copy"><p className="eyebrow">RENT WITH CONFIDENCE</p><h1>Find Your<br />Perfect Home</h1><p>Discover verified rental properties, connect with owners, and manage your rental journey easily.</p>
        <div className="hero-actions"><Button onClick={() => go("Discover")}>Browse Properties <Icon name="arrow" /></Button><Button variant="secondary" onClick={listProperty}>List Your Property</Button></div>
        <div className="hero-proof"><span><strong>{featured.loading?"?":featured.data?.pagination.total??0}</strong><small>Verified homes</small></span><span><strong>Open to all</strong><small>Public browsing</small></span><span><strong>Reviewed</strong><small>Owner listings</small></span></div>
      </div>
      <div className="hero-visual"><img onError={event=>{event.currentTarget.src=rentalImage;}} src="https://images.unsplash.com/photo-1758448511578-ec292173b70c?auto=format&fit=crop&w=1400&q=85" alt="Premium modern apartment building at sunset" /><div className="floating-home"><span className="verified-mark">✓</span><span><small>VERIFIED LISTINGS</small><strong>Homes you can trust</strong><b>Reviewed before publishing</b></span></div></div>
      <div className="hero-search">
        <label><span>Location</span><div><Icon name="pin"/><input value={search.location} onChange={e=>setSearch({...search,location:e.target.value})} placeholder="Where do you want to live?"/></div></label>
        <label><span>Property type</span><select value={search.type} onChange={e=>setSearch({...search,type:e.target.value})}><option value="">Any type</option>{["apartment","flat","studio","room","office","parking"].map(type=><option key={type} value={type}>{statusLabel(type)}</option>)}</select></label>
        <label><span>Maximum rent</span><input type="number" min="0" value={search.maxPrice} onChange={e=>setSearch({...search,maxPrice:e.target.value})} placeholder="Any price"/></label>
        <label><span>Bedrooms</span><input type="number" min="0" value={search.bedrooms} onChange={e=>setSearch({...search,bedrooms:e.target.value})} placeholder="Any bedrooms"/></label>
        <Button onClick={findProperties}><Icon name="search"/> Search Properties</Button>
      </div>
    </section>
    <section className="public-section"><div className="section-title featured-heading"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Featured Properties</h2><p>Handpicked homes from trusted property owners.</p></div><Button variant="ghost" onClick={() => go("Discover")}>Explore all properties <Icon name="arrow" /></Button></div><div className="property-grid public-property-grid">{featured.loading?[0,1,2].map(i=><PropertyCardSkeleton key={i}/>):featured.error?<RentalFailure error={featured.error} retry={featured.reload}/>:featured.data!.items.length?featured.data!.items.map(property=><PropertyCard key={property.id} home={toHome(property)} saved={saved.includes(property.id)} onSave={()=>toggleSaved(property.id)} onView={()=>viewHome(property.id)}/>):<EmptyState icon="home" title="No properties available yet." description="Approved owner listings will appear here."/>}</div></section>
    <section className="how-section"><div className="how-intro"><p className="eyebrow">HOW RENTNEST WORKS</p><h2>Your next home,<br />in three simple steps.</h2><p>We bring everything you need into one clear, trusted rental experience.</p></div><div className="steps">{[["search","Browse Properties","Explore available rental listings that match your needs."],["home","View Details","Check photos, amenities, and property information."],["message","Book or Contact Owner","Request a booking or communicate directly with owners."]].map((step, i)=><article className="step" key={step[1]}><span><Icon name={step[0] as IconName} /></span><small>0{i+1}</small><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div></section>
    <section className="why-section"><div className="why-heading"><p className="eyebrow">BUILT AROUND TRUST</p><h2>Why renters and owners<br />choose RentNest</h2></div><div className="why-grid">{[["building","Verified Listings","Every property is reviewed before it appears on the marketplace."],["message","Secure Communication","Connect with renters and owners in one protected conversation."],["calendar","Easy Booking","Send and manage rental requests without confusing paperwork."],["settings","Property Management","Powerful tools help owners manage listings, bookings, and more."]].map(feature=><article key={feature[1]}><span><Icon name={feature[0] as IconName} /></span><h3>{feature[1]}</h3><p>{feature[2]}</p></article>)}</div></section>
    <section className="join-banner"><div><p className="eyebrow">MAKE YOUR MOVE</p><h2>Ready to find your next home?</h2><p>Join thousands of renters and owners finding a better way to rent.</p></div><div><Button variant="secondary" onClick={() => go("Discover")}>Explore Properties</Button><Button onClick={() => go("Register")}>Sign Up Now <Icon name="arrow" /></Button></div></section>
    <footer className="public-footer"><div className="footer-brand"><button className="brand"><span className="brand-mark"><i /><i /></span><strong>RentNest</strong></button><p>A simpler, safer rental journey for everyone.</p></div>{[["Company","About Us","Careers"],["Support","Help Center","Contact"],["Legal","Privacy Policy","Terms"]].map(column=><div key={column[0]}><strong>{column[0]}</strong>{column.slice(1).map(item=><button key={item}>{item}</button>)}</div>)}<p className="copyright">© 2025 RentNest. All rights reserved.</p></footer>
  </div>;
}

function AboutPage({ go }: { go: (page: string) => void }) {
  const team = [
    { name: "Nadia Rahman", role: "Co-founder & Product", image: "https://images.unsplash.com/photo-1758691737605-69a0e78bd193?auto=format&fit=crop&w=800&q=85" },
    { name: "Arif Hasan", role: "Co-founder & Engineering", image: "https://images.unsplash.com/photo-1705645930353-0e335311ef20?auto=format&fit=crop&w=800&q=85" },
    { name: "Samir Ahmed", role: "Marketplace Operations", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85" },
  ];
  return <div className="public-page about-page"><PublicHeader go={go} />
    <section className="about-hero"><div className="about-hero-copy"><p className="eyebrow">ABOUT RENTNEST</p><h1>Making Renting<br />Simple and Reliable</h1><p>RentNest connects renters and property owners through an easy and transparent rental experience.</p><div className="hero-actions"><Button onClick={()=>go("Discover")}>Explore Properties <Icon name="arrow" /></Button><Button variant="secondary" onClick={()=>go("Register")}>Join RentNest</Button></div></div><div className="about-hero-art"><div className="about-home-card"><img onError={event=>{event.currentTarget.src=rentalImage;}} src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80" alt="Illustrative apartment interior" /><div><Badge>Verified home</Badge><strong>Designed around trust</strong><small>Clear details. Direct conversations. Better decisions.</small></div></div><span className="about-orbit orbit-one" /><span className="about-orbit orbit-two" /></div></section>
    <section className="mission-section"><div className="about-section-heading"><p className="eyebrow">OUR MISSION</p><h2>A better rental experience<br />for everyone involved.</h2><p>Technology should remove uncertainty from renting—not add to it.</p></div><div className="mission-grid">{[["search","Easy Discovery","Find suitable properties quickly with clear details and useful filters."],["message","Secure Communication","Connect directly with property owners through one trusted platform."],["settings","Simple Management","Owners manage properties, requests, and conversations efficiently."]].map((item,i)=><article key={item[1]}><small>0{i+1}</small><span><Icon name={item[0] as IconName} /></span><h3>{item[1]}</h3><p>{item[2]}</p></article>)}</div></section>
    <section className="story-section"><div className="story-intro"><p className="eyebrow">HOW RENTNEST STARTED</p><h2>Built from a familiar frustration.</h2><p>Finding a rental home should feel exciting. Too often, it feels uncertain, fragmented, and unnecessarily difficult.</p></div><div className="story-timeline">{[["The problem","Renters struggled with incomplete listings and scattered conversations. Owners lacked simple tools to manage genuine interest."],["The solution","RentNest brought verified property discovery, direct communication, booking requests, and management into one coherent experience."],["The vision","A rental marketplace where every person can make confident decisions, supported by transparent information and thoughtful technology."]].map((item,i)=><article key={item[0]}><span>{i+1}</span><div><h3>{item[0]}</h3><p>{item[1]}</p></div></article>)}</div></section>
    <section className="team-section"><div className="about-section-heading"><p className="eyebrow">MEET THE TEAM</p><h2>Small team. Meaningful mission.</h2><p>Illustrative team personas for this classroom project.</p></div><div className="team-grid">{team.map(person=><article key={person.name}><img onError={event=>{event.currentTarget.src=rentalImage;}} src={person.image} alt={`${person.name}, ${person.role}`} /><div><h3>{person.name}</h3><p>{person.role}</p></div></article>)}</div></section>
    <section className="about-cta"><div><p className="eyebrow">BUILD YOUR NEXT CHAPTER</p><h2>Find a home—or help someone find theirs.</h2></div><div><Button variant="secondary" onClick={()=>go("Discover")}>Browse homes</Button><Button onClick={()=>go("Register")}>Create an account</Button></div></section>
    <footer className="public-footer"><div className="footer-brand"><button className="brand" onClick={()=>go("Home")}><span className="brand-mark"><i /><i /></span><strong>RentNest</strong></button><p>A simpler, safer rental journey for everyone.</p></div>{[["Company","About Us","Careers"],["Support","Help Center","Contact"],["Legal","Privacy Policy","Terms"]].map(column=><div key={column[0]}><strong>{column[0]}</strong>{column.slice(1).map(item=><button key={item}>{item}</button>)}</div>)}<p className="copyright">© 2025 RentNest. All rights reserved.</p></footer>
  </div>;
}

function BrowsePage({ go, saved, toggleSaved, viewHome }: RentalNavigation & {saved:number[];toggleSaved:(id:number)=>void}) {
  const [initialFilters]=useState(()=>{try{return JSON.parse(sessionStorage.getItem("rentnest:browse-filters")||"{}");}catch{return {};}});
  const [query,setQuery]=useState(initialFilters.location||"");const [searchTerm,setSearchTerm]=useState(initialFilters.location||"");const [page,setPage]=useState(1);const [type,setType]=useState(initialFilters.type||"");const [minPrice,setMinPrice]=useState(initialFilters.minPrice||"");const [maxPrice,setMaxPrice]=useState(initialFilters.maxPrice||"");const [bedrooms,setBedrooms]=useState(initialFilters.bedrooms||"");const [sort,setSort]=useState("latest");const [availability,setAvailability]=useState("");const [filtersOpen,setFiltersOpen]=useState(false);
  const data=useApiData(()=>propertyService.list({search:searchTerm,page,type,minPrice,maxPrice,bedrooms,sort,availability}),`browse-${searchTerm}-${page}-${type}-${minPrice}-${maxPrice}-${bedrooms}-${sort}-${availability}`);
  const search=()=>{setSearchTerm(query.trim());setPage(1);};
  const clear=()=>{setQuery("");setSearchTerm("");setType("");setMinPrice("");setMaxPrice("");setBedrooms("");setAvailability("");setPage(1);};
  const filters=<><div className="filter-head"><div><p className="eyebrow">REFINE RESULTS</p><h3>Filters</h3></div><button onClick={clear}>Reset all</button></div><fieldset><legend>Price range</legend><label>Minimum rent<input type="number" min="0" value={minPrice} onChange={e=>{setMinPrice(e.target.value);setPage(1);}}/></label><label>Maximum rent<input type="number" min="0" value={maxPrice} onChange={e=>{setMaxPrice(e.target.value);setPage(1);}}/></label></fieldset><fieldset><legend>Property type</legend>{["room","studio","flat","apartment","office","parking"].map(value=><label key={value}><input type="checkbox" checked={type===value} onChange={()=>{setType(type===value?"":value);setPage(1);}}/>{statusLabel(value)}</label>)}</fieldset><fieldset><legend>Bedrooms</legend><div className="bedroom-options">{["","1","2","3"].map(value=><label key={value}><input type="radio" name="beds" checked={bedrooms===value} onChange={()=>{setBedrooms(value);setPage(1);}}/><span>{value?`${value}+`:"Any"}</span></label>)}</div></fieldset><fieldset><legend>Availability</legend><select value={availability} onChange={e=>{setAvailability(e.target.value);setPage(1);}}><option value="">All available listings</option><option value="now">Available now</option><option value="future">Available later</option></select></fieldset><div className="filter-actions"><Button onClick={search}>Apply Filters</Button><Button variant="secondary" onClick={clear}>Reset</Button></div></>;
  return <div className="public-page browse-page"><PublicHeader go={go}/><section className="browse-hero"><div><p className="eyebrow">DISCOVER YOUR NEXT HOME</p><h1>Find Your Perfect Property</h1><p>Search verified rental homes across Bangladesh.</p></div><div className="browse-search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Search by location, property name, or keyword"/><Button onClick={search}>Search</Button></div></section><div className="browse-layout"><aside className={`filter-sidebar ${filtersOpen?"open":""}`}>{filters}</aside><main className="browse-main"><div className="results-toolbar"><div><button className="mobile-filter" onClick={()=>setFiltersOpen(!filtersOpen)}><Icon name="sliders"/> Filters</button><h2>{data.loading?"Searching properties...":`${data.data?.pagination.total??0} Properties Found`}</h2><p>Verified homes matching your preferences</p></div><label className="sort-control"><span>Sort by</span><select value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="latest">Latest Added</option><option value="price_asc">Price Low to High</option><option value="price_desc">Price High to Low</option></select></label></div>{data.loading?<div className="browse-property-grid">{[0,1,2,3,4,5].map(i=><PropertyCardSkeleton key={i}/>)}</div>:data.error?<RentalFailure error={data.error} retry={data.reload}/>:data.data!.items.length?<><div className="browse-property-grid">{data.data!.items.map(property=><PropertyCard key={property.id} home={toHome(property)} saved={saved.includes(property.id)} onSave={()=>toggleSaved(property.id)} onView={()=>viewHome(property.id)}/>)}</div><RentalPagination pagination={data.data!.pagination} onPage={setPage}/></>:<EmptyState icon="home" title="No properties available." description="Try adjusting your search or filters." actionLabel="Reset filters" onAction={clear}/>}</main></div></div>;
}

function PropertyDetailsPage({propertyId,scope="public",go,saved,savedPropertyIds=[],onSave,viewHome,onBook,onMessage,onSaveHome,onBooked}:RentalNavigation&{propertyId:number;scope?:PropertyScope;saved:boolean;savedPropertyIds?:number[];onSave:()=>void;onBook:()=>void;onMessage:()=>void;onSaveHome:(id:number)=>void;onBooked:(id:number)=>void}) {
  const {user}=useAuth();const data=useApiData(()=>propertyService.get(propertyId,scope),`property-${propertyId}-${scope}-${scope==="public"?"public":user?.id}`);
  const similar=useApiData(()=>propertyService.list({limit:4}),`similar-${propertyId}`);
  const [photo,setPhoto]=useState(0);const [bookingOpen,setBookingOpen]=useState(false);const [startDate,setStartDate]=useState("");const [endDate,setEndDate]=useState("");const [pending,setPending]=useState(false);const [error,setError]=useState("");
  useEffect(()=>{setPhoto(0);setBookingOpen(false);setError("");},[propertyId]);
  if(data.loading)return <div className="public-page"><PublicHeader go={go}/><div className="detail-loading"><div className="skeleton detail-skeleton-hero"/><div className="skeleton block"/></div></div>;
  if(data.error)return <div className="public-page"><PublicHeader go={go}/><RentalFailure error={data.error} retry={data.reload}/></div>;
  const property=data.data!;const home=toHome(property);const gallery=property.images.length?property.images.map(i=>i.url):[rentalImage];const available=property.available&&property.moderationStatus==="approved"&&!property.archived;
  const create=async()=>{if(pending)return;setPending(true);setError("");try{const booking=await bookingService.create({propertyId:property.id,startDate,endDate});setBookingOpen(false);onBooked(booking.id);}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  return <div className="public-page detail-page"><PublicHeader go={go}/><div className="detail-shell"><nav className="breadcrumb"><button onClick={()=>go("Home")}>Home</button><Icon name="chevron"/><button onClick={()=>go("Discover")}>Properties</button><Icon name="chevron"/><span>{home.title}</span></nav><section className="detail-gallery"><div className="gallery-main"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={gallery[photo]||gallery[0]} alt={home.title}/>{gallery.length>1&&<><button className="gallery-arrow previous" onClick={()=>setPhoto((photo+gallery.length-1)%gallery.length)} aria-label="Previous photo"><Icon name="chevron"/></button><button className="gallery-arrow next" onClick={()=>setPhoto((photo+1)%gallery.length)} aria-label="Next photo"><Icon name="chevron"/></button></>}<span className="photo-count">{Math.min(photo+1,gallery.length)} / {gallery.length}</span></div><div className="gallery-thumbs">{gallery.map((image,i)=><button className={photo===i?"active":""} key={i} onClick={()=>setPhoto(i)}><img onError={event=>{event.currentTarget.src=rentalImage;}} src={image} alt={`Thumbnail ${i+1}`}/></button>)}</div></section><div className="detail-layout"><div className="detail-content"><section className="property-heading"><div><div className="detail-badges"><Badge tone={statusTone(property.moderationStatus)}>{home.tag}</Badge></div><h1>{home.title}</h1><p><Icon name="pin"/>{home.place}</p></div><div className="detail-price"><small>MONTHLY RENT</small><strong>{home.price}</strong><span>/ month</span></div></section><section className="detail-stats">{[[property.bedrooms??"—","Bedrooms"],[property.bathrooms??"—","Bathrooms"],[property.sizeSqft??"—","Square feet"],[statusLabel(property.type),"Property type"]].map(item=><article key={String(item[1])}><span>{item[0]}</span><div><strong>{item[1]}</strong></div></article>)}</section><section className="detail-section"><h2>About this property</h2><p>{property.description||"No description provided."}</p><p>{property.furnished?"Furnished":"Unfurnished"} · {property.bachelorAllowed?"Bachelor allowed":"Bachelor not allowed"} · {property.familyAllowed?"Family allowed":"Family not allowed"}</p>{property.rejectionReason&&<p>Review: {property.rejectionReason}</p>}</section><section className="detail-section"><h2>Amenities</h2><div className="detail-amenities">{property.amenities.length?property.amenities.map(a=><article key={a.id}><Icon name="settings"/><strong>{a.name}</strong></article>):<p>No amenities listed.</p>}</div></section><section className="owner-card"><span className="owner-avatar">{userInitials(property.owner.name)}</span><div><small>PROPERTY OWNER</small><h3>{property.owner.name}</h3><p>@{property.owner.username}</p></div><Button variant="secondary" onClick={onMessage}><Icon name="message"/> Contact Owner</Button></section></div><aside className="booking-card"><div className="booking-price"><span><strong>{home.price}</strong> / month</span><Badge>{home.tag}</Badge></div><div className="booking-note"><p><strong>Deposit: {money(property.depositAmount,property.currency)}</strong><small>{property.moderationStatus==="approved"?"Reviewed by RentNest":"Awaiting publication"}</small></p></div><Button disabled={!available} onClick={()=>user?.role==="renter"?setBookingOpen(true):onBook()}>{available?"Book Property":"Currently Unavailable"}</Button><Button variant="secondary" onClick={onSave}><Icon name="heart"/>{saved?"Remove Favorite":"Add Favorite"}</Button><Button variant="secondary" onClick={onMessage}><Icon name="message"/> Message Owner</Button><p className="booking-help">Your request is sent to the owner for approval. Rent uses a 30-day month plus the deposit.</p></aside></div><section className="similar-section"><div className="section-title"><h2>Similar Properties</h2><Button variant="ghost" onClick={()=>go("Discover")}>View all</Button></div>{similar.loading?<PropertyCardSkeleton/>:similar.error?<RentalFailure error={similar.error} retry={similar.reload}/>:<div className="property-grid">{similar.data?.items.filter(p=>p.id!==property.id).slice(0,3).map(p=><PropertyCard key={p.id} home={toHome(p)} saved={savedPropertyIds.includes(p.id)} onSave={()=>onSaveHome(p.id)} onView={()=>viewHome(p.id)}/>)}</div>}</section></div>
    {bookingOpen&&<div className="modal-backdrop"><section className="modal booking-detail-modal" role="dialog" aria-modal="true"><h2>Request a booking</h2><p>{property.title}</p><form onSubmit={e=>{e.preventDefault();void create();}}><div className="booking-detail-grid"><label><span>Start date</span><input aria-label="Start date" type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label><span>End date</span><input aria-label="End date" type="date" required value={endDate} onChange={e=>setEndDate(e.target.value)}/></label></div><p>Monthly rent {home.price}, deposit {money(property.depositAmount,property.currency)}. Total is calculated for your dates by RentNest.</p>{error&&<FormError message={error}/>}<div className="modal-actions"><Button type="button" variant="secondary" disabled={pending} onClick={()=>setBookingOpen(false)}>Cancel</Button><Button type="submit" disabled={pending}>{pending?"Sending...":"Request Booking"}</Button></div></form></section></div>}
  </div>;
}

function AuthPage({ mode, go, onLogin }: { mode: "login" | "register"; go: (page: string) => void; onLogin?: (user: AuthUser) => void }) {
  const { setAuthenticatedUser } = useAuth();
  const submissionPending = useRef(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [apiMessage, setApiMessage] = useState("");
  const register = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const emailError = submitted && !email ? "Required field" : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Invalid email" : apiErrors.email ?? "";
  const passwordError = submitted && !password ? "Required field" : apiErrors.password ?? "";
  const login = async () => {
    if (submissionPending.current) return;
    setSubmitted(true);
    setApiErrors({});
    setApiMessage("");
    if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("loading");
    submissionPending.current = true;
    try {
      const user = await authService.login({ email, password });
      setAuthenticatedUser(user);
      setStatus("success");
      if (onLogin) onLogin(user); else go(loginDestinations[user.role]);
    } catch (error) {
      setApiErrors(error instanceof ApiError && error.status < 500 ? error.errors ?? {} : {});
      setApiMessage(authErrorMessage(error));
      setStatus("error");
    } finally {
      submissionPending.current = false;
    }
  };
  return <div className="auth-page">
    <button className="auth-back" onClick={() => go("Home")}><Icon name="arrow" /> Back to Home</button>
    <div className="auth-form-panel"><button className="brand" onClick={() => go("Home")}><span className="brand-mark"><i /><i /></span><strong>RentNest</strong></button>
      <div className="auth-form"><p className="eyebrow">{register ? "CREATE YOUR ACCOUNT" : "SECURE ACCOUNT ACCESS"}</p><h1>{register ? "Find your place on RentNest." : "Welcome Back"}</h1><p>{register ? "Join renters and property owners building a better rental experience." : "Login to continue your RentNest journey."}</p>
        {register ? <><div className="role-cards"><button className="active"><Icon name="search" /><strong>I'm looking for a place</strong><small>Browse and book rental homes</small></button><button><Icon name="building" /><strong>I want to list properties</strong><small>Manage homes and bookings</small></button></div><label className="auth-field"><span>Full name</span><input placeholder="Your full name" /></label><label className="auth-field"><span>Username</span><input placeholder="Choose a username" /></label><label className="auth-field"><span>Email address</span><input type="email" placeholder="example@email.com" /></label><label className="auth-field"><span>Password</span><input type="password" placeholder="Enter password" /></label><label className="auth-field"><span>Confirm password</span><input type="password" placeholder="Repeat your password" /></label><Button onClick={() => go("Register")}>Create Account <Icon name="arrow" /></Button></>
        : <form onSubmit={e=>{e.preventDefault();login();}} noValidate><label className={`auth-field ${emailError?"has-error":""}`}><span>Email Address</span><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setApiErrors({});setApiMessage("");}} placeholder="example@email.com" aria-invalid={!!emailError} />{emailError&&<FormError message={emailError}/>} </label><label className={`auth-field ${passwordError?"has-error":""}`}><span>Password</span><div className="password-control"><input type={showPassword?"text":"password"} value={password} onChange={e=>{setPassword(e.target.value);setApiErrors({});setApiMessage("");}} placeholder="Enter password" aria-invalid={!!passwordError} /><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}><Icon name="eye" size={18} /></button></div>{passwordError&&<FormError message={passwordError}/>} </label>{apiMessage&&<FormError message={apiMessage}/>}<div className="auth-options"><label><input type="checkbox" /> Remember me</label><button type="button" onClick={()=>go("Forgot password")}>Forgot Password?</button></div><button className={`button button-primary login-submit ${status==="loading"?"is-loading":""}`} disabled={status==="loading"||status==="success"}>{status==="loading"?<><i /> Logging in...</>:status==="success"?<>Login successful <span>✓</span></>:<>Log In <Icon name="arrow" /></>}</button></form>}
        <p className="auth-switch">{register ? "Already have an account?" : "Don't have an account?"} <button onClick={() => go(register ? "Login" : "Register")}>{register ? "Log In" : "Create Account"}</button></p>{!register && <div className="admin-access"><span>Administrator?</span><button className="admin-login">Admin Login</button></div>}
      </div>
    </div>
    <div className="auth-visual"><img onError={event=>{event.currentTarget.src=rentalImage;}} src="https://images.unsplash.com/photo-1680416124510-5eae1beca412?auto=format&fit=crop&w=1400&q=85" alt="Warm, premium modern apartment interior" /><div><span className="quote-mark">“</span><blockquote>RentNest helped me find a home I could trust, without the usual uncertainty.</blockquote><p>— Farah, renter in Dhaka</p></div>{status==="success"&&<div className="auth-success"><span>✓</span><strong>Welcome back</strong><small>Taking you to your account…</small></div>}</div>
  </div>;
}

function RegistrationPage({ go, initialRole = "renter" }: { go: (page: string) => void; initialRole?: "renter" | "owner" }) {
  const submissionPending = useRef(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});
  const [apiMessage, setApiMessage] = useState("");
  const [role, setRole] = useState<"renter" | "owner">(initialRole);
  const [fields, setFields] = useState({ name: "", username: "", email: "", password: "", confirm: "" });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const setField = (key: keyof typeof fields, value: string) => {
    setFields(current => ({ ...current, [key]: value }));
    setApiErrors(current => ({ ...current, [key === "confirm" ? "confirmPassword" : key]: "" }));
    setApiMessage("");
  };
  const errors = {
    name: submitted && !fields.name ? "Full name is required" : apiErrors.name ?? "",
    username: submitted && !fields.username ? "Username is required" : apiErrors.username ?? "",
    email: submitted && !fields.email ? "Email address is required" : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ? "Enter a valid email address" : apiErrors.email ?? "",
    password: submitted && !fields.password ? "Password is required" : submitted && fields.password.length < 8 ? "Password is too weak. Use at least 8 characters" : apiErrors.password ?? "",
    confirm: submitted && !fields.confirm ? "Please confirm your password" : submitted && fields.password !== fields.confirm ? "Passwords don't match" : apiErrors.confirmPassword ?? "",
  };
  const createAccount = async () => {
    if (submissionPending.current) return;
    setSubmitted(true);
    if (!fields.name || !fields.username || !fields.email || !fields.password || !fields.confirm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) || fields.password.length < 8 || fields.password !== fields.confirm) return;
    setStatus("loading");
    setApiErrors({});
    setApiMessage("");
    submissionPending.current = true;
    try {
      await authService.register({ name: fields.name, username: fields.username, email: fields.email, password: fields.password, confirmPassword: fields.confirm, role });
      setStatus("success");
    } catch (error) {
      setApiErrors(error instanceof ApiError && error.status < 500 ? error.errors ?? {} : {});
      setApiMessage(authErrorMessage(error));
      setStatus("idle");
    } finally {
      submissionPending.current = false;
    }
  };
  if (status === "success") return <div className="registration-page"><button className="auth-back" onClick={()=>go("Home")}><Icon name="arrow" /> Back to Home</button><section className="registration-success"><span>✓</span><p className="eyebrow">WELCOME TO RENTNEST</p><h1>Account created successfully</h1><p>Your {role === "renter" ? "renter" : "property owner"} account is ready. Let's take you to the right place.</p><div className={`success-role role-${role}`}><Icon name={role === "renter" ? "search" : "building"} /><div><small>YOUR ACCOUNT TYPE</small><strong>{role === "renter" ? "Renter" : "Property Owner"}</strong></div></div><Button onClick={()=>go("Login")}>Continue to Login <Icon name="arrow" /></Button></section></div>;
  return <div className="registration-page"><button className="auth-back" onClick={()=>go("Home")}><Icon name="arrow" /> Back to Home</button><div className="registration-glow glow-one" /><div className="registration-glow glow-two" />
    <section className="registration-card"><button className="brand registration-brand" onClick={()=>go("Home")}><span className="brand-mark"><i /><i /></span><strong>RentNest</strong></button><div className="registration-heading"><p className="eyebrow">CREATE YOUR ACCOUNT</p><h1>Start your RentNest journey</h1><p>Choose how you'd like to use RentNest, then tell us a little about yourself.</p></div>
      <div className="registration-roles"><button className={role==="renter"?"selected":""} onClick={()=>setRole("renter")}><span><Icon name="search" /></span><div><small>RENTER</small><strong>I want to find a home</strong><p>Search properties and request bookings.</p></div><i /></button><button className={role==="owner"?"selected":""} onClick={()=>setRole("owner")}><span><Icon name="building" /></span><div><small>PROPERTY OWNER</small><strong>I want to rent out my property</strong><p>Create listings and manage rentals.</p></div><i /></button></div>
      {apiMessage&&<FormError message={apiMessage}/>}
      <form className="registration-form" onSubmit={e=>{e.preventDefault();createAccount();}} noValidate>
        <label className={`auth-field ${errors.name?"has-error":""}`}><span>Full Name</span><input value={fields.name} onChange={e=>setField("name",e.target.value)} placeholder="Enter your full name" />{errors.name&&<small>{errors.name}</small>}</label>
        <label className={`auth-field ${errors.username?"has-error":""}`}><span>Username</span><input value={fields.username} onChange={e=>setField("username",e.target.value)} placeholder="Choose a username" />{errors.username&&<small>{errors.username}</small>}</label>
        <label className={`auth-field wide ${errors.email?"has-error":""}`}><span>Email Address</span><input type="email" value={fields.email} onChange={e=>setField("email",e.target.value)} placeholder="example@email.com" />{errors.email&&<small>{errors.email}</small>}</label>
        <label className={`auth-field ${errors.password?"has-error":""}`}><span>Password</span><input type="password" value={fields.password} onChange={e=>setField("password",e.target.value)} placeholder="At least 8 characters" />{errors.password&&<small>{errors.password}</small>}</label>
        <label className={`auth-field ${errors.confirm?"has-error":""}`}><span>Confirm Password</span><input type="password" value={fields.confirm} onChange={e=>setField("confirm",e.target.value)} placeholder="Repeat your password" />{errors.confirm&&<small>{errors.confirm}</small>}</label>
        <button className={`button button-primary registration-submit ${status==="loading"?"is-loading":""}`} disabled={status==="loading"}>{status==="loading"?<><i /> Creating account...</>:<>Create Account <Icon name="arrow" /></>}</button>
      </form>
      <p className="registration-login">Already have an account? <button onClick={()=>go("Login")}>Login</button></p>
    </section>
  </div>;
}

function ForgotPasswordPage({go}:{go:(page:string)=>void}) {
  const [email,setEmail]=useState("");const [token,setToken]=useState(()=>new URLSearchParams(window.location.search).get("token")||"");
  const [password,setPassword]=useState("");const [confirm,setConfirm]=useState("");const [step,setStep]=useState<"request"|"sent"|"reset"|"success">(()=>token?"reset":"request");const [pending,setPending]=useState(false);const [error,setError]=useState("");
  const submit=async()=>{if(pending)return;setPending(true);setError("");try{if(step==="request"){await authService.forgotPassword({email});setStep("sent");}else{await authService.resetPassword({token,newPassword:password,confirmNewPassword:confirm});setStep("success");}}catch(e){setError(authErrorMessage(e));}finally{setPending(false);}};
  return <div className="recovery-page"><button className="auth-back" onClick={()=>go("Home")}><Icon name="arrow"/>Back to Home</button><section className="recovery-card"><button className="brand recovery-brand" onClick={()=>go("Home")}><span className="brand-mark"><i/><i/></span><strong>RentNest</strong></button><div className="recovery-content">{error&&<FormError message={error}/>} {step==="request"||step==="reset"?<><div className="recovery-icon"><Icon name="mail"/></div><p className="eyebrow">ACCOUNT RECOVERY</p><h1>{step==="request"?"Forgot Password?":"Reset your password"}</h1><form onSubmit={e=>{e.preventDefault();void submit();}}>{step==="request"?<label className="auth-field"><span>Email Address</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>:<>{([["Reset Token",token,setToken],["New Password",password,setPassword],["Confirm Password",confirm,setConfirm]] as const).map(([label,value,set])=><label className="auth-field" key={label}><span>{label}</span><input type={label==="Reset Token"?"text":"password"} value={value} onChange={e=>set(e.target.value)} required/></label>)}</>}<Button disabled={pending}>{pending?"Submitting...":step==="request"?"Send Reset Link":"Update Password"}</Button></form><button className="recovery-link" onClick={()=>setStep(step==="request"?"reset":"request")}>{step==="request"?"I have a reset token":"Request a new token"}</button></>:step==="sent"?<><h1>Check your reset instructions</h1><p>The request was accepted. Email delivery is not configured in this development app. A valid reset token is required to reset a password.</p><Button onClick={()=>setStep("reset")}>Enter Reset Token</Button></>:<><h1>Password changed successfully</h1><p>You can now sign in using your new password.</p></>}<Button variant="secondary" onClick={()=>go("Login")}>Return to Login</Button></div></section></div>;
}

function AccessDeniedPage({ go }: { go: (page: string) => void }) {
  const { user } = useAuth();
  return <ErrorState type="permission" fullPage title="You don't have permission to access this page." description="Your current account role cannot open this workspace. Contact RentNest support if you believe this is a mistake." primaryLabel={user ? "Return Dashboard" : "Login"} onPrimary={()=>go(user ? dashboards[user.role] : "Login")}/>;
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    <section className="ds-section"><div className="ds-section-head"><span>05</span><div><h2>Property cards</h2><p>A responsive marketplace primitive with consistent information hierarchy.</p></div></div>
      <div className="property-grid ds-properties"><PropertyCard home={showcaseHomes[0]} saved={false} onSave={() => {}} /><PropertyCard home={showcaseHomes[1]} saved onSave={() => {}} /><article className="property-card unavailable-card"><div className="property-image"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={showcaseHomes[2].image} alt="" /><Badge tone="neutral">Unavailable</Badge></div><div className="property-body"><h3>{showcaseHomes[2].title}</h3><p className="location">{showcaseHomes[2].place}</p><Button variant="secondary">View details</Button></div></article><article className="property-card skeleton-card"><div className="skeleton skeleton-image" /><div className="property-body"><div className="skeleton line wide" /><div className="skeleton line" /><div className="skeleton line short" /></div></article></div>
    </section>
=======
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
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
    <section className="ds-section"><div className="ds-section-head"><span>08</span><div><h2>Data table</h2><p>Dense, scannable management interfaces for owners and administrators.</p></div></div>
      <div className="ds-table-toolbar"><div className="global-search"><Icon name="search" /><input placeholder="Search listings..." /></div><Button variant="secondary"><Icon name="sliders" /> Filters</Button><Button><Icon name="plus" /> Add listing</Button></div><div className="table-card"><div className="table-head ds-table"><span><input type="checkbox" /></span><span>Property</span><span>Status</span><span>Monthly rent</span><span>Updated</span><span /></div>{showcaseHomes.slice(0,2).map((home,i)=><div className="table-row ds-table" key={home.title}><span><input type="checkbox" /></span><div className="table-property"><img onError={event=>{event.currentTarget.src=rentalImage;}} src={home.image} alt="" /><span><strong>{home.title}</strong><small>{home.place}</small></span></div><Badge tone={i ? "warning" : "success"}>{i ? "Pending approval" : "Approved"}</Badge><strong>{home.price}</strong><span>{i ? "2 hours ago" : "Yesterday"}</span><button className="icon-button"><Icon name="more" /></button></div>)}</div><div className="ds-pagination"><span>Showing 1–2 of 24 listings</span><div><Button variant="secondary">Previous</Button><Button variant="secondary">Next</Button></div></div>
    </section>
  </div>;
=======
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
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
  const { user, isAuthenticated, isLoading, error: authError, refreshUser, clearAuthenticatedUser } = useAuth();
  const pendingPage = useRef<string | null>(null);
  const [ownerIntent, setOwnerIntent] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const logoutLock = useRef(false);
  const [appLoading,setAppLoading]=useState(true);
  const [page, updatePage] = useState(readPage);
  const setPage = useCallback((destination: string) => {
    updatePage(destination);
    const hash = encodeURIComponent(destination);
    if (window.location.hash.slice(1) !== hash) window.location.hash = hash;
  }, []);
  useEffect(() => {
    const syncPage = () => updatePage(readPage());
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);
  useEffect(() => {
    if (isLoading || authError) return;
    const expected = requiredRole(page);
    if (expected && !isAuthenticated) {
      pendingPage.current = page;
      setPage("Login");
    } else if (expected && user?.role !== expected) {
      setPage("Access denied");
    }
  }, [page, user, isAuthenticated, isLoading, authError, setPage]);
  useEffect(()=>{const denied=()=>setPage("Access denied");window.addEventListener("rentnest:access-denied",denied);return()=>window.removeEventListener("rentnest:access-denied",denied);},[setPage]);
  const finishLogin = (authenticatedUser: AuthUser) => {
    const intended = pendingPage.current;
    pendingPage.current = null;
    setPage(intended && (!requiredRole(intended) || requiredRole(intended) === authenticatedUser.role)
      ? intended : dashboards[authenticatedUser.role]);
  };
  const requireRenter = (destination: string, action?: () => void) => {
    if (!isAuthenticated) { pendingPage.current = destination; setPage("Login"); }
    else if (user?.role !== "renter") setPage("Access denied");
    else if (action) action();
    else setPage(destination);
  };
  const listProperty = () => {
    if (!isAuthenticated) { setOwnerIntent(true); pendingPage.current = "Owner add property"; setPage("Register"); }
    else setPage(user?.role === "owner" ? "Owner add property" : "Access denied");
  };
  const performLogout = async () => {
    if (logoutLock.current) return;
    logoutLock.current = true;
    setLogoutPending(true);
    setLogoutError("");
    try {
      await authService.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        setLogoutError(authErrorMessage(error));
        setLogoutPending(false);
        logoutLock.current = false;
        return;
      }
    }
    clearAuthenticatedUser();
    pendingPage.current = null;
    setSaved([]);
    setSessionMenuOpen(false);
    setNotificationsOpen(false);
    setMobileNavOpen(false);
    setLogoutOpen(false);
    setLogoutPending(false);
    logoutLock.current = false;
    setPage("Home");
  };
  const [saved, setSaved] = useState<number[]>([]);
  const [selectedHome, setSelectedHome] = useState(()=>Number(sessionStorage.getItem("rentnest:property-id"))||0);
  const [propertyScope,setPropertyScope]=useState<PropertyScope>(()=>{const stored=sessionStorage.getItem("rentnest:property-scope");return stored==="owner"||stored==="admin"?stored:"public";});
  const [selectedBooking, setSelectedBooking] = useState(()=>Number(sessionStorage.getItem("rentnest:booking-id"))||0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNavOpen,setMobileNavOpen]=useState(false);
  const notificationData=useApiData(()=>user?workspaceService.notifications():Promise.resolve([]),"notifications-"+(user?.id??"guest"));
  const notifications:AppNotification[]=(notificationData.data||[]).map(n=>({id:n.id,icon:n.category==="booking"?"calendar":n.category==="message"?"message":"building",title:n.title,message:n.message,time:new Date(n.createdAt).toLocaleString(),read:!!n.readAt,tone:n.category==="message"?"brand":"neutral",category:n.category==="booking"?"Booking":n.category==="message"?"Messages":"Listings"}));
  const summaryData=useApiData(()=>user?workspaceService.summary():Promise.resolve(null),"workspace-summary-"+(user?.id??"guest"));
  useEffect(()=>{if(!user)return;const timer=window.setInterval(()=>{notificationData.reload();summaryData.reload();},15000);return()=>window.clearInterval(timer);},[user?.id,notificationData.reload,summaryData.reload]);
  const markRead=(id:number)=>{void workspaceService.readNotification(id).then(()=>workspaceChanged()).catch(e=>setActionError(authErrorMessage(e)));};
  const markAll=()=>{void workspaceService.readAllNotifications().then(()=>workspaceChanged()).catch(e=>setActionError(authErrorMessage(e)));};
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  useEffect(() => {
    setSaved([]);
    setSessionMenuOpen(false);
    setNotificationsOpen(false);
  }, [user?.id]);
  useEffect(()=>{const timer=window.setTimeout(()=>setAppLoading(false),520);return()=>window.clearTimeout(timer);},[]);
  const favorites = useApiData(()=>user?.role === "renter" ? favoriteService.list() : Promise.resolve([] as Property[]), "favorite-identity-"+(user?.id??"guest"));
  useEffect(()=>{setSaved(favorites.data?.map(p=>p.id)??[]);},[favorites.data,user?.id]);
  const favoriteLock=useRef(new Set<number>());
  const [actionError,setActionError]=useState("");
  const toggleSaved = (id: number) => requireRenter("Saved homes", () => {
    if(favoriteLock.current.has(id))return;
    favoriteLock.current.add(id);setActionError("");
    const mutation=saved.includes(id)?favoriteService.remove(id):favoriteService.add(id);
    void mutation.then(()=>{favorites.reload();workspaceChanged();}).catch(error=>setActionError(authErrorMessage(error))).finally(()=>favoriteLock.current.delete(id));
  });
  const withFeedback=(content:ReactNode)=><>{actionError&&<div className="edit-save-toast" role="alert"><FormError message={actionError}/><button onClick={()=>setActionError("")}>Dismiss</button></div>}{content}</>;
  const viewHome = (id: number, scope:PropertyScope="public") => { setSelectedHome(id); sessionStorage.setItem("rentnest:property-id",String(id));setPropertyScope(scope);sessionStorage.setItem("rentnest:property-scope",scope); setPage("Property details"); };
  const editHome = (id: number) => { setSelectedHome(id);sessionStorage.setItem("rentnest:property-id",String(id)); setPage("Owner edit property"); };
  const viewBooking = (id: number, scope:BookingScope="renter") => { setSelectedBooking(id);sessionStorage.setItem("rentnest:booking-id",String(id));setPage(scope==="owner"?"Owner booking details":"Booking details"); };
  const role = user?.role === "admin" ? "Admin" : user?.role === "owner" ? "Owner" : user?.role === "renter" ? "Renter" : null;
  const accountName = user?.name ?? "";
  const accountInitials = userInitials(accountName);
  const unreadNotificationCount=summaryData.data?.unreadNotifications??notifications.filter(item=>!item.read).length;
  const pages: Record<string, ReactNode> = {
    Discover: <Discover saved={saved} toggleSaved={toggleSaved} viewHome={viewHome} />,
    "Renter dashboard": <RenterDashboard saved={saved} toggleSaved={toggleSaved} go={setPage} viewHome={viewHome} />,
    "Saved homes": <Saved saved={saved} toggleSaved={toggleSaved} go={setPage} viewHome={viewHome} />,
    Bookings: <Bookings go={setPage} viewBooking={viewBooking} />,
    "Booking details": <BookingDetailsPage bookingId={selectedBooking} go={setPage} viewHome={viewHome} />,
    Messages: <Messages key="renter-messages" viewHome={viewHome} go={setPage} />,
    "Owner messages": <Messages key="owner-messages" viewHome={viewHome} ownerMode go={setPage} />,
    "Owner earnings": <OwnerEarningsPage />,
    Notifications: <NotificationsPage go={setPage} notifications={notifications} markRead={markRead} markAll={markAll} loading={notificationData.loading} error={notificationData.error} retry={notificationData.reload} dashboardPage="Renter dashboard" />,
    "Owner notifications": <NotificationsPage go={setPage} notifications={notifications} markRead={markRead} markAll={markAll} loading={notificationData.loading} error={notificationData.error} retry={notificationData.reload} dashboardPage="Owner workspace" />,
    "Admin notifications": <NotificationsPage go={setPage} notifications={notifications} markRead={markRead} markAll={markAll} loading={notificationData.loading} error={notificationData.error} retry={notificationData.reload} dashboardPage="Admin overview" />,
    "Owner workspace": <Owner go={setPage} viewHome={id=>viewHome(id,"owner")} editHome={editHome} />,
    "Owner listings": <OwnerListingsPage viewHome={id=>viewHome(id,"owner")} editHome={editHome} go={setPage} />,
    "Owner add property": <AddPropertyWizard go={setPage} />,
    "Owner edit property": <EditPropertyPage propertyId={selectedHome} go={setPage} />,
    "Owner booking requests": <OwnerBookingRequestsPage go={setPage} viewBooking={id=>viewBooking(id,"owner")} />,
    "Owner booking details": <OwnerBookingDetailsPage go={setPage} bookingId={selectedBooking} viewHome={id=>viewHome(id,"owner")} />,
    "Admin overview": <Admin go={setPage} />,
    "Admin users": <AdminUserManagement />,
    "Admin listings": <AdminListingManagement go={setPage} viewHome={id=>viewHome(id,"admin")} />,
    "Admin bookings": <AdminBookingManagement go={setPage} viewHome={id=>viewHome(id,"admin")} />,
    "Admin payments": <AdminPaymentsReports />,
    "Admin analytics": <AdminAnalytics />,
    "Admin logs": <AdminActivityLogs />,
    "Admin settings": <AdminSystemSettings />,
    Settings: <Settings key={`renter-settings-${user?.id}`} go={setPage} onLogout={()=>{setLogoutError("");setLogoutOpen(true);}} />,
    "Owner profile": <Settings key={`owner-settings-${user?.id}`} go={setPage} onLogout={()=>{setLogoutError("");setLogoutOpen(true);}} ownerMode />,
    "Design system": <DesignSystem />,
  };
  if(appLoading || isLoading)return <PageLoader/>;
  if (requiredRole(page) && authError) return <ErrorState type="network" fullPage title="Unable to restore your session." description={authError.message} primaryLabel="Retry" onPrimary={()=>void refreshUser()} secondaryLabel="Go Home" onSecondary={()=>setPage("Home")}/>;
  if (requiredRole(page) && !isAuthenticated) return <AuthPage mode="login" go={setPage} onLogin={finishLogin} />;
  if (requiredRole(page) && user?.role !== requiredRole(page)) return <AccessDeniedPage go={setPage} />;
  if (page === "Discover") return withFeedback(<BrowsePage go={setPage} saved={saved} toggleSaved={toggleSaved} viewHome={viewHome} />);
  if (page === "Home") return withFeedback(<Landing go={setPage} listProperty={listProperty} saved={saved} toggleSaved={toggleSaved} viewHome={viewHome} />);
  if (page === "About") return <AboutPage go={setPage} />;
  if (page === "Property details") return withFeedback(<PropertyDetailsPage propertyId={selectedHome} scope={propertyScope} go={setPage} saved={saved.includes(selectedHome)} savedPropertyIds={saved} onSave={()=>toggleSaved(selectedHome)} viewHome={viewHome} onSaveHome={toggleSaved} onBook={()=>requireRenter("Property details")} onMessage={()=>requireRenter("Property details",()=>{void workspaceService.startConversation(selectedHome).then(c=>{sessionStorage.setItem("rentnest:conversation-id",String(c.id));setPage("Messages");workspaceChanged();}).catch(e=>setActionError(authErrorMessage(e)));})} onBooked={viewBooking}/>);
  if (page === "Login") return <AuthPage mode="login" go={setPage} onLogin={finishLogin} />;
  if (page === "Register") return <RegistrationPage go={setPage} initialRole={ownerIntent ? "owner" : "renter"} />;
  if (page === "Forgot password") return <ForgotPasswordPage go={setPage} />;
  if (page === "Access denied") return <AccessDeniedPage go={setPage} />;
  if (page === "Session expired") return <SessionExpiredPage go={setPage} />;
  if (page.startsWith("Redirect ")) return <RoleRedirectPage role={page.replace("Redirect ","") as "Renter"|"Owner"|"Admin"} go={setPage} />;
  if (!pages[page]) return <ErrorState type="not-found" fullPage title="Page not found." description="The page may have moved or the address may be incorrect." primaryLabel="Go Home" onPrimary={()=>setPage("Home")} secondaryLabel="Back" onSecondary={()=>window.history.back()}/>;
  if (!role || !user) return <PageLoader/>;
  return <div className={`app-shell role-${role.toLowerCase()}`}>
    <aside className={`sidebar ${mobileNavOpen?"mobile-open":""}`}>
      <button className="brand" onClick={() => setPage("Home")}><span className="brand-mark"><i /><i /></span><strong>{role==="Admin"?"RentNest Admin":"RentNest"}</strong></button>
      <nav onClick={()=>setMobileNavOpen(false)}>
        {role==="Renter"?<><p>RENTER</p><NavItem icon="home" label="Dashboard" active={page==="Renter dashboard"} onClick={()=>setPage("Renter dashboard")} /><NavItem icon="search" label="Discover Properties" onClick={()=>setPage("Discover")} /><NavItem icon="heart" label="Favorites" active={page==="Saved homes"} onClick={()=>setPage("Saved homes")} badge={String(saved.length)} /><NavItem icon="calendar" label="My Bookings" active={page==="Bookings"||page==="Booking details"} onClick={()=>setPage("Bookings")} /><NavItem icon="message" label="Messages" active={page==="Messages"} onClick={()=>setPage("Messages")} badge={summaryData.data?.unreadMessages?String(summaryData.data.unreadMessages):undefined} /><NavItem icon="bell" label="Notifications" active={page==="Notifications"} onClick={()=>setPage("Notifications")} badge={unreadNotificationCount?String(unreadNotificationCount):undefined} /><NavItem icon="users" label="Profile" active={page==="Settings"} onClick={()=>setPage("Settings")} /></>:role==="Owner"?<><p>OWNER</p><NavItem icon="home" label="Dashboard" active={page==="Owner workspace"} onClick={()=>setPage("Owner workspace")} /><NavItem icon="building" label="My Listings" active={page==="Owner listings"||page==="Owner add property"||page==="Owner edit property"} onClick={()=>setPage("Owner listings")} /><NavItem icon="calendar" label="Booking Requests" active={page==="Owner booking requests"||page==="Owner booking details"} onClick={()=>setPage("Owner booking requests")} badge={summaryData.data?.pending?String(summaryData.data.pending):undefined} /><NavItem icon="message" label="Messages" active={page==="Owner messages"} onClick={()=>setPage("Owner messages")} badge={summaryData.data?.unreadMessages?String(summaryData.data.unreadMessages):undefined} /><NavItem icon="star" label="Payments" active={page==="Owner earnings"} onClick={()=>setPage("Owner earnings")} /><NavItem icon="users" label="Profile" active={page==="Owner profile"} onClick={()=>setPage("Owner profile")} /></>:<><p>ADMINISTRATION</p><NavItem icon="home" label="Dashboard" active={page==="Admin overview"} onClick={()=>setPage("Admin overview")} /><NavItem icon="users" label="User Management" active={page==="Admin users"} onClick={()=>setPage("Admin users")} /><NavItem icon="building" label="Listing Management" active={page==="Admin listings"} onClick={()=>setPage("Admin listings")} badge={summaryData.data?.pending?String(summaryData.data.pending):undefined} /><NavItem icon="calendar" label="Booking Management" active={page==="Admin bookings"} onClick={()=>setPage("Admin bookings")} /><NavItem icon="star" label="Payments & Reports" active={page==="Admin payments"} onClick={()=>setPage("Admin payments")} /><NavItem icon="sliders" label="Analytics" active={page==="Admin analytics"} onClick={()=>setPage("Admin analytics")} /><NavItem icon="more" label="Activity Logs" active={page==="Admin logs"} onClick={()=>setPage("Admin logs")} /><NavItem icon="settings" label="Settings" active={page==="Admin settings"} onClick={()=>setPage("Admin settings")} /></>}
      </nav>
      <div className="sidebar-bottom"><div className="user-card"><span className="avatar profile">{accountInitials}</span><span><strong>{accountName}</strong><small className={`role-badge ${role.toLowerCase()}`}>{role}</small></span><button className="sidebar-logout" onClick={()=>setLogoutOpen(true)}><Icon name="logout" size={16} /><small>Logout</small></button></div></div>
    </aside>
    {mobileNavOpen&&<button className="sidebar-drawer-backdrop" onClick={()=>setMobileNavOpen(false)} aria-label="Close navigation"/>}
    <div className="mobile-top"><div className="mobile-brand-group"><button className="hamburger-button" onClick={()=>setMobileNavOpen(true)} aria-label="Open navigation menu"><i/><i/><i/></button><button className="brand" onClick={()=>setPage(role==="Renter"?"Renter dashboard":role==="Owner"?"Owner workspace":"Admin overview")}><span className="brand-mark"><i /><i /></span><strong>{role==="Admin"?"RentNest Admin":"RentNest"}</strong></button></div><div><span className={`role-badge ${role.toLowerCase()}`}>{role}</span><button className={`icon-button notification ${unreadNotificationCount?"has-unread":""}`} onClick={()=>setPage(role==="Owner"?"Owner notifications":role==="Admin"?"Admin notifications":"Notifications")}><Icon name="bell" />{unreadNotificationCount>0&&<b>{unreadNotificationCount}</b>}</button><span className="avatar">{accountInitials}</span></div></div>
    <MobileBottomNav role={role} page={page} go={setPage}/>
    <main><div className="topbar">{page==="Renter dashboard"&&<div className="dashboard-greeting"><small>{new Intl.DateTimeFormat("en-BD",{timeZone:"Asia/Dhaka",weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase()}</small><strong>Good morning, {user.name.split(" ")[0]}</strong></div>}{page==="Owner workspace"&&<div className="dashboard-greeting"><small>PROPERTY OWNER</small><strong>Welcome back, {user.name.split(" ")[0]}</strong></div>}{page==="Admin overview"&&<div className="dashboard-greeting admin-top-title"><small>PLATFORM ADMINISTRATION</small><strong>Admin Dashboard</strong></div>}{page==="Admin users"&&<div className="dashboard-greeting admin-top-title"><small>ADMINISTRATION</small><strong>User Management</strong></div>}{page==="Admin listings"&&<div className="dashboard-greeting admin-top-title"><small>CONTENT MODERATION</small><strong>Listing Management</strong></div>}{page==="Admin bookings"&&<div className="dashboard-greeting admin-top-title"><small>PLATFORM OPERATIONS</small><strong>Booking Management</strong></div>}{page==="Admin payments"&&<div className="dashboard-greeting admin-top-title"><small>FINANCIAL OPERATIONS</small><strong>Payments & Reports</strong></div>}{page==="Admin analytics"&&<div className="dashboard-greeting admin-top-title"><small>BUSINESS INTELLIGENCE</small><strong>Analytics Dashboard</strong></div>}{page==="Admin logs"&&<div className="dashboard-greeting admin-top-title"><small>SECURITY & COMPLIANCE</small><strong>Activity Logs</strong></div>}{page==="Admin settings"&&<div className="dashboard-greeting admin-top-title"><small>PLATFORM CONFIGURATION</small><strong>System Settings</strong></div>}<span className={`workspace-label ${page==="Renter dashboard"||page==="Owner workspace"||role==="Admin"?"dashboard-hidden":""}`}><i />{role} workspace</span><div className={`global-search ${page==="Renter dashboard"||page==="Owner workspace"?"dashboard-hidden":""}`}><Icon name="search" /><input placeholder={role==="Admin"?"Search users by name or email...":"Search available properties..."} onKeyDown={event=>{if(event.key!=="Enter")return;const search=event.currentTarget.value.trim();if(role==="Admin"){sessionStorage.setItem("rentnest:admin-user-search",search);setPage("Admin users");}else{sessionStorage.setItem("rentnest:browse-filters",JSON.stringify({location:search}));setPage("Discover");}}} /></div>{page==="Renter dashboard"&&<button className="icon-button header-search"><Icon name="search" /></button>}<div className="notification-wrap"><button className={`icon-button notification ${unreadNotificationCount?"has-unread":""}`} onClick={() => setNotificationsOpen(open => !open)} aria-label={`${unreadNotificationCount} unread notifications`}><Icon name="bell" />{unreadNotificationCount>0&&<b>{unreadNotificationCount>9?"9+":unreadNotificationCount}</b>}</button>{notificationsOpen && <div className="notifications-popover"><div className="notification-popover-head"><span><strong>Notifications</strong><small>{unreadNotificationCount} unread</small></span><button onClick={markAll} disabled={!unreadNotificationCount}>Mark all as read</button></div><div className="notification-popover-list">{notifications.slice(0,4).map(item=><article className={item.read?"":"unread"} key={item.id} onClick={()=>markRead(item.id)}><span className={`popover-notification-icon ${item.tone}`}><Icon name={item.icon}/></span><p><small>{item.category}</small><strong>{item.title}</strong><span>{item.message}</span><time>{item.time}</time></p></article>)}</div><button className="view-notifications" onClick={()=>{setPage(role==="Owner"?"Owner notifications":role==="Admin"?"Admin notifications":"Notifications");setNotificationsOpen(false);}}>View all notifications <Icon name="arrow" size={13}/></button></div>}</div><div className="session-menu-wrap"><button className="topbar-profile" onClick={()=>setSessionMenuOpen(!sessionMenuOpen)}><span className="avatar">{accountInitials}</span><span><strong>{accountName}</strong><small className={`role-badge ${role.toLowerCase()}`}>{role}</small></span><Icon name="chevron" size={15} /></button>{sessionMenuOpen&&<div className="session-menu"><div className="session-menu-user"><span className="avatar profile">{accountInitials}</span><p><strong>{accountName}</strong><small>{user.email}</small></p></div><button onClick={()=>{setPage(role==="Renter"?"Renter dashboard":role==="Owner"?"Owner workspace":"Admin overview");setSessionMenuOpen(false);}}><Icon name="home" /> Dashboard</button><button onClick={()=>{setPage(role==="Owner"?"Owner profile":role==="Admin"?"Admin settings":"Settings");setSessionMenuOpen(false);}}><Icon name="settings" /> Account settings</button><button onClick={()=>{setPage(role==="Owner"?"Owner profile":role==="Admin"?"Admin settings":"Settings");setSessionMenuOpen(false);}}><Icon name="lock" /> Session & security</button><button className="session-logout" onClick={()=>{setLogoutOpen(true);setSessionMenuOpen(false);}}><Icon name="logout" /> Logout</button></div>}</div></div><div className="content">{withFeedback(pages[page])}</div></main>
    {logoutOpen&&<div className="modal-backdrop" role="presentation" onMouseDown={()=>setLogoutOpen(false)}><section className="modal logout-modal" role="dialog" aria-modal="true" onMouseDown={e=>e.stopPropagation()}><div className="modal-icon danger"><Icon name="logout" /></div><h2>Logout from RentNest?</h2><p className="modal-description">You will need to login again to access your account.</p><div className="logout-account"><span className="avatar profile">{accountInitials}</span><p><strong>{accountName}</strong><small className={`role-badge ${role.toLowerCase()}`}>{role}</small></p></div>{logoutError&&<FormError message={logoutError}/>}<div className="modal-actions"><Button variant="secondary" disabled={logoutPending} onClick={()=>setLogoutOpen(false)}>Cancel</Button><Button variant="destructive" disabled={logoutPending} onClick={()=>void performLogout()}>{logoutPending ? "Logging out..." : "Logout"}</Button></div></section></div>}
  </div>;
=======
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
>>>>>>> Stashed changes
}
