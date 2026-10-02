import { useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthContext"
import { authService } from "../services/auth"
import { apiRequest } from "../lib/api"
import SessionSecurity from "./SessionSecurity"
import { useAdminData } from "../hooks/useDatabaseData"
const labels: Record<string, string> = {
  booking_notifications: "Booking updates",
  message_notifications: "New messages",
  favorite_notifications: "Favorite property updates",
  marketing_notifications: "RentNest news",
  security_alert_notifications: "Security alerts",
  moderation_queue_notifications: "Moderation queue",
  payment_incident_notifications: "Payment incidents",
  system_health_notifications: "System health",
  scheduled_report_notifications: "Scheduled reports",
}
export default function AccountSettings() {
  const { user, setAuthenticatedUser } = useAuth()
  const initial = () => ({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
  })
  const [fields, setFields] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState("")
  const account = useAdminData<{
    preferences: Record<string, boolean | number>
  }>("/account")
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  })
  const mounted = useRef(true)
  useEffect(
    () => () => {
      mounted.current = false
    },
    [],
  )
  const profile = async () => {
    setBusy(true)
    setError("")
    setSaved("")
    try {
      const u = await authService.updateProfile(fields)
      if (mounted.current) {
        setAuthenticatedUser(u)
        setSaved("Profile saved.")
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Unable to save profile")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  const preference = async (key: string, value: boolean) => {
    setBusy(true)
    setError("")
    setSaved("")
    try {
      await apiRequest("/account/preferences", {
        method: "PATCH",
        csrf: true,
        body: { [key]: value },
      })
      if (mounted.current) {
        account.refresh()
        setSaved("Preference saved.")
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Unable to save preference")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  const changePassword = async () => {
    setBusy(true)
    setError("")
    setSaved("")
    try {
      await authService.changePassword(password)
      if (mounted.current) {
        setPassword({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        })
        setSaved("Password updated. Other sessions were revoked.")
      }
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Unable to change password")
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  return (
    <div className="account-page">
      <div className="account-title">
        <p className="eyebrow">{user?.role.toUpperCase()} ACCOUNT</p>
        <h1>Profile & Settings</h1>
        <p>
          {user?.name} · {user?.email}
        </p>
      </div>
      {error && (
        <p className="form-error-message" role="alert">
          {error}
        </p>
      )}
      {saved && <p role="status">{saved}</p>}
      <section className="account-card">
        <h2>Personal information</h2>
        <div className="account-form-grid">
          {Object.entries(fields).map(([key, value]) => (
            <label key={key}>
              <span>{key === "avatarUrl" ? "Photo URL" : key}</span>
              <input
                value={value}
                type={
                  key === "email"
                    ? "email"
                    : key === "avatarUrl"
                      ? "url"
                      : "text"
                }
                placeholder={
                  key === "phone" || key === "avatarUrl"
                    ? "Not provided"
                    : undefined
                }
                onChange={(e) => {
                  setSaved("")
                  setFields({ ...fields, [key]: e.target.value })
                }}
              />
            </label>
          ))}
        </div>
        <div className="account-card-actions">
          <button
            className="button button-secondary"
            disabled={busy}
            onClick={() => {
              setFields(initial())
              setSaved("")
            }}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() => void profile()}
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </section>
      <section className="account-card">
        <h2>Notification preferences</h2>
        {account.error ? (
          <p role="alert">
            {account.error} <button onClick={account.refresh}>Retry</button>
          </p>
        ) : !account.data ? (
          <p>Loading preferences…</p>
        ) : !account.data.preferences ? (
          <p>No preferences record exists.</p>
        ) : (
          <div className="preference-list">
            {Object.entries(labels)
              .filter(
                ([key]) =>
                  user?.role === "admin" ||
                  [
                    "booking_notifications",
                    "message_notifications",
                    "favorite_notifications",
                    "marketing_notifications",
                  ].includes(key),
              )
              .map(([key, label]) => (
                <article key={key}>
                  <strong>{label}</strong>
                  <button
                    className={`toggle-switch ${
                      account.data!.preferences[key] ? "on" : ""
                    }`}
                    disabled={busy}
                    aria-label={label}
                    aria-pressed={Boolean(account.data!.preferences[key])}
                    onClick={() =>
                      void preference(key, !account.data!.preferences[key])
                    }
                  >
                    <i />
                  </button>
                </article>
              ))}
          </div>
        )}
      </section>
      <section className="account-card">
        <h2>Change password</h2>
        <div className="account-form-grid">
          {Object.entries(password).map(([key, value]) => (
            <label key={key}>
              <span>
                {key === "currentPassword"
                  ? "Current password"
                  : key === "newPassword"
                    ? "New password"
                    : "Confirm new password"}
              </span>
              <input
                type="password"
                autoComplete={
                  key === "currentPassword"
                    ? "current-password"
                    : "new-password"
                }
                value={value}
                onChange={(e) =>
                  setPassword({ ...password, [key]: e.target.value })
                }
              />
            </label>
          ))}
        </div>
        <button
          className="button button-primary"
          disabled={busy}
          onClick={() => void changePassword()}
        >
          Update password
        </button>
      </section>
      <section className="account-card">
        <SessionSecurity />
      </section>
    </div>
  )
}
