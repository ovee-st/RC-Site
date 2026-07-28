import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const revalidate = 60;

export async function GET() {
  try {
    const client = createServerSupabaseClient();
    const result = await client
      .from("platform_releases")
      .select("id,version,title,summary,release_type,status,banner_message,starts_at,ends_at,published_at")
      .in("status", ["scheduled", "published"])
      .order("starts_at", { ascending: false, nullsFirst: false })
      .limit(10);
    if (result.error) {
      if (/does not exist|schema cache/i.test(result.error.message)) return NextResponse.json({ release: null });
      throw new Error(result.error.message);
    }
    const now = Date.now();
    const release = (result.data || []).find((item) => {
      const starts = item.starts_at ? new Date(item.starts_at).getTime() : 0;
      const ends = item.ends_at ? new Date(item.ends_at).getTime() : Number.POSITIVE_INFINITY;
      return starts <= now && ends >= now;
    }) || null;
    return NextResponse.json({ release }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch {
    return NextResponse.json({ release: null }, { status: 200 });
  }
}
