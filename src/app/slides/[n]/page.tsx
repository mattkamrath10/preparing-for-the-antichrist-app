import Link from "next/link";
import { notFound } from "next/navigation";
import { slides, guide, topics } from "@/lib/data";
export function generateStaticParams() { return slides.map((s) => ({ n: String(s.number) })); }
export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const s = slides[Number(n) - 1];
  return { title: s ? `Slide ${n}: ${s.title}` : "Slide" };
}
function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="card"><div className="label">{label}</div><div className="leading-relaxed">{children}</div></div>;
}
export default async function SlidePage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const num = Number(n); const s = slides[num - 1];
  if (!s) notFound();
  const prev = num > 1 ? num - 1 : null, next = num < slides.length ? num + 1 : null;
  return (
    <article>
      <div className="label">{s.kicker}</div>
      <h1 className="text-2xl md:text-3xl font-serif text-[#e8d9b5] mb-4">{s.title}</h1>
      <figure className="mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.image.src} alt={s.image.alt} className="w-full max-h-72 object-contain bg-[#1e2a3a] rounded-xl" />
        <figcaption className="text-xs text-[#8a93a3] mt-1">{s.image.alt}. {s.image.credit}</figcaption>
      </figure>
      {s.likelyArgument && (
        <div className="grid md:grid-cols-2 gap-5">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold border-b border-[#2c374a] pb-1">The claim</h2>
            <Box label="Likely argument">{s.likelyArgument}</Box>
            <Box label="Evidence they may cite">{s.evidence}</Box>
            <Box label="His likely comeback">{s.comeback}</Box>
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold border-b border-[#2c374a] pb-1">Evidence and response</h2>
            <Box label="Where the logic breaks">{s.logicBreaks}</Box>
            <Box label="Cross-examination">{s.crossExamination}</Box>
            <Box label="Your answer">{s.answer}{s.haveOpen && <p className="mt-2 text-sm text-[#c9b27c]">Have open: {s.haveOpen}</p>}</Box>
          </section>
        </div>
      )}
      {s.number === 1 && <div className="card"><p>{s.subtitle}</p><p className="mt-2">{s.description}</p><p className="mt-2 text-sm text-[#c9b27c]">{s.note}</p></div>}
      {s.columns && (
        <div className="grid md:grid-cols-3 gap-4">
          {s.columns.map((c) => <Box key={c.label} label={c.label}><ul className="list-disc pl-5 space-y-1">{c.items.map((i) => <li key={i}>{i}</li>)}</ul></Box>)}
        </div>
      )}
      <section className="card mt-5">
        <div className="label">In plain language</div>
        <p>{guide.explanations[String(s.number)]}</p>
      </section>
      {topics.some((t) => t.relatedSlides.includes(s.number)) && (
        <section className="card mt-5"><div className="label">Related transcript topics</div>
          <ul className="space-y-1">{topics.filter((t) => t.relatedSlides.includes(s.number)).map((t) => <li key={t.id}><Link className="underline text-[#c9b27c]" href={`/topics/${t.id}/`}>{t.title}</Link></li>)}</ul></section>
      )}
      <div className="mt-5 flex flex-wrap gap-3 items-center text-sm">
        {prev && <Link className="px-3 py-2 rounded border border-[#2c374a]" href={`/slides/${prev}/`}>← Slide {prev}</Link>}
        <Link className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" href={`/slides/${s.number}/chat/`}>Discuss this slide</Link>
        {next && <Link className="px-3 py-2 rounded border border-[#2c374a] ml-auto" href={`/slides/${next}/`}>Slide {next} →</Link>}
      </div>
    </article>
  );
}
