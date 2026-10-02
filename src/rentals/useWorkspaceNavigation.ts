import { useEffect, useState } from "react"

import { knownPages } from "../auth/navigation"

interface Options {
  filter?: string

  conversation?: number | null

  property?: number | null
}

const restored = new Set([
  "Renter dashboard",

  "Saved homes",

  "Bookings",

  "Messages",

  "Discover",

  "Listing details",

  "Owner workspace",

  "Owner booking requests",

  "Owner messages",

  "Owner listings",

  "Admin listings",

  "Admin bookings",
])

function read(fallback: string) {
  const params = new URLSearchParams(location.search)
  let requested =
    params.get("view") ||
    (() => {
      try {
        return decodeURIComponent(location.hash.slice(1))
      } catch {
        return ""
      }
    })()

  if (
    [requested, location.pathname].some(
      (value) =>
        value
          ?.toLowerCase()
          .replace(/^\/+|\/+$/g, "")
          .split("?")[0] === "about",
    )
  ) {
    history.replaceState(null, "", "/?view=Home")
    requested = "Home"
  }

  const number = (key: string) => {
    const n = Number(params.get(key))

    return Number.isSafeInteger(n) && n > 0 ? n : null
  }

  return {
    page: requested || fallback,

    filter: params.get("filter") || "",

    conversation: number("conversation"),

    property: number("property"),
  }
}

export function useWorkspaceNavigation(
  fallback: string,

  initialPropertyId?: number,
) {
  const [aboutRedirect] = useState(() =>
    [
      new URLSearchParams(location.search).get("view") ||
        (() => {
          try {
            return decodeURIComponent(location.hash.slice(1))
          } catch {
            return ""
          }
        })(),
      location.pathname,
    ].some(
      (value) =>
        value
          ?.toLowerCase()
          .replace(/^\/+|\/+$/g, "")
          .split("?")[0] === "about",
    ),
  )
  const [route, setRoute] = useState(() =>
    initialPropertyId && !aboutRedirect
      ? {
          page: "Listing details",

          filter: "",

          conversation: null,

          property: initialPropertyId,
        }
      : read(fallback),
  )

  useEffect(() => {
    if (!initialPropertyId || aboutRedirect) return

    const url = new URL(location.href)

    for (const key of ["view", "filter", "conversation", "property"])
      url.searchParams.delete(key)

    url.searchParams.set("view", "Listing details")

    url.searchParams.set("property", String(initialPropertyId))

    history.replaceState(null, "", url)
  }, [initialPropertyId, aboutRedirect])

  useEffect(() => {
    const pop = () => setRoute(read(fallback))

    window.addEventListener("popstate", pop)

    window.addEventListener("hashchange", pop)

    return () => {
      window.removeEventListener("popstate", pop)
      window.removeEventListener("hashchange", pop)
    }
  }, [fallback])

  const navigate = (page: string, options: Options = {}, replace = false) => {
    const url = new URL(location.href)

    url.hash = ""

    for (const key of ["view", "filter", "conversation", "property"])
      url.searchParams.delete(key)

    url.searchParams.set("view", page)

    if (options.filter) url.searchParams.set("filter", options.filter)

    if (options.conversation)
      url.searchParams.set("conversation", String(options.conversation))

    if (options.property)
      url.searchParams.set("property", String(options.property))

    history[replace ? "replaceState" : "pushState"]({fromView:route.page,fromFilter:route.filter}, "", url)

    setRoute(read(page))
  }

  return {
    ...route,

    navigate,

    setPage: (page: string) => navigate(page),

    setFilter: (filter: string) =>
      navigate(route.page, { filter, property: route.property }),

    selectConversation: (conversation: number | null) =>
      navigate(route.page, { filter: route.filter, conversation }),
  }
}
