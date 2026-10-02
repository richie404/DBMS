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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const authRevision = useRef(0);

  const clearAuthenticatedUser = useCallback(() => {
    authRevision.current += 1;
    clearCsrfToken();
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    authRevision.current += 1;
    clearCsrfToken();
    setError(null);
    setUser(authenticatedUser);
    setIsLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const revision = ++authRevision.current;
    setIsLoading(true);
    try {
      const restoredUser = await authService.getCurrentUser();
      if (revision !== authRevision.current) return;
      clearCsrfToken();
      setUser(restoredUser);
      setError(null);
    } catch (caughtError) {
      if (revision !== authRevision.current) return;
      clearCsrfToken();
      setUser(null);
      if (caughtError instanceof ApiError && (caughtError.status === 401 || caughtError.status === 403)) {
        setError(null);
      } else {
        setError(caughtError instanceof Error ? caughtError : new Error("Unable to restore the current session."));
      }
    } finally {
      if (revision === authRevision.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
    const sessionEnded = () => clearAuthenticatedUser();
    const restoreOnFocus = () => { void refreshUser(); };
    window.addEventListener("rentnest:session-ended", sessionEnded);
    window.addEventListener("focus", restoreOnFocus);
    return () => {
      authRevision.current += 1;
      window.removeEventListener("rentnest:session-ended", sessionEnded);
      window.removeEventListener("focus", restoreOnFocus);
    };
  }, [refreshUser, clearAuthenticatedUser]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,
    refreshUser,
    setAuthenticatedUser,
    clearAuthenticatedUser,
  }), [user, isLoading, error, refreshUser, setAuthenticatedUser, clearAuthenticatedUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
