import { useEffect, useState } from "react"
import { apiRequest, ApiError } from "../lib/api"
import { useAuth } from "../auth/AuthContext"
export function useAdminData<T>(path: string, enabled = true) {
  const { user } = useAuth()
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({
    key: "",
  })
  const [revision, setRevision] = useState(0)
  const key = user?.id + ":" + path
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let busy = false,
      again = false
    const load = async () => {
      if (busy) {
        again = true
        return
      }
      busy = true
      try {
        const data = await apiRequest<T>(path, { signal: controller.signal })
        if (!controller.signal.aborted) setState({ key, data })
      } catch (e) {
        if (!controller.signal.aborted)
          setState({
            key,
            error:
              e instanceof ApiError && e.status === 403
                ? "Access denied"
                : e instanceof Error
                  ? e.message
                  : "Unable to load records",
          })
      } finally {
        busy = false
        if (again && !controller.signal.aborted) {
          again = false
          void load()
        }
      }
    }
    const refresh = () => void load()
    refresh()
    const timer = setInterval(refresh, 10000)
    window.addEventListener("focus", refresh)
    window.addEventListener("rentnest:data-changed", refresh)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("rentnest:data-changed", refresh)
    }
  }, [key, enabled, revision])
  return {
    ...(enabled && state.key === key ? state : {}),
    refresh: () => setRevision((n) => n + 1),
  }
}
