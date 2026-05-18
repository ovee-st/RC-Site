import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppLayout from "@/components/layout/AppLayout";
import { AuthProvider } from "@/context/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MX Venture Lab | AI-Powered Recruitment & Business Solutions",
  description: "AI-powered recruitment platform for candidates and employers in Bangladesh. ATS CV builder, smart matching, managed hiring, and business solutions."
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
      </body>
    </html>
  );
}

