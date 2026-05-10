"use client";

import { create } from "zustand";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationsStore = {
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  pushNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  clear: () => void;
};

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  pushNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  markRead: (id) => set((state) => ({ notifications: state.notifications.map((item) => item.id === id ? { ...item, isRead: true } : item) })),
  clear: () => set({ notifications: [] })
}));
