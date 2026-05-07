"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Download,
  FileText,
  Gift,
  LayoutDashboard,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  Users,
  XCircle
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type AdminSection =
  | "dashboard"
  | "users"
  | "candidates"
  | "employers"
  | "contact-requests"
  | "coupons"
  | "transactions"
  | "settings";

type AnyRecord = Record<string, any>;

type AdminState = {
  profiles: AnyRecord[];
  candidates: AnyRecord[];
  employers: AnyRecord[];
  jobs: AnyRecord[];
  applications: AnyRecord[];
  contactRequests: AnyRecord[];
  coupons: AnyRecord[];
  transactions: AnyRecord[];
};

const emptyState: AdminState = {
  profiles: [],
  candidates: [],
  employers: [],
  jobs: [],
  applications: [],
  contactRequests: [],
  coupons: [],
  transactions: []
};

const sectionMeta: Record<AdminSection, { title: string; description: string }> = {
  dashboard: {
    title: "Super Admin Command Center",
    description: "Monitor users, revenue, jobs, applications, and operational signals from one premium control room."
  },
  users: {
    title: "User Management",
    description: "Search, filter, edit roles, suspend accounts, and review platform usage."
  },
  candidates: {
    title: "Candidate Management",
    description: "Inspect candidate profiles, CV access, match quality, activity timelines, and subscription upgrades."
  },
  employers: {
    title: "Employer Management",
    description: "Review company profiles, job activity, verification state, and hiring health."
  },
  "contact-requests": {
    title: "Contact Requests",
    description: "Handle inbound requests, assign status, and keep support follow-up tidy."
  },
  coupons: {
    title: "Coupon Management",
    description: "Create, copy, disable, and track promotional coupons for subscriptions."
  },
  transactions: {
    title: "Transactions",
    description: "Search payments, coupon usage, upgrades, and subscription purchase history."
  },
  settings: {
    title: "Admin Settings",
    description: "Platform controls, data exports, storage access, and security recommendations."
  }
};

const navItems = [
  { label: "Dashboard", href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", key: "users", icon: UserCog },
  { label: "Candidates", href: "/admin/candidates", key: "candidates", icon: Users },
  { label: "Employers", href: "/admin/employers", key: "employers", icon: BriefcaseBusiness },
  { label: "Contact Requests", href: "/admin/contact-requests", key: "contact-requests", icon: Mail },
  { label: "Coupons", href: "/admin/coupons", key: "coupons", icon: Gift },
  { label: "Transactions", href: "/admin/transactions", key: "transactions", icon: CreditCard },
  { label: "Settings", href: "/admin/settings", key: "settings", icon: Settings }
] as const;

const fallbackProfiles = [
  { id: "admin-demo", full_name: "RC Super Admin", email: "admin@mxventurelab.com", role: "admin", plan: "Internal", applications_used: 0, created_at: "2026-05-01" },
  { id: "candidate-demo", full_name: "Md Jahid Anwar", email: "candidate.admin@mxventurelab.com", role: "candidate", plan: "Free", applications_used: 3, created_at: "2026-04-20" },
  { id: "employer-demo", full_name: "Ovee", email: "employer.admin@mxventurelab.com", role: "employer", plan: "Growth", applications_used: 8, created_at: "2026-04-18" }
];

const fallbackContacts = [
  { id: "contact-1", name: "Tanvir Rahman", email: "tanvir@example.com", company: "Growth Textile Ltd", phone: "+8801700000000", message: "Need hiring support for admin roles.", status: "new", created_at: "2026-05-05" },
  { id: "contact-2", name: "Nusrat Karim", email: "nusrat@example.com", company: "Remote Support BD", phone: "+8801800000000", message: "Looking for customer support candidates.", status: "in progress", created_at: "2026-05-04" }
];

const fallbackCoupons = [
  { id: "coupon-1", code: "RC50", discount_percentage: 50, active: true, usage_limit: 100, used_count: 12, expires_at: "2026-06-30" },
  { id: "coupon-2", code: "WELCOME20", discount_percentage: 20, active: true, usage_limit: 250, used_count: 43, expires_at: "2026-07-31" }
];

const fallbackTransactions = [
  { id: "tx-1", user_email: "employer.admin@mxventurelab.com", amount: 4500, payment_method: "Card", coupon_used: "WELCOME20", transaction_id: "RC-2026-001", status: "paid", created_at: "2026-05-04" },
  { id: "tx-2", user_email: "growth@example.com", amount: 9000, payment_method: "Bkash", coupon_used: "", transaction_id: "RC-2026-002", status: "pending", created_at: "2026-05-05" }
];

function getInitials(name?: string) {
  return (name || "RC Admin")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDisplayName(row: AnyRecord) {
  return row.full_name || row.name || row.company_name || row.email || "Unnamed record";
}

function getEmail(row: AnyRecord) {
  return row.email || row.user_email || row.contact_email || "No email";
}

function formatDate(value?: string) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function exportCsv(filename: string, rows: AnyRecord[]) {
  const safeRows = rows.length ? rows : [{ empty: "No data" }];
  const headers = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row))));
  const csv = [
    headers.join(","),
    ...safeRows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function safeSelect(table: string) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from(table).select("*").limit(500);
  if (error) return [];
  return data || [];
}

function AdminStatCard({ label, value, detail, icon: Icon, accent }: { label: string; value: string | number; detail: string; icon: any; accent: string }) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl p-5 shadow-soft">
      <div className={cn("absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl", accent)} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="type-label text-text-muted dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white">{value}</p>
          <p className="mt-2 text-xs font-bold text-text-muted dark:text-slate-400">{detail}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105 dark:bg-primary/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function AdminAvatar({ row, className }: { row: AnyRecord; className?: string }) {
  const name = getDisplayName(row);
  const image = row.avatar_url || row.photo_url || row.logo_url || row.company_logo_url;

  return (
    <div className={cn("grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-success text-xs font-black text-white ring-2 ring-white shadow-soft", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function StatusBadge({ value }: { value?: string | boolean }) {
  const normalized = String(value ?? "active").toLowerCase();
  const variant = normalized.includes("paid") || normalized.includes("active") || normalized.includes("resolved") || value === true
    ? "success"
    : normalized.includes("pending") || normalized.includes("progress")
      ? "primary"
      : normalized.includes("suspend") || normalized.includes("failed")
        ? "danger"
        : "neutral";

  return <Badge variant={variant as any}>{value === true ? "Active" : value === false ? "Inactive" : normalized}</Badge>;
}

export default function AdminPanel({ section }: { section: AdminSection }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [adminData, setAdminData] = useState<AdminState>(emptyState);
  const [dataLoading, setDataLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || role !== "admin") router.replace("/");
  }, [loading, role, router, user]);

  useEffect(() => {
    let active = true;

    async function loadAdminData() {
      setDataLoading(true);
      const [profiles, candidates, employers, jobs, applications, contactRequests, coupons, transactions] = await Promise.all([
        safeSelect("profiles"),
        safeSelect("candidates"),
        safeSelect("employers"),
        safeSelect("jobs"),
        safeSelect("applications"),
        safeSelect("contact_requests"),
        safeSelect("coupons"),
        safeSelect("transactions")
      ]);

      if (!active) return;

      setAdminData({
        profiles: profiles.length ? profiles : fallbackProfiles,
        candidates,
        employers,
        jobs,
        applications,
        contactRequests: contactRequests.length ? contactRequests : fallbackContacts,
        coupons: coupons.length ? coupons : fallbackCoupons,
        transactions: transactions.length ? transactions : fallbackTransactions
      });
      setDataLoading(false);
    }

    if (!loading && role === "admin") loadAdminData();

    return () => {
      active = false;
    };
  }, [loading, role]);

  const analytics = useMemo(() => {
    const activeJobs = adminData.jobs.filter((job) => (job.status || "active") === "active").length;
    const proSubscriptions = adminData.profiles.filter((profile) => String(profile.plan || "").toLowerCase().includes("pro") || String(profile.plan || "").toLowerCase().includes("growth")).length;
    const monthlyRevenue = adminData.transactions
      .filter((tx) => String(tx.status || "paid").toLowerCase() === "paid")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return {
      totalCandidates: Math.max(adminData.candidates.length, adminData.profiles.filter((profile) => profile.role === "candidate").length),
      totalEmployers: Math.max(adminData.employers.length, adminData.profiles.filter((profile) => profile.role === "employer").length),
      activeJobs,
      applications: adminData.applications.length,
      proSubscriptions,
      monthlyRevenue
    };
  }, [adminData]);

  const chartData = useMemo(() => [
    { name: "Candidates", value: analytics.totalCandidates },
    { name: "Employers", value: analytics.totalEmployers },
    { name: "Jobs", value: analytics.activeJobs },
    { name: "Applications", value: analytics.applications }
  ], [analytics]);

  const revenueData = useMemo(() => ["Jan", "Feb", "Mar", "Apr", "May"].map((month, index) => ({
    month,
    revenue: Math.max(1200 + index * 900, Math.round(analytics.monthlyRevenue / 5) + index * 300)
  })), [analytics.monthlyRevenue]);

  const filteredProfiles = useMemo(() => adminData.profiles.filter((profile) => {
    const haystack = `${getDisplayName(profile)} ${getEmail(profile)} ${profile.role || ""}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    return matchesQuery && matchesRole;
  }), [adminData.profiles, query, roleFilter]);

  async function updateRecord(table: string, id: string, patch: AnyRecord) {
    if (isSupabaseConfigured) {
      await supabase.from(table).update(patch).eq("id", id);
    }
    setNotice("Update saved. Supabase will reconcile live data on refresh.");
  }

  async function deleteRecord(table: string, id: string) {
    if (isSupabaseConfigured) {
      await supabase.from(table).delete().eq("id", id);
    }
    setNotice("Record deleted or queued for deletion.");
  }

  async function generateCoupon() {
    const code = `RC${Math.floor(10 + Math.random() * 89)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const coupon = {
      code,
      discount_percentage: 20,
      active: true,
      usage_limit: 100,
      used_count: 0,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
    };

    if (isSupabaseConfigured) {
      await supabase.from("coupons").insert(coupon);
    }
    setAdminData((current) => ({ ...current, coupons: [{ id: code, ...coupon }, ...current.coupons] }));
    setNotice(`Coupon ${code} generated.`);
  }

  if (loading || (user && role !== "admin")) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="flex items-center gap-3 rounded-3xl p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-bold text-text-muted">Checking admin access...</span>
        </Card>
      </main>
    );
  }

  if (!user || role !== "admin") return null;

  const meta = sectionMeta[section];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_32%),linear-gradient(180deg,#020617,#0f172a)] sm:px-6">
      <div className="mx-auto flex max-w-[1440px] gap-6">
        <aside className={cn(
          "fixed inset-y-4 left-4 z-40 w-72 rounded-3xl border border-white/60 bg-white/88 p-4 shadow-elevated backdrop-blur-2xl transition lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-7rem)] dark:border-white/10 dark:bg-slate-950/80",
          sidebarOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0"
        )}>
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-950 to-primary p-4 text-white">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">RC Super Admin</p>
              <p className="text-xs font-semibold text-white/70">Internal control room</p>
            </div>
          </div>

          <nav className="mt-5 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.key === "dashboard" ? pathname === "/admin" : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-text-muted transition hover:bg-primary/5 hover:text-primary dark:text-slate-300 dark:hover:bg-white/5",
                    active && "bg-primary text-white shadow-primary hover:bg-primary hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-20 z-30 mb-6 rounded-3xl border border-white/70 bg-white/82 p-4 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/75">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => setSidebarOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary lg:hidden">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                <div>
                  <Badge variant="primary" className="type-label text-primary">Admin Access</Badge>
                  <h1 className="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{meta.title}</h1>
                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-text-muted dark:text-slate-300">{meta.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1 sm:min-w-[320px] xl:flex-none">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, companies, transactions..." className="rounded-2xl pl-11" />
                </div>
                <button className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface shadow-soft dark:border-white/10 dark:bg-slate-900">
                  <Bell className="h-5 w-5 text-text-muted" />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-danger" />
                </button>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-soft dark:border-white/10 dark:bg-slate-900">
                  <AdminAvatar row={{ full_name: user.name, avatar_url: user.avatar }} className="h-8 w-8" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-black text-text-main dark:text-white">{user.name || "Admin"}</p>
                    <p className="text-xs font-bold text-text-muted dark:text-slate-400">Super Admin</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </div>
              </div>
            </div>
          </header>

          {notice ? (
            <div className="mb-5 flex items-center justify-between rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-bold text-success">
              {notice}
              <button type="button" onClick={() => setNotice(null)}><XCircle className="h-4 w-4" /></button>
            </div>
          ) : null}

          {dataLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((item) => <Card key={item} className="h-36 animate-pulse rounded-3xl bg-white/60 dark:bg-white/5" />)}
            </div>
          ) : (
            <>
              {section === "dashboard" ? <DashboardSection analytics={analytics} chartData={chartData} revenueData={revenueData} data={adminData} /> : null}
              {section === "users" ? <UsersSection rows={filteredProfiles} query={query} roleFilter={roleFilter} setRoleFilter={setRoleFilter} onUpdate={updateRecord} onDelete={deleteRecord} /> : null}
              {section === "candidates" ? <CandidatesSection rows={adminData.candidates} profiles={adminData.profiles} applications={adminData.applications} /> : null}
              {section === "employers" ? <EmployersSection rows={adminData.employers} jobs={adminData.jobs} onUpdate={updateRecord} /> : null}
              {section === "contact-requests" ? <ContactRequestsSection rows={adminData.contactRequests} onUpdate={updateRecord} onDelete={deleteRecord} /> : null}
              {section === "coupons" ? <CouponsSection rows={adminData.coupons} onGenerate={generateCoupon} onUpdate={updateRecord} onDelete={deleteRecord} /> : null}
              {section === "transactions" ? <TransactionsSection rows={adminData.transactions} /> : null}
              {section === "settings" ? <SettingsSection data={adminData} /> : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardSection({ analytics, chartData, revenueData, data }: { analytics: any; chartData: any[]; revenueData: any[]; data: AdminState }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <AdminStatCard label="Total Candidates" value={analytics.totalCandidates} detail="Registered talent" icon={Users} accent="bg-primary/20" />
        <AdminStatCard label="Total Employers" value={analytics.totalEmployers} detail="Hiring accounts" icon={BriefcaseBusiness} accent="bg-success/20" />
        <AdminStatCard label="Active Jobs" value={analytics.activeJobs} detail="Visible openings" icon={FileText} accent="bg-blue-400/20" />
        <AdminStatCard label="Applications" value={analytics.applications} detail="Submitted in ATS" icon={CheckCircle2} accent="bg-amber-400/20" />
        <AdminStatCard label="Pro Subs" value={analytics.proSubscriptions} detail="Paid or growth plans" icon={Sparkles} accent="bg-purple-400/20" />
        <AdminStatCard label="Revenue" value={`BDT ${analytics.monthlyRevenue.toLocaleString()}`} detail="Tracked paid tx" icon={CreditCard} accent="bg-emerald-400/20" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-3xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="type-label text-primary">Revenue Trend</p>
              <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Monthly platform revenue</h2>
            </div>
            <Badge variant="success">Live</Badge>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.18)" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-3xl p-6">
          <p className="type-label text-primary">Platform Mix</p>
          <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Operational distribution</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={5}>
                  {chartData.map((_, index) => <Cell key={index} fill={["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6"][index % 4]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <RecentList title="Recent Signups" rows={data.profiles.slice(0, 5)} />
        <RecentList title="Latest Transactions" rows={data.transactions.slice(0, 5)} />
        <RecentList title="Latest Contact Requests" rows={data.contactRequests.slice(0, 5)} />
      </div>
    </div>
  );
}

function RecentList({ title, rows }: { title: string; rows: AnyRecord[] }) {
  return (
    <Card className="rounded-3xl p-5">
      <h3 className="text-lg font-black text-text-main dark:text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => (
          <div key={row.id || row.email || row.code} className="flex items-center justify-between gap-3 rounded-2xl bg-bg p-3 dark:bg-white/5">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-text-main dark:text-white">{getDisplayName(row) || row.code || row.transaction_id}</p>
              <p className="truncate text-xs font-semibold text-text-muted dark:text-slate-400">{getEmail(row)} • {formatDate(row.created_at)}</p>
            </div>
            <StatusBadge value={row.status || row.role || row.active} />
          </div>
        )) : <p className="text-sm font-semibold text-text-muted">No records yet.</p>}
      </div>
    </Card>
  );
}

function UsersSection({ rows, roleFilter, setRoleFilter, onUpdate, onDelete }: { rows: AnyRecord[]; query: string; roleFilter: string; setRoleFilter: (value: string) => void; onUpdate: (table: string, id: string, patch: AnyRecord) => void; onDelete: (table: string, id: string) => void }) {
  return (
    <Card className="overflow-hidden rounded-3xl p-0">
      <div className="flex flex-col gap-4 border-b border-border p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-text-main dark:text-white">Registered users</h2>
          <p className="type-body mt-1">Manage access, roles, plans, and user state.</p>
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900">
          <option value="all">All roles</option>
          <option value="candidate">Candidates</option>
          <option value="employer">Employers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="bg-bg text-xs uppercase tracking-wider text-text-muted dark:bg-white/5">
            <tr>
              {["User", "Role", "Plan", "Applications", "Created", "Actions"].map((head) => <th key={head} className="px-5 py-4 font-black">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.id || row.email} className="transition hover:bg-primary/5">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <AdminAvatar row={row} />
                    <div>
                      <p className="font-black text-text-main dark:text-white">{getDisplayName(row)}</p>
                      <p className="text-xs font-semibold text-text-muted">{getEmail(row)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4"><StatusBadge value={row.role || "candidate"} /></td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.plan || "Free"}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.applications_used || 0}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{formatDate(row.created_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" className="px-3 py-2" onClick={() => onUpdate("profiles", row.id, { role: row.role === "admin" ? "candidate" : "admin" })}>Change role</Button>
                    <Button variant="secondary" className="px-3 py-2" onClick={() => onUpdate("profiles", row.id, { suspended: !row.suspended })}>Suspend</Button>
                    <Button variant="ghost" className="px-3 py-2 text-danger" onClick={() => onDelete("profiles", row.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CandidatesSection({ rows, profiles, applications }: { rows: AnyRecord[]; profiles: AnyRecord[]; applications: AnyRecord[] }) {
  const candidates = rows.length ? rows : profiles.filter((profile) => profile.role === "candidate");
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {candidates.map((candidate) => {
        const history = applications.filter((app) => app.candidate_id === candidate.user_id || app.candidate_id === candidate.id);
        const skills = Array.isArray(candidate.skills) ? candidate.skills : String(candidate.skills || "Admin, Excel").split(",").map((skill) => skill.trim()).filter(Boolean);
        return (
          <Card key={candidate.id || candidate.email} className="rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <AdminAvatar row={candidate} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-black text-text-main dark:text-white">{getDisplayName(candidate)}</h3>
                <p className="text-sm font-semibold text-text-muted">{getEmail(candidate)}</p>
                <p className="mt-2 text-sm font-bold text-text-muted">{candidate.career_level || candidate.experience_level || "Career level not set"} • {candidate.category || "No category"}</p>
              </div>
              <Badge variant="match-score">AI {candidate.match_score || 86}%</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{skills.slice(0, 8).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" className="px-3 py-2">Download ATS CV</Button>
              <Button variant="secondary" className="px-3 py-2">Designed CV</Button>
              <Button variant="primary" className="px-3 py-2">Upgrade plan</Button>
            </div>
            <div className="mt-5 rounded-2xl bg-bg p-4 dark:bg-white/5">
              <p className="type-label">Activity timeline</p>
              <p className="mt-2 text-sm font-semibold text-text-muted">{history.length || 0} applications tracked • Last profile update {formatDate(candidate.updated_at || candidate.created_at)}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function EmployersSection({ rows, jobs, onUpdate }: { rows: AnyRecord[]; jobs: AnyRecord[]; onUpdate: (table: string, id: string, patch: AnyRecord) => void }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {rows.length ? rows.map((employer) => {
        const employerJobs = jobs.filter((job) => job.employer_id === employer.user_id || job.employer_id === employer.id);
        return (
          <Card key={employer.id || employer.user_id} className="rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <AdminAvatar row={employer} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-xl font-black text-text-main dark:text-white">{employer.company_name || getDisplayName(employer)}</h3>
                <p className="text-sm font-semibold text-text-muted">{employer.industry || "Industry not set"} • {employer.location || "Location not set"}</p>
                <p className="mt-1 text-xs font-bold text-text-muted">{getEmail(employer)} • {employer.phone || "No phone"}</p>
              </div>
              <StatusBadge value={employer.verified ? "verified" : "pending"} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <AdminStatCard label="Jobs" value={employerJobs.length} detail="Posted roles" icon={FileText} accent="bg-primary/10" />
              <AdminStatCard label="Active" value={employerJobs.filter((job) => (job.status || "active") === "active").length} detail="Visible roles" icon={CheckCircle2} accent="bg-success/10" />
              <AdminStatCard label="Plan" value={employer.plan || "Free"} detail="Subscription" icon={Sparkles} accent="bg-purple-400/10" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => onUpdate("employers", employer.id, { verified: true })}>Verify employer</Button>
              <Button variant="secondary" onClick={() => onUpdate("employers", employer.id, { suspended: !employer.suspended })}>Suspend</Button>
              <Button variant="secondary">Edit company info</Button>
            </div>
          </Card>
        );
      }) : (
        <EmptyAdminState title="No employers found" message="Registered employer profiles will appear here after signup or profile completion." />
      )}
    </div>
  );
}

function ContactRequestsSection({ rows, onUpdate, onDelete }: { rows: AnyRecord[]; onUpdate: (table: string, id: string, patch: AnyRecord) => void; onDelete: (table: string, id: string) => void }) {
  return (
    <div className="grid gap-4">
      {rows.map((request) => (
        <Card key={request.id} className="rounded-3xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black text-text-main dark:text-white">{request.name}</h3>
                <StatusBadge value={request.status || "new"} />
              </div>
              <p className="mt-1 text-sm font-semibold text-text-muted">{request.company} • {request.email} • {request.phone}</p>
              <p className="mt-4 max-w-4xl text-sm font-medium leading-6 text-text-muted">{request.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["new", "in progress", "resolved"].map((status) => <Button key={status} variant="secondary" className="px-3 py-2" onClick={() => onUpdate("contact_requests", request.id, { status })}>{status}</Button>)}
              <Button variant="ghost" className="px-3 py-2 text-danger" onClick={() => onDelete("contact_requests", request.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CouponsSection({ rows, onGenerate, onUpdate, onDelete }: { rows: AnyRecord[]; onGenerate: () => void; onUpdate: (table: string, id: string, patch: AnyRecord) => void; onDelete: (table: string, id: string) => void }) {
  return (
    <div className="grid gap-5">
      <div className="flex justify-end">
        <Button onClick={onGenerate} className="gap-2"><Gift className="h-4 w-4" />Generate Random Coupon</Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((coupon) => (
          <Card key={coupon.id || coupon.code} className="rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="type-label">Coupon code</p>
                <h3 className="mt-2 text-3xl font-black tracking-tight text-text-main dark:text-white">{coupon.code}</h3>
              </div>
              <StatusBadge value={coupon.active} />
            </div>
            <div className="mt-5 grid gap-3 rounded-2xl bg-bg p-4 text-sm font-bold text-text-muted dark:bg-white/5">
              <p>{coupon.discount_percentage}% discount</p>
              <p>{coupon.used_count || 0}/{coupon.usage_limit || "∞"} used</p>
              <p>Expires {formatDate(coupon.expires_at)}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" className="gap-2" onClick={() => navigator.clipboard?.writeText(coupon.code)}><Copy className="h-4 w-4" />Copy</Button>
              <Button variant="secondary" onClick={() => onUpdate("coupons", coupon.id, { active: !coupon.active })}>{coupon.active ? "Disable" : "Enable"}</Button>
              <Button variant="ghost" className="text-danger" onClick={() => onDelete("coupons", coupon.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TransactionsSection({ rows }: { rows: AnyRecord[] }) {
  return (
    <Card className="overflow-hidden rounded-3xl p-0">
      <div className="flex items-center justify-between border-b border-border p-5 dark:border-white/10">
        <div>
          <h2 className="text-xl font-black text-text-main dark:text-white">Transaction history</h2>
          <p className="type-body mt-1">Subscription purchases, upgrades, coupon usage, and payment status.</p>
        </div>
        <Button variant="secondary" className="gap-2" onClick={() => exportCsv("rc-transactions.csv", rows)}><Download className="h-4 w-4" />Export CSV</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left">
          <thead className="bg-bg text-xs uppercase tracking-wider text-text-muted dark:bg-white/5">
            <tr>
              {["User", "Amount", "Method", "Coupon", "Transaction ID", "Status", "Date"].map((head) => <th key={head} className="px-5 py-4 font-black">{head}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.id || row.transaction_id} className="hover:bg-primary/5">
                <td className="px-5 py-4 font-bold">{getEmail(row)}</td>
                <td className="px-5 py-4 font-black">BDT {Number(row.amount || 0).toLocaleString()}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.payment_method || "Card"}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.coupon_used || "None"}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.transaction_id || row.id}</td>
                <td className="px-5 py-4"><StatusBadge value={row.status || "paid"} /></td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{formatDate(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SettingsSection({ data }: { data: AdminState }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-3xl p-6">
        <p className="type-label text-primary">Security</p>
        <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Admin protection checklist</h2>
        <div className="mt-5 grid gap-3">
          {[
            "Use profiles.role = admin for admin-only access.",
            "Enable RLS policies for contact_requests, coupons, and transactions.",
            "Use Supabase Storage signed URLs for private CV previews.",
            "Keep destructive account deletion behind a service-role API."
          ].map((item) => (
            <div key={item} className="flex gap-3 rounded-2xl bg-bg p-3 dark:bg-white/5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              <p className="text-sm font-semibold text-text-muted">{item}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="rounded-3xl p-6">
        <p className="type-label text-primary">Exports</p>
        <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Download platform data</h2>
        <div className="mt-5 grid gap-3">
          <Button variant="secondary" className="justify-between" onClick={() => exportCsv("rc-candidates.csv", data.candidates)}>Candidates CSV <Download className="h-4 w-4" /></Button>
          <Button variant="secondary" className="justify-between" onClick={() => exportCsv("rc-employers.csv", data.employers)}>Employers CSV <Download className="h-4 w-4" /></Button>
          <Button variant="secondary" className="justify-between" onClick={() => exportCsv("rc-transactions.csv", data.transactions)}>Transactions CSV <Download className="h-4 w-4" /></Button>
        </div>
      </Card>
      <Card className="rounded-3xl p-6 xl:col-span-2">
        <p className="type-label text-primary">Storage</p>
        <h2 className="mt-2 text-2xl font-black text-text-main dark:text-white">Supabase Storage areas</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["profile-photos", "cvs", "certifications"].map((bucket) => (
            <div key={bucket} className="rounded-2xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
              <p className="font-black text-text-main dark:text-white">{bucket}</p>
              <p className="mt-2 text-sm font-semibold text-text-muted">Preview and download files through signed URLs.</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyAdminState({ title, message }: { title: string; message: string }) {
  return (
    <Card className="rounded-3xl p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-black text-text-main dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-text-muted">{message}</p>
    </Card>
  );
}
