import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { ApiError, invalidateAuthRequests } from "../lib/api"
import { authService } from "../services/auth"
import type { AuthUser } from "../types/auth"
type AuthContextValue = {
  user: AuthUser | null
  status: "checking" | "authenticated" | "guest"
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
  sessionExpired: boolean
  refreshUser: () => Promise<void>
  setAuthenticatedUser: (user: AuthUser) => void
  clearAuthenticatedUser: () => void
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthContextValue | null>(null)
const broadcast = () => {
  try {
    localStorage.setItem(
      "rentnest:auth-change",
      String(Date.now()) + Math.random(),
    )
  } catch {}
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [isLoading, setIsLoading] = useState(true),
    [error, setError] = useState<Error | null>(null),
    [sessionExpired, setSessionExpired] = useState(false)
  const revision = useRef(0),
    currentUser = useRef<AuthUser | null>(null)
  const clearAuthenticatedUser = useCallback(() => {
    revision.current++
    invalidateAuthRequests()
    try {
      if (currentUser.current) {
        localStorage.removeItem(`rentnest:searches:${currentUser.current.id}`)
        sessionStorage.removeItem("rentnest:property-return")
        sessionStorage.removeItem("rentnest:login-return")
      }
    } catch {}
    currentUser.current = null
    setUser(null)
    setError(null)
    setIsLoading(false)
  }, [])
  const setAuthenticatedUser = useCallback((value: AuthUser) => {
    if (!["renter", "owner", "admin"].includes(value.role))
      throw new Error("Unsupported account role")
    revision.current++
    if (currentUser.current?.id !== value.id) invalidateAuthRequests()
    currentUser.current = value
    setUser(value)
    setError(null)
    setIsLoading(false)
    setSessionExpired(false)
    broadcast()
  }, [])
  const refreshUser = useCallback(async () => {
    const attempt = ++revision.current
    try {
      const value = await authService.getCurrentUser()
      if (attempt !== revision.current) return
      if (!["renter", "owner", "admin"].includes(value.role))
        throw new Error("Unsupported account role")
      if (currentUser.current?.id !== value.id) invalidateAuthRequests()
      currentUser.current = value
      setUser(value)
      setError(null)
      setSessionExpired(false)
    } catch (caught) {
      if (attempt !== revision.current) return
      if (
        caught instanceof ApiError &&
        (caught.status === 401 ||
          (caught.status === 403 &&
            caught.message === "Account access is unavailable"))
      ) {
        const hadUser = Boolean(currentUser.current)
        clearAuthenticatedUser()
        setSessionExpired(hadUser)
      } else
        setError(
          caught instanceof Error
            ? caught
            : new Error("Unable to check your session"),
        )
    } finally {
      if (attempt === revision.current) setIsLoading(false)
    }
  }, [clearAuthenticatedUser])
  useEffect(() => {
    void refreshUser()
    return ()=>{revision.current++}
  }, [refreshUser])
  useEffect(() => {
    const expired = () => {
      const hadUser = Boolean(currentUser.current)
      clearAuthenticatedUser()
      setSessionExpired(hadUser)
      broadcast()
    }
    const check = () => {
      void refreshUser()
    }
    const sync = (event: StorageEvent) => {
      if (event.key === "rentnest:auth-change") {
        clearAuthenticatedUser()
        setIsLoading(true)
        void refreshUser()
      }
    }
    window.addEventListener("rentnest:session-expired", expired)
    window.addEventListener("rentnest:session-ended", expired)
    window.addEventListener("focus", check)
    window.addEventListener("storage", sync)
    const timer = window.setInterval(check, 60000)
    return () => {
      window.removeEventListener("rentnest:session-expired", expired)
      window.removeEventListener("rentnest:session-ended", expired)
      window.removeEventListener("focus", check)
      window.removeEventListener("storage", sync)
      clearInterval(timer)
    }
  }, [clearAuthenticatedUser, refreshUser])
  const logout = useCallback(async () => {
    revision.current++
    invalidateAuthRequests()
    setIsLoading(true)
    try {
      await authService.logout()
    } catch (caught) {
      if (!(caught instanceof ApiError && caught.status === 401)) {setIsLoading(false);throw caught}
    }
    clearAuthenticatedUser()
    setSessionExpired(false)
    try {
      sessionStorage.removeItem("rentnest:property-return")
      sessionStorage.removeItem("rentnest:login-return")
    } catch {}
    broadcast()
  }, [clearAuthenticatedUser])
  const value = useMemo(
    () => ({
      user,
      status: isLoading
        ? "checking" as const
        : user
          ? "authenticated" as const
          : "guest" as const,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      sessionExpired,
      refreshUser,
      setAuthenticatedUser,
      clearAuthenticatedUser,
      logout,
    }),
    [
      user,
      isLoading,
      error,
      sessionExpired,
      refreshUser,
      setAuthenticatedUser,
      clearAuthenticatedUser,
      logout,
    ],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used within AuthProvider.")
  return value
}
