import Link from "next/link";
import { notFound } from "next/navigation";
import { topics, slides } from "@/lib/data";
export function generateStaticParams() { return topics.map((t) => ({ id: t.id })); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; return { title: topics.find((t) => t.id === id)?.title ?? "Topic" };
}
export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const i = topics.findIndex((t) => t.id === id); const t = topics[i];
  if (!t) notFound();
  const prev = topics[i - 1], next = topics[i + 1];
  return (
    <article className="space-y-4">
      <Link href="/topics/" className="text-sm text-[#c9b27c]">← All transcript topics</Link>
      <div><div className="label">Transcript topic {i + 1} • video time {t.time}</div>
        <h1 className="text-2xl md:text-3xl font-serif text-[#e8d9b5]">{t.title}</h1></div>
      <div className="grid md:grid-cols-2 gap-5">
        <section className="card"><div className="label">Who claims it</div><p>{t.claimant}</p>
          <div className="label mt-3">The claim</div>{t.claim.map((c) => <p key={c} className="mb-2">{c}</p>)}</section>
        <section className="card"><div className="label">Evidence and counterpoints</div>
          <ul className="list-disc pl-5 space-y-2">{t.counterpoints.map((c) => <li key={c}>{c}</li>)}</ul>
          <p className="text-xs text-[#8a93a3] mt-3">Points citing a slide or the guide come from the debate prep materials. Others are general reasoning; check them yourself.</p></section>
      </div>
      {t.names.length > 0 && <section className="card"><div className="label">Names mentioned</div><p>{t.names.join(" • ")}</p></section>}
      {t.unclear.length > 0 && <section className="card border-[#7a5c2e]"><div className="label">Unclear or not verified</div><ul className="list-disc pl-5 space-y-1">{t.unclear.map((u) => <li key={u}>{u}</li>)}</ul></section>}
      <section className="card"><div className="label">Related slides</div><ul className="space-y-1">{t.relatedSlides.map((n) => <li key={n}><Link className="underline text-[#c9b27c]" href={`/slides/${n}/`}>Slide {n}: {slides[n - 1].title}</Link></li>)}</ul></section>
      <div className="flex text-sm">{prev && <Link className="px-3 py-2 rounded border border-[#2c374a]" href={`/topics/${prev.id}/`}>← {prev.title}</Link>}{next && <Link className="px-3 py-2 rounded border border-[#2c374a] ml-auto" href={`/topics/${next.id}/`}>{next.title} →</Link>}</div>
    </article>
  );
}
