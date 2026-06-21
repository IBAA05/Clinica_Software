import { create } from "zustand"
import type { ClinicNotification } from "@/types"

interface NotificationState {
  items: ClinicNotification[]
  unreadCount: number
  setItems: (items: ClinicNotification[]) => void
  markRead: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  setItems: (items) =>
    set({
      items,
      unreadCount: items.filter((n) => n.status === "unread" || n.status === "pending").length,
    }),
  markRead: (id) =>
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, status: "read" as const } : n))
      return { items, unreadCount: items.filter((n) => n.status === "unread").length }
    }),
}))
