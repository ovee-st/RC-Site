import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MX Venture Lab | AI-Powered Recruitment & Business Solutions",
  description: "AI-powered recruitment platform connecting candidates and employers through smart matching, career tools, managed hiring, and business solutions.",
  applicationName: "MX Venture Lab",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MX Venture Lab",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/android/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/android/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/android/icon-192.png", sizes: "192x192", type: "image/png" }]
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

