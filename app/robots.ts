import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/support",
        "/employee",
        "/candidate",
        "/employer",
        "/dashboard",
        "/auth/callback",
        "/subscriptions/payment",
        "/subscriptions/payments"
      ]
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    host: SITE_URL.origin
  };
}
