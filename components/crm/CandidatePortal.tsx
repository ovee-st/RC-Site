"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, FileText, Loader2, Mail, RefreshCw, Upload } from "lucide-react";
import { compactAuthHeaders } from "@/lib/compactAuthToken";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type Row = Record<string, any>;
type PortalData = { applications: Row[]; interviews: Row[]; offers: Row[]; messages: Row[]; documents: Row[] };

async function portalRequest(init?: RequestInit) {
  const auth = await compactAuthHeaders("candidate_portal");
  const response = await fetch("/api/candidate-portal", { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...auth }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Candidate portal request failed.");
  return data;
}

export default function CandidatePortal() {
  const [data, setData] = useState<PortalData>({ applications: [], interviews: [], offers: [], messages: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await portalRequest()); }
    catch (value) { setError(value instanceof Error ? value.message : "Could not load portal."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const applications = useMemo(() => new Map(data.applications.map((item) => [item.id, item])), [data.applications]);

  const respond = async (offerId: string, status: "accepted" | "declined") => {
    setSaving(true); setError("");
    try { await portalRequest({ method: "PATCH", body: JSON.stringify({ offer_id: offerId, status }) }); await load(); }
    catch (value) { setError(value instanceof Error ? value.message : "Could not respond to offer."); }
    finally { setSaving(false); }
  };

  const uploadDocument = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Documents must be 10 MB or smaller."); return; }
    if (!isSupabaseConfigured || !supabase) { setError("Document storage is unavailable."); return; }
    setSaving(true); setError("");
    try {
      const auth = await supabase.auth.getUser();
      if (!auth.data.user) throw new Error("Authentication is required.");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-160);
      const path = `${auth.data.user.id}/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upload.error) throw new Error(upload.error.message);
      try {
        await portalRequest({ method: "POST", body: JSON.stringify({ storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size, document_type: "supporting_document" }) });
      } catch (value) {
        await supabase.storage.from("candidate-documents").remove([path]);
        throw value;
      }
      await load();
    } catch (value) { setError(value instanceof Error ? value.message : "Could not upload document."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="grid min-h-80 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div><Badge variant="primary">Candidate Portal</Badge><h1 className="mt-3 text-3xl font-black text-text-main dark:text-white">Your hiring journey</h1><p className="mt-2 text-sm font-semibold text-text-muted">Track applications, interviews, offers, messages, and supporting documents.</p></div>
        <Button variant="secondary" onClick={load}><RefreshCw className="h-4 w-4" />Refresh</Button>
      </header>
      {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">{error}</p> : null}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Section title="Applications" icon={CheckCircle2}>{data.applications.length ? data.applications.map((item) => <article key={item.id} className="rounded-md border border-border p-4 dark:border-white/10"><div className="flex justify-between gap-3"><div><h3 className="font-black text-text-main dark:text-white">{item.job?.job_title || item.job_role || "Application"}</h3><p className="text-xs text-text-muted">{item.job?.company_name || "Employer"}{item.job?.job_location ? ` - ${item.job.job_location}` : ""}</p></div><Badge>{item.status}</Badge></div><p className="mt-3 text-xs font-semibold text-text-muted">Applied {new Date(item.created_at).toLocaleDateString()}</p></article>) : <Empty text="No applications yet." />}</Section>
        <Section title="Interview schedule" icon={CalendarDays}>{data.interviews.length ? data.interviews.map((item) => <article key={item.id} className="rounded-md border border-border p-4 dark:border-white/10"><div className="flex justify-between gap-3"><h3 className="font-black capitalize text-text-main dark:text-white">{item.interview_type} interview</h3><Badge>{item.status}</Badge></div><p className="mt-2 text-sm text-text-muted">{new Date(item.scheduled_at).toLocaleString()} - {item.duration_minutes} minutes</p>{item.meeting_link ? <a href={item.meeting_link} target="_blank" className="mt-3 inline-block text-sm font-black text-primary">Open meeting</a> : null}</article>) : <Empty text="No interviews scheduled." />}</Section>
        <Section title="Offers" icon={FileText}>{data.offers.length ? data.offers.map((offer) => { const application = applications.get(offer.application_id); return <article key={offer.id} className="rounded-md border border-border p-4 dark:border-white/10"><div className="flex justify-between gap-3"><h3 className="font-black text-text-main dark:text-white">{application?.job?.job_title || application?.job_role || "Employment offer"}</h3><Badge>{offer.status}</Badge></div>{["sent", "viewed"].includes(offer.status) ? <div className="mt-4 flex gap-2"><Button variant="success" disabled={saving} onClick={() => respond(offer.id, "accepted")}>Accept</Button><Button variant="secondary" disabled={saving} onClick={() => respond(offer.id, "declined")}>Decline</Button></div> : null}</article>; }) : <Empty text="No active offers." />}</Section>
        <Section title="Messages" icon={Mail}>{data.messages.length ? data.messages.map((item) => <article key={item.id} className="rounded-md border border-border p-4 dark:border-white/10"><h3 className="font-black text-text-main dark:text-white">{item.subject || item.message_type.replaceAll("_", " ")}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{item.body}</p><p className="mt-3 text-[10px] font-black uppercase text-text-muted">{new Date(item.created_at).toLocaleString()}</p></article>) : <Empty text="No messages yet." />}</Section>
      </div>
      <Section title="Documents" icon={FileText} className="mt-6">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-black text-white transition hover:bg-primary/90"><Upload className="h-4 w-4" />{saving ? "Uploading..." : "Upload document"}<input type="file" className="sr-only" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" disabled={saving} onChange={uploadDocument} /></label>
        {data.documents.length ? data.documents.map((item) => <article key={item.id} className="flex items-center justify-between rounded-md border border-border p-4 dark:border-white/10"><div><h3 className="font-black text-text-main dark:text-white">{item.file_name}</h3><p className="text-xs text-text-muted">{item.document_type.replaceAll("_", " ")} - {new Date(item.created_at).toLocaleDateString()}</p></div><Badge>{item.mime_type || "document"}</Badge></article>) : <Empty text="Supporting documents uploaded for applications will appear here." />}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children, className = "" }: { title: string; icon: typeof FileText; children: React.ReactNode; className?: string }) { return <Card className={className}><h2 className="flex items-center gap-2 text-xl font-black text-text-main dark:text-white"><Icon className="h-5 w-5 text-primary" />{title}</h2><div className="mt-5 space-y-3">{children}</div></Card>; }
function Empty({ text }: { text: string }) { return <p className="rounded-md border border-dashed border-border p-6 text-center text-sm font-bold text-text-muted dark:border-white/10">{text}</p>; }
