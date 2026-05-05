import { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";
import ThemeToggle from "@/components/theme/ThemeToggle";
import VisitorTracker from "@/components/layout/VisitorTracker";
import ScrollTopButton from "@/components/layout/ScrollTopButton";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="depth-page min-h-screen text-text-main antialiased dark:text-white">
      <VisitorTracker />
      <Navbar />
      <PageTransition>{children}</PageTransition>
      <div className="fixed bottom-5 right-5 z-50">
        <div className="flex flex-col gap-3">
          <ScrollTopButton />
          <ThemeToggle className="h-12 rounded-full px-4 shadow-elevated backdrop-blur-xl" />
        </div>
      </div>
    </div>
  );
}
