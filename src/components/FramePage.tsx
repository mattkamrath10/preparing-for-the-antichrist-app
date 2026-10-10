import Link from "next/link";
import type { FramePage as FP } from "@/lib/data";
import Img from "@/components/Img";
import YouTube from "@/components/YouTube";
import FullVideo from "@/components/FullVideo";
import Chat from "@/components/Chat";
export default function FramePage({ p, room, label, prev, next, credits }: { p: FP; room: string; label: string; prev?: { href: string; text: string }; next?: { href: string; text: string }; credits?: React.ReactNode }) {
  return (
    <article className="space-y-4">
      <div><div className="label">{label}</div><h1 className="text-2xl md:text-3xl font-serif text-[#e8d9b5]">{p.title}</h1></div>
      {credits}
      {p.video ? <YouTube video={p.video} title={`${p.title} (video)`} /> : <FullVideo startLabel title={`Full video: ${p.title}`} />}
      <Img slug={p.slug} admin src={p.image} fallback={p.fallback} alt={p.alt} className="w-full aspect-video max-h-96 object-cover bg-[#1e2a3a] rounded-xl" />
      {p.sections.map((s) => (
        <section key={s.title} className="card space-y-3">
          <h2 className="text-xl font-serif text-[#e8d9b5]">{s.title}</h2>
          <p>{s.plainLanguage}</p>
          <div><div className="label">The speaker&apos;s argument</div><p>{s.claim}</p></div>
          <div><div className="label">Sources he draws on</div><p>{s.sources}</p></div>
          <div><div className="label">Other perspectives</div><p>{s.keyFacts}</p></div>
          <p className="text-xs text-[#8a93a3]">From deck slide {s.sourceSlide} and the plain-language guide.</p>
        </section>
      ))}
      <div className="flex text-sm">{prev && <Link className="px-3 py-2 rounded border border-[#2c374a]" href={prev.href}>← {prev.text}</Link>}{next && <Link className="px-3 py-2 rounded border border-[#2c374a] ml-auto" href={next.href}>{next.text} →</Link>}</div>
      <section className="pt-4 border-t border-[#2c374a]"><h2 className="text-xl font-serif text-[#e8d9b5] mb-3">Chat</h2><Chat room={room} /></section>
    </article>
  );
}
