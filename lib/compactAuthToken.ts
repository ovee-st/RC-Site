"use client";

import { supabase } from "@/lib/supabaseClient";
import { stripInlineAuthAvatarMetadata } from "@/lib/profileImageSync";

export const MAX_SAFE_AUTH_TOKEN_LENGTH = 6000;

export async function getCompactAccessToken(context = "auth") {
  const { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session || null;
  let token = session?.access_token || "";
  const originalLength = token.length;
  let cleanupOccurred = false;

  console.log(`${context}_ORIGINAL_TOKEN_LENGTH`, originalLength);

  if (token && token.length > MAX_SAFE_AUTH_TOKEN_LENGTH) {
    cleanupOccurred = true;
    const cleanMetadata = stripInlineAuthAvatarMetadata(session?.user?.user_metadata || {});
    await supabase.auth.updateUser({ data: cleanMetadata }).catch(() => null);
    const refreshed = await supabase.auth.refreshSession().catch(() => null);
    if (refreshed?.data?.session) {
      session = refreshed.data.session;
      token = session.access_token || token;
    }
  }

  console.log(`${context}_REFRESHED_TOKEN_LENGTH`, token.length);
  console.log(`${context}_TOKEN_CLEANUP_OCCURRED`, cleanupOccurred);

  return token;
}

export async function compactAuthHeaders(context = "auth"): Promise<Record<string, string>> {
  const token = await getCompactAccessToken(context);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
