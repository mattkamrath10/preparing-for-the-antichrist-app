// Privacy-friendly YouTube embed. Accepts shorts/, watch?v=, youtu.be/, embed/ links or a bare 11-char ID.
export type Video = { url: string; start?: number | string; short?: boolean } | null | undefined;

function toSeconds(v?: number | string): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const p = v.split(":").map(Number);
  return p.length > 1 ? p.reduce((a, b) => a * 60 + b, 0) : Number(v) || 0;
}
export function parseYouTube(url: string): { id: string; short: boolean; start: number } | null {
  const s = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return { id: s, short: false, start: 0 };
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const t = toSeconds(u.searchParams.get("t")?.replace("s", "") ?? u.searchParams.get("start") ?? undefined);
    let m = u.pathname.match(/\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    if (m) return { id: m[2], short: m[1] === "shorts", start: t };
    if (u.hostname.includes("youtu.be")) { m = u.pathname.match(/^\/([A-Za-z0-9_-]{11})/); if (m) return { id: m[1], short: false, start: t }; }
    const v = u.searchParams.get("v");
    if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return { id: v, short: false, start: t };
  } catch {}
  return null;
}
export default function YouTube({ video, title }: { video: Video; title: string }) {
  if (!video?.url) return null;
  const p = parseYouTube(video.url);
  if (!p) return null;
  const short = video.short ?? p.short;
  const start = video.start != null ? toSeconds(video.start) : p.start;
  const src = `https://www.youtube-nocookie.com/embed/${p.id}?rel=0${start ? `&start=${start}` : ""}`;
  return (
    <div className={short ? "mx-auto w-full max-w-[360px]" : "w-full"}>
      <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ aspectRatio: short ? "9 / 16" : "16 / 9" }}>
        <iframe src={src} title={title} loading="lazy" className="absolute inset-0 h-full w-full" referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </div>
    </div>
  );
}
