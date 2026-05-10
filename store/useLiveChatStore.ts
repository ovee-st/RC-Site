"use client";

import { create } from "zustand";
import type { LiveChatMessage, LiveChatSession } from "@/types/liveChat";

type LiveChatStore = {
  sessions: LiveChatSession[];
  messagesBySession: Record<string, LiveChatMessage[]>;
  activeSessionId: string | null;
  setSessions: (sessions: LiveChatSession[]) => void;
  upsertSession: (session: LiveChatSession) => void;
  setMessages: (sessionId: string, messages: LiveChatMessage[]) => void;
  addMessage: (message: LiveChatMessage) => void;
  selectSession: (sessionId: string | null) => void;
};

export const useLiveChatStore = create<LiveChatStore>((set) => ({
  sessions: [],
  messagesBySession: {},
  activeSessionId: null,
  setSessions: (sessions) => set((state) => ({
    sessions,
    activeSessionId: state.activeSessionId && sessions.some((session) => session.id === state.activeSessionId)
      ? state.activeSessionId
      : sessions[0]?.id || null
  })),
  upsertSession: (session) => set((state) => ({
    sessions: state.sessions.some((item) => item.id === session.id)
      ? state.sessions.map((item) => item.id === session.id ? session : item)
      : [session, ...state.sessions]
  })),
  setMessages: (sessionId, messages) => set((state) => ({
    messagesBySession: { ...state.messagesBySession, [sessionId]: messages }
  })),
  addMessage: (message) => set((state) => {
    const existing = state.messagesBySession[message.session_id] || [];
    if (existing.some((item) => item.id === message.id)) return state;
    return {
      messagesBySession: {
        ...state.messagesBySession,
        [message.session_id]: [...existing, message]
      }
    };
  }),
  selectSession: (sessionId) => set({ activeSessionId: sessionId })
}));
