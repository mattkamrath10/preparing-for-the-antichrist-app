"use client";
import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import YouTube, { parseYouTube } from "./YouTube";

type Row = { id: string; youtube_id: string; is_short: boolean; position: number };
const btn = "px-2 py-1 rounded border border-[#c9b27c] text-xs hover:bg-[#c9b27c] hover:text-[#11161f] disabled:opacity-40";

// Admin-added videos (table chapter_videos, migration 0005), shown to everyone, with an admin panel.
export default function PageVideos({ slug, label }: { slug: string; label: string }) {
  const sb = getSupabase();
  const [rows, setRows] = useState<Row[]>([]);
  const [missing, setMissing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("chapter_videos").select("id, youtube_id, is_short, position").eq("slug", slug).order("position").order("created_at");
    if (error) { setMissing(true); setRows([]); } else { setMissing(false); setRows((data as Row[]) ?? []); }
  }, [sb, slug]);

  useEffect(() => {
    if (!sb) return;
    load();
    const check = async (uid?: string) => {
      if (!uid) return setIsAdmin(false);
      const { data } = await sb.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
      setIsAdmin(Boolean(data?.is_admin));
    };
    sb.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => check(s?.user.id));
    return () => sub.subscription.unsubscribe();
  }, [sb, load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const p = parseYouTube(link);
    if (!p) return setMsg("That doesn't look like a YouTube link (shorts, watch, youtu.be or embed).");
    setBusy(true);
    const pos = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    const { error } = await sb!.from("chapter_videos").insert({ slug, youtube_id: p.id, is_short: p.short, position: pos });
    setBusy(false);
    if (error) return setMsg(missing || /chapter_videos|schema cache/.test(error.message) ? "Run 0005 in Supabase first." : error.message);
    setLink(""); setMsg("Video added."); load();
  }
  async function remove(r: Row) {
    if (!confirm("Remove this video from the page?")) return;
    setBusy(true);
    const { error } = await sb!.from("chapter_videos").delete().eq("id", r.id);
    setBusy(false); setMsg(error ? error.message : "Video removed."); load();
  }
  async function move(i: number, d: -1 | 1) {
    const j = i + d; if (j < 0 || j >= rows.length) return;
    const next = [...rows]; [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    const res = await Promise.all(next.map((r, k) => sb!.from("chapter_videos").update({ position: k }).eq("id", r.id)));
    setBusy(false);
    const err = res.find((x) => x.error)?.error; if (err) setMsg(err.message);
    load();
  }

  if (!sb) return null;
  return (
    <>
      {rows.map((r, i) => (
        <div key={r.id} className="space-y-2">
          <YouTube video={{ url: r.youtube_id, short: r.is_short }} title={`${label}: video ${i + 1}`} />
          {isAdmin && (
            <div className="flex gap-2 justify-center">
              <button className={btn} disabled={busy || i === 0} onClick={() => move(i, -1)}>↑ Up</button>
              <button className={btn} disabled={busy || i === rows.length - 1} onClick={() => move(i, 1)}>↓ Down</button>
              <button className={btn} disabled={busy} onClick={() => remove(r)}>Remove</button>
            </div>
          )}
        </div>
      ))}
      {isAdmin && (
        <form onSubmit={add} className="card space-y-2 border border-[#c9b27c]">
          <div className="label">Admin · Add YouTube video</div>
          {missing ? <p className="text-sm text-[#c9b27c]">Run 0005 in Supabase first.</p> : (
            <div className="flex gap-2">
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/shorts/… or youtu.be/…" className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2 text-sm" />
              <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" disabled={busy}>Add</button>
            </div>
          )}
          {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
        </form>
      )}
    </>
  );
}
