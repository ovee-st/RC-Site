"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const lastPagePathRef = useRef<string | null>(null);

  function getPagePath() {
    if (typeof window === "undefined") return pathname || "/";
    return `${pathname || "/"}${window.location.search || ""}`;
  }

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
    const nextPagePath = getPagePath();
    if (!lastPagePathRef.current) {
      lastPagePathRef.current = nextPagePath;
      return;
    }
    if (lastPagePathRef.current === nextPagePath || typeof window.gtag !== "function") return;
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: nextPagePath,
      page_location: window.location.href
    });
    lastPagePathRef.current = nextPagePath;
    console.log("GA pageview sent", nextPagePath);
  }, [pathname]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
          console.log('GA initialized');
          console.log('GA pageview sent', window.location.pathname + window.location.search);
        `}
      </Script>
    </>
  );
}
