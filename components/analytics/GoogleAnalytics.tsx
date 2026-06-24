"use client";

import { Suspense, useEffect, useState } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics";

function RouteAnalytics({ ready }: { ready: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    if (!ready) return;
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, query, ready]);

  return null;
}

export default function GoogleAnalytics() {
  const [ready, setReady] = useState(false);
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="mxvl-google-analytics" strategy="afterInteractive" onReady={() => setReady(true)}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          if (!window.__mxvlGaInitialized) {
            window.__mxvlGaInitialized = true;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          }
        `}
      </Script>
      <Suspense fallback={null}>
        <RouteAnalytics ready={ready} />
      </Suspense>
    </>
  );
}
