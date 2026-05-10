"use client";

import type { LiveChatSession } from "@/types/liveChat";
import ChatQueue from "@/components/chat/ChatQueue";

export default function ActiveChatsList({ sessions, selectedId, onSelect }: { sessions: LiveChatSession[]; selectedId?: string | null; onSelect: (sessionId: string) => void }) {
  return <ChatQueue sessions={sessions.filter((session) => session.status === "ACTIVE")} selectedId={selectedId} onSelect={onSelect} />;
}
