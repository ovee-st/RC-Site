"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Rocket, X } from "lucide-react";

type Release = {
  id: string;
  version: string;
  title: string;
  summary: string;
  release_type: "product_update" | "release_note" | "maintenance";
  banner_message: string | null;
  ends_at: string | null;
};

export default function ReleaseBanner() {
  const [release, setRelease] = useState<Release | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/releases/active", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        const next = payload.release as Release | null;
        if (!next) return;
        const hidden = window.sessionStorage.getItem(`mxvl-release-dismissed:${next.id}`);
        if (!hidden) setRelease(next);
      })
      .catch(() => null);
    return () => controller.abort();
  }, []);

  if (!release || dismissed) return null;
  const maintenance = release.release_type === "maintenance";
  const Icon = maintenance ? AlertTriangle : Rocket;
  const dismiss = () => {
    window.sessionStorage.setItem(`mxvl-release-dismissed:${release.id}`, "true");
    setDismissed(true);
  };

  return (
    <aside className={maintenance ? "border-y border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100" : "border-y border-primary/20 bg-primary/5 text-text-main dark:text-white"} aria-label={maintenance ? "Scheduled maintenance" : "Product update"}>
      <div className="mx-auto flex min-h-11 max-w-[1480px] items-center gap-3 px-4 py-2 sm:px-6">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="min-w-0 flex-1 text-xs font-bold"><strong className="mr-2">{release.title}</strong>{release.banner_message || release.summary}</p>
        <button type="button" onClick={dismiss} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/10" aria-label="Dismiss announcement"><X className="h-4 w-4" /></button>
      </div>
    </aside>
  );
}
