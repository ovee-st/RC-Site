"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, BarChart3, BellRing, Bot, ChevronLeft, ChevronRight,
  ClipboardCheck, Download, FileClock, Gauge, HeartHandshake, Loader2,
  MessageSquareText, RefreshCw, Rocket, ShieldCheck, TestTube2, Users
} from "lucide-react";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import type { FunnelStep, OperationsMetric, OperationsView } from "@/lib/operationsIntelligence";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Row = Record<string, unknown>;
type ApiData = Row & {
  rows?: Row[];
  metrics?: OperationsMetric[];
  candidateFunnel?: FunnelStep[];
  employerFunnel?: FunnelStep[];
  adoption?: Array<{ event: string; users: number; events: number; completionRate: number; averageDurationMs: number | null }>;
  checks?: Array<{ name: string; status: string; latencyMs: number; message?: string }>;
  pagination?: { page: number; pageSize: number; count: number; pages: number };
  configuration?: { invite_only: boolean; waitlist_enabled: boolean; beta_ends_at: string | null };
  activeMemberships?: number;
  summary?: { averageLatencyMs: number; averageConfidence: number; fallbackRate: number; failureRate: number; cacheHitRate: number; humanOverrideRate: number };
  unavailable?: string | string[];
};

const tabs: Array<{ key: OperationsView; label: string; icon: typeof Activity }> = [
  { key: "overview", label: "Overview", icon: Gauge },
  { key: "analytics", label: "Product Analytics", icon: BarChart3 },
  { key: "beta", label: "Beta Management", icon: TestTube2 },
  { key: "support", label: "Support", icon: HeartHandshake },
  { key: "health", label: "Platform Health", icon: Activity },
  { key: "ai", label: "AI Telemetry", icon: Bot },
  { key: "audit", label: "Audit", icon: ShieldCheck },
  { key: "users", label: "User Intelligence", icon: Users },
  { key: "errors", label: "Errors", icon: AlertTriangle },
  { key: "notifications", label: "Notifications", icon: BellRing },
  { key: "releases", label: "Releases", icon: Rocket },
  { key: "feedback", label: "Feedback", icon: MessageSquareText }
];

const cache = new Map<string, { expiresAt: number; data: ApiData }>();

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return new Date(value).toLocaleString();
  return String(value);
}

function tone(status: string) {
  const value = status.toLowerCase();
  if (["healthy", "success", "active", "approved", "resolved", "published", "used"].includes(value)) return "success";
  if (["unhealthy", "critical", "error", "revoked", "declined", "failed"].includes(value)) return "danger";
  if (["degraded", "warning", "pending", "reviewing", "scheduled", "acknowledged"].includes(value)) return "primary";
  return "neutral";
}

function Empty({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center dark:border-white/10">
      <ClipboardCheck className="mx-auto h-7 w-7 text-success" />
      <p className="mt-3 text-sm font-black text-text-main dark:text-white">{message}</p>
      <p className="mt-1 text-xs font-semibold text-text-muted">New operational activity will appear here automatically.</p>
    </div>
  );
}

function Funnel({ title, steps = [] }: { title: string; steps?: FunnelStep[] }) {
  return (
    <Card className="rounded-2xl p-5">
      <h3 className="text-base font-black text-text-main dark:text-white">{title}</h3>
      <div className="mt-5 space-y-4">
        {steps.map((step) => (
          <div key={step.event}>
            <div className="flex items-center justify-between gap-3 text-xs font-black">
              <span>{step.label}</span>
              <span className="text-text-muted">{step.users} users / {step.conversion}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(step.users ? 4 : 0, step.conversion)}%` }} />
            </div>
            {step.dropOff > 0 ? <p className="mt-1 text-[10px] font-bold text-text-muted">{step.dropOff}% drop-off from previous step</p> : null}
          </div>
        ))}
        {!steps.length ? <p className="text-sm font-semibold text-text-muted">No journey data has been recorded yet.</p> : null}
      </div>
    </Card>
  );
}

function DataTable({ rows, view, onStatus, readOnly }: { rows: Row[]; view: OperationsView; onStatus: (id: string, status: string, recordType?: string) => void; readOnly: boolean }) {
  const preferred = {
    beta: ["record_type", "code", "email", "intended_role", "requested_role", "company_name", "status", "expires_at", "used_count", "max_uses", "created_at"],
    support: ["ticket_number", "subject", "category", "priority", "status", "created_at"],
    ai: ["task", "model", "latency_ms", "success", "fallback_used", "confidence", "prompt_version", "cache_hit", "created_at"],
    audit: ["action", "resource_type", "resource_id", "outcome", "correlation_id", "created_at"],
    users: ["full_name", "email", "role", "plan", "verified", "profile_completed", "activity_events", "ai_analyses", "last_login", "subscription_status", "subscription_expiry", "support_mode"],
    errors: ["source", "severity", "status", "error_code", "message", "route", "correlation_id", "created_at"],
    notifications: ["notification_type", "severity", "title", "message", "status", "source", "created_at"],
    releases: ["version", "title", "release_type", "status", "starts_at", "ends_at", "created_at"],
    feedback: ["feedback_type", "category", "rating", "message", "page_path", "role", "status", "priority", "created_at"]
  } as Partial<Record<OperationsView, string[]>>;
  const columns = (preferred[view] || Object.keys(rows[0] || {})).filter((column) => rows.some((row) => column in row));
  const statuses: Partial<Record<OperationsView, string[]>> = {
    beta: ["pending", "approved", "used", "expired", "revoked"],
    errors: ["open", "resolved"],
    notifications: ["open", "acknowledged", "resolved"],
    releases: ["draft", "scheduled", "published", "completed", "cancelled"],
    feedback: ["new", "reviewing", "planned", "resolved", "closed"]
  };

  if (!rows.length) return <Empty message={`No ${tabs.find((tab) => tab.key === view)?.label.toLowerCase() || "records"} found.`} />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border dark:border-white/10">
      <table className="w-full min-w-[900px] border-collapse text-left text-xs">
        <thead className="bg-slate-50 dark:bg-white/5">
          <tr>{columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 font-black uppercase text-text-muted">{column.replaceAll("_", " ")}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-white/10">
          {rows.map((row, index) => (
            <tr key={String(row.id || index)} className="align-top hover:bg-primary/[0.025]">
              {columns.map((column) => (
                <td key={column} className={cn("max-w-[320px] px-4 py-3 font-semibold text-text-main dark:text-slate-200", ["message", "summary"].includes(column) && "whitespace-normal")}>
                  {column === "status" && statuses[view] && !readOnly ? (
                    <select value={String(row[column] || "")} onChange={(event) => onStatus(String(row.id), event.target.value, String(row.record_type || ""))} className="min-h-11 rounded-xl border border-border bg-white px-3 font-black dark:border-white/10 dark:bg-slate-900" aria-label={`Change ${view} status`}>
                      {(view === "beta" && row.record_type === "waitlist" ? ["waiting", "approved", "invited", "declined"] : statuses[view])?.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  ) : ["status", "severity", "outcome"].includes(column) ? <Badge variant={tone(String(row[column] || ""))}>{display(row[column])}</Badge> : <span className="line-clamp-3">{display(row[column])}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BetaInviteForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("candidate");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const headers = await compactAuthHeaders("operations_beta_invite");
      const response = await fetch("/api/admin/operations", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action: "create_invite", email, intended_role: role, expires_at: expiresAt || null }) });
      if (!response.ok) throw new Error("Invite could not be created.");
      setEmail("");
      setExpiresAt("");
      onCreated();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card className="rounded-2xl p-5">
      <h3 className="font-black text-text-main dark:text-white">Create beta invite</h3>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4">
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Invitee email (optional)" aria-label="Invitee email" />
        <select value={role} onChange={(event) => setRole(event.target.value)} className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900" aria-label="Intended role"><option value="candidate">Candidate</option><option value="employer">Employer</option><option value="support">Support</option></select>
        <Input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} aria-label="Invite expiration" />
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}Create invite</Button>
      </form>
    </Card>
  );
}

function BetaConfiguration({ value, activeMemberships = 0, onSaved }: { value?: ApiData["configuration"]; activeMemberships?: number; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const update = async (patch: Partial<NonNullable<ApiData["configuration"]>>) => {
    setSaving(true);
    try {
      const headers = await compactAuthHeaders("operations_beta_configuration");
      const response = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "update_beta_configuration", ...value, ...patch })
      });
      if (!response.ok) throw new Error("Beta configuration could not be saved.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card className="rounded-2xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-black text-text-main dark:text-white">Private beta access</h3><p className="mt-1 text-xs font-semibold text-text-muted">{activeMemberships} active early-access members</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={saving} aria-pressed={Boolean(value?.invite_only)} onClick={() => void update({ invite_only: !value?.invite_only })} className={cn("min-h-11 rounded-xl border px-4 text-xs font-black", value?.invite_only ? "border-primary bg-primary text-white" : "border-border bg-white text-text-main dark:border-white/10 dark:bg-slate-900 dark:text-white")}>Invite-only {value?.invite_only ? "on" : "off"}</button>
          <button type="button" disabled={saving} aria-pressed={value?.waitlist_enabled !== false} onClick={() => void update({ waitlist_enabled: value?.waitlist_enabled === false })} className={cn("min-h-11 rounded-xl border px-4 text-xs font-black", value?.waitlist_enabled !== false ? "border-success bg-success text-white" : "border-border bg-white text-text-main dark:border-white/10 dark:bg-slate-900 dark:text-white")}>Waitlist {value?.waitlist_enabled !== false ? "on" : "off"}</button>
        </div>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-text-muted">Access settings are stored centrally without changing Supabase authentication or existing user sessions.</p>
    </Card>
  );
}

function ReleaseForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ version: "", title: "", summary: "", release_type: "product_update", starts_at: "", ends_at: "", banner_message: "" });
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const headers = await compactAuthHeaders("operations_release");
      const response = await fetch("/api/admin/operations", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ action: "create_release", ...form }) });
      if (!response.ok) throw new Error("Release could not be created.");
      setForm({ version: "", title: "", summary: "", release_type: "product_update", starts_at: "", ends_at: "", banner_message: "" });
      onCreated();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card className="rounded-2xl p-5">
      <h3 className="font-black text-text-main dark:text-white">Create release note</h3>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input required value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} placeholder="Version" />
        <Input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
        <select value={form.release_type} onChange={(event) => setForm((current) => ({ ...current, release_type: event.target.value }))} className="min-h-11 rounded-xl border border-border bg-white px-3 text-sm font-bold dark:border-white/10 dark:bg-slate-900" aria-label="Release type"><option value="product_update">Product update</option><option value="release_note">Release note</option><option value="maintenance">Maintenance</option></select>
        <Input required value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Release summary" />
        <Input value={form.banner_message} onChange={(event) => setForm((current) => ({ ...current, banner_message: event.target.value }))} placeholder="Banner message (optional)" />
        <Input type="datetime-local" value={form.starts_at} onChange={(event) => setForm((current) => ({ ...current, starts_at: event.target.value }))} aria-label="Release starts at" />
        <Input type="datetime-local" value={form.ends_at} onChange={(event) => setForm((current) => ({ ...current, ends_at: event.target.value }))} aria-label="Release ends at" />
        <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}Save draft</Button>
      </form>
    </Card>
  );
}

export default function OperationsIntelligence({ readOnly = false }: { readOnly?: boolean }) {
  const [activeView, setActiveView] = useState<OperationsView>("overview");
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const cacheKey = `${activeView}:${page}:${refreshKey}`;

  const load = useCallback(async (signal?: AbortSignal) => {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setData(cached.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const headers = await compactAuthHeaders(`operations_${activeView}`);
      const response = await fetch(`/api/admin/operations?view=${activeView}&page=${page}&page_size=25`, { headers, signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Could not load operations intelligence.");
      const next = payload.data as ApiData;
      cache.set(cacheKey, { data: next, expiresAt: Date.now() + 30_000 });
      setData(next);
    } catch (reason) {
      if ((reason as Error).name !== "AbortError") setError(reason instanceof Error ? reason.message : "Could not load operations intelligence.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [activeView, cacheKey, page]);

  useEffect(() => {
    const controller = new AbortController();
    // The effect synchronizes the active tab with its abortable external request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const selectView = (view: OperationsView) => {
    setActiveView(view);
    setPage(1);
  };
  const refresh = () => {
    cache.clear();
    setRefreshKey((value) => value + 1);
  };
  const changeStatus = async (id: string, status: string, recordType = "") => {
    const headers = await compactAuthHeaders("operations_status");
    const response = await fetch("/api/admin/operations", { method: "PATCH", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ view: activeView, id, status, record_type: recordType }) });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || "Could not update status.");
      return;
    }
    refresh();
  };
  const exportData = async (extension: "csv" | "xls") => {
    const headers = await compactAuthHeaders("operations_export");
    const response = await fetch(`/api/admin/operations?view=${activeView}&page=${page}&page_size=100&format=csv`, { headers });
    if (!response.ok) return setError("Could not export this dataset.");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `mxvl-${activeView}-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const rows = data?.rows || [];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRows = normalizedQuery
    ? rows.filter((row) => Object.values(row).some((value) => display(value).toLowerCase().includes(normalizedQuery)))
    : rows;
  const unavailable = !data?.unavailable ? [] : Array.isArray(data.unavailable) ? data.unavailable : [data.unavailable];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-soft dark:border-white/10 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Operations intelligence views">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.key} type="button" role="tab" aria-selected={activeView === tab.key} onClick={() => selectView(tab.key)} className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition", activeView === tab.key ? "bg-primary text-white" : "text-text-muted hover:bg-primary/5 hover:text-primary")}><Icon className="h-4 w-4" />{tab.label}</button>;
          })}
        </div>
        <div className="flex shrink-0 gap-2">
          {!["overview", "analytics", "health"].includes(activeView) ? <><Button variant="secondary" className="min-h-11 px-3" onClick={() => void exportData("csv")}><Download className="h-4 w-4" />CSV</Button><Button variant="secondary" className="min-h-11 px-3" onClick={() => void exportData("xls")}>Excel</Button><Button variant="secondary" className="min-h-11 px-3 print:hidden" onClick={() => window.print()}>PDF</Button></> : null}
          <Button variant="secondary" className="min-h-11 px-3" onClick={refresh} aria-label="Refresh operations data"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {unavailable.length ? <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Some Sprint 10 datasets are unavailable until <code>supabase-operations-intelligence.sql</code> is deployed.</div> : null}
      {error ? <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"><span>{error}</span><Button variant="secondary" onClick={refresh}>Try again</Button></div> : null}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <Card key={index} className="h-32 animate-pulse rounded-2xl bg-white/60 dark:bg-white/5" />)}</div> : null}

      {!loading && activeView === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(data?.metrics || []).map((metric) => <Card key={metric.key} className="rounded-2xl p-5"><p className="text-[11px] font-black uppercase text-text-muted">{metric.label}</p><p className="mt-3 text-3xl font-black text-text-main dark:text-white">{metric.value.toLocaleString()}</p></Card>)}
          </div>
          <div className="grid gap-5 xl:grid-cols-2"><Funnel title="Candidate journey" steps={data?.candidateFunnel} /><Funnel title="Employer journey" steps={data?.employerFunnel} /></div>
        </>
      ) : null}

      {!loading && activeView === "analytics" ? (
        <>
          <div className="grid gap-5 xl:grid-cols-2"><Funnel title="Candidate funnel" steps={data?.candidateFunnel} /><Funnel title="Employer funnel" steps={data?.employerFunnel} /></div>
          <Card className="rounded-2xl p-5"><h3 className="font-black text-text-main dark:text-white">Feature adoption</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr>{["Feature", "Users", "Events", "Completion", "Average time"].map((label) => <th key={label} className="px-3 py-2 font-black uppercase text-text-muted">{label}</th>)}</tr></thead><tbody>{(data?.adoption || []).map((item) => <tr key={item.event} className="border-t border-border dark:border-white/10"><td className="px-3 py-3 font-black">{item.event.replaceAll("_", " ")}</td><td className="px-3 py-3">{item.users}</td><td className="px-3 py-3">{item.events}</td><td className="px-3 py-3">{item.completionRate}%</td><td className="px-3 py-3">{item.averageDurationMs === null ? "-" : `${Math.round(item.averageDurationMs / 1000)}s`}</td></tr>)}</tbody></table></div></Card>
        </>
      ) : null}

      {!loading && activeView === "health" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{(data?.checks || []).map((check) => <Card key={check.name} className="rounded-2xl p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-text-main dark:text-white">{check.name}</h3><Badge variant={tone(check.status)}>{check.status}</Badge></div><p className="mt-3 text-2xl font-black">{check.latencyMs} ms</p>{check.message ? <p className="mt-2 text-xs font-semibold text-text-muted">{check.message}</p> : null}</Card>)}</div> : null}
      {!loading && activeView === "ai" && data?.summary ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[
        ["Average latency", `${data.summary.averageLatencyMs} ms`],
        ["Average confidence", `${data.summary.averageConfidence}%`],
        ["Fallback usage", `${data.summary.fallbackRate}%`],
        ["Failure rate", `${data.summary.failureRate}%`],
        ["Cache hit rate", `${data.summary.cacheHitRate}%`],
        ["Human override", `${data.summary.humanOverrideRate}%`]
      ].map(([label, value]) => <Card key={label} className="rounded-2xl p-5"><p className="text-[11px] font-black uppercase text-text-muted">{label}</p><p className="mt-3 text-2xl font-black text-text-main dark:text-white">{value}</p></Card>)}</div> : null}
      {!loading && activeView === "beta" && !readOnly ? <><BetaConfiguration value={data?.configuration} activeMemberships={data?.activeMemberships} onSaved={refresh} /><BetaInviteForm onCreated={refresh} /></> : null}
      {!loading && activeView === "releases" && !readOnly ? <ReleaseForm onCreated={refresh} /> : null}
      {!loading && !["overview", "analytics", "health"].includes(activeView) ? (
        <>
          <div className="max-w-md"><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${tabs.find((tab) => tab.key === activeView)?.label.toLowerCase()}...`} aria-label={`Search ${activeView}`} /></div>
          <DataTable rows={visibleRows} view={activeView} onStatus={changeStatus} readOnly={readOnly} />
          {data?.pagination && data.pagination.pages > 1 ? <div className="flex items-center justify-between"><p className="text-xs font-bold text-text-muted">Page {data.pagination.page} of {data.pagination.pages} / {data.pagination.count} records</p><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4" />Previous</Button><Button variant="secondary" disabled={page >= data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight className="h-4 w-4" /></Button></div></div> : null}
        </>
      ) : null}
      <p className="flex items-center gap-2 text-[11px] font-bold text-text-muted"><FileClock className="h-4 w-4" />Operational data is cached for 30 seconds. Health checks always refresh independently.</p>
    </div>
  );
}
