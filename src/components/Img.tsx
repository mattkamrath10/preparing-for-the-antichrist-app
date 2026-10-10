"use client";
import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";

// Display order: Supabase chapter_images entry -> static file in /public -> fallback SVG.
type Row = { slug: string; path: string; updated_at: string };
let rowsPromise: Promise<{ rows: Record<string, Row>; missing: boolean }> | null = null;
function loadRows(force = false) {
  const sb = getSupabase();
  if (!sb) return Promise.resolve({ rows: {} as Record<string, Row>, missing: false });
  if (!rowsPromise || force) {
    rowsPromise = (async () => {
      const { data, error } = await sb.from("chapter_images").select("slug, path, updated_at");
      if (error) return { rows: {} as Record<string, Row>, missing: true };
      return { rows: Object.fromEntries((data as Row[]).map((r) => [r.slug, r])) as Record<string, Row>, missing: false };
    })();
  }
  return rowsPromise;
}
function publicUrl(path: string) {
  return getSupabase()!.storage.from("chapter-images").getPublicUrl(path).data.publicUrl;
}
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default function Img({ src, fallback, alt, className, slug, admin = false }: { src: string; fallback: string; alt: string; className?: string; slug?: string; admin?: boolean }) {
  const [remote, setRemote] = useState<string | null>(null);
  const [s, setS] = useState(src);
  const [isAdmin, setIsAdmin] = useState(false);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hasRow, setHasRow] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!slug) return;
    loadRows().then(({ rows, missing }) => {
      setMissing(missing);
      const r = rows[slug];
      setHasRow(Boolean(r));
      if (r) setRemote(`${publicUrl(r.path)}?v=${encodeURIComponent(r.updated_at)}`);
    });
  }, [slug]);

  useEffect(() => {
    const sb = getSupabase();
    if (!admin || !slug || !sb) return;
    const check = async () => {
      const { data } = await sb.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) { setIsAdmin(false); return; }
      const { data: p } = await sb.from("profiles").select("is_admin").eq("id", uid).maybeSingle();
      setIsAdmin(Boolean(p?.is_admin));
    };
    check();
    const { data: sub } = sb.auth.onAuthStateChange(() => check());
    return () => sub.subscription.unsubscribe();
  }, [admin, slug]);

  async function upload(file: File) {
    const sb = getSupabase()!;
    const ext = TYPES[file.type];
    if (!ext) { setMsg("Use a JPG, PNG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg("Image must be 5 MB or smaller."); return; }
    setBusy(true); setMsg("Uploading…");
    const path = `${slug}-${Date.now()}.${ext}`;
    const up = await sb.storage.from("chapter-images").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(false); setMsg(`Upload failed: ${up.error.message}`); return; }
    const { error } = await sb.from("chapter_images").upsert({ slug, path, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) { setMsg(`Saved file but could not update the page: ${error.message}`); return; }
    setRemote(`${publicUrl(path)}?v=${Date.now()}`); setHasRow(true); setMsg("Image updated."); loadRows(true);
  }
  async function remove() {
    if (!confirm("Remove the uploaded image for this page?")) return;
    const sb = getSupabase()!;
    setBusy(true);
    const { data: row } = await sb.from("chapter_images").select("path").eq("slug", slug).maybeSingle();
    const { error } = await sb.from("chapter_images").delete().eq("slug", slug);
    if (!error && row?.path) await sb.storage.from("chapter-images").remove([row.path]);
    setBusy(false);
    if (error) { setMsg(`Could not remove: ${error.message}`); return; }
    setRemote(null); setHasRow(false); setS(src); setMsg("Uploaded image removed."); loadRows(true);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={remote ?? s} alt={alt} className={className} onError={() => { if (remote) setRemote(null); else if (s !== fallback) setS(fallback); }} />
      {admin && isAdmin && (
        <div className="card border-[#c9b27c] text-sm">
          <div className="label">Admin</div>
          {missing ? <p>Run 0003 in Supabase first (supabase/migrations/0003_chapter_images.sql).</p> : (
            <div className="flex flex-wrap gap-2 items-center">
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              <button type="button" disabled={busy} onClick={() => input.current?.click()} className="px-3 py-1.5 rounded bg-[#c9b27c] text-[#11161f] font-semibold disabled:opacity-50">Upload image</button>
              {hasRow && <button type="button" disabled={busy} onClick={remove} className="px-3 py-1.5 rounded border border-[#c9b27c] disabled:opacity-50">Remove image</button>}
              <span className="text-xs text-[#8a93a3]">JPG, PNG or WebP, up to 5 MB. Page: {slug}</span>
            </div>
          )}
          {msg && <p className="mt-2 text-[#c9b27c]">{msg}</p>}
        </div>
      )}
    </>
  );
}
