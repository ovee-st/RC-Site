"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { roleHomeRoutes } from "@/lib/rbac";
import { useUserStore } from "@/store/useUserStore";

type OAuthRole = "candidate" | "employer";

const allowedOAuthRoles = new Set<OAuthRole>(["candidate", "employer"]);

function getSelectedRole(url: URL): OAuthRole {
  const role = url.searchParams.get("role");
  return allowedOAuthRoles.has(role as OAuthRole) ? role as OAuthRole : "candidate";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [message, setMessage] = useState("Completing Google login...");

  useEffect(() => {
    let active = true;

    async function completeOAuthLogin() {
      try {
        const url = new URL(window.location.href);
        const selectedRole = getSelectedRole(url);
        const code = url.searchParams.get("code");
        const authError = url.searchParams.get("error_description") || url.searchParams.get("error");

        if (authError) throw new Error(authError);

        const authResult = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.getSession();

        const data = authResult.data as { session?: { access_token?: string; user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null } | null; user?: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null };
        const session = data.session || null;
        const authUser = data.user || session?.user || null;

        if (authResult.error) throw authResult.error;
        if (!session?.access_token || !authUser) throw new Error("Google login did not return a valid session.");

        const response = await fetch("/api/profile/ensure", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ selected_role: selectedRole })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not create your MXVL profile.");

        const profile = payload.profile || {};
        const metadata = authUser.user_metadata || {};
        const role = profile.role || metadata.role || selectedRole;
        const name = profile.full_name || profile.name || metadata.full_name || metadata.name || authUser.email?.split("@")[0] || "MXVL User";
        const avatar = profile.avatar_url || profile.photo_url || metadata.avatar_url || metadata.picture || metadata.photo_url || null;
        const email = profile.email || authUser.email || "";

        setUser({
          id: authUser.id,
          name,
          email,
          avatar
        }, role);

        if (!active) return;
        router.replace(roleHomeRoutes[role as keyof typeof roleHomeRoutes] || "/");
      } catch (error) {
        if (!active) return;
        setMessage(error instanceof Error ? error.message : "Could not complete Google login.");
      }
    }

    completeOAuthLogin();

    return () => {
      active = false;
    };
  }, [router, setUser]);

  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-bg px-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-soft dark:border-white/10 dark:bg-slate-900">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Google Login</p>
        <h1 className="mt-3 text-2xl font-black text-text-main dark:text-white">Signing you in</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-text-muted dark:text-slate-300">{message}</p>
      </div>
    </main>
  );
}
