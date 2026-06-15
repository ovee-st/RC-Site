"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { demoCandidates } from "@/lib/demoData";
import { AUTH_CHANGE_EVENT, MOCK_USER_KEY, getStableUsername } from "@/lib/accountIdentity";
import { getBestAvatarUrl } from "@/lib/authUserSync";

export const AuthContext = createContext({
  user: null,
  loading: true,
  role: null
});

function normalizeUser(authUser, profile, fallbackUser) {
  if (!authUser) return null;

  const metadata = authUser.user_metadata || {};
  const resolvedAvatar =
    getBestAvatarUrl(profile) ||
    getBestAvatarUrl(authUser) ||
    getBestAvatarUrl(fallbackUser);
  const name =
    profile?.full_name ||
    profile?.name ||
    metadata.full_name ||
    metadata.name ||
    fallbackUser?.user_metadata?.full_name ||
    fallbackUser?.user_metadata?.name ||
    fallbackUser?.name ||
    authUser.email?.split("@")[0] ||
    "MX User";

  return {
    id: authUser.id,
    email: authUser.email,
    user_metadata: {
      ...fallbackUser?.user_metadata,
      ...metadata,
      verified: profile?.verified ?? metadata.verified ?? fallbackUser?.user_metadata?.verified,
      plan: profile?.plan ?? metadata.plan ?? fallbackUser?.user_metadata?.plan
    },
    name,
    username: getStableUsername({
      id: authUser.id,
      email: authUser.email,
      name,
      username: profile?.username || metadata.username || fallbackUser?.username,
      user_metadata: { ...fallbackUser?.user_metadata, ...metadata }
    }),
    avatar: resolvedAvatar || null,
    avatar_url: resolvedAvatar || null,
    photo_url: resolvedAvatar || null,
    profile_photo_url: resolvedAvatar || null
  };
}

async function loadProfile(authUser) {
  if (!authUser || !isSupabaseConfigured) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  let profile = data || null;

  const [candidateResult, employerResult] = await Promise.allSettled([
    supabase.from("candidates").select("*").eq("user_id", authUser.id).maybeSingle(),
    supabase.from("employers").select("*").eq("user_id", authUser.id).maybeSingle()
  ]);
  const candidate = candidateResult.status === "fulfilled" ? candidateResult.value.data : null;
  const employer = employerResult.status === "fulfilled" ? employerResult.value.data : null;

  if (candidate || employer) {
    profile = {
      ...(profile || {}),
      candidate: candidate || undefined,
      employer: employer || undefined,
      avatar_url: getBestAvatarUrl(profile) || getBestAvatarUrl(candidate) || getBestAvatarUrl(employer) || profile?.avatar_url || null,
      photo_url: getBestAvatarUrl(profile) || getBestAvatarUrl(candidate) || getBestAvatarUrl(employer) || profile?.photo_url || null
    };
  }

  if (profile?.role) return profile;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return data || null;

  const response = await fetch("/api/profile/ensure", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }).catch(() => null);

  if (!response?.ok) return profile || null;
  const payload = await response.json().catch(() => ({}));
  return payload.profile || profile || null;
}

function getMockUser() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(MOCK_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function normalizeRole(value) {
  return [
    "candidate",
    "employer",
    "employee",
    "support_agent",
    "support_senior",
    "support_manager",
    "admin",
    "viewer"
  ].includes(value) ? value : null;
}

function applyUserDefaults(user) {
  if (!user) return null;

  const role = normalizeRole(user.role || user.user_metadata?.role);
  const isGenericName = !user.name || user.name === "MX User" || user.name === "demo-user";

  if (role === "candidate" && isGenericName) {
    const candidate = demoCandidates[0];

    return {
      ...user,
      name: candidate.name,
      avatar: user.avatar || user.user_metadata?.photo_url || user.user_metadata?.avatar_url || candidate.avatar || null,
      user_metadata: {
        ...user.user_metadata,
        name: candidate.name,
        full_name: candidate.name,
        avatar_url: user.avatar || user.user_metadata?.photo_url || candidate.avatar || user.user_metadata?.avatar_url,
        photo_url: user.avatar || user.user_metadata?.photo_url || candidate.avatar,
        username: getStableUsername(user),
        role
      }
    };
  }

  if (role === "employer" && isGenericName) {
    return {
      ...user,
      name: "Ovee",
      user_metadata: {
        ...user.user_metadata,
        name: "Ovee",
        full_name: "Ovee",
        username: getStableUsername(user),
        role
      }
    };
  }

  return {
    ...user,
    username: getStableUsername(user),
    user_metadata: {
      ...user.user_metadata,
      username: getStableUsername(user)
    }
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    function applyMockUser() {
      const mockUser = applyUserDefaults(getMockUser());

      if (!active) return;

      setUser(mockUser);
      setRole(normalizeRole(mockUser?.role));
      setLoading(false);
    }

    async function syncAuth(authUser) {
      if (!authUser) {
        applyMockUser();
        return;
      }

      const fallbackUser = applyUserDefaults(getMockUser());
      const provisionalRole = normalizeRole(authUser?.user_metadata?.role || fallbackUser?.role);

      if (active) {
        setUser(normalizeUser(authUser, null, fallbackUser));
        setRole(provisionalRole);
        setLoading(false);
      }

      const profile = await loadProfile(authUser).catch(() => null);

      if (!active) return;

      setUser(normalizeUser(authUser, profile, fallbackUser));
      setRole(normalizeRole(profile?.role || authUser?.user_metadata?.role || fallbackUser?.role));
      setLoading(false);
    }

    async function hydrate() {
      setLoading(true);

      if (!isSupabaseConfigured) {
        applyMockUser();
        return;
      }

      const { data } = await supabase.auth.getUser();
      await syncAuth(data?.user || null);
    }

    hydrate();

    const handleFallbackAuthChange = () => {
      if (isSupabaseConfigured) {
        supabase.auth.getUser().then(({ data }) => {
          syncAuth(data?.user || null);
        });
        return;
      }

      applyMockUser();
    };

    const handleStorageChange = (event) => {
      if (event.key === MOCK_USER_KEY) {
        handleFallbackAuthChange();
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleFallbackAuthChange);
    window.addEventListener("storage", handleStorageChange);

    if (!isSupabaseConfigured) {
      return () => {
        active = false;
        window.removeEventListener(AUTH_CHANGE_EVENT, handleFallbackAuthChange);
        window.removeEventListener("storage", handleStorageChange);
      };
    }

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuth(session?.user || null);
    });

    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleFallbackAuthChange);
      window.removeEventListener("storage", handleStorageChange);
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading, role }), [user, loading, role]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

