"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Camera, CheckCircle2, Pencil, Save, X } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

type EmployerProfileState = {
  company_name: string;
  contact_person: string;
  email: string;
  photo_url: string | null;
  banner_url: string | null;
  phone: string;
  location: string;
  industry: string;
  company_size: string;
  about: string;
};

const PROFILE_KEY = "mx_employer_profile";
const MOCK_USER_KEY = "mx_mock_user";
const AUTH_CHANGE_EVENT = "mx-auth-change";

const defaultProfile: EmployerProfileState = {
  company_name: "MX Partner Employer",
  contact_person: "Ovee",
  email: "employer.admin@mxventurelab.com",
  photo_url: null,
  banner_url: null,
  phone: "",
  location: "Dhaka, Bangladesh",
  industry: "Recruitment & Operations",
  company_size: "11-50 employees",
  about: "A growing employer using MX Venture Lab to source, evaluate, and hire matched candidates faster."
};

function TextArea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={[
        "focus-ring min-h-28 w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main placeholder:text-text-muted shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white",
        className
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function loadLocalProfile(userEmail?: string | null) {
  if (typeof window === "undefined") return { ...defaultProfile, email: userEmail || defaultProfile.email };

  try {
    const saved = window.localStorage.getItem(PROFILE_KEY);
    return {
      ...defaultProfile,
      email: userEmail || defaultProfile.email,
      ...(saved ? JSON.parse(saved) : {})
    };
  } catch {
    return { ...defaultProfile, email: userEmail || defaultProfile.email };
  }
}

export default function EmployerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmployerProfileState>(() => loadLocalProfile(user?.email));
  const [draft, setDraft] = useState<EmployerProfileState>(() => loadLocalProfile(user?.email));
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function hydrateProfile() {
      const localProfile = loadLocalProfile(user?.email);

      if (!user?.id || !isSupabaseConfigured) {
        setProfile(localProfile);
        setDraft(localProfile);
        return;
      }

      const { data } = await supabase
        .from("employers")
        .select("company_name, contact_person, email, photo_url, banner_url, phone, location, industry, company_size, about")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;

      const nextProfile = {
        ...localProfile,
        ...(data || {}),
        email: data?.email || user.email || localProfile.email
      };

      setProfile(nextProfile);
      setDraft(nextProfile);
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
    }

    hydrateProfile().catch(() => {
      const localProfile = loadLocalProfile(user?.email);
      setProfile(localProfile);
      setDraft(localProfile);
    });

    return () => {
      active = false;
    };
  }, [user?.id, user?.email]);

  const updateDraft = (key: keyof EmployerProfileState, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft("photo_url", String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const handleBannerChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft("banner_url", String(reader.result));
    };
    reader.readAsDataURL(file);
  };

  const syncNavbarProfile = (nextProfile: EmployerProfileState) => {
    try {
      const storedMock = window.localStorage.getItem(MOCK_USER_KEY);
      const currentMock = storedMock ? JSON.parse(storedMock) : {};
      const displayName = nextProfile.contact_person || nextProfile.company_name;

      window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
        ...currentMock,
        name: displayName,
        avatar: nextProfile.photo_url,
        role: "employer",
        user_metadata: {
          ...currentMock.user_metadata,
          name: displayName,
          full_name: displayName,
          avatar_url: nextProfile.photo_url,
          role: "employer"
        }
      }));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    } catch {
      // Local auth sync is best-effort only.
    }
  };

  const saveProfile = async () => {
    if (!draft.company_name.trim() || !draft.contact_person.trim()) {
      setMessage("Company name and contact person are required.");
      return;
    }

    setProfile(draft);
    setEditing(false);
    setMessage("Profile saved successfully.");
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(draft));
    syncNavbarProfile(draft);

    if (user?.id && isSupabaseConfigured) {
      try {
        await supabase
          .from("employers")
          .upsert({
            user_id: user.id,
            ...draft
          }, { onConflict: "user_id" })
          .throwOnError();
      } catch {
        setMessage("Saved locally. Supabase profile table may need the employer columns.");
      }
    }

    window.setTimeout(() => {
      setMessage("");
      router.replace("/employer#profile");
      document.getElementById("profile")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 900);
  };

  return (
    <Card id="profile" className="depth-primary scroll-mt-24 p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photo_url} alt={profile.company_name} className="h-14 w-14 rounded-full object-cover shadow-soft ring-2 ring-gray-200" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-white shadow-soft">
              <Building2 className="h-7 w-7" />
            </div>
          )}
          <div>
            <Badge variant="primary" className="type-label text-primary">Employer Profile</Badge>
            <h2 className="type-h2 mt-3">{profile.company_name}</h2>
            <p className="type-body mt-1">{profile.industry} • {profile.location}</p>
          </div>
        </div>
        <Button type="button" variant={editing ? "secondary" : "primary"} onClick={() => {
          setDraft(profile);
          setEditing((value) => !value);
          setMessage("");
        }} className="w-fit rounded-lg">
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {editing ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-text-main dark:text-white">LinkedIn-size profile banner</p>
                <p className="type-body mt-1 text-xs">Recommended 4:1 ratio. This appears in employer profile and posted job previews.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text-main shadow-soft transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <Camera className="h-4 w-4" />
                Upload Banner
                <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
              </label>
            </div>
            <div className="aspect-[4/1] overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 via-white to-success/10 dark:border-white/10 dark:from-primary/20 dark:via-slate-900 dark:to-success/10">
              {draft.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.banner_url} alt={`${draft.company_name} banner`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold text-text-muted dark:text-slate-300">Banner preview</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
            {draft.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.photo_url} alt={draft.company_name} className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-success text-white ring-2 ring-gray-200">
                <Building2 className="h-7 w-7" />
              </div>
            )}
            <div>
              <p className="text-sm font-black text-text-main dark:text-white">Company profile image</p>
              <p className="type-body mt-1 text-xs">Upload a logo or employer profile photo.</p>
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-bold text-text-main shadow-soft transition hover:border-primary/25 hover:text-primary dark:border-white/10 dark:bg-surface-dark dark:text-white">
                <Camera className="h-4 w-4" />
                Upload Image
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={draft.company_name} onChange={(event) => updateDraft("company_name", event.target.value)} placeholder="Company Name" />
            <Input value={draft.contact_person} onChange={(event) => updateDraft("contact_person", event.target.value)} placeholder="Contact Person" />
            <Input value={draft.email} readOnly placeholder="Email" className="opacity-80" />
            <Input value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} placeholder="Phone Number" />
            <Input value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="Company Location" />
            <Input value={draft.industry} onChange={(event) => updateDraft("industry", event.target.value)} placeholder="Industry Type" />
            <select
              value={draft.company_size}
              onChange={(event) => updateDraft("company_size", event.target.value)}
              className="focus-ring w-full rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-text-main shadow-soft hover:border-primary/20 dark:border-white/10 dark:bg-surface-dark dark:text-white"
            >
              <option>1-10 employees</option>
              <option>11-50 employees</option>
              <option>51-200 employees</option>
              <option>201-500 employees</option>
              <option>500+ employees</option>
            </select>
          </div>
          <TextArea value={draft.about} onChange={(event) => updateDraft("about", event.target.value)} placeholder="About Company" />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : <span />}
            <Button type="button" onClick={saveProfile} className="rounded-lg">
              <Save className="h-4 w-4" />
              Save Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {profile.banner_url ? (
            <div className="aspect-[4/1] overflow-hidden rounded-xl border border-border bg-bg dark:border-white/10 md:col-span-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.banner_url} alt={`${profile.company_name} banner`} className="h-full w-full object-cover" />
            </div>
          ) : null}
          {[
            ["Contact Person", profile.contact_person],
            ["Email", profile.email],
            ["Phone", profile.phone || "Not added"],
            ["Location", profile.location],
            ["Company Size", profile.company_size],
            ["Industry", profile.industry]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5">
              <p className="type-label">{label}</p>
              <p className="mt-2 text-sm font-bold text-text-main dark:text-white">{value}</p>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-bg p-4 dark:border-white/10 dark:bg-white/5 md:col-span-3">
            <p className="type-label">About Company</p>
            <p className="type-body mt-2">{profile.about}</p>
          </div>
          {message ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-success md:col-span-3">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}
