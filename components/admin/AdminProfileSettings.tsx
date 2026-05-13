"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, ShieldCheck, UserRound } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY, getStableUsername } from "@/lib/accountIdentity";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AD";
}

function updateLocalAuthProfile(fullName: string, avatarUrl: string) {
  if (typeof window === "undefined") return;

  try {
    const stored = window.localStorage.getItem(MOCK_USER_KEY);
    const current = stored ? JSON.parse(stored) : {};
    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      ...current,
      name: fullName,
      avatar: avatarUrl || current.avatar,
      user_metadata: {
        ...current.user_metadata,
        name: fullName,
        full_name: fullName,
        avatar_url: avatarUrl || current.user_metadata?.avatar_url
      }
    }));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // Local sync is best effort only.
  }
}

export default function AdminProfileSettings() {
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const readOnly = role === "viewer";
  const canAccessAdmin = role === "admin" || role === "viewer";
  const username = useMemo(() => getStableUsername(user), [user]);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !canAccessAdmin) router.replace("/");
  }, [canAccessAdmin, loading, router, user]);

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.name || "");
    setAvatarUrl(user?.user_metadata?.avatar_url || user?.user_metadata?.picture || user?.avatar || "");
  }, [user]);

  async function saveProfile() {
    if (readOnly) {
      setMessage("Viewer accounts can inspect admin data, but cannot make changes.");
      return;
    }

    const cleanName = fullName.trim();
    if (!cleanName) {
      setMessage("Please enter your admin display name.");
      return;
    }

    setSaving(true);
    setMessage("");

    if (isSupabaseConfigured) {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          ...(user?.user_metadata || {}),
          name: cleanName,
          full_name: cleanName,
          avatar_url: avatarUrl.trim() || null,
          username
        }
      });

      if (authError) {
        setSaving(false);
        setMessage(authError.message);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: cleanName, avatar_url: avatarUrl.trim() || null, username })
        .eq("id", user?.id);

      if (profileError) {
        setSaving(false);
        setMessage(profileError.message);
        return;
      }
    }

    updateLocalAuthProfile(cleanName, avatarUrl.trim());
    setSaving(false);
    setMessage("Admin profile updated.");
    window.setTimeout(() => setMessage(""), 2500);
  }

  if (loading || !user || !canAccessAdmin) return null;

  const previewName = fullName.trim() || "Admin";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),linear-gradient(180deg,#f8fafc,#eef2ff)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#020617,#0f172a)] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-3xl p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="primary" className="type-label text-primary">Admin Profile</Badge>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white">Edit admin profile</h1>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-text-muted dark:text-slate-300">Update your internal display name and profile image used across the admin command center.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg p-3 dark:border-white/10 dark:bg-white/5">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-sm font-black text-text-main dark:text-white">{role === "viewer" ? "Admin Viewer" : "Admin"}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
            <div className="rounded-3xl border border-border bg-bg p-5 text-center dark:border-white/10 dark:bg-white/5">
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-success text-2xl font-black text-white ring-4 ring-white shadow-soft dark:ring-white/10">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={previewName} className="h-full w-full object-cover" />
                ) : initials(previewName)}
              </div>
              <h2 className="mt-4 text-lg font-black text-text-main dark:text-white">{previewName}</h2>
              <p className="mt-1 text-xs font-bold text-text-muted">{user.email}</p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span className="type-label inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />Display name</span>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Admin display name" disabled={readOnly || saving} />
              </label>
              <label className="grid gap-2">
                <span className="type-label inline-flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" />Profile image URL</span>
                <Input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." disabled={readOnly || saving} />
              </label>
              <label className="grid gap-2">
                <span className="type-label">Permanent username</span>
                <Input value={username} readOnly className="bg-bg font-black text-text-muted dark:bg-white/5" />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-primary">{message}</p>
            <Button type="button" onClick={saveProfile} disabled={saving || readOnly} className="rounded-xl">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
