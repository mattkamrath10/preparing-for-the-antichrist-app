"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { containsHateTerm } from "@/lib/filter";
import { RULES } from "@/lib/rules";

type Post = { id: string; room: string; body: string; anonymous: boolean; hidden: boolean; created_at: string; author: string; is_mine: boolean; author_blocked: boolean };
const TERMS_VERSION = 1;
const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Chat({ room }: { room: string }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState("");
  const chan = useRef<RealtimeChannel | null>(null);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("comments_feed").select("*").eq("room", room).order("created_at");
    if (!error) setPosts((data as Post[]) ?? []);
  }, [sb, room]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    load();
    const ch = sb.channel(`room:${room}`).on("broadcast", { event: "changed" }, () => load()).subscribe();
    chan.current = ch;
    const poll = setInterval(load, 15000);
    return () => { sub.subscription.unsubscribe(); sb.removeChannel(ch); clearInterval(poll); };
  }, [sb, room, load]);

  useEffect(() => {
    if (!sb || !session) return;
    load();
    sb.from("profiles").select("username, terms_version, is_admin").eq("id", session.user.id).maybeSingle().then(({ data }) => {
      setAccepted((data?.terms_version ?? 0) >= TERMS_VERSION);
      setIsAdmin(Boolean(data?.is_admin));
      setUsername(data?.username ?? null);
      setEditName(data?.username ?? "");
    });
  }, [sb, session, load]);

  if (!supabaseConfigured || !sb) {
    return (
      <div className="card">
        <div className="label">Chat is not set up yet</div>
        <p>The chat needs a free Supabase project. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to the environment (Vercel → Project → Settings → Environment Variables, or <code>.env.local</code>), run the SQL files in <code>supabase/migrations</code> in order, and redeploy. See the README, section “Supabase”.</p>
        <p className="mt-2 text-sm text-[#8a93a3]">Everything else in the app works without it.</p>
      </div>
    );
  }
  const ping = () => chan.current?.send({ type: "broadcast", event: "changed", payload: {} });
  const uid = session?.user.id;

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    setMsg(error ? error.message : "Check your email for a sign-in link.");
  }
  function validName(n: string) {
    if (!USERNAME_RE.test(n)) { setMsg("Usernames are 3-20 letters, numbers or underscores."); return false; }
    if (containsHateTerm(n) || ["anonymous", "admin", "moderator"].includes(n.toLowerCase())) { setMsg("That username is not allowed."); return false; }
    return true;
  }
  async function accept() {
    const n = editName.trim();
    if (n && !validName(n)) return;
    const { error } = await sb!.from("profiles").upsert({ id: uid, username: n || null, terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() });
    if (error) setMsg(error.message.includes("unique") ? "That username is taken." : error.message);
    else { setAccepted(true); setUsername(n || null); if (!n) setAnon(true); setMsg(""); }
  }
  async function saveName() {
    const n = editName.trim();
    if (!validName(n)) return;
    const { error } = await sb!.from("profiles").update({ username: n }).eq("id", uid);
    if (error) setMsg(error.message.includes("unique") ? "That username is taken." : error.message);
    else { setUsername(n); setEditing(false); setMsg("Username saved."); load(); ping(); }
  }
  async function post(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (!anon && !username) { setMsg("Set a username first, or tick “Post as Anonymous”."); return; }
    if (containsHateTerm(body)) { setMsg("That post contains a blocked term and was not sent. Please review the community rules."); return; }
    const { error } = await sb!.from("comments").insert({ room, slide: null, body: body.slice(0, 2000), user_id: uid, anonymous: anon });
    if (error) setMsg(error.message); else { setText(""); setMsg(""); load(); ping(); }
  }
  async function report(p: Post) {
    const reason = prompt("Why are you reporting this post?") ?? "";
    const { error } = await sb!.from("reports").insert({ comment_id: p.id, reporter_id: uid, reason: reason.slice(0, 500) });
    setMsg(error ? error.message : "Thanks. A moderator will review it.");
  }
  async function block(p: Post) {
    if (!confirm(`Block ${p.author === "Anonymous" ? "the author of this post" : p.author}? You will no longer see their posts, including anonymous ones.`)) return;
    const { error } = await sb!.rpc("block_author", { p_comment: p.id });
    if (error) setMsg(error.message); else load();
  }
  async function hide(p: Post) {
    const { error } = await sb!.from("comments").update({ hidden: !p.hidden }).eq("id", p.id);
    if (error) setMsg(error.message); else { load(); ping(); }
  }

  const visible = posts.filter((p) => !p.author_blocked);
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {visible.length === 0 && <li className="text-[#8a93a3]">No messages yet.</li>}
        {visible.map((p) => (
          <li key={p.id} className={`card ${p.hidden ? "opacity-50" : ""}`}>
            <div className="text-xs text-[#8a93a3]">{p.author}{p.is_mine && p.anonymous && " (you)"} • {new Date(p.created_at).toLocaleString()}{p.hidden && " • hidden by moderator"}</div>
            <p className="mt-1 whitespace-pre-wrap">{p.body}</p>
            {session && (
              <div className="mt-2 flex gap-3 text-xs">
                {!p.is_mine && <><button onClick={() => report(p)} className="underline">Report</button><button onClick={() => block(p)} className="underline">Block author</button></>}
                {isAdmin && <button onClick={() => hide(p)} className="underline text-[#c9b27c]">{p.hidden ? "Unhide" : "Hide"}</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {!session ? (
        <form onSubmit={signIn} className="card space-y-2">
          <div className="label">Sign in to join the chat</div>
          <p className="text-sm">We email you a one-time sign-in link. No password needed.</p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">Email me a link</button>
        </form>
      ) : !accepted ? (
        <div className="card space-y-2">
          <div className="label">Community rules (required)</div>
          <ol className="list-decimal pl-6 text-sm space-y-1">{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
          <p className="text-sm">Read the full <Link href="/rules/" className="underline">rules and terms</Link>.</p>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Username (optional: leave blank to post only as Anonymous)" className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <button onClick={accept} className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">I agree to the rules and terms</button>
        </div>
      ) : (
        <form onSubmit={post} className="card space-y-2">
          <div className="text-xs text-[#8a93a3] flex flex-wrap gap-2 items-center">
            {editing ? (
              <><input value={editName} onChange={(e) => setEditName(e.target.value)} className="rounded bg-[#11161f] border border-[#2c374a] p-1" placeholder="New username" />
                <button type="button" onClick={saveName} className="underline">Save</button><button type="button" onClick={() => setEditing(false)} className="underline">Cancel</button></>
            ) : (
              <>Posting as <b className="text-[#e9e4d8]">{anon ? "Anonymous" : username ?? "(no username)"}</b><button type="button" onClick={() => setEditing(true)} className="underline">{username ? "Change username" : "Set username"}</button></>
            )}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} placeholder="Share your view, and cite your source." className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <div className="flex gap-3 items-center flex-wrap">
            <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">Post</button>
            <label className="text-sm flex items-center gap-1"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Post as Anonymous</label>
            <button type="button" onClick={() => sb!.auth.signOut()} className="text-xs underline ml-auto">Sign out</button>
          </div>
          <p className="text-xs text-[#8a93a3]">Anonymous posts hide your username from other members. Moderators can still act on them.</p>
        </form>
      )}
      {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
    </div>
  );
}
