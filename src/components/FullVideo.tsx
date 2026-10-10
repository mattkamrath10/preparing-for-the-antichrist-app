"use client";
import { useState } from "react";
// The full 13:51 video (same cut as the transcript). Buttons reload the privacy-friendly embed at the chosen start time.
export const FULL_VIDEO_ID = "Iu6ZqLviVyg";
function secs(t: string) { return t.split(":").map(Number).reduce((a, b) => a * 60 + b, 0); }
export default function FullVideo({ ranges = [], title, startLabel = false }: { ranges?: string[]; title: string; startLabel?: boolean }) {
  const [start, setStart] = useState<number | null>(null);
  const src = `https://www.youtube-nocookie.com/embed/${FULL_VIDEO_ID}?rel=0${start !== null ? `&start=${start}&autoplay=1` : ""}`;
  const btn = "px-3 py-1.5 rounded border border-[#c9b27c] text-sm hover:bg-[#c9b27c] hover:text-[#11161f] font-mono";
  return (
    <section className="card space-y-3">
      <div className="label">Full video</div>
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        <iframe key={src} src={src} title={title} loading="lazy" className="absolute inset-0 h-full w-full" referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>
      <div className="flex flex-wrap gap-2">
        {startLabel && <button type="button" className={btn} onClick={() => setStart(0)}>Play from start</button>}
        {ranges.map((r) => { const from = r.split(/[–-]/)[0].trim(); return <button key={r} type="button" className={btn} onClick={() => setStart(secs(from))}>Play {r}</button>; })}
      </div>
    </section>
  );
}
