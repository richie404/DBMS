import {
  rentalService,
  type Notice,
  type Conversation as RentalConversation,
  type Message as RentalMessage,
} from "./rentals"
import type { DashboardSummary } from "../rentals/useDashboardSummary"
import { apiRequest } from "../lib/api"
import type { AuthUser } from "../types/auth"
export type NotificationRecord = Notice
export type Conversation = RentalConversation
export type MessageRecord = RentalMessage
export interface PaymentRecord {
  id: number
  reference: string | null
  bookingId: number | null
  recordType: "charge" | "payout" | "refund"
  amount: number
  currency: string
  status: string
  transactionAt: string | null
  createdAt: string
  notes: string | null
  propertyId: number | null
  title: string | null
  location: string | null
  image: string | null
  payerName: string | null
  payerRole: string | null
  payeeName: string | null
}
export interface ManagedUser extends AuthUser {
  createdAt: string
  properties: number
  bookings: number
  messages: number
}
export interface ActivityRecord {
  id: number
  action: string
  targetType: string | null
  targetId: number | null
  outcome: string
  description: string | null
  sourceIp: string | null
  createdAt: string
  actorName: string | null
  actorRole: string | null
}
export interface PlatformSettings {
  platformName: string
  supportEmail: string | null
  currency: string
  timezone: string
  reviewTargetHours: number
  sessionTimeoutMinutes: number
  maintenanceMode: boolean
}
export interface SessionRecord {
  id: number
  device: string | null
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string
  current: boolean
}
export interface Account {
  user: AuthUser & { createdAt: string; propertyCount: number }
  preferences: Record<string, boolean>
}
export interface Summary {
  unreadNotifications: number
  unreadMessages: number
  pending: number
}
export type Overview = import("../admin/AdminWorkspace").Overview
export interface Analytics {
  series: Record<"users" | "listings" | "bookings" | "revenue", {
    day: string
    value: number
  }[]>
  start: string
  end: string
  timezone: string
  currency: string
}
const mutate = (path: string, method: string, body?: unknown) =>
  apiRequest(path, { method, body, csrf: true })
export const workspaceService = {
  account: () => apiRequest<Account>("/account"),
  updateProfile: async (body: Partial<AuthUser>) =>
    (
      await apiRequest<{ user: AuthUser }>("/account", {
        method: "PATCH",
        body,
        csrf: true,
      })
    ).user,
  preferences: (body: Record<string, boolean>) =>
    mutate("/account/preferences", "PATCH", body),
  sessions: async () =>
    (await apiRequest<{ items: SessionRecord[] }>("/auth/sessions")).items,
  revokeSession: (id: number) => mutate(`/auth/sessions/${id}`, "DELETE"),
  revokeOthers: () => mutate("/auth/sessions/revoke-others", "POST"),
  notifications: async () =>
    (await rentalService.notifications()).notifications,
  readNotification: (id: number) =>
    mutate(`/notifications/${id}/read`, "PATCH"),
  readAllNotifications: () => mutate("/notifications/read-all", "PATCH"),
  summary: async () =>
    (await apiRequest<{ summary: DashboardSummary }>("/dashboard/summary"))
      .summary,
  conversations: async () =>
    (await rentalService.conversations()).conversations,
  startConversation: (propertyId: number) =>
    rentalService.startConversation(propertyId),
  messages: async (id: number) => (await rentalService.messages(id)).messages,
  readMessages: (id: number, messageIds: number[]) =>
    rentalService.readMessages(id, messageIds),
  sendMessage: (id: number, text: string) =>
    apiRequest(`/conversations/${id}/messages`, {
      method: "POST",
      body: { text },
      csrf: true,
    }),
  payments: async (scope: "owner" | "admin") =>
    (await apiRequest<{ items: PaymentRecord[] }>(`/${scope}/payments`)).items,
  users: async () =>
    (await apiRequest<{ items: ManagedUser[] }>("/admin/users")).items,
  userStatus: (id: number, status: string, reason?: string) =>
    mutate(`/admin/users/${id}/status`, "PATCH", { status, reason }),
  activity: async () =>
    (await apiRequest<{ items: ActivityRecord[] }>("/admin/activity")).items,
  overview: () => apiRequest<Overview>("/admin/overview"),
  analytics: (range: string) =>
    apiRequest<Analytics>(
      `/admin/analytics?range=${encodeURIComponent(range)}`,
    ),
  settings: async () =>
    (await apiRequest<{ settings: PlatformSettings | null }>("/admin/settings"))
      .settings,
  saveSettings: (body: Partial<PlatformSettings>) =>
    mutate("/admin/settings", "PATCH", body),
}
export function workspaceChanged() {
  window.dispatchEvent(new Event("rentnest:data-changed"))
}
