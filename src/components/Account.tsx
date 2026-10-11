"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { containsHateTerm } from "@/lib/filter";
import Avatar from "./Avatar";
import MySuggestions from "./MySuggestions";

const TERMS_VERSION = 1;
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const PENDING = "pending-username";
const inp = "w-full rounded bg-[#11161f] border border-[#2c374a] p-2";
const btn = "px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold disabled:opacity-50";
const tabBtn = (on: boolean) => `px-3 py-1.5 rounded ${on ? "bg-[#c9b27c] text-[#11161f] font-semibold" : "border border-[#2c374a]"}`;

function nameError(n: string) {
  if (!USERNAME_RE.test(n)) return "Usernames are 3-20 letters, numbers or underscores.";
  if (containsHateTerm(n) || ["anonymous", "admin", "moderator"].includes(n.toLowerCase())) return "That username is not allowed.";
  return "";
}
const here = () => `${window.location.origin}/account/`;

export default function Account() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"create" | "signin" | "forgot" | "link">("create");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null; terms_version: number | null } | null>(null);
  const [editName, setEditName] = useState("");
  const [noAvatarCol, setNoAvatarCol] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!sb) return;
    if (new URLSearchParams(window.location.search).get("reset") === "1") setRecovery(true);
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((e, s) => { if (e === "PASSWORD_RECOVERY") setRecovery(true); setSession(s); setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  async function loadProfile() {
    if (!sb || !session) return;
    const uid = session.user.id;
    let { data, error } = await sb.from("profiles").select("username, avatar_url, terms_version").eq("id", uid).maybeSingle();
    if (error) { setNoAvatarCol(true); ({ data } = await sb.from("profiles").select("username, terms_version").eq("id", uid).maybeSingle() as never); }
    const pending = localStorage.getItem(PENDING);
    if (pending && !data?.username) {
      const { error: e2 } = await sb.from("profiles").upsert({ id: uid, username: pending });
      if (!e2) data = { ...(data ?? { avatar_url: null, terms_version: null }), username: pending } as never;
    }
    localStorage.removeItem(PENDING);
    const p = { username: data?.username ?? null, avatar_url: (data as { avatar_url?: string | null })?.avatar_url ?? null, terms_version: data?.terms_version ?? null };
    setProfile(p); setEditName(p.username ?? "");
  }
  useEffect(() => { loadProfile(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!supabaseConfigured || !sb) return <div className="card">Accounts are not set up yet (Supabase environment variables are missing).</div>;
  if (!ready) return <div className="card text-[#8a93a3]">Loading…</div>;
  const done = (m: string) => { setMsg(m); setBusy(false); };

  // ---------- password reset (arrived from the email link) ----------
  if (recovery && session) {
    return (
      <form className="card space-y-2" onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setMsg("Passwords need at least 8 characters.");
        if (pw !== pw2) return setMsg("The passwords don't match.");
        setBusy(true);
        const { error } = await sb.auth.updateUser({ password: pw });
        if (error) return done(error.message);
        setRecovery(false); setPw(""); setPw2(""); window.history.replaceState(null, "", "/account/"); done("Password updated.");
      }}>
        <div className="label">Choose a new password</div>
        <input type="password" className={inp} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required />
        <input type="password" className={inp} placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required />
        <button className={btn} disabled={busy}>Save new password</button>
        {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
      </form>
    );
  }

  // ---------- signed out ----------
  if (!session) {
    return (
      <div className="card space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button className={tabBtn(tab === "create")} onClick={() => { setTab("create"); setMsg(""); }}>Create account</button>
          <button className={tabBtn(tab === "signin")} onClick={() => { setTab("signin"); setMsg(""); }}>Sign in</button>
        </div>
        {tab === "create" && (
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault();
            const n = name.trim(); const ne = nameError(n);
            if (ne) return setMsg(ne);
            if (pw.length < 8) return setMsg("Passwords need at least 8 characters.");
            if (pw !== pw2) return setMsg("The passwords don't match.");
            setBusy(true);
            const { data: taken } = await sb.from("profiles").select("id").ilike("username", n).maybeSingle();
            if (taken) return done("That username is taken.");
            localStorage.setItem(PENDING, n);
            const { data, error } = await sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: here() } });
            if (error) { localStorage.removeItem(PENDING); return done(error.message); }
            done(data.session ? "Account created." : "Check your email to confirm your account, then sign in.");
          }}>
            <input type="email" className={inp} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <input type="password" className={inp} placeholder="Password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required autoComplete="new-password" />
            <input type="password" className={inp} placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} minLength={8} required autoComplete="new-password" />
            <input className={inp} placeholder="Username (3-20 letters, numbers or _)" value={name} onChange={(e) => setName(e.target.value)} required />
            <button className={btn} disabled={busy}>Create account</button>
          </form>
        )}
        {tab === "signin" && (
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const { error } = await sb.auth.signInWithPassword({ email, password: pw });
            done(error ? (error.message.includes("confirm") ? "Please confirm your email first (check your inbox)." : error.message) : "");
          }}>
            <input type="email" className={inp} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            <input type="password" className={inp} placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />
            <button className={btn} disabled={busy}>Sign in</button>
          </form>
        )}
        {tab === "forgot" && (
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${here()}?reset=1` });
            done(error ? error.message : "If that email has an account, a reset link is on its way.");
          }}>
            <div className="label">Forgot password</div>
            <input type="email" className={inp} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className={btn} disabled={busy}>Send reset link</button>
          </form>
        )}
        {tab === "link" && (
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true);
            const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: here() } });
            done(error ? error.message : "Check your email for a sign-in link.");
          }}>
            <div className="label">Email me a sign-in link</div>
            <p className="text-sm">No password needed: we email you a one-time link.</p>
            <input type="email" className={inp} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className={btn} disabled={busy}>Email me a link</button>
          </form>
        )}
        <div className="flex gap-4 text-sm flex-wrap">
          <button className="underline" onClick={() => { setTab("forgot"); setMsg(""); }}>Forgot password</button>
          <button className="underline" onClick={() => { setTab("link"); setMsg(""); }}>Email me a sign-in link</button>
        </div>
        {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
      </div>
    );
  }

  // ---------- signed in ----------
  const uid = session.user.id;
  const changed = () => window.dispatchEvent(new Event("profile-updated"));
  async function upload(f: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setMsg("Use a JPG, PNG or WebP picture.");
    if (f.size > 2 * 1024 * 1024) return setMsg("Pictures must be 2 MB or smaller.");
    setBusy(true);
    const ext = f.type === "image/png" ? "png" : f.type === "image/webp" ? "webp" : "jpg";
    const path = `${uid}/${Date.now()}.${ext}`;
    const { error } = await sb!.storage.from("avatars").upload(path, f, { contentType: f.type, cacheControl: "3600" });
    if (error) return done(/bucket|not found/i.test(error.message) ? "Run 0004 in Supabase first." : error.message);
    const url = sb!.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    const old = profile?.avatar_url;
    const { error: e2 } = await sb!.from("profiles").upsert({ id: uid, avatar_url: url });
    if (e2) return done(/avatar_url/.test(e2.message) ? "Run 0004 in Supabase first." : e2.message);
    if (old) { const m = old.split("/avatars/")[1]; if (m) await sb!.storage.from("avatars").remove([decodeURIComponent(m)]); }
    setProfile((p) => p && { ...p, avatar_url: url }); changed(); done("Picture updated.");
  }
  async function removePic() {
    setBusy(true);
    const old = profile?.avatar_url;
    const { error } = await sb!.from("profiles").update({ avatar_url: null }).eq("id", uid);
    if (error) return done(error.message);
    if (old) { const m = old.split("/avatars/")[1]; if (m) await sb!.storage.from("avatars").remove([decodeURIComponent(m)]); }
    setProfile((p) => p && { ...p, avatar_url: null }); changed(); done("Picture removed.");
  }
  async function saveName() {
    const n = editName.trim(); const ne = nameError(n);
    if (ne) return setMsg(ne);
    setBusy(true);
    const { error } = await sb!.from("profiles").upsert({ id: uid, username: n });
    if (error) return done(error.message.includes("unique") || error.message.includes("duplicate") ? "That username is taken." : error.message);
    setProfile((p) => p && { ...p, username: n }); changed(); done("Username saved.");
  }
  async function accept() {
    setBusy(true);
    const { error } = await sb!.from("profiles").upsert({ id: uid, terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() });
    if (error) return done(error.message);
    setProfile((p) => p && { ...p, terms_version: TERMS_VERSION }); done("Thanks, you can now post in the chats.");
  }
  const acceptedRules = (profile?.terms_version ?? 0) >= TERMS_VERSION;

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="label">Profile picture</div>
        <div className="flex items-center gap-4 flex-wrap">
          <Avatar url={profile?.avatar_url} name={profile?.username} size={72} />
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }} />
          <button className={btn} disabled={busy || noAvatarCol} onClick={() => file.current?.click()}>Upload picture</button>
          {profile?.avatar_url && <button className="underline text-sm" disabled={busy} onClick={removePic}>Remove picture</button>}
        </div>
        <p className="text-xs text-[#8a93a3]">{noAvatarCol ? "Run 0004 in Supabase first." : "JPG, PNG or WebP, up to 2 MB. Not shown on posts you make as Anonymous."}</p>
      </div>
      <div className="card space-y-2">
        <div className="label">Username</div>
        <div className="flex gap-2">
          <input className={inp} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="3-20 letters, numbers or _" />
          <button className={btn} disabled={busy} onClick={saveName}>Save</button>
        </div>
        <p className="text-xs text-[#8a93a3]">Signed in as {session.user.email}</p>
      </div>
      <div className="card space-y-2">
        <div className="label">Community rules</div>
        {acceptedRules ? <p className="text-sm">✓ You have accepted the <Link href="/rules/" className="underline">rules and terms</Link>.</p> : (
          <><p className="text-sm">You haven&apos;t accepted the <Link href="/rules/" className="underline">rules and terms</Link> yet. You need to before posting.</p>
            <button className={btn} disabled={busy} onClick={accept}>I agree to the rules and terms</button></>
        )}
      </div>
      <MySuggestions uid={uid} />
      <button className="underline text-sm" onClick={() => sb!.auth.signOut()}>Sign out</button>
      {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
    </div>
  );
}
