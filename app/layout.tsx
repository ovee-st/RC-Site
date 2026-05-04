import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MX VENTURE LAB | AI Hiring Platform",
  description: "AI-ranked talent matching, recruiter dashboards, and ATS hiring workflows for modern teams."
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
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
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
      </body>
    </html>
  );
}
