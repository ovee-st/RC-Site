import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="depth-page min-h-screen text-text-main antialiased dark:text-white">
      <Navbar />
      <PageTransition>{children}</PageTransition>
      <div className="fixed bottom-5 right-5 z-50">
        <ThemeToggle className="h-12 rounded-full px-4 shadow-elevated backdrop-blur-xl" />
      </div>
    </div>
  );
}
