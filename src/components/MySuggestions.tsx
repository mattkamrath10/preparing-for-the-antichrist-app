"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { V_COLS, slugHref, slugLabel, type VRow } from "@/lib/videos";

export default function MySuggestions({ uid }: { uid: string }) {
  const sb = getSupabase();
  const [rows, setRows] = useState<VRow[] | null>(null);
  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("chapter_videos").select(V_COLS).eq("submitted_by", uid).order("created_at", { ascending: false });
    setRows(error ? null : ((data as VRow[]) ?? []));
  }, [sb, uid]);
  useEffect(() => { load(); }, [load]);
  if (!rows) return null;
  const label = { pending: "Pending review", approved: "Approved", rejected: "Not approved" } as Record<string, string>;
  return (
    <div className="card space-y-2">
      <div className="label">My suggested videos</div>
      {rows.length === 0 && <p className="text-sm text-[#8a93a3]">You haven&apos;t suggested any videos yet. Use “Suggest a video” on any chapter.</p>}
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-2 items-center">
            <Link href={slugHref(r.slug)} className="underline">{slugLabel(r.slug)}</Link>
            <a href={`https://youtu.be/${r.youtube_id}`} target="_blank" rel="noopener noreferrer" className="underline font-mono text-xs">{r.youtube_id}</a>
            <span className="text-[#c9b27c]">{label[r.status ?? "approved"]}</span>
            {r.status === "pending" && <button className="underline text-xs" onClick={async () => { if (confirm("Delete this suggestion?")) { await sb!.from("chapter_videos").delete().eq("id", r.id); load(); } }}>Delete</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
