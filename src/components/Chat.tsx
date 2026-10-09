"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { containsHateTerm } from "@/lib/filter";
import { RULES } from "@/lib/rules";

type Comment = { id: string; slide: number; user_id: string; display_name: string; body: string; hidden: boolean; created_at: string };
const TERMS_VERSION = 1;

export default function Chat({ slide }: { slide: number }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [accepted, setAccepted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.from("comments").select("*").eq("slide", slide).order("created_at");
    setComments((data as Comment[]) ?? []);
  }, [sb, slide]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    load();
    const ch = sb.channel(`slide-${slide}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `slide=eq.${slide}` }, () => load())
      .subscribe();
    return () => { sub.subscription.unsubscribe(); sb.removeChannel(ch); };
  }, [sb, slide, load]);

  useEffect(() => {
    if (!sb || !session) return;
    const uid = session.user.id;
    sb.from("profiles").select("display_name, terms_version, is_admin").eq("id", uid).maybeSingle().then(({ data }) => {
      setAccepted((data?.terms_version ?? 0) >= TERMS_VERSION);
      setIsAdmin(Boolean(data?.is_admin));
      if (data?.display_name) setName(data.display_name);
    });
    sb.from("blocks").select("blocked_id").eq("blocker_id", uid).then(({ data }) => setBlocked(new Set((data ?? []).map((b) => b.blocked_id))));
  }, [sb, session]);

  if (!supabaseConfigured || !sb) {
    return (
      <div className="card">
        <div className="label">Chat is not set up yet</div>
        <p>The debate chat needs a free Supabase project. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to the environment (Vercel → Project → Settings → Environment Variables, or <code>.env.local</code>), run the SQL in <code>supabase/migrations</code>, and redeploy. See the README, section “Supabase”.</p>
        <p className="mt-2 text-sm text-[#8a93a3]">Everything else in the app works without it.</p>
      </div>
    );
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await sb!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
    setMsg(error ? error.message : "Check your email for a sign-in link.");
  }
  async function accept() {
    if (!name.trim()) { setMsg("Choose a display name first."); return; }
    const { error } = await sb!.from("profiles").upsert({ id: session!.user.id, display_name: name.trim().slice(0, 40), terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() });
    if (error) setMsg(error.message); else { setAccepted(true); setMsg(""); }
  }
  async function post(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    if (containsHateTerm(body)) { setMsg("That post contains a blocked term and was not sent. Please review the community rules."); return; }
    const { error } = await sb!.from("comments").insert({ slide, body: body.slice(0, 2000), user_id: session!.user.id, display_name: name });
    if (error) setMsg(error.message); else { setText(""); setMsg(""); load(); }
  }
  async function report(c: Comment) {
    const reason = prompt("Why are you reporting this post?") ?? "";
    const { error } = await sb!.from("reports").insert({ comment_id: c.id, reporter_id: session!.user.id, reason: reason.slice(0, 500) });
    setMsg(error ? error.message : "Thanks. A moderator will review it.");
  }
  async function block(c: Comment) {
    if (!confirm(`Block ${c.display_name}? You will no longer see their posts.`)) return;
    const { error } = await sb!.from("blocks").insert({ blocker_id: session!.user.id, blocked_id: c.user_id });
    if (!error) setBlocked(new Set([...blocked, c.user_id])); else setMsg(error.message);
  }
  async function hide(c: Comment) {
    const { error } = await sb!.from("comments").update({ hidden: !c.hidden }).eq("id", c.id);
    if (error) setMsg(error.message); else load();
  }

  const visible = comments.filter((c) => !blocked.has(c.user_id));
  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {visible.length === 0 && <li className="text-[#8a93a3]">No comments yet.</li>}
        {visible.map((c) => (
          <li key={c.id} className={`card ${c.hidden ? "opacity-50" : ""}`}>
            <div className="text-xs text-[#8a93a3]">{c.display_name} • {new Date(c.created_at).toLocaleString()}{c.hidden && " • hidden by moderator"}</div>
            <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            {session && (
              <div className="mt-2 flex gap-3 text-xs">
                {c.user_id !== session.user.id && <><button onClick={() => report(c)} className="underline">Report</button><button onClick={() => block(c)} className="underline">Block user</button></>}
                {isAdmin && <button onClick={() => hide(c)} className="underline text-[#c9b27c]">{c.hidden ? "Unhide" : "Hide"}</button>}
              </div>
            )}
          </li>
        ))}
      </ul>
      {!session ? (
        <form onSubmit={signIn} className="card space-y-2">
          <div className="label">Sign in to join the discussion</div>
          <p className="text-sm">We email you a one-time sign-in link. No password needed.</p>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">Email me a link</button>
        </form>
      ) : !accepted ? (
        <div className="card space-y-2">
          <div className="label">Community rules (required)</div>
          <ol className="list-decimal pl-6 text-sm space-y-1">{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
          <p className="text-sm">Read the full <Link href="/rules/" className="underline">rules and terms</Link>.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <button onClick={accept} className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">I agree to the rules and terms</button>
        </div>
      ) : (
        <form onSubmit={post} className="card space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} placeholder="Make your point, and cite your source." className="w-full rounded bg-[#11161f] border border-[#2c374a] p-2" />
          <div className="flex gap-3 items-center">
            <button className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold">Post</button>
            <button type="button" onClick={() => sb!.auth.signOut()} className="text-xs underline ml-auto">Sign out</button>
          </div>
        </form>
      )}
      {msg && <p className="text-sm text-[#c9b27c]">{msg}</p>}
    </div>
  );
}
