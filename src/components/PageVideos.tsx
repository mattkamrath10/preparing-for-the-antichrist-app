"use client";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { containsHateTerm } from "@/lib/filter";
import { V_COLS, V_COLS_OLD, loadProfiles, review, type VRow, type Who } from "@/lib/videos";
import YouTube, { parseYouTube } from "./YouTube";
import Avatar from "./Avatar";

const btn = "px-2 py-1 rounded border border-[#c9b27c] text-xs hover:bg-[#c9b27c] hover:text-[#11161f] disabled:opacity-40";
const inp = "w-full rounded bg-[#11161f] border border-[#2c374a] p-2 text-sm";

// Videos from table chapter_videos (0005), member suggestions + review (0006).
export default function PageVideos({ slug, label }: { slug: string; label: string }) {
  const sb = getSupabase();
  const [rows, setRows] = useState<VRow[]>([]);
  const [who, setWho] = useState<Record<string, Who>>({});
  const [missing5, setMissing5] = useState(false);
  const [has6, setHas6] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [link, setLink] = useState("");
  const [sLink, setSLink] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [sMsg, setSMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sb) return;
    let { data, error } = await sb.from("chapter_videos").select(V_COLS).eq("slug", slug).order("position").order("created_at");
    if (error) {
      setHas6(false);
      ({ data, error } = (await sb.from("chapter_videos").select(V_COLS_OLD).eq("slug", slug).order("position").order("created_at")) as never);
      if (error) { setMissing5(true); setRows([]); return; }
    } else setHas6(true);
    setMissing5(false);
    const r = (data as VRow[]) ?? [];
    setRows(r);
    setWho(await loadProfiles(sb, r.map((x) => x.submitted_by)));
  }, [sb, slug]);

  useEffect(() => {
    if (!sb) return;
    load();
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) { setIsAdmin(false); setCanPost(false); return; }
      const { data } = await sb.from("profiles").select("is_admin, banned, terms_version").eq("id", s.user.id).maybeSingle();
      setIsAdmin(Boolean(data?.is_admin));
      setCanPost(Boolean(data && !data.banned && (data.terms_version ?? 0) >= 1));
      load();
    };
    sb.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => check(s));
    return () => sub.subscription.unsubscribe();
  }, [sb, load]);

  if (!sb) return null;
  const approved = rows.filter((r) => (r.status ?? "approved") === "approved");
  const pending = rows.filter((r) => r.status === "pending");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const p = parseYouTube(link);
    if (!p) return setMsg("That doesn't look like a YouTube link (shorts, watch, youtu.be or embed).");
    setBusy(true);
    const pos = approved.length ? Math.max(...approved.map((r) => r.position)) + 1 : 0;
    const { error } = await sb!.from("chapter_videos").insert({ slug, youtube_id: p.id, is_short: p.short, position: pos });
    setBusy(false);
    if (error) return setMsg(/chapter_videos|schema cache/.test(error.message) ? "Run 0005 in Supabase first." : error.message);
    setLink(""); setMsg("Video added."); load();
  }
  async function suggest(e: React.FormEvent) {
    e.preventDefault();
    const p = parseYouTube(sLink);
    if (!p) return setSMsg("That doesn't look like a YouTube link (shorts, watch, youtu.be or embed).");
    const n = note.trim().slice(0, 300);
    if (n && containsHateTerm(n)) return setSMsg("Your note contains a blocked term. Please review the community rules.");
    setBusy(true);
    const { error } = await sb!.from("chapter_videos").insert({ slug, youtube_id: p.id, is_short: p.short, note: n || null, status: "pending", submitted_by: session!.user.id });
    setBusy(false);
    if (error) return setSMsg(/3 videos/.test(error.message) ? "You can suggest up to 3 videos per 24 hours." : error.message);
    setSLink(""); setNote(""); setSMsg("Sent for review. Thank you!"); load();
  }
  async function remove(r: VRow) {
    if (!confirm("Remove this video from the page?")) return;
    setBusy(true);
    const { error } = await sb!.from("chapter_videos").delete().eq("id", r.id);
    setBusy(false); setMsg(error ? error.message : "Video removed."); load();
  }
  async function move(i: number, d: -1 | 1) {
    const j = i + d; if (j < 0 || j >= approved.length) return;
    const next = [...approved]; [next[i], next[j]] = [next[j], next[i]];
    setBusy(true);
    const res = await Promise.all(next.map((r, k) => sb!.from("chapter_videos").update({ position: k }).eq("id", r.id)));
    setBusy(false);
    const err = res.find((x) => x.error)?.error; if (err) setMsg(err.message);
    load();
  }
  async function decide(r: VRow, s: "approved" | "rejected") {
    setBusy(true);
    const { error } = await review(sb!, r.id, s);
    setBusy(false); setMsg(error ? error.message : s === "approved" ? "Approved." : "Rejected."); load();
  }

  return (
    <>
      {approved.map((r, i) => {
        const w = r.submitted_by ? who[r.submitted_by] : null;
        return (
          <div key={r.id} className="space-y-2">
            <YouTube video={{ url: r.youtube_id, short: r.is_short }} title={`${label}: video ${i + 1}`} />
            {r.submitted_by && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#8a93a3]">
                <Avatar url={w?.avatar_url} name={w?.username} size={20} /> Suggested by {w?.username ?? "a member"}
              </div>
            )}
            {isAdmin && (
              <div className="flex gap-2 justify-center">
                <button className={btn} disabled={busy || i === 0} onClick={() => move(i, -1)}>↑ Up</button>
                <button className={btn} disabled={busy || i === approved.length - 1} onClick={() => move(i, 1)}>↓ Down</button>
                <button className={btn} disabled={busy} onClick={() => remove(r)}>Remove</button>
              </div>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <div className="card space-y-3 border border-[#c9b27c]">
          <form onSubmit={add} className="space-y-2">
            <div className="label">Admin · Add YouTube video</div>
            {missing5 ? <p className="text-sm text-[#c9b27c]">Run 0005 in Supabase first.</p> : (
              <div className="flex gap-2">
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/shorts/… or youtu.be/…" className={inp} />
                <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" disabled={busy}>Add</button>
              </div>
            )}
          </form>
          <div className="space-y-2">
            <div className="label">Admin · Pending videos</div>
            {!has6 ? <p className="text-sm text-[#c9b27c]">Run 0006 in Supabase first.</p> : pending.length === 0 ? <p className="text-sm text-[#8a93a3]">No pending suggestions for this page.</p> : pending.map((r) => {
              const w = r.submitted_by ? who[r.submitted_by] : null;
              return (
                <div key={r.id} className="rounded border border-[#2c374a] p-2 space-y-2">
                  <YouTube video={{ url: r.youtube_id, short: r.is_short }} title={`Pending suggestion for ${label}`} />
                  <div className="flex items-center gap-2 text-xs"><Avatar url={w?.avatar_url} name={w?.username} size={20} /> {w?.username ?? "a member"} · {new Date(r.created_at).toLocaleString()}</div>
                  {r.note && <p className="text-sm whitespace-pre-wrap">“{r.note}”</p>}
                  <div className="flex gap-2">
                    <button className={btn} disabled={busy} onClick={() => decide(r, "approved")}>Approve</button>
                    <button className={btn} disabled={busy} onClick={() => decide(r, "rejected")}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
          {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
        </div>
      )}

      {session && canPost && has6 && !isAdmin && (
        <form onSubmit={suggest} className="card space-y-2">
          <div className="label">Suggest a video</div>
          <p className="text-xs text-[#8a93a3]">Know a YouTube video that fits this page? An admin reviews every suggestion before it appears. Up to 3 per day.</p>
          <input value={sLink} onChange={(e) => setSLink(e.target.value)} placeholder="YouTube link" className={inp} required />
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} placeholder="Optional note for the reviewer (300 characters max)" className={inp} />
          <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" disabled={busy}>Suggest</button>
          {sMsg && <p className="text-sm text-[#c9b27c]">{sMsg}</p>}
        </form>
      )}
    </>
  );
}
