"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookOpen,
  Gauge,
  Inbox,
  LifeBuoy,
  MessageCircle,
  NotepadText,
  Search,
  Settings,
  Sparkles,
  TicketCheck,
  UserCog,
  UsersRound
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupportStaffRole, getSupportRoleLabel } from "@/lib/supportRoles";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const navItems = [
  { label: "Dashboard", href: "/support/dashboard", icon: Gauge },
  { label: "Unified Inbox", href: "/support/inbox", icon: Inbox },
  { label: "Live Chat", href: "/support/live-chat", icon: MessageCircle },
  { label: "Tickets", href: "/support/tickets", icon: TicketCheck },
  { label: "Users", href: "/support/users/me", icon: UsersRound },
  { label: "Saved Replies", href: "/support/macros", icon: NotepadText },
  { label: "Knowledge Base", href: "/support/knowledge-base", icon: BookOpen },
  { label: "Analytics", href: "/support/analytics", icon: BarChart3 },
  { label: "My Performance", href: "/support/profile", icon: Activity },
  { label: "Profile Settings", href: "/support/profile", icon: Settings }
];

export default function SupportLayout({ children, activeView = "dashboard" }: { children: ReactNode; activeView?: string }) {
  const pathname = usePathname();
  const { user, role, loading } = useAuth();

  if (loading) {
    return <main className="grid min-h-[70vh] place-items-center px-6"><Card className="rounded-3xl p-6 font-bold text-text-muted">Loading support portal...</Card></main>;
  }

  if (!isSupportStaffRole(role)) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Card className="rounded-3xl p-8 text-center">
          <LifeBuoy className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-3xl font-black text-text-main dark:text-white">Support staff access only</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-text-muted">This operations center is reserved for MX Venture Lab support employees. Candidate and employer support remains available from the regular Support Center.</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white shadow-soft">Return home</Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-6 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20 sm:px-6">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <Card className="h-full rounded-[2rem] p-4">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-950 to-primary p-5 text-white shadow-primary dark:from-blue-950 dark:to-primary">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><LifeBuoy className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm font-black">MXVL Support</p>
                  <p className="text-xs font-semibold text-white/70">{getSupportRoleLabel(role)}</p>
                </div>
              </div>
            </div>
            <nav className="mt-4 grid gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/support/profile" && pathname?.startsWith(item.href));
                return (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-text-muted transition hover:bg-primary/8 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5", active && "bg-primary text-white shadow-primary hover:bg-primary hover:text-white")}>
                    <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-bg text-text-muted dark:bg-white/5", active && "bg-white/15 text-white")}><Icon className="h-4 w-4" /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>
        <section className="min-w-0">
          <div className="mb-5 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge variant="primary">Support Operations</Badge>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white">{activeView}</h1>
                <p className="mt-1 text-sm font-semibold text-text-muted">Live chat, tickets, customer context, SLAs, macros, and agent performance in one workspace.</p>
              </div>
              <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-bg px-4 py-3 dark:border-white/10 dark:bg-slate-950">
                <Search className="h-4 w-4 text-text-muted" />
                <input className="w-full min-w-0 bg-transparent text-sm font-semibold outline-none placeholder:text-text-muted" placeholder="Search tickets, users, chats..." />
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
