"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import Avatar from "./Avatar";

export default function AccountNav() {
  const sb = getSupabase();
  const [uid, setUid] = useState<string | null>(null);
  const [p, setP] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  useEffect(() => {
    if (!sb) return;
    const loadP = (id: string | null) => {
      setUid(id);
      if (!id) { setP(null); return; }
      sb.from("profiles").select("username, avatar_url").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (error) sb.from("profiles").select("username").eq("id", id).maybeSingle().then(({ data: d }) => setP({ username: d?.username ?? null, avatar_url: null }));
        else setP({ username: data?.username ?? null, avatar_url: data?.avatar_url ?? null });
      });
    };
    sb.auth.getSession().then(({ data }) => loadP(data.session?.user.id ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => loadP(s?.user.id ?? null));
    const onUpd = () => sb.auth.getSession().then(({ data }) => loadP(data.session?.user.id ?? null));
    window.addEventListener("profile-updated", onUpd);
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("profile-updated", onUpd); };
  }, [sb]);
  if (!uid) return <Link href="/account/">Account</Link>;
  return <Link href="/account/" aria-label="Your account" title="Your account"><Avatar url={p?.avatar_url} name={p?.username} size={28} /></Link>;
}
