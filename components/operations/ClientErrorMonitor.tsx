"use client";

import { useEffect } from "react";

const sent = new Set<string>();

function report(message: string, stack = "") {
  const route = `${window.location.pathname}${window.location.search}`;
  const key = `${route}:${message}:${stack.slice(0, 120)}`;
  if (sent.has(key)) return;
  sent.add(key);
  if (sent.size > 100) sent.delete(sent.values().next().value || "");
  const payload = JSON.stringify({
    source: "client",
    severity: "error",
    message,
    stack,
    route,
    correlation_id: crypto.randomUUID()
  });
  void fetch("/api/operations/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: payload.length < 60_000
  }).catch(() => null);
}

export default function ClientErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => report(event.message || "Unhandled client error", event.error instanceof Error ? event.error.stack || "" : "");
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      report(reason instanceof Error ? reason.message : String(reason || "Unhandled promise rejection"), reason instanceof Error ? reason.stack || "" : "");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
