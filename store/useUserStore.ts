"use client";

import { create } from "zustand";
import type { Notification, UserRole } from "@/types";

type UserStore = {
  user: { id: string; name: string; email: string; avatar?: string } | null;
  role: UserRole;
  notifications: Notification[];
  setUser: (user: UserStore["user"], role: UserRole) => void;
  logout: () => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  role: "guest",
  notifications: [],
  setUser: (user, role) => set({ user, role }),
  logout: () => set({ user: null, role: "guest" }),
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications].slice(0, 20) })),
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map((item) => item.id === id ? { ...item, isRead: true } : item)
  }))
}));
