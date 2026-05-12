"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  CreditCard,
  Download,
  Edit3,
  Eye,
  FileText,
  Gift,
  LayoutDashboard,
  Loader2,
  Mail,
  MoreHorizontal,
  Search,
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
import { mergeRowsWithProfiles } from "@/lib/authUserSync";

type AdminSection =
  | "dashboard"
  | "users"
  | "candidates"
  | "employers"
  | "jobs"
  | "employees"
  | "contact-requests"
  | "coupons"
  | "transactions";

type AnyRecord = Record<string, any>;
type PlatformRole = "admin" | "viewer" | "employer" | "employee" | "candidate";

const platformRoles: { value: PlatformRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Admin (Viewer)" },
  { value: "employer", label: "Employer" },
  { value: "employee", label: "Employee" },
  { value: "candidate", label: "Candidate" }
];

const roleLabelMap = platformRoles.reduce<Record<string, string>>((labels, role) => {
  labels[role.value] = role.label;
  return labels;
}, {});

type AdminState = {
  profiles: AnyRecord[];
  candidates: AnyRecord[];
  employers: AnyRecord[];
  employees: AnyRecord[];
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
  employees: [],
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
  jobs: {
    title: "Job Management",
    description: "Review, edit, archive, and correct any employer job post from one admin list."
  },
  employees: {
    title: "Employee Management",
    description: "Create support employees, monitor access, and keep internal ticket ownership clear."
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
  }
};

const navItems = [
  { label: "Dashboard", href: "/admin", key: "dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", key: "users", icon: UserCog },
  { label: "Candidates", href: "/admin/candidates", key: "candidates", icon: Users },
  { label: "Employers", href: "/admin/employers", key: "employers", icon: BriefcaseBusiness },
  { label: "Jobs", href: "/admin/jobs", key: "jobs", icon: FileText },
  { label: "Employees", href: "/admin/employees", key: "employees", icon: UserCog },
  { label: "Support Tickets", href: "/admin/support", key: "support", icon: Bell },
  { label: "Contact Requests", href: "/admin/contact-requests", key: "contact-requests", icon: Mail },
  { label: "Coupons", href: "/admin/coupons", key: "coupons", icon: Gift },
  { label: "Transactions", href: "/admin/transactions", key: "transactions", icon: CreditCard }
] as const;

const fallbackProfiles = [
  { id: "admin-demo", full_name: "RC Super Admin", email: "admin@mxventurelab.com", role: "admin", plan: "Internal", applications_used: 0, created_at: "2026-05-01" },
  { id: "viewer-demo", full_name: "RC Viewer", email: "viewer@mxventurelab.com", role: "viewer", plan: "Internal", applications_used: 0, created_at: "2026-05-01" },
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

function isVerifiedRecord(row: AnyRecord) {
  return Boolean(row.verified) || String(row.plan || "").toLowerCase() === "pro";
}

function VerifiedBadge() {
  return <Badge variant="primary" className="gap-1">Verified</Badge>;
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
        <div className="grid h-12 w-12 place-items-center text-primary transition group-hover:scale-105">
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

function StatusBadge({ value, className }: { value?: string | boolean; className?: string }) {
  const normalized = String(value ?? "active").toLowerCase();
  const variant = normalized.includes("paid") || normalized.includes("active") || normalized.includes("resolved") || value === true
    ? "success"
    : normalized.includes("pending") || normalized.includes("progress")
      ? "primary"
      : normalized.includes("suspend") || normalized.includes("failed")
        ? "danger"
        : "neutral";

  const label = value === true ? "Active" : value === false ? "Inactive" : String(value ?? "active");
  return <Badge variant={variant as any} className={className}>{label}</Badge>;
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const readOnly = role === "viewer";
  const canAccessAdmin = role === "admin" || role === "viewer";

  useEffect(() => {
    if (loading) return;
    if (!user || !canAccessAdmin) router.replace("/");
  }, [canAccessAdmin, loading, router, user]);

  useEffect(() => {
    let active = true;

    async function loadAdminData() {
      setDataLoading(true);
      let syncedCandidates: AnyRecord[] = [];
      let syncedEmployers: AnyRecord[] = [];

      if (isSupabaseConfigured) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (token) {
          const response = await fetch("/api/admin/sync-auth-users", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);

          if (response?.ok) {
            const payload = await response.json().catch(() => ({}));
            syncedCandidates = Array.isArray(payload.candidates) ? payload.candidates : [];
            syncedEmployers = Array.isArray(payload.employers) ? payload.employers : [];
          }
        }
      }

      const [profiles, candidates, employers, employees, jobs, applications, contactRequests, coupons, transactions] = await Promise.all([
        safeSelect("profiles"),
        safeSelect("candidates"),
        safeSelect("employers"),
        safeSelect("employees"),
        safeSelect("jobs"),
        safeSelect("applications"),
        safeSelect("contact_requests"),
        safeSelect("coupons"),
        safeSelect("transactions")
      ]);

      if (!active) return;

      setAdminData({
        profiles: profiles.length ? profiles : fallbackProfiles,
        candidates: syncedCandidates.length ? syncedCandidates : mergeRowsWithProfiles(candidates, profiles.length ? profiles : fallbackProfiles, "candidate"),
        employers: syncedEmployers.length ? syncedEmployers : mergeRowsWithProfiles(employers, profiles.length ? profiles : fallbackProfiles, "employer"),
        employees,
        jobs,
        applications,
        contactRequests: contactRequests.length ? contactRequests : fallbackContacts,
        coupons: coupons.length ? coupons : fallbackCoupons,
        transactions: transactions.length ? transactions : fallbackTransactions
      });
      setDataLoading(false);
    }

    if (!loading && canAccessAdmin) loadAdminData();

    return () => {
      active = false;
    };
  }, [canAccessAdmin, loading]);

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

  const adminNotifications = useMemo(() => {
    const contactItems = adminData.contactRequests
      .filter((request) => String(request.status || "new").toLowerCase() !== "resolved")
      .slice(0, 4)
      .map((request) => ({
        id: `contact-${request.id}`,
        title: request.status === "in progress" ? "Contact request in progress" : "New contact request",
        message: `${request.name || "Someone"} from ${request.company || "a company"} needs follow-up.`,
        href: "/admin/contact-requests",
        icon: Mail,
        created_at: request.created_at
      }));

    const signupItems = adminData.profiles
      .slice(0, 4)
      .map((profile) => ({
        id: `profile-${profile.id || profile.email}`,
        title: `New ${profile.role || "user"} registered`,
        message: `${getDisplayName(profile)} joined RC.`,
        href: profile.role === "employer" ? "/admin/employers" : profile.role === "candidate" ? "/admin/candidates" : "/admin/users",
        icon: Users,
        created_at: profile.created_at
      }));

    const transactionItems = adminData.transactions
      .slice(0, 3)
      .map((tx) => ({
        id: `tx-${tx.id || tx.transaction_id}`,
        title: String(tx.status || "paid").toLowerCase() === "paid" ? "Payment completed" : "Payment needs review",
        message: `${getEmail(tx)} • BDT ${Number(tx.amount || 0).toLocaleString()}`,
        href: "/admin/transactions",
        icon: CircleDollarSign,
        created_at: tx.created_at
      }));

    return [...contactItems, ...signupItems, ...transactionItems]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10);
  }, [adminData.contactRequests, adminData.profiles, adminData.transactions]);

  const visibleAdminNotifications = useMemo(() => (
    adminNotifications.filter((item) => !clearedNotificationIds.includes(item.id))
  ), [adminNotifications, clearedNotificationIds]);

  function clearAdminNotifications() {
    setClearedNotificationIds((current) => {
      const next = new Set(current);
      visibleAdminNotifications.forEach((item) => next.add(item.id));
      return Array.from(next);
    });
  }

  async function updateRecord(table: string, id: string, patch: AnyRecord) {
    if (readOnly) {
      setNotice("Viewer accounts can inspect admin data, but cannot make changes.");
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.from(table).update(patch).eq("id", id);
    }
    const stateKey = ({
      profiles: "profiles",
      candidates: "candidates",
      employers: "employers",
      employees: "employees",
      jobs: "jobs",
      applications: "applications",
      contact_requests: "contactRequests",
      coupons: "coupons",
      transactions: "transactions"
    } as Record<string, keyof AdminState>)[table];

    if (stateKey) {
      setAdminData((current) => ({
        ...current,
        [stateKey]: current[stateKey].map((row) => row.id === id ? { ...row, ...patch } : row)
      }));
    }
    setNotice("Update saved");

    if ((table === "candidates" || table === "employers") && Object.prototype.hasOwnProperty.call(patch, "verified")) {
      window.setTimeout(() => window.location.reload(), 900);
    }
  }

  async function updateCandidatePlan(candidate: AnyRecord, nextPlan: "Basic" | "Pro") {
    if (readOnly) {
      setNotice("Viewer accounts can inspect admin data, but cannot change plans.");
      return;
    }

    const verified = nextPlan === "Pro";
    const userId = candidate.user_id || "";
    const email = getEmail(candidate);

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/update-user-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({
          user_id: userId,
          candidate_id: candidate.id,
          email,
          plan: nextPlan,
          verified
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const canFallbackToClientUpdate = response.status === 500 && String(payload.error || "").toLowerCase().includes("service role");

        if (!canFallbackToClientUpdate) {
          setNotice(payload.error || "Could not update plan.");
          return;
        }

        await supabase.from("candidates").update({ plan: nextPlan, verified }).eq("id", candidate.id);

        if (userId) {
          await supabase.from("profiles").update({ plan: nextPlan, verified }).eq("id", userId);
        } else if (email) {
          await supabase.from("profiles").update({ plan: nextPlan, verified }).eq("email", email);
        }
      }
    }

    setAdminData((current) => ({
      ...current,
      profiles: current.profiles.map((row) => (
        row.id === userId || (email && String(row.email || "").toLowerCase() === email.toLowerCase())
          ? { ...row, plan: nextPlan, verified }
          : row
      )),
      candidates: current.candidates.map((row) => (
        row.id === candidate.id || row.user_id === userId || (email && String(row.email || "").toLowerCase() === email.toLowerCase())
          ? { ...row, plan: nextPlan, verified }
          : row
      ))
    }));
    setNotice(`Candidate plan changed to ${nextPlan}.`);
  }

  async function updateUserRole(profile: AnyRecord, nextRole: PlatformRole) {
    if (readOnly) {
      setNotice("Viewer accounts can inspect admin data, but cannot change roles.");
      return;
    }

    if (!profile?.id || !platformRoles.some((roleItem) => roleItem.value === nextRole)) {
      setNotice("Could not update role because the user record is invalid.");
      return;
    }

    if (isSupabaseConfigured) {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/admin/update-user-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
        },
        body: JSON.stringify({
          user_id: profile.id,
          role: nextRole,
          full_name: getDisplayName(profile),
          email: getEmail(profile)
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const canFallbackToProfileUpdate = response.status === 500 && String(payload.error || "").toLowerCase().includes("service role");

        if (!canFallbackToProfileUpdate) {
          setNotice(payload.error || "Could not update role.");
          return;
        }

        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({
            role: nextRole,
            plan: nextRole === "admin" || nextRole === "viewer" || nextRole === "employee" ? "Internal" : profile.plan || "Basic"
          })
          .eq("id", profile.id);

        if (profileUpdateError) {
          setNotice(profileUpdateError.message || "Could not update role.");
          return;
        }
      }
    }

    setAdminData((current) => ({
      ...current,
      profiles: current.profiles.map((row) => row.id === profile.id ? { ...row, role: nextRole } : row)
    }));
    setNotice(`Role changed to ${roleLabelMap[nextRole]}.`);
  }

  async function deleteRecord(table: string, id: string) {
    if (readOnly) {
      setNotice("Viewer accounts can inspect admin data, but cannot delete records.");
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.from(table).delete().eq("id", id);
    }
    setNotice("Record deleted or queued for deletion.");
  }

  async function generateCoupon() {
    if (readOnly) {
      setNotice("Viewer accounts can inspect coupons, but cannot generate them.");
      return;
    }
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

  async function createCoupon(coupon: AnyRecord) {
    if (readOnly) {
      setNotice("Viewer accounts can inspect coupons, but cannot create them.");
      return;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from("coupons").insert(coupon).select("*").maybeSingle();
      if (error) {
        setNotice(error.message);
        return;
      }
      setAdminData((current) => ({ ...current, coupons: [data || { id: coupon.code, ...coupon }, ...current.coupons] }));
    } else {
      setAdminData((current) => ({ ...current, coupons: [{ id: coupon.code, ...coupon }, ...current.coupons] }));
    }

    setNotice(`Coupon ${coupon.code} added.`);
  }

  if (loading || (user && !canAccessAdmin)) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-6">
        <Card className="flex items-center gap-3 rounded-3xl p-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="font-bold text-text-muted">Checking admin access...</span>
        </Card>
      </main>
    );
  }

  if (!user || !canAccessAdmin) return null;

  const meta = sectionMeta[section];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_32%),linear-gradient(180deg,#020617,#0f172a)] sm:px-6">
      <div className="mx-auto flex max-w-[1440px] gap-6">
        <aside className={cn(
          "fixed inset-y-4 left-4 z-40 w-72 rounded-3xl border border-white/60 bg-white/88 p-4 shadow-elevated backdrop-blur-2xl transition lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-7rem)] dark:border-white/10 dark:bg-slate-950/80",
          sidebarOpen ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0"
        )}>
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-950 to-primary p-4 text-white">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black">Admin</p>
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
                  <span className={cn("grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-text-muted dark:bg-white/10 dark:text-slate-300", active && "bg-white/20 text-white")}>
                    <Icon className="h-4 w-4" />
                  </span>
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((value) => !value)}
                    className="relative grid h-11 w-11 place-items-center rounded-2xl border border-border bg-surface shadow-soft transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-slate-900"
                    aria-label="Admin notifications"
                  >
                    <Bell className="h-5 w-5 text-text-muted" />
                    {visibleAdminNotifications.length ? (
                      <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-black text-white">
                        {visibleAdminNotifications.length}
                      </span>
                    ) : null}
                  </button>
                  {notificationsOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-border bg-white shadow-elevated dark:border-white/10 dark:bg-slate-950">
                      <div className="flex items-start justify-between gap-3 border-b border-border p-4 dark:border-white/10">
                        <div>
                          <p className="type-label text-primary">Notifications</p>
                          <h3 className="mt-1 text-lg font-black text-text-main dark:text-white">Admin activity</h3>
                        </div>
                        {visibleAdminNotifications.length ? (
                          <button
                            type="button"
                            onClick={clearAdminNotifications}
                            className="rounded-full border border-border px-3 py-1 text-xs font-black text-text-muted transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                      <div className="max-h-96 overflow-y-auto p-2">
                        {visibleAdminNotifications.length ? visibleAdminNotifications.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => setNotificationsOpen(false)}
                              className="flex gap-3 rounded-2xl p-3 transition hover:bg-primary/5 dark:hover:bg-white/5"
                            >
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-text-main dark:text-white">{item.title}</span>
                                <span className="mt-1 block text-xs font-semibold leading-5 text-text-muted dark:text-slate-400">{item.message}</span>
                                <span className="mt-1 block text-[11px] font-bold text-text-muted">{formatDate(item.created_at)}</span>
                              </span>
                            </Link>
                          );
                        }) : (
                          <div className="p-6 text-center">
                            <Bell className="mx-auto h-6 w-6 text-text-muted" />
                            <p className="mt-3 text-sm font-bold text-text-muted">No new admin notifications.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
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
              {section === "users" ? <UsersSection rows={filteredProfiles} query={query} roleFilter={roleFilter} setRoleFilter={setRoleFilter} onUpdate={updateRecord} onRoleChange={updateUserRole} onDelete={deleteRecord} readOnly={readOnly} onNotice={setNotice} /> : null}
              {section === "candidates" ? <CandidatesSection rows={adminData.candidates} profiles={adminData.profiles} applications={adminData.applications} onUpdate={updateRecord} onPlanChange={updateCandidatePlan} readOnly={readOnly} /> : null}
              {section === "employers" ? <EmployersSection rows={adminData.employers} jobs={adminData.jobs} onUpdate={updateRecord} readOnly={readOnly} /> : null}
              {section === "jobs" ? <JobsSection rows={adminData.jobs} onUpdate={updateRecord} readOnly={readOnly} /> : null}
              {section === "employees" ? <EmployeesSection rows={adminData.employees} onUpdate={updateRecord} readOnly={readOnly} /> : null}
              {section === "contact-requests" ? <ContactRequestsSection rows={adminData.contactRequests} onUpdate={updateRecord} onDelete={deleteRecord} /> : null}
              {section === "coupons" ? <CouponsSection rows={adminData.coupons} onCreate={createCoupon} onGenerate={generateCoupon} onUpdate={updateRecord} onDelete={deleteRecord} readOnly={readOnly} /> : null}
              {section === "transactions" ? <TransactionsSection rows={adminData.transactions} /> : null}
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

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <RecentList title="Recent Signups" rows={data.profiles.slice(0, 5)} />
        <RecentList title="Latest Transactions" rows={data.transactions.slice(0, 5)} />
        <RecentList title="Latest Contact Requests" rows={data.contactRequests.slice(0, 5)} />
      </div>
    </div>
  );
}

function RecentList({ title, rows }: { title: string; rows: AnyRecord[] }) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-3xl p-5">
      <h3 className="text-lg font-black text-text-main dark:text-white">{title}</h3>
      <div className="mt-4 grid gap-3">
        {rows.length ? rows.map((row) => (
          <div key={row.id || row.email || row.code} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-bg p-3 dark:bg-white/5">
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-black text-text-main dark:text-white">{getDisplayName(row) || row.code || row.transaction_id}</p>
              <p className="truncate text-xs font-semibold text-text-muted dark:text-slate-400">{getEmail(row)} • {formatDate(row.created_at)}</p>
            </div>
            <StatusBadge value={row.status || row.role || row.active} className="max-w-[112px] justify-center truncate px-2" />
          </div>
        )) : <p className="text-sm font-semibold text-text-muted">No records yet.</p>}
      </div>
    </Card>
  );
}

function UsersSection({
  rows,
  roleFilter,
  setRoleFilter,
  onUpdate,
  onRoleChange,
  onDelete,
  readOnly,
  onNotice
}: {
  rows: AnyRecord[];
  query: string;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  onUpdate: (table: string, id: string, patch: AnyRecord) => void;
  onRoleChange: (profile: AnyRecord, nextRole: PlatformRole) => void;
  onDelete: (table: string, id: string) => void;
  readOnly: boolean;
  onNotice: (message: string) => void;
}) {
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", role: "admin" });
  const [creating, setCreating] = useState(false);

  async function createInternalUser() {
    if (readOnly) {
      onNotice("Viewer accounts cannot create admin users.");
      return;
    }

    if (!newUser.full_name || !newUser.email || !newUser.password) {
      onNotice("Full name, email, and password are required to create an internal user.");
      return;
    }

    setCreating(true);
    const { data: sessionData } = isSupabaseConfigured ? await supabase.auth.getSession() : { data: { session: null } as any };
    const response = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionData?.session?.access_token ? { Authorization: `Bearer ${sessionData.session.access_token}` } : {})
      },
      body: JSON.stringify(newUser)
    });
    const result = await response.json().catch(() => ({}));
    setCreating(false);

    if (!response.ok) {
      onNotice(result.error || "Could not create internal user.");
      return;
    }

    setNewUser({ full_name: "", email: "", password: "", role: "admin" });
    onNotice(`${roleLabelMap[newUser.role] || "Internal"} user created successfully.`);
  }

  return (
    <div className="grid gap-5">
      <Card className="rounded-3xl p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="type-label text-primary">Internal access</p>
            <h2 className="mt-2 text-xl font-black text-text-main dark:text-white">Add internal user</h2>
            <p className="type-body mt-1">Create Admin, Admin (Viewer), or Employee access. Candidate and Employer roles are managed in the user table below.</p>
          </div>
          {readOnly ? <Badge variant="neutral">Read only</Badge> : null}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_180px_180px_auto]">
          <Input value={newUser.full_name} onChange={(event) => setNewUser((current) => ({ ...current, full_name: event.target.value }))} placeholder="Full name" disabled={readOnly} />
          <Input value={newUser.email} onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))} placeholder="Email" disabled={readOnly} />
          <Input value={newUser.password} onChange={(event) => setNewUser((current) => ({ ...current, password: event.target.value }))} placeholder="Password" type="password" disabled={readOnly} />
                <select value={newUser.role} onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value }))} disabled={readOnly} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900">
                  <option value="admin">Admin</option>
                  <option value="viewer">Admin (Viewer)</option>
                  <option value="employee">Employee</option>
                </select>
          <Button onClick={createInternalUser} disabled={creating || readOnly}>{creating ? "Creating..." : "Add user"}</Button>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-3xl p-0">
      <div className="flex flex-col gap-4 border-b border-border p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-text-main dark:text-white">Registered users</h2>
          <p className="type-body mt-1">Manage access, roles, plans, and user state.</p>
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900">
          <option value="all">All roles</option>
          {platformRoles.map((roleItem) => (
            <option key={roleItem.value} value={roleItem.value}>{roleItem.label}</option>
          ))}
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
                <td className="px-5 py-4"><StatusBadge value={roleLabelMap[row.role] || row.role || "Candidate"} /></td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.plan || "Free"}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{row.applications_used || 0}</td>
                <td className="px-5 py-4 text-sm font-bold text-text-muted">{formatDate(row.created_at)}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={platformRoles.some((roleItem) => roleItem.value === row.role) ? row.role : "candidate"}
                      disabled={readOnly}
                      onChange={(event) => onRoleChange(row, event.target.value as PlatformRole)}
                      className="rounded-2xl border border-border bg-surface px-3 py-2 text-sm font-bold text-text-main shadow-soft transition focus:border-primary focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      {platformRoles.map((roleItem) => (
                        <option key={roleItem.value} value={roleItem.value}>{roleItem.label}</option>
                      ))}
                    </select>
                    <Button variant="secondary" className="px-3 py-2" disabled={readOnly} onClick={() => onUpdate("profiles", row.id, { suspended: !row.suspended })}>Suspend</Button>
                    <Button variant="ghost" className="px-3 py-2 text-danger" disabled={readOnly} onClick={() => onDelete("profiles", row.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </Card>
    </div>
  );
}

function CandidatesSection({
  rows,
  profiles,
  applications,
  onUpdate,
  onPlanChange,
  readOnly
}: {
  rows: AnyRecord[];
  profiles: AnyRecord[];
  applications: AnyRecord[];
  onUpdate: (table: string, id: string, patch: AnyRecord) => void;
  onPlanChange: (candidate: AnyRecord, nextPlan: "Basic" | "Pro") => void;
  readOnly: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnyRecord>({});
  const candidates = rows.length ? rows : profiles.filter((profile) => profile.role === "candidate");

  function startEdit(candidate: AnyRecord) {
    setEditingId(candidate.id || candidate.user_id || candidate.email);
    setDraft({
      name: candidate.name || candidate.full_name || "",
      full_name: candidate.full_name || candidate.name || "",
      email: candidate.email || "",
      phone: candidate.phone || "",
      category: candidate.category || "",
      career_level: candidate.career_level || candidate.experience_level || "",
      linkedin_url: candidate.linkedin_url || "",
      location: candidate.location || "",
      about: candidate.about || candidate.bio || "",
      plan: candidate.plan || "Basic",
      verified: isVerifiedRecord(candidate)
    });
  }

  return (
    <div className="grid gap-5">
      {candidates.map((candidate) => {
        const recordKey = candidate.id || candidate.user_id || candidate.email;
        const history = applications.filter((app) => app.candidate_id === candidate.user_id || app.candidate_id === candidate.id);
        const skills = Array.isArray(candidate.skills) ? candidate.skills : String(candidate.skills || "Admin, Excel").split(",").map((skill) => skill.trim()).filter(Boolean);
        const editing = editingId === recordKey;
        return (
          <Card key={recordKey} className="rounded-3xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <AdminAvatar row={candidate} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-xl font-black text-text-main dark:text-white">{getDisplayName(candidate)}</h3>
                  {isVerifiedRecord(candidate) ? <VerifiedBadge /> : null}
                </div>
                <p className="text-sm font-semibold text-text-muted">{getEmail(candidate)}</p>
                <p className="mt-2 text-sm font-bold text-text-muted">{candidate.career_level || candidate.experience_level || "Career level not set"} ? {candidate.category || "No category"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="match-score">AI {candidate.match_score || 86}%</Badge>
                <Button variant="secondary" className="gap-2 px-3 py-2" onClick={() => startEdit(candidate)}><Edit3 className="h-4 w-4" />Edit details</Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{skills.slice(0, 8).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            {editing ? (
              <div className="mt-5 rounded-3xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={draft.name || ""} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, full_name: event.target.value }))} placeholder="Candidate name" />
                  <Input value={draft.email || ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
                  <Input value={draft.phone || ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
                  <Input value={draft.location || ""} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                  <Input value={draft.category || ""} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
                  <Input value={draft.career_level || ""} onChange={(event) => setDraft((current) => ({ ...current, career_level: event.target.value }))} placeholder="Career level" />
                  <Input value={draft.linkedin_url || ""} onChange={(event) => setDraft((current) => ({ ...current, linkedin_url: event.target.value }))} placeholder="LinkedIn profile" />
                  <select value={draft.plan || "Basic"} onChange={(event) => setDraft((current) => ({ ...current, plan: event.target.value, verified: event.target.value === "Pro" ? true : current.verified }))} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900">
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <textarea value={draft.about || ""} onChange={(event) => setDraft((current) => ({ ...current, about: event.target.value }))} placeholder="About candidate" className="mt-3 min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />
                <label className="mt-3 flex items-center gap-2 text-sm font-bold text-text-muted">
                  <input type="checkbox" checked={Boolean(draft.verified)} onChange={(event) => setDraft((current) => ({ ...current, verified: event.target.checked }))} />
                  Verified candidate badge
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={readOnly} onClick={() => {
                    onUpdate("candidates", candidate.id, draft);
                    if (candidate.user_id) onUpdate("profiles", candidate.user_id, { full_name: draft.full_name || draft.name, email: draft.email, plan: draft.plan, verified: draft.verified });
                    if (draft.plan === "Basic" || draft.plan === "Pro") onPlanChange(candidate, draft.plan);
                    setEditingId(null);
                  }}>Save candidate</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : null}
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_220px]">
              <Button variant="secondary" className="px-3 py-2">Download ATS CV</Button>
              <Button variant="secondary" className="px-3 py-2">Designed CV</Button>
              <div className="grid grid-cols-2 gap-2">
                {["Basic", "Pro"].map((plan) => (
                  <Button key={plan} variant={String(candidate.plan || "Basic") === plan ? "primary" : "secondary"} className="px-3 py-2" disabled={readOnly} onClick={() => onPlanChange(candidate, plan as "Basic" | "Pro")}>{plan}</Button>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-bg p-4 dark:bg-white/5">
              <p className="type-label">Activity timeline</p>
              <p className="mt-2 text-sm font-semibold text-text-muted">{history.length || 0} applications tracked ? Last profile update {formatDate(candidate.updated_at || candidate.created_at)}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function EmployersSection({ rows, jobs, onUpdate, readOnly }: { rows: AnyRecord[]; jobs: AnyRecord[]; onUpdate: (table: string, id: string, patch: AnyRecord) => void; readOnly: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnyRecord>({});

  function startEdit(employer: AnyRecord) {
    setEditingId(employer.id || employer.user_id || employer.email);
    setDraft({
      company_name: employer.company_name || employer.name || "",
      contact_person: employer.contact_person || employer.full_name || "",
      email: employer.email || "",
      phone: employer.phone || "",
      location: employer.location || "",
      industry: employer.industry || "",
      company_size: employer.company_size || "",
      about: employer.about || "",
      linkedin_url: employer.linkedin_url || employer.linkedin || "",
      website: employer.website || employer.company_website || "",
      facebook_url: employer.facebook_url || employer.facebook || "",
      verified: Boolean(employer.verified)
    });
  }

  return (
    <div className="grid gap-5">
      {rows.length ? rows.map((employer) => {
        const recordKey = employer.id || employer.user_id || employer.email;
        const employerJobs = jobs.filter((job) => job.employer_id === employer.user_id || job.employer_id === employer.id);
        const editing = editingId === recordKey;
        return (
          <Card key={recordKey} className="rounded-3xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <AdminAvatar row={employer} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-xl font-black text-text-main dark:text-white">{employer.company_name || getDisplayName(employer)}</h3>
                  {employer.verified ? <VerifiedBadge /> : null}
                </div>
                <p className="text-sm font-semibold text-text-muted">{employer.industry || "Industry not set"} ? {employer.location || "Location not set"}</p>
                <p className="mt-1 text-xs font-bold text-text-muted">{getEmail(employer)} ? {employer.phone || "No phone"}</p>
              </div>
              <StatusBadge value={employer.verified ? "verified" : "pending"} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <AdminStatCard label="Jobs" value={employerJobs.length} detail="Posted roles" icon={FileText} accent="bg-primary/10" />
              <AdminStatCard label="Active" value={employerJobs.filter((job) => (job.status || "active") === "active").length} detail="Visible roles" icon={CheckCircle2} accent="bg-success/10" />
              <AdminStatCard label="Plan" value={employer.plan || "Free"} detail="Subscription" icon={Sparkles} accent="bg-purple-400/10" />
            </div>
            {editing ? (
              <div className="mt-5 rounded-3xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={draft.company_name || ""} onChange={(event) => setDraft((current) => ({ ...current, company_name: event.target.value }))} placeholder="Company name" />
                  <Input value={draft.contact_person || ""} onChange={(event) => setDraft((current) => ({ ...current, contact_person: event.target.value }))} placeholder="Contact person" />
                  <Input value={draft.email || ""} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
                  <Input value={draft.phone || ""} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" />
                  <Input value={draft.location || ""} onChange={(event) => setDraft((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                  <Input value={draft.industry || ""} onChange={(event) => setDraft((current) => ({ ...current, industry: event.target.value }))} placeholder="Industry" />
                  <Input value={draft.company_size || ""} onChange={(event) => setDraft((current) => ({ ...current, company_size: event.target.value }))} placeholder="Company size" />
                  <Input value={draft.linkedin_url || ""} onChange={(event) => setDraft((current) => ({ ...current, linkedin_url: event.target.value }))} placeholder="LinkedIn page" />
                  <Input value={draft.website || ""} onChange={(event) => setDraft((current) => ({ ...current, website: event.target.value }))} placeholder="Company website" />
                  <Input value={draft.facebook_url || ""} onChange={(event) => setDraft((current) => ({ ...current, facebook_url: event.target.value }))} placeholder="Facebook page" />
                </div>
                <textarea value={draft.about || ""} onChange={(event) => setDraft((current) => ({ ...current, about: event.target.value }))} placeholder="About company" className="mt-3 min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />
                <label className="mt-3 flex items-center gap-2 text-sm font-bold text-text-muted">
                  <input type="checkbox" checked={Boolean(draft.verified)} onChange={(event) => setDraft((current) => ({ ...current, verified: event.target.checked }))} />
                  Verified employer badge
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={readOnly} onClick={() => { onUpdate("employers", employer.id, draft); setEditingId(null); }}>Save company</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" disabled={readOnly} onClick={() => onUpdate("employers", employer.id, { verified: true })}>Verify employer</Button>
              <Button variant="secondary" disabled={readOnly} onClick={() => onUpdate("employers", employer.id, { suspended: !employer.suspended })}>Suspend</Button>
              <Button variant="secondary" className="gap-2" onClick={() => startEdit(employer)}><Edit3 className="h-4 w-4" />Edit company info</Button>
            </div>
          </Card>
        );
      }) : (
        <EmptyAdminState title="No employers found" message="Registered employer profiles will appear here after signup or profile completion." />
      )}
    </div>
  );
}


function JobsSection({ rows, onUpdate, readOnly }: { rows: AnyRecord[]; onUpdate: (table: string, id: string, patch: AnyRecord) => void; readOnly: boolean }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnyRecord>({});

  function startEdit(job: AnyRecord) {
    setEditingId(job.id);
    setDraft({
      job_title: job.job_title || job.title || "",
      company_name: job.company_name || job.company || "",
      job_location: job.job_location || job.location || "",
      category: job.category || "",
      job_type: job.job_type || job.type || "",
      job_level: job.job_level || job.experience_level || "",
      employment_type: job.employment_type || "",
      experience_years: job.experience_years || job.required_experience || "",
      salary_min: job.salary_min || "",
      salary_max: job.salary_max || "",
      status: job.status || "active",
      last_date: job.last_date || job.deadline || "",
      description: job.description || "",
      requirements: job.requirements || ""
    });
  }

  if (!rows.length) {
    return <EmptyAdminState title="No jobs found" message="Employer job posts will appear here after they publish hiring requirements." />;
  }

  return (
    <div className="grid gap-5">
      {rows.map((job) => {
        const editing = editingId === job.id;
        const title = job.job_title || job.title || "Untitled job";
        const skills = Array.isArray(job.required_skills) ? job.required_skills : Array.isArray(job.skills) ? job.skills : String(job.required_skills || job.skills || "").split(",").map((skill) => skill.trim()).filter(Boolean);
        return (
          <Card key={job.id} className="rounded-3xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-xl font-black text-text-main dark:text-white">{title}</h3>
                  <StatusBadge value={job.status || "active"} />
                </div>
                <p className="mt-1 text-sm font-semibold text-text-muted">{job.company_name || job.company || "Company not set"} ? {job.job_location || job.location || "Location not set"}</p>
                <p className="mt-2 text-xs font-bold text-text-muted">{job.category || "No category"} ? {job.job_level || job.experience_level || "Any level"} ? {job.job_type || "Any type"}</p>
              </div>
              <Button variant="secondary" className="gap-2" onClick={() => startEdit(job)}><Edit3 className="h-4 w-4" />Edit job</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{skills.slice(0, 10).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
            {editing ? (
              <div className="mt-5 rounded-3xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <Input value={draft.job_title || ""} onChange={(event) => setDraft((current) => ({ ...current, job_title: event.target.value }))} placeholder="Job title" />
                  <Input value={draft.company_name || ""} onChange={(event) => setDraft((current) => ({ ...current, company_name: event.target.value }))} placeholder="Company name" />
                  <Input value={draft.job_location || ""} onChange={(event) => setDraft((current) => ({ ...current, job_location: event.target.value }))} placeholder="Location" />
                  <Input value={draft.category || ""} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} placeholder="Category" />
                  <Input value={draft.job_type || ""} onChange={(event) => setDraft((current) => ({ ...current, job_type: event.target.value }))} placeholder="Job type" />
                  <Input value={draft.job_level || ""} onChange={(event) => setDraft((current) => ({ ...current, job_level: event.target.value }))} placeholder="Job level" />
                  <Input value={draft.employment_type || ""} onChange={(event) => setDraft((current) => ({ ...current, employment_type: event.target.value }))} placeholder="Employment type" />
                  <Input value={draft.experience_years || ""} onChange={(event) => setDraft((current) => ({ ...current, experience_years: event.target.value }))} placeholder="Required experience" />
                  <select value={draft.status || "active"} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))} className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="hired">Hired</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Input value={draft.salary_min || ""} onChange={(event) => setDraft((current) => ({ ...current, salary_min: event.target.value }))} placeholder="Min salary" />
                  <Input value={draft.salary_max || ""} onChange={(event) => setDraft((current) => ({ ...current, salary_max: event.target.value }))} placeholder="Max salary" />
                  <Input value={draft.last_date || ""} onChange={(event) => setDraft((current) => ({ ...current, last_date: event.target.value }))} placeholder="Application deadline" />
                </div>
                <textarea value={draft.description || ""} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Description" className="mt-3 min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />
                <textarea value={draft.requirements || ""} onChange={(event) => setDraft((current) => ({ ...current, requirements: event.target.value }))} placeholder="Requirements" className="mt-3 min-h-28 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900" />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={readOnly} onClick={() => { onUpdate("jobs", job.id, draft); setEditingId(null); }}>Save job</Button>
                  <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

function EmployeesSection({ rows, onUpdate, readOnly }: { rows: AnyRecord[]; onUpdate: (table: string, id: string, patch: AnyRecord) => void; readOnly: boolean }) {
  const activeEmployees = rows.filter((employee) => employee.is_active !== false);

  return (
    <div className="grid gap-4">
      <Card className="rounded-3xl p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="type-label text-primary">Support team</p>
            <h2 className="mt-1 text-xl font-black text-text-main dark:text-white">{activeEmployees.length} active employee{activeEmployees.length === 1 ? "" : "s"}</h2>
            <p className="mt-1 text-sm font-semibold text-text-muted">Create employee accounts from Users. Manage activation, department, and ticket ownership here.</p>
          </div>
          <LinkButton href="/admin/users" className="rounded-2xl">Add employee</LinkButton>
        </div>
      </Card>

      {rows.length ? rows.map((employee) => (
        <Card key={employee.id || employee.user_id || employee.email} className="rounded-3xl p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-success text-sm font-black text-white">
                {employee.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={employee.avatar_url} alt={employee.full_name || employee.email} className="h-full w-full object-cover" />
                ) : getInitials(employee.full_name || employee.email)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-text-main dark:text-white">{employee.full_name || "Support employee"}</h3>
                  <Badge variant={employee.is_active === false ? "neutral" : "success"}>{employee.is_active === false ? "inactive" : "active"}</Badge>
                </div>
                <p className="mt-1 text-sm font-bold text-text-muted">{employee.email}</p>
                <p className="mt-1 text-sm font-semibold text-text-muted">{employee.department || "Support"} - {employee.username || employee.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={readOnly}
                onClick={() => onUpdate("employees", employee.id || employee.user_id, { is_active: employee.is_active === false })}
              >
                {employee.is_active === false ? "Activate" : "Deactivate"}
              </Button>
              <Button
                variant="secondary"
                disabled={readOnly}
                onClick={() => onUpdate("employees", employee.id || employee.user_id, { department: employee.department === "Support" ? "Support Manager" : "Support" })}
              >
                Toggle department
              </Button>
            </div>
          </div>
        </Card>
      )) : (
        <Card className="rounded-3xl p-8 text-center">
          <UserCog className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-3 text-lg font-black text-text-main dark:text-white">No employees yet</h3>
          <p className="mt-2 text-sm font-semibold text-text-muted">Create the first employee from the Users tab and select the Employee role.</p>
        </Card>
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

function CouponsSection({
  rows,
  onCreate,
  onGenerate,
  onUpdate,
  onDelete,
  readOnly
}: {
  rows: AnyRecord[];
  onCreate: (coupon: AnyRecord) => void;
  onGenerate: () => void;
  onUpdate: (table: string, id: string, patch: AnyRecord) => void;
  onDelete: (table: string, id: string) => void;
  readOnly: boolean;
}) {
  const [form, setForm] = useState({ coupon_name: "", code: "", discount_percentage: "20", usage_limit: "100", expires_at: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnyRecord>({});

  function submitCoupon() {
    const code = form.code.trim().toUpperCase();
    const discount = Number(form.discount_percentage || 0);
    const usageLimit = Number(form.usage_limit || 0);

    if (!code || !form.coupon_name.trim()) return;

    onCreate({
      coupon_name: form.coupon_name.trim(),
      code,
      discount_percentage: Math.min(100, Math.max(1, discount || 1)),
      active: true,
      usage_limit: usageLimit || null,
      used_count: 0,
      expires_at: form.expires_at || null
    });
    setForm({ coupon_name: "", code: "", discount_percentage: "20", usage_limit: "100", expires_at: "" });
  }

  function startEdit(coupon: AnyRecord) {
    setEditingId(coupon.id || coupon.code);
    setDraft({
      coupon_name: coupon.coupon_name || coupon.name || coupon.code || "",
      code: coupon.code || "",
      discount_percentage: coupon.discount_percentage || 20,
      usage_limit: coupon.usage_limit || "",
      expires_at: coupon.expires_at ? String(coupon.expires_at).slice(0, 10) : "",
      active: coupon.active !== false
    });
  }

  return (
    <div className="grid gap-5">
      <Card className="rounded-3xl p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="type-label text-primary">Coupon setup</p>
            <h2 className="mt-2 text-xl font-black text-text-main dark:text-white">Add custom coupon</h2>
            <p className="type-body mt-1">Create named coupons with discount amount, expiry date, and usage quantity.</p>
          </div>
          <Button onClick={onGenerate} disabled={readOnly} variant="secondary" className="gap-2"><Gift className="h-4 w-4" />Generate Random</Button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_160px_140px_150px_170px_auto]">
          <Input value={form.coupon_name} onChange={(event) => setForm((current) => ({ ...current, coupon_name: event.target.value }))} placeholder="Coupon name" disabled={readOnly} />
          <Input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="Code e.g. RC50" disabled={readOnly} />
          <Input value={form.discount_percentage} onChange={(event) => setForm((current) => ({ ...current, discount_percentage: event.target.value }))} placeholder="Discount %" type="number" min={1} max={100} disabled={readOnly} />
          <Input value={form.usage_limit} onChange={(event) => setForm((current) => ({ ...current, usage_limit: event.target.value }))} placeholder="Quantity" type="number" min={1} disabled={readOnly} />
          <Input value={form.expires_at} onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))} type="date" disabled={readOnly} />
          <Button onClick={submitCoupon} disabled={readOnly || !form.coupon_name || !form.code}>Add coupon</Button>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((coupon) => {
          const key = coupon.id || coupon.code;
          const editing = editingId === key;
          return (
            <Card key={key} className="rounded-3xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="type-label">Coupon</p>
                  <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-text-main dark:text-white">{coupon.coupon_name || coupon.name || coupon.code}</h3>
                  <p className="mt-1 text-sm font-black text-primary">{coupon.code}</p>
                </div>
                <StatusBadge value={coupon.active} />
              </div>
              <div className="mt-5 grid gap-3 rounded-2xl bg-bg p-4 text-sm font-bold text-text-muted dark:bg-white/5">
                <p>{coupon.discount_percentage}% discount</p>
                <p>{coupon.used_count || 0}/{coupon.usage_limit || "?"} used</p>
                <p>Expires {formatDate(coupon.expires_at)}</p>
              </div>
              {editing ? (
                <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-surface p-3 dark:border-white/10 dark:bg-slate-900">
                  <Input value={draft.coupon_name || ""} onChange={(event) => setDraft((current) => ({ ...current, coupon_name: event.target.value }))} placeholder="Coupon name" />
                  <Input value={draft.code || ""} onChange={(event) => setDraft((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="Coupon code" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={draft.discount_percentage || ""} onChange={(event) => setDraft((current) => ({ ...current, discount_percentage: Number(event.target.value) }))} type="number" min={1} max={100} placeholder="Discount" />
                    <Input value={draft.usage_limit || ""} onChange={(event) => setDraft((current) => ({ ...current, usage_limit: Number(event.target.value) || null }))} type="number" min={1} placeholder="Quantity" />
                  </div>
                  <Input value={draft.expires_at || ""} onChange={(event) => setDraft((current) => ({ ...current, expires_at: event.target.value || null }))} type="date" />
                  <label className="flex items-center gap-2 text-sm font-bold text-text-muted">
                    <input type="checkbox" checked={draft.active !== false} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} />
                    Coupon active
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={readOnly} onClick={() => { onUpdate("coupons", coupon.id, draft); setEditingId(null); }}>Save</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => navigator.clipboard?.writeText(coupon.code)}><Copy className="h-4 w-4" />Copy</Button>
                <Button variant="secondary" className="gap-2" onClick={() => startEdit(coupon)}><Edit3 className="h-4 w-4" />Edit</Button>
                <Button variant="secondary" disabled={readOnly} onClick={() => onUpdate("coupons", coupon.id, { active: !coupon.active })}>{coupon.active ? "Disable" : "Enable"}</Button>
                <Button variant="ghost" disabled={readOnly} className="text-danger" onClick={() => onDelete("coupons", coupon.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          );
        })}
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
