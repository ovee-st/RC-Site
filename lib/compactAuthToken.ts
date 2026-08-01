"use client";

import { supabase } from "@/lib/supabaseClient";
import { stripInlineAuthAvatarMetadata } from "@/lib/profileImageSync";

export const MAX_SAFE_AUTH_TOKEN_LENGTH = 6000;

export async function getCompactAccessToken(_context = "auth") {
  void _context;
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session || null;
  let token = session?.access_token || "";
  if (token && token.length > MAX_SAFE_AUTH_TOKEN_LENGTH) {
    const cleanMetadata = stripInlineAuthAvatarMetadata(session?.user?.user_metadata || {});
    await supabase.auth.updateUser({ data: cleanMetadata }).catch(() => null);
    const refreshed = await supabase.auth.refreshSession().catch(() => null);
    if (refreshed?.data?.session) {
      session = refreshed.data.session;
      token = session.access_token || token;
    }
  }

  return token;
}

export async function compactAuthHeaders(context = "auth"): Promise<Record<string, string>> {
  const token = await getCompactAccessToken(context);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
