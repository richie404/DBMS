interface BookingList {
  bookings: Booking[]
  total: number
}
interface MessageOptions {
  after?: number
  before?: number
  signal?: AbortSignal
}
interface NoticeResponse {
  notifications: Notice[]
  unread: number
}
import { apiRequest } from "../lib/api"

export type BookingQuote = {
  owner?: import("./properties").PropertyOwner
  startDate: string
  endDate: string
  months: number
  monthlyRent: number
  depositAmount: number
  totalRent: number
  currency: string
}
export type Booking = {
  id: number
  bookingCode: string
  propertyId: number
  title: string
  location: string
  ownerId: number
  ownerName: string
  renterName: string
  startDate: string
  endDate: string
  monthlyRent: string
  depositAmount: string
  totalRent: string
  currency: string
  status: string
  decisionReason: string | null
}
export type Conversation = {
  listingOwnerChanged?: boolean
  id: number
  propertyId: number
  propertyTitle: string
  participantName: string
  participantAvatar: string | null
  lastMessage: string | null
  unread: number
  disabledAt: string | null
  disabledReason: string | null
}
export type Message = {
  id: number
  senderId: number
  text: string
  sentAt: string
  deliveredAt: string | null
  readAt: string | null
}
export type Notice = {
  id: number
  category: "booking" | "message" | "listing"
  title: string
  body: string
  propertyId: number | null
  bookingId: number | null
  conversationId: number | null
  readAt: string | null
  createdAt: string
}
export const rentalService = {
  quote(
    propertyId: number,
    startDate: string,
    months: number,
    signal?: AbortSignal,
  ) {
    return apiRequest<{ quote: BookingQuote }>(
      `/bookings/quote?${new URLSearchParams({ propertyId: String(propertyId), startDate, months: String(months) })}`,
      { signal },
    )
  },
  book(propertyId: number, quote: BookingQuote) {
    return apiRequest<{ booking: Booking }>("/bookings", {
      method: "POST",
      csrf: true,
      body: {
        propertyId,
        startDate: quote.startDate,
        endDate: quote.endDate,
        months: quote.months,
        quotedOwnerId: quote.owner?.id,
        quotedMonthlyRent: quote.monthlyRent,
        quotedDeposit: quote.depositAmount,
      },
    })
  },
  bookings(signal?: AbortSignal, filter = "") {
    return apiRequest<BookingList>(
      `/bookings?filter=${encodeURIComponent(filter)}`,
      { signal },
    )
  },
  decision(id: number, status: string, reason: string) {
    return apiRequest(`/bookings/${id}/decision`, {
      method: "PATCH",
      csrf: true,
      body: { status, reason },
    })
  },
  cancel(id: number) {
    return apiRequest(`/bookings/${id}/cancel`, { method: "PATCH", csrf: true })
  },
  startConversation(propertyId: number) {
    return apiRequest<{ conversationId: number }>("/conversations", {
      method: "POST",
      csrf: true,
      body: { propertyId },
    })
  },
  conversations(signal?: AbortSignal) {
    return apiRequest<{ conversations: Conversation[] }>("/conversations", {
      signal,
    })
  },
  messages(id: number, options: MessageOptions = {}) {
    const params = new URLSearchParams()
    if (options.after) params.set("after", String(options.after))
    if (options.before) params.set("before", String(options.before))
    return apiRequest<{
      messages: Message[]
      hasMore: boolean
      disabledAt: string | null
      disabledReason: string | null
    }>(`/conversations/${id}/messages?${params}`, { signal: options.signal })
  },
  send(id: number, text: string) {
    return apiRequest<{ message: Message }>(`/conversations/${id}/messages`, {
      method: "POST",
      csrf: true,
      body: { text },
    })
  },
  readMessages(id: number, messageIds: number[]) {
    return apiRequest(`/conversations/${id}/read`, {
      method: "PATCH",
      csrf: true,
      body: { messageIds },
    })
  },
  notifications(signal?: AbortSignal) {
    return apiRequest<NoticeResponse>("/notifications", { signal })
  },
  readNotice(id: number) {
    return apiRequest(`/notifications/${id}/read`, {
      method: "PATCH",
      csrf: true,
    })
  },
  readNotices() {
    return apiRequest("/notifications/read-all", {
      method: "PATCH",
      csrf: true,
    })
  },
}
