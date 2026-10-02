import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, clearCsrfToken } from "../lib/api";
import { authService } from "../services/auth";
import type { AuthUser } from "../types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  clearAuthenticatedUser: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const revision = useRef(0);

  const clearAuthenticatedUser = useCallback(() => {
    revision.current++;
    clearCsrfToken();
    setUser(null);
  }, []);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    revision.current++;
    clearCsrfToken();
    setError(null);
    setUser(authenticatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentRevision = revision.current;
    try {
      const restoredUser = await authService.getCurrentUser();
      if (revision.current === currentRevision) setAuthenticatedUser(restoredUser);
    } catch (caughtError) {
      if (revision.current !== currentRevision) return;
      clearAuthenticatedUser();
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        setError(null);
      } else {
        setError(caughtError instanceof Error ? caughtError : new Error("Unable to restore the current session."));
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthenticatedUser, setAuthenticatedUser]);

  useEffect(() => { void refreshUser(); }, [refreshUser]);
  useEffect(() => {
    const expire = () => clearAuthenticatedUser();
    const check = () => { void refreshUser(); };
    window.addEventListener("rentnest:session-expired", expire);
    window.addEventListener("focus", check);
    const timer = window.setInterval(check, 60000);
    return () => { window.removeEventListener("rentnest:session-expired", expire); window.removeEventListener("focus", check); window.clearInterval(timer); };
  }, [clearAuthenticatedUser, refreshUser]);
  const logout = useCallback(async () => {
    try { await authService.logout(); clearAuthenticatedUser(); }
    catch (error) { if (error instanceof ApiError && error.status === 401) clearAuthenticatedUser(); else throw error; }
  }, [clearAuthenticatedUser]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    refreshUser,
    setAuthenticatedUser,
    clearAuthenticatedUser,
    logout,
  }), [user, isLoading, error, refreshUser, setAuthenticatedUser, clearAuthenticatedUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
