"use client";

import { type ChangeEvent, useState } from "react";
import { Camera, Github, Linkedin, MapPin, Pencil, UserRound, X } from "lucide-react";
import type { CandidateProfile } from "@/types/candidate";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { avatarAliases, normalizeProfileImageUrl, syncProfileImageState } from "@/lib/profileImageSync";

export default function ProfileCard({ profile, onProfileUpdate }: { profile: CandidateProfile; onProfileUpdate: (profile: CandidateProfile) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, avatarUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const nextDraft = { ...draft, avatarUrl: normalizeProfileImageUrl(draft.avatarUrl) || undefined };
    onProfileUpdate(nextDraft);
    setEditing(false);
    syncProfileImageState({
      role: "candidate",
      name: nextDraft.name,
      avatarUrl: nextDraft.avatarUrl,
      profileStorageKey: "mx_candidate_profile",
      profilePatch: {
        name: nextDraft.name,
        title: nextDraft.title,
        location: nextDraft.location,
        avatar: nextDraft.avatarUrl || null,
        avatarUrl: nextDraft.avatarUrl || null
      }
    });

    if (isSupabaseConfigured && nextDraft.userId) {
      await supabase.from("candidates").upsert({
        user_id: nextDraft.userId,
        name: nextDraft.name,
        full_name: nextDraft.name,
        title: nextDraft.title,
        location: nextDraft.location,
        about: nextDraft.bio,
        skills: nextDraft.skills,
        linkedin: nextDraft.socials.linkedin,
        ...avatarAliases(nextDraft.avatarUrl)
      }, { onConflict: "user_id" });
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-success text-2xl font-black text-white shadow-soft">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.name} className="h-full w-full object-cover" /> : initials}
            </div>
            <div>
              <Badge variant="primary">Candidate profile</Badge>
              <h2 className="mt-3 text-2xl font-black text-text-main dark:text-white">{profile.name}</h2>
              <p className="mt-1 text-sm font-semibold text-text-muted dark:text-slate-300">{profile.title} · {profile.experienceLevel}</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-text-muted dark:text-slate-300"><MapPin className="h-4 w-4" /> {profile.location}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => { setDraft(profile); setEditing(true); }} className="gap-2"><Pencil className="h-4 w-4" /> Edit profile</Button>
        </div>
        <p className="mt-6 text-sm leading-7 text-text-muted dark:text-slate-300">{profile.bio}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.skills.map((skill) => <Badge key={skill}>{skill}</Badge>)}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {profile.socials.linkedin ? <a className="inline-flex items-center gap-2 text-sm font-bold text-primary" href={profile.socials.linkedin}><Linkedin className="h-4 w-4" /> LinkedIn</a> : null}
          {profile.socials.github ? <a className="inline-flex items-center gap-2 text-sm font-bold text-primary" href={profile.socials.github}><Github className="h-4 w-4" /> GitHub</a> : null}
          {profile.socials.portfolio ? <a className="inline-flex items-center gap-2 text-sm font-bold text-primary" href={profile.socials.portfolio}><UserRound className="h-4 w-4" /> Portfolio</a> : null}
        </div>
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/25 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div><Badge variant="primary">Edit profile</Badge><h3 className="mt-2 text-2xl font-black dark:text-white">Update candidate profile</h3></div>
              <button onClick={() => setEditing(false)} className="rounded-full p-2 text-text-muted hover:bg-primary/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 sm:col-span-2">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-success text-lg font-black text-white ring-2 ring-gray-200">
                  {draft.avatarUrl ? <img src={draft.avatarUrl} alt={draft.name} className="h-full w-full object-cover" /> : initials}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-bg px-4 py-2 text-sm font-bold text-text-main transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <Camera className="h-4 w-4" />
                  Update Photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              </div>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Full name" />
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Professional title" />
              <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Location" />
              <Input value={draft.socials.linkedin || ""} onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, linkedin: e.target.value } })} placeholder="LinkedIn URL" />
              <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} className="focus-ring min-h-32 rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-text-main dark:border-white/10 dark:bg-slate-900 dark:text-white sm:col-span-2" />
            </div>
            <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={saveProfile}>Save profile</Button></div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
