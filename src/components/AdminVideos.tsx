"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { V_COLS, loadProfiles, review, slugHref, slugLabel, type VRow, type Who } from "@/lib/videos";
import YouTube from "./YouTube";
import Avatar from "./Avatar";

const btn = "px-2 py-1 rounded border border-[#c9b27c] text-xs hover:bg-[#c9b27c] hover:text-[#11161f] disabled:opacity-40";

export default function AdminVideos() {
  const sb = getSupabase();
  const [state, setState] = useState<"loading" | "no" | "yes">("loading");
  const [pending, setPending] = useState<VRow[]>([]);
  const [recent, setRecent] = useState<VRow[]>([]);
  const [who, setWho] = useState<Record<string, Who>>({});
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sb) return;
    const p = await sb.from("chapter_videos").select(V_COLS).eq("status", "pending").order("created_at");
    if (p.error) { setMissing(true); return; }
    const r = await sb.from("chapter_videos").select(V_COLS).in("status", ["approved", "rejected"]).not("submitted_by", "is", null).order("reviewed_at", { ascending: false, nullsFirst: false }).limit(30);
    setMissing(false);
    setPending((p.data as VRow[]) ?? []); setRecent((r.data as VRow[]) ?? []);
    setWho(await loadProfiles(sb, [...(p.data ?? []), ...(r.data ?? [])].map((x) => (x as VRow).submitted_by)));
  }, [sb]);

  useEffect(() => {
    if (!sb) { setState("no"); return; }
    sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      if (!uid) return setState("no");
      const { data: p } = await sb.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
      if (p?.is_admin) { setState("yes"); load(); } else setState("no");
    });
  }, [sb, load]);

  if (state === "loading") return <div className="card text-[#8a93a3]">Loading…</div>;
  if (state === "no") return <div className="card">This page is for admins. <Link href="/account/" className="underline">Sign in</Link> with an admin account.</div>;
  if (missing) return <div className="card text-[#c9b27c]">Run 0006 in Supabase first.</div>;

  async function decide(r: VRow, s: "approved" | "rejected") {
    setBusy(true);
    const { error } = await review(sb!, r.id, s);
    setBusy(false); setMsg(error ? error.message : s === "approved" ? "Approved." : "Rejected."); load();
  }
  const by = (r: VRow) => { const w = r.submitted_by ? who[r.submitted_by] : null; return <span className="inline-flex items-center gap-1"><Avatar url={w?.avatar_url} name={w?.username} size={18} /> {w?.username ?? "a member"}</span>; };

  return (
    <div className="space-y-4">
      <section className="card space-y-3">
        <div className="label">Pending video suggestions ({pending.length})</div>
        {pending.length === 0 && <p className="text-sm text-[#8a93a3]">Nothing waiting for review.</p>}
        {pending.map((r) => (
          <div key={r.id} className="rounded border border-[#2c374a] p-3 space-y-2">
            <div className="text-sm flex flex-wrap gap-2 items-center"><Link href={slugHref(r.slug)} className="underline font-semibold">{slugLabel(r.slug)}</Link> · {by(r)} · <span className="text-xs text-[#8a93a3]">{new Date(r.created_at).toLocaleString()}</span></div>
            <YouTube video={{ url: r.youtube_id, short: r.is_short }} title={`Pending suggestion for ${slugLabel(r.slug)}`} />
            {r.note && <p className="text-sm whitespace-pre-wrap">“{r.note}”</p>}
            <div className="flex gap-2">
              <button className={btn} disabled={busy} onClick={() => decide(r, "approved")}>Approve</button>
              <button className={btn} disabled={busy} onClick={() => decide(r, "rejected")}>Reject</button>
            </div>
          </div>
        ))}
        {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
      </section>
      <section className="card space-y-2">
        <div className="label">Recently reviewed</div>
        {recent.length === 0 && <p className="text-sm text-[#8a93a3]">None yet.</p>}
        <ul className="space-y-1 text-sm">
          {recent.map((r) => (
            <li key={r.id} className="flex flex-wrap gap-2 items-center">
              <span className={r.status === "approved" ? "text-green-400" : "text-red-400"}>{r.status === "approved" ? "Approved" : "Rejected"}</span>
              <Link href={slugHref(r.slug)} className="underline">{slugLabel(r.slug)}</Link>
              <a href={`https://youtu.be/${r.youtube_id}`} target="_blank" rel="noopener noreferrer" className="underline font-mono text-xs">{r.youtube_id}</a>
              · {by(r)}
              {r.reviewed_at && <span className="text-xs text-[#8a93a3]">{new Date(r.reviewed_at).toLocaleString()}</span>}
              <button className={btn} disabled={busy} onClick={() => decide(r, r.status === "approved" ? "rejected" : "approved")}>{r.status === "approved" ? "Reject" : "Approve"}</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
