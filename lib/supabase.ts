export { supabase, isSupabaseConfigured } from "./supabaseClient";

export async function getCurrentSessionUser() {
  const { supabase, isSupabaseConfigured } = await import("./supabaseClient");
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
}
