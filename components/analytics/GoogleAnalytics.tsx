"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID, track } from "@/lib/analytics";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const lastPagePathRef = useRef<string | null>(null);
  const warnedMissingIdRef = useRef(false);

  function getPagePath() {
    if (typeof window === "undefined") return pathname || "/";
    return `${pathname || "/"}${window.location.search || ""}`;
  }

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") {
      if (!GA_MEASUREMENT_ID && process.env.NODE_ENV === "development" && !warnedMissingIdRef.current) {
        console.warn("Google Analytics is disabled because NEXT_PUBLIC_GA_MEASUREMENT_ID is missing.");
        warnedMissingIdRef.current = true;
      }
      return;
    }
    const nextPagePath = getPagePath();
    const pageLocation = window.location.href;
    const pageTitle = document.title;

    if (!lastPagePathRef.current) {
      lastPagePathRef.current = nextPagePath;
      track({ event: "page_view", page_location: pageLocation, page_title: pageTitle }, {}, { sendToGtag: false });
      return;
    }
    if (lastPagePathRef.current === nextPagePath) return;
    track({ event: "page_view", page_location: pageLocation, page_title: pageTitle });
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
