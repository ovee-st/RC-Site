import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type ServerAnalyticsValue = string | number | boolean | null | undefined;
export type ServerAnalyticsParameters = Record<string, ServerAnalyticsValue>;

export type ServerAnalyticsEvent = {
  event?: string;
  event_name?: string;
  page_location?: string;
  page_title?: string;
  user_id?: string;
  session_id?: string;
  parameters?: ServerAnalyticsParameters;
};

const CLIENT_ID_KEY = "mxvl_ga_client_id";

function getBrowserClientId() {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    return undefined;
  }
}

async function getSupabaseUserId() {
  if (!isSupabaseConfigured) return undefined;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id;
  } catch {
    return undefined;
  }
}

function canUseRelativeAnalyticsFetch() {
  return typeof window !== "undefined" && typeof window.location?.origin === "string" && typeof fetch === "function";
}

export async function trackServerEvent(event: ServerAnalyticsEvent) {
  const eventName = event.event || event.event_name;
  if (!eventName || !canUseRelativeAnalyticsFetch()) return;

  try {
    const userId = event.user_id || await getSupabaseUserId();
    const payload = JSON.stringify({
      event_name: eventName,
      page_location: event.page_location || window.location.href,
      page_title: event.page_title || document.title,
      user_id: userId,
      session_id: event.session_id || getBrowserClientId(),
      parameters: event.parameters || {}
    });

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: payload.length < 60_000
    }).catch(() => null);
  } catch {
    // Analytics must never block product flows.
  }
}
