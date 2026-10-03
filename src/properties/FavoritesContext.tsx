import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useAuth } from "../auth/AuthContext"
import { propertyService, type Property } from "../services/properties"

type FavoritesState = {
  favorites: Property[]
  loading: boolean
  error: string
  refresh: () => Promise<void>
  toggle: (property: Property) => Promise<void>
  pending: Set<number>
}
const FavoritesContext = createContext<FavoritesState | null>(null)
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Property[]>([])
  const [loading, setLoading] = useState(Boolean(user))
  const [error, setError] = useState("")
  const [pending, setPending] = useState(new Set<number>())
  const pendingRef = useRef(new Set<number>())
  const mounted = useRef(true)
  const revision = useRef(0)
  const favoritesRef = useRef(favorites)
  favoritesRef.current = favorites
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      revision.current++
    }
  }, [])
  const refresh = useCallback(
    async (quiet = false) => {
      if (!user) return
      const request = ++revision.current
      if (!quiet) {
        setLoading(true)
        setError("")
      }
      try {
        const result = await propertyService.favorites()
        if (mounted.current && request === revision.current)
          setFavorites(result.properties)
      } catch (error) {
        if (mounted.current && request === revision.current)
          setError(
            error instanceof Error ? error.message : "Unable to load favorites",
          )
      } finally {
        if (mounted.current && request === revision.current) setLoading(false)
      }
    },
    [user?.id],
  )
  useEffect(() => {
    void refresh()
    const update = () => {
      if (!pendingRef.current.size) void refresh(true)
    }
    const timer = setInterval(update, 15000)
    window.addEventListener("focus", update)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", update)
    }
  }, [refresh])
  const toggle = async (property: Property) => {
    if (!user) throw new Error("Log in to save properties")
    if (user.role !== "renter")
      throw new Error("A renter account is required to save properties")
    if (loading) throw new Error("Please wait for your favorites to load")
    if (error)
      throw new Error("Retry loading your favorites before making changes")
    if (pendingRef.current.has(property.id)) return
    revision.current++
    pendingRef.current.add(property.id)
    setPending(new Set(pendingRef.current))
    const saved = favoritesRef.current.some((item) => item.id === property.id)
    try {
      if (saved) await propertyService.unsave(property.id)
      else await propertyService.save(property.id)
      if (mounted.current)
        setFavorites((current) =>
          saved
            ? current.filter((item) => item.id !== property.id)
            : [property, ...current.filter((item) => item.id !== property.id)],
        )
    } finally {
      pendingRef.current.delete(property.id)
      if (mounted.current) setPending(new Set(pendingRef.current))
    }
  }
  return (
    <FavoritesContext.Provider
      value={{ favorites, loading, error, refresh, toggle, pending }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}
export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error("FavoritesProvider is required")
  return context
}
