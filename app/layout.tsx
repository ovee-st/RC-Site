import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from "@/lib/seo";
import { generateOrganizationSchema, generateWebsiteSchema, serializeJsonLd } from "@/lib/schema";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const organizationSchema = generateOrganizationSchema({
  name: SITE_NAME,
  url: SITE_URL.toString(),
  logo: new URL("/android/icon-512.png", SITE_URL).toString(),
  description: DEFAULT_DESCRIPTION,
  sameAs: []
});
const websiteSchema = generateWebsiteSchema({
  name: SITE_NAME,
  url: SITE_URL.toString(),
  searchTarget: `${SITE_URL.origin}/jobs?search={search_term_string}`
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: DEFAULT_TITLE,
    template: "%s | MX Venture Lab"
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/android/icon-512.png",
        width: 512,
        height: 512,
        alt: "MX Venture Lab"
      }
    ]
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/android/icon-512.png"]
  },
  robots: {
    index: true,
    follow: true
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MX Venture Lab",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "72x72", type: "image/x-icon" },
      { url: "/android/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/android/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/android/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/favicon.ico"]
  }
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className={inter.variable}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }} />
        <AuthProvider>
          <Providers>
            <AppLayout>{children}</AppLayout>
          </Providers>
        </AuthProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}

