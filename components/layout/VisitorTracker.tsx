"use client";

import { useEffect } from "react";

const VISITOR_KEY = "mx_site_visitors";
const VISITOR_SESSION_KEY = "mx_site_visited_session";

export default function VisitorTracker() {
  useEffect(() => {
    if (window.sessionStorage.getItem(VISITOR_SESSION_KEY)) return;
    window.sessionStorage.setItem(VISITOR_SESSION_KEY, "1");
    const current = Number(window.localStorage.getItem(VISITOR_KEY) || "0");
    window.localStorage.setItem(VISITOR_KEY, String(current + 1));
  }, []);

  return null;
}