"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brain, CheckCircle2, KanbanSquare, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/cn";
import PageContainer from "@/components/layout/PageContainer";
import { demoCandidates } from "@/lib/demoData";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY, createStableUsername } from "@/lib/accountIdentity";

const features = [
  { icon: Brain, label: "AI ranked matches" },
  { icon: KanbanSquare, label: "Hiring pipeline" },
  { icon: ShieldCheck, label: "Secure profiles" }
];

function getDefaultProfile(role: "candidate" | "employer", fallbackName: string) {
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

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"candidate" | "employer">("candidate");
  const [email, setEmail] = useState("candidate.admin@mxventurelab.com");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("MX User");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const persistAuthFallback = (nextUser: { id: string; name: string; email: string; avatar?: string; username?: string }, nextRole: "candidate" | "employer") => {
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

  const submit = async () => {
    setMessage("");
    if (!email || !password) return setMessage("Email and password are required.");
    setLoading(true);

    if (!isSupabaseConfigured) {
      const defaultProfile = getDefaultProfile(role, name);
      const fallbackUser = { id: "demo-user", name: defaultProfile.name, email, avatar: defaultProfile.avatar, username: createStableUsername(defaultProfile.name, email, "demo-user") };
      setUser(fallbackUser, role);
      persistAuthFallback(fallbackUser, role);
      setLoading(false);
      router.push(role === "employer" ? "/employer" : "/candidate");
      return;
    }

    const response = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name, role } } });
    setLoading(false);
    const defaultProfile = getDefaultProfile(role, name);
    if (response.error) {
      setMessage(response.error.message);
      const fallbackUser = { id: "demo-user", name: defaultProfile.name, email, avatar: defaultProfile.avatar, username: createStableUsername(defaultProfile.name, email, "demo-user") };
      setUser(fallbackUser, role);
      persistAuthFallback(fallbackUser, role);
      router.push(role === "employer" ? "/employer" : "/candidate");
      return;
    }
    const user = response.data.user;
    const metadata = user?.user_metadata || {};
    const displayName = metadata.full_name || metadata.name || defaultProfile.name || email.split("@")[0];
    const avatar = metadata.avatar_url || metadata.picture || metadata.photo_url || defaultProfile.avatar;
    const loggedInUser = { id: user?.id || "demo-user", name: displayName, email, avatar, username: metadata.username || createStableUsername(displayName, email, user?.id || "demo-user") };
    setUser(loggedInUser, role);
    persistAuthFallback(loggedInUser, role);
    router.push(role === "employer" ? "/employer" : "/candidate");
  };

  return (
    <PageContainer className="grid min-h-[calc(100vh-4rem)] items-center">
      <div className="mx-auto grid w-full max-w-[1120px] items-center gap-6 lg:grid-cols-[1fr_460px]">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-soft dark:border-white/10 dark:bg-surface-dark">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
          <p className="type-label text-primary">Secure Access</p>
          <h1 className="type-h1 mt-3 max-w-xl">One account for talent matching</h1>
          <p className="type-body mt-3 max-w-lg">Candidates manage profiles while employers manage jobs, matches, shortlists, and hiring progress from one SaaS workspace.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            {features.map((feature) => (
              <div key={feature.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-bg px-4 py-2 text-sm font-semibold text-text-main shadow-soft dark:border-white/10 dark:bg-white/5 dark:text-white">
                <feature.icon className="h-4 w-4 text-primary" />
                {feature.label}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["10k+", "candidate profiles"],
              ["48h", "shortlist delivery"],
              ["90%", "match accuracy"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border bg-bg p-6 dark:border-white/10 dark:bg-white/5">
                <strong className="block text-2xl font-bold tracking-tight text-text-main dark:text-white">{value}</strong>
                <span className="type-body mt-1 block text-xs">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-success">
            <CheckCircle2 className="h-4 w-4" />
            Built for candidates, recruiters, and managed hiring teams.
          </div>
          </div>
        </div>

        <Card className="w-full justify-self-end p-6 shadow-md">
          <div className="grid grid-cols-2 rounded-lg bg-bg p-1 dark:bg-white/5">
            {(["login", "signup"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant="tab"
                onClick={() => setMode(item)}
                className={cn("py-3 shadow-none", mode === item && "bg-surface text-primary shadow-soft dark:bg-surface-dark")}
              >
                {item === "login" ? "Login" : "Signup"}
              </Button>
            ))}
          </div>
          <div className="mt-6">
            <h2 className="type-h2">{mode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="type-body mt-2">{mode === "login" ? "Access your hiring workspace." : "Start building your profile or hiring team."}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-bg p-1 dark:bg-white/5">
            {(["candidate", "employer"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                variant="tab"
                onClick={() => setRole(item)}
                className={cn("py-3 shadow-none", role === item && "bg-primary text-white shadow-soft")}
              >
                {item === "candidate" ? "Candidate" : "Employer"}
              </Button>
            ))}
          </div>
          <div className="mt-6 grid gap-3">
            {mode === "signup" ? <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /> : null}
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
            <Button onClick={submit} disabled={loading} className="mt-1 w-full">{loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}</Button>
            {message ? <p className="type-body rounded-md bg-danger/10 px-4 py-3 font-semibold text-danger dark:text-red-300">{message}</p> : null}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
