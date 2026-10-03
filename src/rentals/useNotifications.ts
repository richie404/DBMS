import { useCallback, useEffect, useRef, useState } from "react"
import { rentalService, type Notice } from "../services/rentals"

export function useNotifications(enabled: boolean) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  const revision = useRef(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    let fetching = false
    const refresh = async () => {
      if (fetching) return
      fetching = true
      const request = revision.current
      try {
        const result = await rentalService.notifications(controller.signal)
        if (!controller.signal.aborted && request === revision.current) {
          setNotices(result.notifications)
          setError("")
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load notifications",
          )
      } finally {
        fetching = false
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      revision.current++
    }
  }, [enabled, retry])
  const markRead = useCallback(async (id?: number) => {
    revision.current++
    try {
      if (id) await rentalService.readNotice(id)
      else await rentalService.readNotices()
      setNotices((current) =>
        current.map((item) =>
          !id || item.id === id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to mark notification read",
      )
    }
  }, [])
  return {
    notices,
    error,
    markRead,
    refresh: () => setRetry((value) => value + 1),
  }
}
