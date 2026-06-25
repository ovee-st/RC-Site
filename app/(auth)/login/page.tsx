"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/cn";
import { demoCandidates } from "@/lib/demoData";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY, createStableUsername } from "@/lib/accountIdentity";
import { roleHomeRoutes } from "@/lib/rbac";
import { analyticsEvents } from "@/lib/analytics";

const metrics = [
  { value: "10K+", label: "Candidate Profiles", icon: UsersRound, tone: "text-blue-600 dark:text-blue-300" },
  { value: "500+", label: "Employers", icon: BriefcaseBusiness, tone: "text-violet-600 dark:text-violet-300" },
  { value: "48h", label: "Average Hiring Time", icon: Clock3, tone: "text-emerald-600 dark:text-emerald-300" },
  { value: "90%", label: "Match Accuracy", icon: Sparkles, tone: "text-rose-600 dark:text-rose-300" }
];

type LoginRole = "candidate" | "employer";
type ResolvedRole = LoginRole | "employee" | "support_agent" | "support_senior" | "support_manager" | "admin" | "viewer";

const resolvedRoles: ResolvedRole[] = ["candidate", "employer", "employee", "support_agent", "support_senior", "support_manager", "admin", "viewer"];

function getDefaultProfile(role: ResolvedRole, fallbackName: string) {
  if (role === "admin" || role === "viewer") {
    return {
      name: fallbackName && fallbackName !== "MX User" ? fallbackName : "MXVL Admin",
      avatar: undefined
    };
  }

  if (role === "candidate") {
    const candidate = demoCandidates[0];
    return {
      name: candidate.name,
      avatar: candidate.avatar
    };
  }

  return {
    name: fallbackName && fallbackName !== "MX User" ? fallbackName : "Ovee",
    avatar: undefined
  };
}

async function resolveUserRole(authUser: { id?: string; email?: string | null; user_metadata?: Record<string, unknown> } | null, fallbackRole: LoginRole): Promise<ResolvedRole> {
  if (!authUser?.id || !isSupabaseConfigured) {
    return fallbackRole;
  }

  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .maybeSingle();

    const databaseRole = data?.role as ResolvedRole | undefined;
    if (resolvedRoles.includes(databaseRole as ResolvedRole)) {
      return databaseRole as ResolvedRole;
    }

  } catch {
    // If the profiles table is unavailable, keep the selected role as fallback.
  }

  const metadataRole = authUser?.user_metadata?.role;

  if (resolvedRoles.includes(metadataRole as ResolvedRole)) {
    return metadataRole as ResolvedRole;
  }

  return fallbackRole;
}

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<LoginRole>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("MX User");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const persistAuthFallback = (nextUser: { id: string; name: string; email: string; avatar?: string; username?: string }, nextRole: ResolvedRole) => {
    if (typeof window === "undefined") return;
    const username = nextUser.username || createStableUsername(nextUser.name, nextUser.email, nextUser.id);

    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify({
      ...nextUser,
      username,
      role: nextRole,
      user_metadata: {
        name: nextUser.name,
        full_name: nextUser.name,
        username,
        avatar_url: nextUser.avatar,
        role: nextRole
      }
    }));
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  };

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setMessage("");
    if (!email || !password) return setMessage("Email and password are required.");
    setLoading(true);

    if (!isSupabaseConfigured) {
      const defaultProfile = getDefaultProfile(role, name);
      const fallbackUser = { id: "demo-user", name: defaultProfile.name, email, avatar: defaultProfile.avatar, username: createStableUsername(defaultProfile.name, email, "demo-user") };
      setUser(fallbackUser, role);
      persistAuthFallback(fallbackUser, role);
      setLoading(false);
      router.push(role === "employer" ? "/employer" : "/");
      return;
    }

    const response = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role } } });
    setLoading(false);
    const defaultProfile = getDefaultProfile(role, name);
    if (response.error) {
      setMessage(response.error.message);
      return;
    }
    const user = response.data.user;
    const resolvedRole = mode === "login" ? await resolveUserRole(user, role) : role;
    const metadata = user?.user_metadata || {};
    const resolvedDefaultProfile = getDefaultProfile(resolvedRole, name);
    const displayName = metadata.full_name || metadata.name || resolvedDefaultProfile.name || email.split("@")[0];
    const avatar = metadata.avatar_url || metadata.picture || metadata.photo_url || resolvedDefaultProfile.avatar;
    const loggedInUser = { id: user?.id || "demo-user", name: displayName, email, avatar, username: metadata.username || createStableUsername(displayName, email, user?.id || "demo-user") };
    setUser(loggedInUser, resolvedRole);
    persistAuthFallback(loggedInUser, resolvedRole);
    if (mode === "signup") {
      if (resolvedRole === "employer") analyticsEvents.employerRegistration();
      else analyticsEvents.candidateRegistration();
    }
    router.push(roleHomeRoutes[resolvedRole] || "/");
  };

  const continueWithGoogle = async () => {
    setMessage("");

    if (!isSupabaseConfigured) {
      setMessage("Google login requires Supabase configuration.");
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
    }
  };

  return (
    <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[#f4f7fc] dark:bg-[#090b14]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(37,99,235,0.10),transparent_38%,rgba(124,58,237,0.08)_68%,rgba(16,185,129,0.05))] dark:bg-[linear-gradient(135deg,rgba(37,99,235,0.14),transparent_42%,rgba(124,58,237,0.12)_72%,rgba(16,185,129,0.05))]" />

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1500px] xl:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]">
        <section className="relative flex min-w-0 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-20 xl:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-blue-200/80 bg-white/75 px-3 py-2 text-xs font-black text-blue-700 shadow-sm backdrop-blur-xl dark:border-blue-400/20 dark:bg-white/8 dark:text-blue-200">
              <Image src="/mxvl-logo.png" alt="MX Venture Lab" width={24} height={24} className="h-6 w-6 object-contain dark:hidden" />
              <Image src="/mxvl-logo-dark.png" alt="" width={24} height={24} className="hidden h-6 w-6 object-contain dark:block" />
              AI-powered recruitment platform
            </div>

            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.05] text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
              Find Jobs. Hire Talent. <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Grow Together.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg dark:text-slate-300">
              MXVL brings candidates and employers into one intelligent hiring workspace, using AI-powered matching to make every search faster, clearer, and more human.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="min-w-0 border-l-2 border-slate-200 pl-3 dark:border-white/15">
                  <metric.icon className={cn("h-5 w-5", metric.tone)} />
                  <strong className="mt-2 block text-2xl font-black text-slate-950 dark:text-white">{metric.value}</strong>
                  <span className="mt-1 block text-xs font-bold leading-4 text-slate-500 dark:text-slate-400">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 hidden min-h-[300px] max-w-[760px] md:block" aria-label="MXVL recruitment workspace preview">
            <div className="absolute bottom-0 left-0 top-5 w-[72%] overflow-hidden rounded-lg border border-white/80 bg-white/85 shadow-[0_24px_70px_rgba(30,64,175,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
                <div>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-300">HIRING OVERVIEW</p>
                  <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">Your recruitment workspace</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-200 dark:border-white/10">
                {[["24", "Active jobs"], ["186", "Candidates"], ["14", "Interviews"]].map(([value, label]) => (
                  <div key={label} className="border-r border-slate-200 px-5 py-4 last:border-r-0 dark:border-white/10">
                    <strong className="block text-2xl font-black text-slate-950 dark:text-white">{value}</strong>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400"><span>Hiring progress</span><span>72%</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-600 to-violet-500" /></div>
                <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 8 strong matches ready to review</div>
              </div>
            </div>

            <div className="absolute bottom-5 right-0 w-[44%] rounded-lg border border-white/90 bg-white/95 p-5 shadow-[0_24px_70px_rgba(76,29,149,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
              <div className="flex items-center gap-3">
                <Image src="/default-avatar.png" alt="Candidate profile preview" width={52} height={52} className="h-[52px] w-[52px] rounded-full border-2 border-white object-cover shadow-sm dark:border-slate-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">Nusrat Jahan</p>
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Success Specialist</p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">94%</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400"><MapPin className="h-4 w-4" /> Remote friendly</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["CRM", "Communication", "Operations"].map((skill) => <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-200">{skill}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center border-t border-white/70 bg-white/58 px-5 py-10 backdrop-blur-xl sm:px-10 xl:border-l xl:border-t-0 dark:border-white/10 dark:bg-slate-950/42">
          <div className="w-full max-w-[490px] rounded-lg border border-white/90 bg-white/88 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.14)] backdrop-blur-2xl sm:p-8 dark:border-white/10 dark:bg-slate-900/88 dark:shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black text-blue-600 dark:text-blue-300">SECURE ACCESS</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                  {mode === "login" ? "Sign in to continue to your MXVL workspace." : "Choose your path and start building momentum."}
                </p>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-white/10 dark:bg-white/5" aria-label="Account type">
              {(["candidate", "employer"] as const).map((item) => {
                const Icon = item === "candidate" ? UserRound : BriefcaseBusiness;
                return (
                  <Button
                    key={item}
                    type="button"
                    variant="tab"
                    onClick={() => setRole(item)}
                    className={cn(
                      "h-11 gap-2 rounded-md px-3 py-2 font-bold shadow-none",
                      role === item && "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-200"
                    )}
                  >
                    <Icon className="h-4 w-4" /> {item === "candidate" ? "Candidate" : "Employer"}
                  </Button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-1 border-b border-slate-200 dark:border-white/10">
              {(["login", "signup"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "relative h-11 text-sm font-black text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300",
                    mode === item && "text-blue-700 after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:bg-blue-600 dark:text-blue-200"
                  )}
                >
                  {item === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form className="mt-6 grid gap-4" onSubmit={submit}>
              {mode === "signup" ? (
                <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                  Full name
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" className="h-12 rounded-md bg-white pl-11 shadow-none dark:bg-slate-950/60" />
                  </div>
                </label>
              ) : null}

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Email address
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@company.com" autoComplete="email" className="h-12 rounded-md bg-white pl-11 shadow-none dark:bg-slate-950/60" />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                Password
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="h-12 rounded-md bg-white px-11 shadow-none dark:bg-slate-950/60" />
                  <button type="button" onClick={() => setShowPassword((current) => !current)} className="focus-ring absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <Button type="submit" disabled={loading} className="mt-1 h-12 w-full gap-2 rounded-md text-sm font-black">
                {loading ? "Please wait..." : mode === "login" ? "Login to MXVL" : "Create Account"}
                {!loading ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>

              {message ? <p className="rounded-md bg-danger/10 px-4 py-3 text-sm font-semibold text-danger dark:text-red-300">{message}</p> : null}
            </form>

            <div className="my-5 flex items-center gap-3 text-xs font-bold text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /> OR <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div>

            <button type="button" onClick={continueWithGoogle} disabled={loading} className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10">
              <span className="grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white font-black text-blue-600">G</span>
              Continue with Google
            </button>

            <div className="mt-6 border-t border-slate-200 pt-5 text-center dark:border-white/10">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">New to MXVL?</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <button type="button" onClick={() => { setRole("candidate"); setMode("signup"); }} className="focus-ring inline-flex items-center gap-1 text-sm font-black text-blue-700 hover:text-blue-500 dark:text-blue-300">Register as Candidate <ArrowRight className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => { setRole("employer"); setMode("signup"); }} className="focus-ring inline-flex items-center gap-1 text-sm font-black text-violet-700 hover:text-violet-500 dark:text-violet-300">Register as Employer <ArrowRight className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-slate-400"><Check className="h-4 w-4 text-emerald-500" /> Secure authentication powered by MXVL</div>
          </div>
        </section>
      </div>
    </main>
  );
}

