import { useEffect, useState } from "react"
import { apiRequest } from "../lib/api"
export interface DashboardSummary {
  savedProperties: number
  activeBookings: number
  pendingRequests: number
  unreadMessages: number
  unreadConversations: number
  latestUnreadConversationId: number | null
}
export function useDashboardSummary(enabled: boolean) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!enabled) {
      setSummary(null)
      setError("")
      return
    }
    const controller = new AbortController()
    let fetching = false,
      again = false
    const refresh = async () => {
      if (fetching) {
        again = true
        return
      }
      fetching = true
      try {
        const result = await apiRequest<{ summary: DashboardSummary }>(
          "/dashboard/summary",
          { signal: controller.signal },
        )
        if (!controller.signal.aborted) {
          setSummary(result.summary)
          setError("")
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard counts",
          )
      } finally {
        fetching = false
        if (again && !controller.signal.aborted) {
          again = false
          void refresh()
        }
      }
    }
    const update = () => void refresh()
    update()
    const timer = setInterval(update, 5000)
    window.addEventListener("rentnest:data-changed", update)
    window.addEventListener("focus", update)
    return () => {
      controller.abort()
      clearInterval(timer)
      window.removeEventListener("rentnest:data-changed", update)
      window.removeEventListener("focus", update)
    }
  }, [enabled, retry])
  return { summary, error, refresh: () => setRetry((n) => n + 1) }
}
