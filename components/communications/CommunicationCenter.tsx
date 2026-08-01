"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Archive, Bell, CalendarClock, Check, CheckCheck, ChevronRight, CircleAlert, Clock3, FileText, Inbox, Loader2, Mail, MessageSquare, Pin, RefreshCw, Search, Send, Settings2, Sparkles } from "lucide-react";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CommunicationCenterResponse, CommunicationContext, CommunicationItem, CommunicationSection, NotificationPreferences } from "@/types/communicationCenter";

const sections: Array<{ id: CommunicationSection; label: string; icon: typeof Bell }> = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "interviews", label: "Interviews", icon: CalendarClock },
  { id: "offers", label: "Offers", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckCheck },
  { id: "ai-alerts", label: "AI Alerts", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Clock3 }
];

const defaultPreferences: NotificationPreferences = {
  email: true,
  inApp: true,
  push: false,
  sms: false,
  whatsapp: false,
  dailySummary: true,
  weeklySummary: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  categories: { application: true, interview: true, offer: true, talent_crm: true, ai_recommendation: true, reminder: true, system: true, subscription: true, security: true, beta: true }
};

async function centerRequest(section: CommunicationSection, page = 1, search = "", init?: RequestInit) {
  const auth = await compactAuthHeaders("communication_center");
  const url = init ? "/api/communication-center" : `/api/communication-center?section=${section}&page=${page}&page_size=25${search ? `&q=${encodeURIComponent(search)}` : ""}`;
  const response = await fetch(url, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...auth }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Communication Center request failed.");
  return data;
}

export default function CommunicationCenter() {
  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section") as CommunicationSection | null;
  const initialSection = sections.some((item) => item.id === requestedSection) ? requestedSection! : "notifications";
  const { user, role, loading: authLoading } = useAuth();
  const [section, setSection] = useState<CommunicationSection>(initialSection);
  const [responses, setResponses] = useState<Partial<Record<CommunicationSection, CommunicationCenterResponse>>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CommunicationItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);

  const load = useCallback(async (target: CommunicationSection, page = 1, query = "") => {
    if (!user?.id) return;
    if (page === 1) setLoading(true); else setLoadingMore(true);
    setError("");
    try {
      const next = await centerRequest(target, page, query) as CommunicationCenterResponse;
      setResponses((current) => ({ ...current, [target]: page === 1 ? next : { ...next, items: [...(current[target]?.items || []), ...next.items] } }));
      if (page === 1) setSelected(next.items[0] || null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Could not load Communication Center.");
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, [user?.id]);

  useEffect(() => { if (!authLoading && user?.id && !responses[section]) queueMicrotask(() => void load(section)); }, [authLoading, load, responses, section, user?.id]);
  useEffect(() => {
    if (!user?.id) return;
    queueMicrotask(() => { try { const saved = window.localStorage.getItem(`mxvl-communication-preferences:${user.id}`); if (saved) setPreferences({ ...defaultPreferences, ...JSON.parse(saved) }); } catch { setPreferences(defaultPreferences); } });
  }, [user?.id]);

  const response = responses[section];
  const unread = responses.notifications?.unreadCount || 0;
  const urgent = useMemo(() => Object.values(responses).flatMap((value) => value?.items || []).filter((item) => item.priority === "urgent").length, [responses]);

  const changeSection = (next: CommunicationSection) => {
    setSection(next); setSelected(responses[next]?.items[0] || null); setError("");
    window.history.replaceState(null, "", `/communication-center?section=${next}`);
  };

  const runSearch = (event: React.FormEvent) => { event.preventDefault(); setResponses((current) => ({ ...current, [section]: undefined })); void load(section, 1, search.trim()); };
  const markAllRead = async () => { await centerRequest(section, 1, "", { method: "PATCH", body: JSON.stringify({ action: "mark_all_read" }) }); await load("notifications"); };
  const markRead = async (item: CommunicationItem) => {
    if (item.status !== "unread") return;
    await centerRequest(section, 1, "", { method: "PATCH", body: JSON.stringify({ action: "mark_read", source: item.metadata?.source, source_id: item.metadata?.sourceId }) });
    setResponses((current) => ({ ...current, [section]: current[section] ? { ...current[section]!, unreadCount: Math.max(0, current[section]!.unreadCount - 1), items: current[section]!.items.map((entry) => entry.id === item.id ? { ...entry, status: "read" } : entry) } : undefined }));
    setSelected((current) => current?.id === item.id ? { ...current, status: "read" } : current);
  };

  const completeTask = async (item: CommunicationItem) => { await centerRequest(section, 1, "", { method: "PATCH", body: JSON.stringify({ action: "complete_task", source_id: item.metadata?.sourceId }) }); await load("tasks"); };
  const updateNotification = async (item: CommunicationItem, patch: { pinned?: boolean; archived?: boolean }) => { await centerRequest(section, 1, "", { method: "PATCH", body: JSON.stringify({ action: "update_notification", source: item.metadata?.source, source_id: item.metadata?.sourceId, ...patch }) }); await load(section); };
  const savePreferences = () => { if (user?.id) window.localStorage.setItem(`mxvl-communication-preferences:${user.id}`, JSON.stringify(preferences)); setPreferencesOpen(false); };

  if (authLoading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <div className="mx-auto max-w-xl px-4 py-20"><Card kind="empty"><h1 className="text-2xl font-black text-text-main dark:text-white">Sign in to open Communication Center</h1><p className="mt-2 text-sm text-text-muted">Your recruitment updates and recommended next steps are private to your account.</p><LinkButton href="/login" className="mt-5">Sign in</LinkButton></Card></div>;

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div><Badge variant="primary">Unified Engagement</Badge><h1 className="mt-3 text-3xl font-black text-text-main dark:text-white sm:text-4xl">Communication Center</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-text-muted">See what happened, understand why it matters, and take the next recommended action across your recruitment journey.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setPreferencesOpen(true)}><Settings2 className="h-4 w-4" />Preferences</Button><Button variant="secondary" onClick={() => void load(section)}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />Refresh</Button>{section === "messages" ? <Button onClick={() => setComposeOpen(true)}><Send className="h-4 w-4" />New message</Button> : null}</div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Communication summary">
        <Summary label="Unread updates" value={unread} icon={Inbox} tone="blue" />
        <Summary label="Urgent actions" value={urgent} icon={CircleAlert} tone="amber" />
        <Summary label="Active section" value={response?.total || 0} icon={sections.find((item) => item.id === section)?.icon || Bell} tone="green" />
      </section>

      <div className="mt-6 grid min-w-0 gap-5 xl:grid-cols-[240px_minmax(0,1fr)_minmax(300px,380px)]">
        <nav className="flex gap-2 overflow-x-auto pb-2 xl:block xl:space-y-1 xl:overflow-visible" aria-label="Communication Center sections">
          {sections.map((item) => { const Icon = item.icon; const count = responses[item.id]?.total; return <button key={item.id} type="button" onClick={() => changeSection(item.id)} className={cn("focus-ring flex min-h-11 shrink-0 items-center gap-3 rounded-control px-4 text-sm font-bold transition xl:w-full", section === item.id ? "bg-primary text-white shadow-soft" : "border border-border bg-surface text-text-muted hover:border-primary/30 hover:text-primary dark:border-white/10 dark:bg-white/5")} aria-current={section === item.id ? "page" : undefined}><Icon className="h-4 w-4" /><span>{item.label}</span>{typeof count === "number" ? <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px]", section === item.id ? "bg-white/15" : "bg-primary/10 text-primary")}>{count}</span> : null}</button>; })}
        </nav>

        <section className="min-w-0">
          <form onSubmit={runSearch} className="flex gap-2"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${sections.find((item) => item.id === section)?.label.toLowerCase()}`} className="pl-11" /></div><Button type="submit" variant="secondary">Search</Button></form>
          {section === "notifications" && unread ? <div className="mt-3 flex justify-end"><button type="button" onClick={() => void markAllRead()} className="focus-ring min-h-11 rounded-control px-3 text-sm font-bold text-primary hover:bg-primary/5"><CheckCheck className="mr-2 inline h-4 w-4" />Mark all as read</button></div> : null}
          {error ? <div role="alert" className="mt-4 rounded-control border border-danger/20 bg-danger/5 p-4 text-sm font-bold text-danger">{error}</div> : null}
          {loading ? <LoadingList /> : response?.items.length ? <div className="mt-4 space-y-3">{response.items.map((item) => <CommunicationRow key={item.id} item={item} active={selected?.id === item.id} onSelect={() => { setSelected(item); void markRead(item); }} />)}{response.hasMore ? <Button variant="secondary" className="w-full" disabled={loadingMore} onClick={() => void load(section, response.page + 1, search)}>{loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Load older updates</Button> : null}</div> : <EmptySection section={section} />}
        </section>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start" aria-label="Selected communication detail">
          {selected ? <EngagementDetail item={selected} role={String(role || "candidate")} onCompleteTask={() => void completeTask(selected)} onUpdateNotification={(patch) => void updateNotification(selected, patch)} /> : <Card kind="empty"><Inbox className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-lg font-black text-text-main dark:text-white">Select an update</h2><p className="mt-2 text-sm text-text-muted">Its context and recommended next action will appear here.</p></Card>}
        </aside>
      </div>

      {composeOpen ? <ComposeDialog contexts={response?.contexts || []} onClose={() => setComposeOpen(false)} onSent={() => { setComposeOpen(false); void load("messages"); }} /> : null}
      {preferencesOpen ? <PreferencesDialog value={preferences} onChange={setPreferences} onClose={() => setPreferencesOpen(false)} onSave={savePreferences} /> : null}
    </main>
  );
}

function Summary({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Bell; tone: "blue" | "amber" | "green" }) {
  const tones = { blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300", amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300", green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" };
  return <Card kind="metric" className="flex items-center gap-4"><span className={cn("grid h-11 w-11 place-items-center rounded-control", tones[tone])}><Icon className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase text-text-muted">{label}</p><strong className="mt-1 block text-2xl font-black text-text-main dark:text-white">{value}</strong></div></Card>;
}

function CommunicationRow({ item, active, onSelect }: { item: CommunicationItem; active: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={cn("focus-ring w-full rounded-card border bg-surface p-4 text-left shadow-card transition hover:border-primary/30 dark:bg-surface-dark", active ? "border-primary ring-2 ring-primary/10" : "border-border dark:border-white/10")}><div className="flex items-start gap-3"><span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", item.status === "unread" ? "bg-primary" : item.priority === "urgent" ? "bg-danger" : "bg-slate-300 dark:bg-slate-600")} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="min-w-0 flex-1 text-sm font-black text-text-main dark:text-white">{item.title}</strong><StatusBadge status={item.status} /></span><span className="mt-1 line-clamp-2 block text-sm leading-5 text-text-muted">{item.summary}</span><span className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-text-muted"><Badge variant={item.signal === "Estimate" ? "review" : item.signal === "Recommendation" ? "primary" : "neutral"}>{item.signal}</Badge><span>{new Date(item.timestamp).toLocaleString()}</span></span></span><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-muted" /></div></button>;
}

function EngagementDetail({ item, role, onCompleteTask, onUpdateNotification }: { item: CommunicationItem; role: string; onCompleteTask: () => void; onUpdateNotification: (patch: { pinned?: boolean; archived?: boolean }) => void }) {
  const attachments = Array.isArray(item.metadata?.attachments) ? item.metadata.attachments as Array<{ name?: string; url?: string }> : [];
  return <Card><div className="flex flex-wrap items-center gap-2"><Badge variant={item.priority === "urgent" ? "danger" : item.priority === "high" ? "warning" : "neutral"}>{item.priority} priority</Badge><Badge variant={item.signal === "Estimate" ? "review" : "primary"}>{item.signal}</Badge>{item.metadata?.pinned ? <Pin className="h-4 w-4 text-primary" /> : null}</div>{item.section === "notifications" && item.metadata?.source === "recruitment" ? <div className="mt-3 flex gap-2"><button type="button" onClick={() => onUpdateNotification({ pinned: !Boolean(item.metadata?.pinned) })} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-xs font-bold text-text-muted hover:bg-primary/5 hover:text-primary"><Pin className="h-4 w-4" />{item.metadata?.pinned ? "Unpin" : "Pin"}</button><button type="button" onClick={() => onUpdateNotification({ archived: item.status !== "archived" })} className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-xs font-bold text-text-muted hover:bg-primary/5 hover:text-primary"><Archive className="h-4 w-4" />{item.status === "archived" ? "Restore" : "Archive"}</button></div> : null}<h2 className="mt-4 text-xl font-black text-text-main dark:text-white">{item.title}</h2><div className="mt-5 space-y-5"><DetailBlock label="What happened?" text={item.summary} /><DetailBlock label="Why does it matter?" text={item.whyItMatters} /><div><p className="text-xs font-black uppercase text-primary">What should I do next?</p><p className="mt-2 text-sm font-semibold text-text-muted">MXVL recommends one focused action based on this update.</p><LinkButton href={item.recommendedAction.href} className="mt-3 w-full justify-center">{item.recommendedAction.label}<ChevronRight className="h-4 w-4" /></LinkButton></div></div>{item.section === "tasks" && role !== "candidate" && !["completed", "done"].includes(item.status) ? <Button variant="success" className="mt-4 w-full" onClick={onCompleteTask}><Check className="h-4 w-4" />Mark completed</Button> : null}{item.section === "interviews" && typeof item.metadata?.meetingLink === "string" && item.metadata.meetingLink ? <a className="focus-ring mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-control border border-border text-sm font-bold text-primary dark:border-white/10" href={item.metadata.meetingLink} target="_blank" rel="noreferrer">Open meeting link</a> : null}{attachments.length ? <div className="mt-5 border-t border-border pt-4 dark:border-white/10"><p className="text-xs font-black uppercase text-text-muted">Attachments</p>{attachments.map((attachment, index) => attachment.url ? <a key={`${attachment.url}-${index}`} href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-bold text-primary hover:bg-primary/5"><FileText className="h-4 w-4" />{attachment.name || "Open attachment"}</a> : null)}</div> : null}<p className="mt-5 border-t border-border pt-4 text-xs font-semibold text-text-muted dark:border-white/10">{new Date(item.timestamp).toLocaleString()}</p></Card>;
}

function DetailBlock({ label, text }: { label: string; text: string }) { return <div><p className="text-xs font-black uppercase text-text-muted">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-text-main dark:text-slate-200">{text}</p></div>; }
function LoadingList() { return <div className="mt-4 space-y-3" aria-label="Loading communication updates">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-card border border-border bg-surface dark:border-white/10 dark:bg-white/5" />)}</div>; }
function EmptySection({ section }: { section: CommunicationSection }) { return <Card kind="empty" className="mt-4"><Inbox className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 text-lg font-black text-text-main dark:text-white">Nothing here yet</h2><p className="mt-2 text-sm text-text-muted">New {sections.find((item) => item.id === section)?.label.toLowerCase()} will appear here as your recruitment journey progresses.</p></Card>; }

function ComposeDialog({ contexts, onClose, onSent }: { contexts: CommunicationContext[]; onClose: () => void; onSent: () => void }) {
  const [applicationId, setApplicationId] = useState(contexts[0]?.applicationId || ""); const [subject, setSubject] = useState(""); const [body, setBody] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(""); try { await centerRequest("messages", 1, "", { method: "POST", body: JSON.stringify({ application_id: applicationId, subject, body }) }); onSent(); } catch (value) { setError(value instanceof Error ? value.message : "Could not send message."); } finally { setSaving(false); } };
  return <Dialog title="New recruitment message" icon={Mail} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Application"><Select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} required><option value="">Select application</option>{contexts.map((context) => <option key={context.applicationId} value={context.applicationId}>{context.label}</option>)}</Select></Field><Field label="Subject"><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Clear message subject" /></Field><Field label="Message" helper="Messages become part of the application communication history."><textarea value={body} onChange={(event) => setBody(event.target.value)} required className="focus-ring min-h-36 w-full rounded-control border border-border bg-surface p-4 text-sm dark:border-white/10 dark:bg-slate-900" placeholder="Write your message" /></Field>{error ? <p role="alert" className="text-sm font-bold text-danger">{error}</p> : null}<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || !applicationId || !body.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Send message</Button></div></form></Dialog>;
}

function PreferencesDialog({ value, onChange, onClose, onSave }: { value: NotificationPreferences; onChange: (value: NotificationPreferences) => void; onClose: () => void; onSave: () => void }) {
  const channels: Array<[keyof NotificationPreferences, string, boolean]> = [["inApp", "In-app notifications", false], ["email", "Email notifications", false], ["push", "Push notifications", true], ["sms", "SMS notifications", true], ["whatsapp", "WhatsApp notifications", true], ["dailySummary", "Daily summary", false], ["weeklySummary", "Weekly summary", false]];
  return <Dialog title="Notification preferences" icon={Settings2} onClose={onClose}><div className="space-y-5"><div className="grid gap-2 sm:grid-cols-2">{channels.map(([key, label, future]) => <Toggle key={String(key)} label={label} checked={Boolean(value[key])} future={future} onChange={(checked) => onChange({ ...value, [key]: checked })} />)}</div><div className="border-t border-border pt-5 dark:border-white/10"><Toggle label="Quiet hours" checked={value.quietHoursEnabled} onChange={(checked) => onChange({ ...value, quietHoursEnabled: checked })} />{value.quietHoursEnabled ? <div className="mt-3 grid grid-cols-2 gap-3"><Field label="Starts"><Input type="time" value={value.quietHoursStart} onChange={(event) => onChange({ ...value, quietHoursStart: event.target.value })} /></Field><Field label="Ends"><Input type="time" value={value.quietHoursEnd} onChange={(event) => onChange({ ...value, quietHoursEnd: event.target.value })} /></Field></div> : null}</div><div className="border-t border-border pt-5 dark:border-white/10"><p className="text-sm font-black text-text-main dark:text-white">Categories</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(value.categories).map(([category, enabled]) => <Toggle key={category} label={category.replaceAll("_", " ")} checked={enabled} onChange={(checked) => onChange({ ...value, categories: { ...value.categories, [category]: checked } })} />)}</div></div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onSave}>Save preferences</Button></div></div></Dialog>;
}

function Dialog({ title, icon: Icon, onClose, children }: { title: string; icon: typeof Mail; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>("button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])") || []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab") return;
      const elements = focusable(); if (!elements.length) return;
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); previousFocus?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[100] grid place-items-end bg-black/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="communication-dialog-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-card border border-border bg-surface p-5 shadow-elevated dark:border-white/10 dark:bg-slate-950 sm:max-w-2xl sm:rounded-card sm:p-6"><header className="mb-5 flex items-center justify-between gap-4"><h2 id="communication-dialog-title" className="flex items-center gap-2 text-xl font-black text-text-main dark:text-white"><Icon className="h-5 w-5 text-primary" />{title}</h2><button type="button" onClick={onClose} className="focus-ring grid h-11 w-11 place-items-center rounded-control text-text-muted hover:bg-primary/5" aria-label="Close dialog">×</button></header>{children}</div></div>;
}
function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) { return <label className="grid gap-2 text-sm font-bold text-text-main dark:text-white">{label}{helper ? <span className="text-xs font-medium text-text-muted">{helper}</span> : null}{children}</label>; }
function Toggle({ label, checked, onChange, future = false }: { label: string; checked: boolean; onChange: (value: boolean) => void; future?: boolean }) { return <label className="flex min-h-11 items-center justify-between gap-3 rounded-control border border-border px-3 text-sm font-bold text-text-main dark:border-white/10 dark:text-white"><span className="capitalize">{label}{future ? <span className="ml-2 text-[10px] text-text-muted">Provider-ready</span> : null}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-primary" /></label>; }
