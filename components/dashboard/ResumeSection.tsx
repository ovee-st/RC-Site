"use client";

import { useRef, useState } from "react";
import { Download, FileUp, Sparkles } from "lucide-react";
import type { CandidateDocument, CandidateProfile } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function ResumeSection({ profile, documents: initialDocuments }: { profile: CandidateProfile; documents: CandidateDocument[] }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    setUploading(true);
    let url = URL.createObjectURL(file);
    if (isSupabaseConfigured && profile.userId) {
      const path = `${profile.userId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("candidate-documents").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("candidate-documents").getPublicUrl(path);
        url = data.publicUrl;
      }
    }
    setDocuments((current) => [{ id: `doc-${Date.now()}`, name: file.name, type: "Resume", url, uploadedAt: new Date().toISOString(), score: 86 }, ...current]);
    setUploading(false);
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><Badge variant="primary">Resume & documents</Badge><h2 className="mt-2 text-2xl font-black dark:text-white">Document vault</h2><p className="mt-1 text-sm text-text-muted dark:text-slate-300">Upload resumes, cover letters, certifications, and portfolio proof.</p></div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2"><FileUp className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload file"}</Button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
              <div><p className="font-black text-text-main dark:text-white">{doc.name}</p><p className="mt-1 text-xs font-semibold text-text-muted dark:text-slate-300">{doc.type} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p></div>
              <a href={doc.url} download className="rounded-xl border border-border p-2 text-text-muted transition hover:text-primary dark:border-white/10"><Download className="h-4 w-4" /></a>
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-success/10 p-5">
          <Sparkles className="h-6 w-6 text-primary" />
          <h3 className="mt-4 text-lg font-black dark:text-white">AI resume analysis</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted dark:text-slate-300">ATS score is {profile.resumeScore}%. Add measurable outcomes to your latest role and include two more domain keywords.</p>
          <div className="mt-4 h-2 rounded-full bg-white/70 dark:bg-white/10"><div className="h-full rounded-full bg-primary" style={{ width: `${profile.resumeScore}%` }} /></div>
        </div>
      </div>
    </Card>
  );
}
