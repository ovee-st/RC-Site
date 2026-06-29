"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  LifeBuoy,
  MessageCircle,
  NotebookTabs,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRoundCheck,
  UsersRound,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { isSupportStaffRole, canManageSupportAssignments, canEscalateSupport } from "@/lib/supportRoles";
import { ticketStatuses, formatTicketStatus } from "@/lib/support";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import LiveChatDashboard from "@/components/chat/LiveChatDashboard";
import ChatWidget from "@/components/chat/ChatWidget";
import TicketCenter from "@/components/support/TicketCenter";
import SupportLayout from "@/components/support/SupportLayout";
import type { SupportTicket } from "@/types/support";
import type { LiveChatSession } from "@/types/liveChat";

const macros = [
  { title: "Password Reset Instructions", category: "Account Access", content: "Please use Account Settings > Change Password. If you cannot access your account, we can send a secure reset link." },
  { title: "Payment Verification", category: "Billing", content: "Please share the transaction ID and payment method. We will verify and activate the account after confirmation." },
  { title: "Pro Plan Upgrade Benefits", category: "Subscription", content: "Pro unlocks verified profile visibility, enhanced CV tools, and priority matching insights." },
  { title: "CV Download Guidance", category: "CV Service", content: "Open Resume Builder, choose ATS CV or Customized CV, then download the generated PDF." },
  { title: "Subscription Activation", category: "Subscription", content: "Your subscription will be activated after payment reconciliation. We will notify you once complete." },
  { title: "Employer Posting Help", category: "Employer Support", content: "Go to Employer Home > Post New Job, complete the required role details, skills, deadline, and publish." }
];

const kbArticles = [
  { title: "Profile image troubleshooting", category: "Technical Issue", body: "Check Supabase Storage public URL, profile avatar_url, candidate photo_url, and browser cache." },
  { title: "Payment escalation rules", category: "Billing", body: "Payment issues are high priority. Escalate urgent unresolved payments after 4 business hours." },
  { title: "Employer verification checklist", category: "Employer Support", body: "Confirm company website, LinkedIn/Facebook, contact number, and posted job legitimacy." },
  { title: "CV generation support", category: "CV Service", body: "Confirm candidate profile completeness and regenerate ATS/Customized CV after profile updates." }
];

const slaTargets = [
  { label: "First response", value: "30m", tone: "primary" as const },
  { label: "Low resolution", value: "72h", tone: "neutral" as const },
  { label: "Medium resolution", value: "48h", tone: "primary" as const },
  { label: "High resolution", value: "24h", tone: "danger" as const },
  { label: "Urgent resolution", value: "4h", tone: "danger" as const }
];

async function authHeaders(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};
  return compactAuthHeaders("SUPPORT_OPERATIONS_LIVE_CHAT");
}

function metricTone(value: number, warning = 5) {
  if (value >= warning) return "text-amber-600 dark:text-amber-300";
  if (value > 0) return "text-primary";
  return "text-text-main dark:text-white";
}

function OpsMetric({ label, value, icon: Icon, helper }: { label: string; value: string | number; icon: any; helper: string }) {
  return (
    <Card className="rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-label text-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-black text-text-main dark:text-white">{value}</p>
          <p className="mt-1 text-xs font-bold text-text-muted">{helper}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
      </div>
    </Card>
  );
}

function TicketRow({ ticket }: { ticket: SupportTicket }) {
  return (
    <Link href={`/support/tickets/${ticket.id}`} className="grid gap-3 rounded-2xl border border-border bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-hover dark:border-white/10 dark:bg-slate-900 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-primary">{ticket.ticket_number}</p>
          <Badge variant={ticket.priority === "URGENT" || ticket.priority === "HIGH" ? "danger" : "primary"}>{ticket.priority}</Badge>
          <Badge>{formatTicketStatus(ticket.status)}</Badge>
        </div>
        <h3 className="mt-2 line-clamp-1 text-sm font-black text-text-main dark:text-white">{ticket.subject}</h3>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-text-muted">{ticket.username} • {ticket.user_role} • {ticket.category || "Other"}</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
        <Clock3 className="h-4 w-4" />
        {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : new Date(ticket.created_at).toLocaleString()}
      </div>
    </Link>
  );
}

function useSupportOpsData() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const headers = await authHeaders();
        const [ticketResponse, chatResponse] = await Promise.all([
          fetch("/api/support/tickets", { headers }),
          fetch("/api/live-chat", { headers })
        ]);
        const ticketPayload = await ticketResponse.json().catch(() => ({}));
        const chatPayload = await chatResponse.json().catch(() => ({}));
        if (!active) return;
        setTickets((ticketPayload.tickets || []) as SupportTicket[]);
        setSessions((chatPayload.sessions || []) as LiveChatSession[]);
      } catch {
        if (active) {
          setTickets([]);
          setSessions([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const interval = window.setInterval(load, 25000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return { tickets, sessions, loading };
}

function DashboardView() {
  const { tickets, sessions, loading } = useSupportOpsData();
  const resolvedToday = tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status) && (ticket.updated_at || ticket.created_at).slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const open = tickets.filter((ticket) => ticket.status === "OPEN").length;
  const escalated = tickets.filter((ticket) => ticket.status === "ESCALATED").length;
  const waitingChats = sessions.filter((session) => session.status === "WAITING").length;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OpsMetric label="Open tickets" value={open} icon={Inbox} helper="Needs first action" />
        <OpsMetric label="Waiting chats" value={waitingChats} icon={MessageCircle} helper="Realtime queue" />
        <OpsMetric label="Resolved today" value={resolvedToday} icon={CheckCircle2} helper="Closed by support" />
        <OpsMetric label="Escalations" value={escalated} icon={AlertTriangle} helper="Manager attention" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="rounded-3xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Badge variant="primary">Unified Inbox</Badge>
              <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Requests needing attention</h2>
              <p className="mt-1 text-sm font-semibold text-text-muted">Tickets, escalations, and chat-created issues in one queue.</p>
            </div>
            <Link href="/support/inbox" className="rounded-2xl border border-border px-4 py-2 text-sm font-black text-text-muted hover:text-primary dark:border-white/10">Open inbox</Link>
          </div>
          <div className="mt-5 grid max-h-[420px] gap-3 overflow-y-auto pr-1">
            {loading ? <p className="text-sm font-bold text-text-muted">Loading queue...</p> : tickets.slice(0, 8).map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}
            {!loading && !tickets.length ? <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm font-bold text-text-muted dark:border-white/10">No support items yet.</p> : null}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-3xl p-5">
            <Badge variant="primary">SLA Control</Badge>
            <h2 className="mt-3 text-xl font-black text-text-main dark:text-white">Response targets</h2>
            <div className="mt-4 grid gap-3">
              {slaTargets.map((item) => <div key={item.label} className="flex items-center justify-between rounded-2xl bg-bg p-3 dark:bg-white/5"><span className="text-sm font-bold text-text-muted">{item.label}</span><Badge variant={item.tone}>{item.value}</Badge></div>)}
            </div>
          </Card>
          <Card className="rounded-3xl p-5">
            <Badge variant="success">AI Assist</Badge>
            <h2 className="mt-3 text-xl font-black text-text-main dark:text-white">Suggested automation</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">Payment issues are automatically highlighted as high priority. Overdue tickets should escalate to senior support.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InboxView() {
  const { tickets, sessions, loading } = useSupportOpsData();
  const filters = ["My Items", "Unassigned", "High Priority", "SLA Due Soon", "Escalated", "Resolved Today"];
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2">{filters.map((filter) => <Badge key={filter} variant={filter === "High Priority" || filter === "Escalated" ? "danger" : "neutral"}>{filter}</Badge>)}</div>
      <Card className="rounded-3xl p-5">
        <div className="flex items-center justify-between gap-4"><div><Badge variant="primary">Combined Queue</Badge><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Unified inbox</h2></div><Badge variant="success">{sessions.filter((session) => session.status === "WAITING").length} live chats waiting</Badge></div>
        <div className="mt-5 grid gap-3">{loading ? <p className="font-bold text-text-muted">Loading inbox...</p> : tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div>
      </Card>
    </div>
  );
}

function TicketsView() {
  return <TicketCenter mode="employee" />;
}

function LiveChatView() {
  return <LiveChatDashboard mode="employee" />;
}

function UsersView() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="rounded-3xl p-5">
        <Badge variant="primary">User 360</Badge>
        <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Customer context workspace</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-text-muted">Search a candidate or employer to view subscription plan, payment history, generated CVs, applications, job postings, previous tickets, live chat history, and internal support notes.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {["Candidate profile", "Employer profile", "Subscription & payments", "Previous tickets", "Chat history", "Internal notes"].map((item) => <div key={item} className="rounded-2xl border border-border bg-bg p-4 text-sm font-black text-text-main dark:border-white/10 dark:bg-white/5 dark:text-white">{item}</div>)}
        </div>
      </Card>
      <Card className="rounded-3xl p-5"><UserRoundCheck className="h-8 w-8 text-primary" /><h3 className="mt-4 text-xl font-black text-text-main dark:text-white">Customer success view</h3><p className="mt-2 text-sm font-semibold text-text-muted">Open a ticket or chat from the inbox to load the user profile sidebar with customer history.</p></Card>
    </div>
  );
}

function MacrosView() {
  return (
    <Card className="rounded-3xl p-5">
      <div className="flex items-center justify-between gap-4"><div><Badge variant="primary">Saved Replies</Badge><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Macros</h2></div><Button className="gap-2"><Zap className="h-4 w-4" />New macro</Button></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{macros.map((macro) => <Card key={macro.title} className="rounded-2xl p-4"><Badge>{macro.category}</Badge><h3 className="mt-3 text-base font-black text-text-main dark:text-white">{macro.title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-text-muted">{macro.content}</p></Card>)}</div>
    </Card>
  );
}

function KnowledgeBaseView() {
  return (
    <Card className="rounded-3xl p-5">
      <Badge variant="primary">Knowledge Base</Badge><h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">Internal guides</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{kbArticles.map((article) => <Card key={article.title} className="rounded-2xl p-4"><BookOpen className="h-5 w-5 text-primary" /><h3 className="mt-3 text-base font-black text-text-main dark:text-white">{article.title}</h3><p className="mt-1 text-xs font-bold uppercase tracking-wider text-primary">{article.category}</p><p className="mt-2 text-sm font-semibold leading-6 text-text-muted">{article.body}</p></Card>)}</div>
    </Card>
  );
}

function AnalyticsView() {
  const { tickets, sessions } = useSupportOpsData();
  const total = Math.max(tickets.length, 1);
  const resolved = tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status)).length;
  const compliance = Math.round((resolved / total) * 100);
  const categories = Array.from(new Set(tickets.map((ticket) => ticket.category || "Other"))).slice(0, 6);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><OpsMetric label="SLA compliance" value={`${compliance}%`} icon={ShieldCheck} helper="Resolved vs queue" /><OpsMetric label="Avg first response" value="18m" icon={Timer} helper="Target 30m" /><OpsMetric label="Avg resolution" value="16h" icon={CheckCircle2} helper="Across active tickets" /><OpsMetric label="Active chats" value={sessions.filter((s) => s.status === "ACTIVE").length} icon={MessageCircle} helper="Currently owned" /></div>
      <Card className="rounded-3xl p-5"><Badge variant="primary">Top issue categories</Badge><div className="mt-5 grid gap-3">{categories.map((category) => <div key={category} className="grid grid-cols-[170px_1fr_auto] items-center gap-3"><span className="text-sm font-bold text-text-muted">{category}</span><div className="h-2 rounded-full bg-bg dark:bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(18, Math.min(100, tickets.filter((ticket) => (ticket.category || "Other") === category).length * 18))}%` }} /></div><span className="text-sm font-black text-text-main dark:text-white">{tickets.filter((ticket) => (ticket.category || "Other") === category).length}</span></div>)}</div></Card>
    </div>
  );
}

function ProfileView() {
  const { user, role } = useAuth();
  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="rounded-3xl p-5"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-success text-xl font-black text-white">{(user?.name || "MX").slice(0, 2).toUpperCase()}</div><h2 className="mt-4 text-2xl font-black text-text-main dark:text-white">{user?.name || "Support Agent"}</h2><p className="text-sm font-semibold text-text-muted">{user?.email}</p><Badge className="mt-3" variant="primary">{role}</Badge></Card>
      <Card className="rounded-3xl p-5"><Badge variant="success">My Performance</Badge><div className="mt-5 grid gap-4 md:grid-cols-4"><OpsMetric label="Assigned" value="12" icon={Inbox} helper="Active workload" /><OpsMetric label="Resolved" value="34" icon={CheckCircle2} helper="This month" /><OpsMetric label="CSAT" value="4.8" icon={Sparkles} helper="Customer rating" /><OpsMetric label="Response" value="18m" icon={Timer} helper="Average" /></div></Card>
    </div>
  );
}

export default function SupportOperationsCenter({ view = "dashboard" }: { view?: string }) {
  const { role } = useAuth();
  const normalizedTitle = view.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");

  const content = useMemo(() => {
    switch (view) {
      case "inbox": return <InboxView />;
      case "live-chat": return <LiveChatView />;
      case "tickets": return <TicketsView />;
      case "users": return <UsersView />;
      case "macros": return <MacrosView />;
      case "knowledge-base": return <KnowledgeBaseView />;
      case "analytics": return <AnalyticsView />;
      case "profile": return <ProfileView />;
      default: return <DashboardView />;
    }
  }, [view]);

  if (!isSupportStaffRole(role)) {
    return (
      <>
        <TicketCenter mode="user" />
        <ChatWidget />
      </>
    );
  }

  return <SupportLayout activeView={normalizedTitle}>{content}</SupportLayout>;
}
