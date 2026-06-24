"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, initializeGoogleAnalytics, trackPageView } from "@/lib/analytics";

function RouteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    initializeGoogleAnalytics();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, query]);

  return null;
}

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <RouteAnalytics />
      </Suspense>
    </>
  );
}
