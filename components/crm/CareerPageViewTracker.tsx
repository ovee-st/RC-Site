"use client";

import { useEffect } from "react";

export default function CareerPageViewTracker({ careerPageId }: { careerPageId: string }) {
  useEffect(() => {
    const key = `mx-career-view-${careerPageId}-${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    void fetch("/api/career-pages/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ career_page_id: careerPageId, event_type: "view", source: document.referrer || "direct" }), keepalive: true }).catch(() => undefined);
  }, [careerPageId]);
  return null;
}
