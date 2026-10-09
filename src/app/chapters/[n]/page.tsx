import Link from "next/link";
import { notFound } from "next/navigation";
import { chapters, topics } from "@/lib/data";
import Img from "@/components/Img";
import Chat from "@/components/Chat";
import YouTube from "@/components/YouTube";
export function generateStaticParams() { return chapters.map((c) => ({ n: String(c.number) })); }
export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const c = chapters[Number(n) - 1]; return { title: c ? `Chapter ${n}: ${c.title}` : "Chapter" };
}
function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return <section className="card"><div className="label">{label}</div><div className="leading-relaxed">{children}</div></section>;
}
export default async function ChapterPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const num = Number(n); const c = chapters[num - 1];
  if (!c) notFound();
  const prev = num > 1 ? num - 1 : null, next = num < chapters.length ? num + 1 : null;
  const related = topics.filter((t) => t.relatedChapters.includes(num));
  return (
    <article className="space-y-4">
      <div><div className="label">Chapter {c.number} of {chapters.length}</div><h1 className="text-2xl md:text-3xl font-serif text-[#e8d9b5]">{c.title}</h1></div>
      <YouTube video={c.video} title={`Chapter ${c.number}: ${c.title} (video)`} />
      <figure>
        <Img src={c.image} fallback={c.fallback} alt={c.alt} className="w-full aspect-video max-h-96 object-cover bg-[#1e2a3a] rounded-xl" />
      </figure>
      <Box label="In plain language">{c.plainLanguage}</Box>
      <Box label="The claim">{c.claim}</Box>
      <Box label="Sources cited">{c.sources}</Box>
      <Box label="Key facts">{c.keyFacts}</Box>
      {related.length > 0 && <Box label="Related transcript topics"><ul className="space-y-1">{related.map((t) => <li key={t.id}><Link className="underline text-[#c9b27c]" href={`/topics/${t.id}/`}>{t.title}</Link></li>)}</ul></Box>}
      <div className="flex flex-wrap gap-3 text-sm">
        {prev && <Link className="px-3 py-2 rounded border border-[#2c374a]" href={`/chapters/${prev}/`}>← Chapter {prev}</Link>}
        {next && <Link className="px-3 py-2 rounded border border-[#2c374a] ml-auto" href={`/chapters/${next}/`}>Chapter {next} →</Link>}
      </div>
      <section id="chat" className="pt-4 border-t border-[#2c374a]">
        <h2 className="text-xl font-serif text-[#e8d9b5] mb-1">Chapter {c.number} chat</h2>
        <p className="text-sm text-[#8a93a3] mb-3">Talk about this chapter. For everything else, use the <Link href="/chat/" className="underline">main chat</Link>.</p>
        <Chat room={`chapter-${c.number}`} />
      </section>
    </article>
  );
}
