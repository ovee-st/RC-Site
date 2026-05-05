"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";
import { demoCandidates } from "@/lib/demoData";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useJobStore } from "@/store/useJobStore";
import { Save, ShieldCheck, UsersRound } from "lucide-react";

type AdminUserRow = {
  id: string;
  type: "candidate" | "employer";
  username: string;
  name: string;
  email?: string;
  phone?: string;
};

const VISITOR_KEY = "mx_site_visitors";

function localVisitorCount() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(VISITOR_KEY) || "0");
}

export default function AdminDashboard() {
  const { jobs } = useJobStore();
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [visitors, setVisitors] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setVisitors(localVisitorCount());

    async function loadRows() {
      const fallback: AdminUserRow[] = [
        ...demoCandidates.map((candidate) => ({
          id: candidate.id,
          type: "candidate" as const,
          username: candidate.name.toLowerCase().replace(/\s+/g, "."),
          name: candidate.name,
          email: "",
          phone: ""
        })),
        {
          id: "employer-local",
          type: "employer",
          username: "ovee.employer",
          name: "Ovee",
          email: "",
          phone: ""
        }
      ];

      if (!isSupabaseConfigured) {
        setRows(fallback);
        return;
      }

      const [profiles, candidates, employers] = await Promise.all([
        supabase.from("profiles").select("id, role, username, full_name, name"),
        supabase.from("candidates").select("user_id, name, full_name, email, phone"),
        supabase.from("employers").select("user_id, company_name, contact_person, email, phone")
      ]);

      const profileRows = (profiles.data || []).map((profile: any) => {
        const candidate = (candidates.data || []).find((item: any) => item.user_id === profile.id);
        const employer = (employers.data || []).find((item: any) => item.user_id === profile.id);
        const type = profile.role === "employer" ? "employer" : "candidate";
        return {
          id: profile.id,
          type,
          username: profile.username || profile.id,
          name: profile.full_name || profile.name || candidate?.name || candidate?.full_name || employer?.contact_person || employer?.company_name || "Registered user",
          email: candidate?.email || employer?.email || "",
          phone: candidate?.phone || employer?.phone || ""
        } as AdminUserRow;
      });

      setRows(profileRows.length ? profileRows : fallback);
    }

    loadRows().catch(() => setRows([]));
  }, []);

  const stats = useMemo(() => ({
    candidates: rows.filter((row) => row.type === "candidate").length,
    employers: rows.filter((row) => row.type === "employer").length,
    visitors,
    jobs: jobs.length
  }), [rows, visitors, jobs.length]);

  const updateRow = (id: string, key: keyof AdminUserRow, value: string) => {
    if (key === "username") return;
    setRows((current) => current.map((row) => row.id === id ? { ...row, [key]: value } : row));
  };

  const saveRow = async (row: AdminUserRow) => {
    setMessage("");

    if (isSupabaseConfigured) {
      try { await supabase.from("profiles").update({ full_name: row.name }).eq("id", row.id); } catch {}
      if (row.type === "candidate") {
        try { await supabase.from("candidates").update({ name: row.name, email: row.email, phone: row.phone }).eq("user_id", row.id); } catch {}
      } else {
        try { await supabase.from("employers").update({ contact_person: row.name, email: row.email, phone: row.phone }).eq("user_id", row.id); } catch {}
      }
    }

    setMessage(`Saved ${row.name}. Username remains locked.`);
    window.setTimeout(() => setMessage(""), 2500);
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <Badge variant="primary" className="type-label text-primary">Admin Profile</Badge>
        <h1 className="type-h1 mt-3">Platform control center</h1>
        <p className="type-body mt-2">View platform counts and update editable candidate or employer profile fields. Usernames are locked after registration.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          ["Candidates", stats.candidates],
          ["Employers", stats.employers],
          ["Visitors", stats.visitors],
          ["Jobs", stats.jobs]
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="type-label">{label}</p>
            <strong className="mt-3 block text-3xl font-black text-text-main dark:text-white">{value}</strong>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <Badge variant="primary" className="type-label text-primary">Registered Users</Badge>
            <h2 className="type-h2 mt-3">Manage editable profile fields</h2>
          </div>
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div className="grid gap-4">
          {rows.map((row) => (
            <Card key={row.id} className="grid gap-3 p-4 md:grid-cols-[130px_1fr_1fr_1fr_auto] md:items-end">
              <div>
                <Badge variant={row.type === "employer" ? "primary" : "success"}>{row.type}</Badge>
                <p className="mt-2 text-xs font-bold text-text-muted">@{row.username}</p>
              </div>
              <Input value={row.name} onChange={(event) => updateRow(row.id, "name", event.target.value)} placeholder="Name" />
              <Input value={row.email || ""} onChange={(event) => updateRow(row.id, "email", event.target.value)} placeholder="Email" />
              <Input value={row.phone || ""} onChange={(event) => updateRow(row.id, "phone", event.target.value)} placeholder="Phone" />
              <Button type="button" onClick={() => saveRow(row)} className="rounded-lg">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </Card>
          ))}
          {!rows.length ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center dark:border-white/10">
              <UsersRound className="mx-auto h-8 w-8 text-primary" />
              <h3 className="type-h3 mt-3">No users loaded</h3>
              <p className="type-body mt-2">Check Supabase profile access or register users first.</p>
            </div>
          ) : null}
        </div>
        {message ? <p className="mt-4 text-sm font-bold text-primary">{message}</p> : null}
      </Card>
    </PageContainer>
  );
}