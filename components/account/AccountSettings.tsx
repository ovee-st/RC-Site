"use client";

import { useEffect, useMemo, useState } from "react";
import { AtSign, KeyRound, Lock, Save, UserRound } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY, getStableUsername } from "@/lib/accountIdentity";

type AccountSettingsProps = {
  profileStorageKey?: string;
  title?: string;
};

function updateStoredProfileEmail(profileStorageKey: string | undefined, email: string) {
  if (!profileStorageKey || typeof window === "undefined") return;

  try {
    const storedProfile = window.localStorage.getItem(profileStorageKey);
    const parsedProfile = storedProfile ? JSON.parse(storedProfile) : {};
    window.localStorage.setItem(profileStorageKey, JSON.stringify({ ...parsedProfile, email }));
  } catch {
    // Profile storage sync is best-effort.
  }
}

function updateStoredAuth(email: string, username: string) {
  if (typeof window === "undefined") return;

  try {
    const storedMock = window.localStorage.getItem(MOCK_USER_KEY);
    const currentMock = storedMock ? JSON.parse(storedMock) : {};

    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      ...currentMock,
      email,
      username,
      user_metadata: {
        ...currentMock.user_metadata,
        username
      }
    }));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // Local auth sync is best-effort.
  }
}

export default function AccountSettings({ profileStorageKey, title = "Account Settings" }: AccountSettingsProps) {
  const { user } = useAuth();
  const username = useMemo(() => getStableUsername(user), [user]);
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user?.email]);

  const saveAccount = async () => {
    setMessage("");

    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setMessage("Password confirmation does not match.");
        return;
      }
    }

    setSaving(true);

    if (isSupabaseConfigured) {
      try {
        const updates: { email?: string; password?: string; data?: { username: string } } = {
          data: { username }
        };

        if (email !== user?.email) updates.email = email;
        if (newPassword) updates.password = newPassword;

        const { error } = await supabase.auth.updateUser(updates);
        if (error) throw error;
      } catch (error) {
        setSaving(false);
        setMessage(error instanceof Error ? error.message : "Could not update Supabase account.");
        return;
      }
    }

    updateStoredAuth(email, username);
    updateStoredProfileEmail(profileStorageKey, email);
    setNewPassword("");
    setConfirmPassword("");
    setSaving(false);
    setMessage(isSupabaseConfigured && email !== user?.email ? "Account updated. Supabase may send an email confirmation link." : "Account updated successfully.");
    window.setTimeout(() => setMessage(""), 3000);
  };

  return (
    <Card className="depth-primary p-5">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <Badge variant="primary" className="type-label text-primary">Account Identity</Badge>
          <h3 className="type-h3 mt-3 font-black">{title}</h3>
          <p className="type-body mt-1">Username is permanent. Email and password can be updated anytime.</p>
        </div>
        <Badge variant="neutral" className="w-fit gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Secure
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="type-label inline-flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5" />
            Username
          </span>
          <Input value={username} readOnly className="bg-bg font-black text-text-muted dark:bg-white/5" />
        </label>

        <label className="grid gap-2">
          <span className="type-label inline-flex items-center gap-1.5">
            <AtSign className="h-3.5 w-3.5" />
            Email Address
          </span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="name@example.com" />
        </label>

        <label className="grid gap-2">
          <span className="type-label inline-flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5" />
            New Password
          </span>
          <Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Leave blank to keep current password" />
        </label>

        <label className="grid gap-2">
          <span className="type-label">Confirm Password</span>
          <Input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="Confirm new password" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {message ? <p className="text-sm font-semibold text-primary">{message}</p> : <p className="type-body text-xs">Use your username for internal identity. It does not change when email changes.</p>}
        <Button type="button" onClick={saveAccount} disabled={saving} className="rounded-lg">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Account"}
        </Button>
      </div>
    </Card>
  );
}
