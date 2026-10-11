export default function Avatar({ url, name, size = 28 }: { url?: string | null; name?: string | null; size?: number }) {
  const s = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  if (url) return <img src={url} alt="" style={s} className="rounded-full object-cover border border-[#2c374a] shrink-0" />;
  const init = (name ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  return (
    <span style={s} aria-hidden className="rounded-full bg-[#2c374a] text-[#e8d9b5] inline-flex items-center justify-center font-semibold shrink-0">
      {init || <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="currentColor"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" /></svg>}
    </span>
  );
}
