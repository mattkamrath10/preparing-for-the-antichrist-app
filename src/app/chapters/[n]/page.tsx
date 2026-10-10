import Link from "next/link";
import { notFound } from "next/navigation";
import { chapters } from "@/lib/data";
import Img from "@/components/Img";
import Chat from "@/components/Chat";
import YouTube from "@/components/YouTube";
import FullVideo from "@/components/FullVideo";
export function generateStaticParams() { return chapters.map((c) => ({ n: String(c.number) })); }
export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const c = chapters[Number(n) - 1]; return { title: c ? `Chapter ${n}: ${c.title}` : "Chapter" };
}
const FLAG: Record<string, string> = { "general reasoning": "General reasoning", unverified: "Unverified", unclear: "Unclear" };
export default async function ChapterPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const num = Number(n); const c = chapters[num - 1];
  if (!c) notFound();
  const prev = num > 1 ? { href: `/chapters/${num - 1}/`, text: `Chapter ${num - 1}` } : { href: "/intro/", text: "Introduction" };
  const next = num < chapters.length ? { href: `/chapters/${num + 1}/`, text: `Chapter ${num + 1}` } : { href: "/closing/", text: "Closing" };
  return (
    <article className="space-y-4">
      <div><div className="label">Chapter {c.number} of {chapters.length}</div><h1 className="text-2xl md:text-3xl font-serif text-[#e8d9b5]">{c.title}</h1></div>
      {c.video ? <YouTube video={c.video} title={`Chapter ${c.number}: ${c.title} (video)`} /> : <FullVideo ranges={c.times} title={`Full video, chapter ${c.number}: ${c.title}`} />}
      <Img src={c.image} fallback={c.fallback} alt={c.alt} className="w-full aspect-video max-h-96 object-cover bg-[#1e2a3a] rounded-xl" />
      <section className="card"><div className="label">Where it&apos;s discussed</div><p>{c.times.map((t) => <span key={t} className="inline-block mr-2 mb-1 px-2 py-0.5 rounded bg-[#11161f] border border-[#2c374a] text-sm font-mono">{t}</span>)}</p></section>
      <section className="card"><div className="label">What the speaker claims</div><p className="leading-relaxed">{c.summary}</p></section>
      {c.names.length > 0 && <section className="card"><div className="label">Key names</div><p>{c.names.join(" • ")}</p></section>}
      <section className="card"><div className="label">Evidence and counterpoints</div>
        <ul className="list-disc pl-5 space-y-2">{c.evidence.map((e) => <li key={e.text}>{e.text}{e.flag && <span className="ml-2 text-xs px-1.5 py-0.5 rounded border border-[#7a5c2e] text-[#c9b27c] whitespace-nowrap">{FLAG[e.flag] ?? e.flag}</span>}</li>)}</ul>
        <p className="text-xs text-[#8a93a3] mt-3">Points citing a deck slide or the guide come from the source materials. Flagged points are general reasoning, unverified or unclear; check them yourself.</p></section>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="px-3 py-2 rounded border border-[#2c374a]" href={prev.href}>← {prev.text}</Link>
        <Link className="px-3 py-2 rounded border border-[#2c374a] ml-auto" href={next.href}>{next.text} →</Link>
      </div>
      <section id="chat" className="pt-4 border-t border-[#2c374a]">
        <h2 className="text-xl font-serif text-[#e8d9b5] mb-1">Chapter {c.number} chat</h2>
        <p className="text-sm text-[#8a93a3] mb-3">Talk about this chapter. For everything else, use the <Link href="/chat/" className="underline">main chat</Link>.</p>
        <Chat room={`chapter-${c.number}`} />
      </section>
    </article>
  );
}
