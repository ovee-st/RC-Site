"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const initializedRef = useRef(false);
  const readyRef = useRef(false);
  const lastPagePathRef = useRef<string | null>(null);

  const getPagePath = useCallback(() => {
    if (typeof window === "undefined") return pathname || "/";
    return `${pathname || "/"}${window.location.search || ""}`;
  }, [pathname]);

  const ensureGtag = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer?.push(arguments);
    };
  }, []);

  const initializeAnalytics = useCallback(() => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
    ensureGtag();
    readyRef.current = true;

    if (!initializedRef.current) {
      window.gtag?.("js", new Date());
      window.gtag?.("config", GA_MEASUREMENT_ID, {
        page_path: getPagePath(),
        page_location: window.location.href
      });
      initializedRef.current = true;
      lastPagePathRef.current = getPagePath();
      console.log("GA initialized");
      console.log("GA pageview sent", lastPagePathRef.current);
    }
  }, [ensureGtag, getPagePath]);

  useEffect(() => {
    if (!readyRef.current || !initializedRef.current || !GA_MEASUREMENT_ID || typeof window === "undefined") return;
    const nextPagePath = getPagePath();
    if (lastPagePathRef.current === nextPagePath) return;
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: nextPagePath,
      page_location: window.location.href
    });
    lastPagePathRef.current = nextPagePath;
    console.log("GA pageview sent", nextPagePath);
  }, [getPagePath, pathname]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onReady={initializeAnalytics}
      />
      <Script id="google-analytics-bootstrap" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
        `}
      </Script>
    </>
  );
}
