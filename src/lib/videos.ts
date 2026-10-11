import type { SupabaseClient } from "@supabase/supabase-js";
export type VRow = { id: string; slug: string; youtube_id: string; is_short: boolean; position: number; created_at: string; status?: string; submitted_by?: string | null; note?: string | null; reviewed_at?: string | null };
export type Who = { username: string | null; avatar_url: string | null };
export const V_COLS = "id, slug, youtube_id, is_short, position, created_at, status, submitted_by, note, reviewed_at";
export const V_COLS_OLD = "id, slug, youtube_id, is_short, position, created_at";

export async function loadProfiles(sb: SupabaseClient, ids: (string | null | undefined)[]): Promise<Record<string, Who>> {
  const u = [...new Set(ids.filter(Boolean))] as string[];
  if (!u.length) return {};
  let { data, error } = await sb.from("profiles").select("id, username, avatar_url").in("id", u);
  if (error) ({ data } = (await sb.from("profiles").select("id, username").in("id", u)) as never);
  return Object.fromEntries(((data ?? []) as { id: string; username: string | null; avatar_url?: string | null }[]).map((p) => [p.id, { username: p.username, avatar_url: p.avatar_url ?? null }]));
}
export function slugHref(slug: string) {
  if (slug === "intro") return "/intro/";
  if (slug === "closing") return "/closing/";
  if (slug === "hero") return "/";
  const m = slug.match(/^chapter-(\d+)$/);
  return m ? `/chapters/${Number(m[1])}/` : "/";
}
export function slugLabel(slug: string) {
  const m = slug.match(/^chapter-(\d+)$/);
  return m ? `Chapter ${Number(m[1])}` : slug[0].toUpperCase() + slug.slice(1);
}
export async function review(sb: SupabaseClient, id: string, status: "approved" | "rejected") {
  return sb.from("chapter_videos").update({ status }).eq("id", id);
}
