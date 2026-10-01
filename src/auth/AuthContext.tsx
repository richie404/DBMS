import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

  const clearAuthenticatedUser = useCallback(() => {
    clearCsrfToken();
    setUser(null);
  }, []);

  const setAuthenticatedUser = useCallback((authenticatedUser: AuthUser) => {
    clearCsrfToken();
    setError(null);
    setUser(authenticatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      setAuthenticatedUser(await authService.getCurrentUser());
    } catch (caughtError) {
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
