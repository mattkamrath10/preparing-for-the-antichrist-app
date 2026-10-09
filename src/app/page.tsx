import Link from "next/link";
import { chapters, topics } from "@/lib/data";
import Img from "@/components/Img";
export default function Home() {
  return (
    <div>
      <section className="card mb-6">
        <Img src="/images/hero.png" fallback="/images/hero-fallback.svg" alt="App illustration" className="w-full max-h-80 object-contain bg-[#1e2a3a] rounded-xl mb-4" />
        <h1 className="text-3xl md:text-4xl font-serif text-[#e8d9b5]">Answering the Edomite Myth</h1>
        <p className="mt-2 text-[#c5c9d2]">A plain-language guide to the claims in the video, the sources it cites, and the key facts, chapter by chapter.</p>
        <p className="mt-2 text-sm text-[#c9b27c]">Antisemitic claims are presented for critical examination, not endorsement.</p>
        <div className="mt-4 flex gap-3 flex-wrap text-sm">
          <Link className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" href="/chapters/1/">Start with chapter 1</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/chat/">Main chat</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/topics/">Transcript topics</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/glossary/">Glossary</Link>
        </div>
      </section>
      <section className="card mb-6"><div className="label">Transcript topics</div><p className="mb-2">{topics.length} subjects from the video, each with the claim and the evidence.</p><Link href="/topics/" className="underline text-[#c9b27c]">Browse transcript topics →</Link></section>
      <h2 className="label">All {chapters.length} chapters</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chapters.map((c) => (
          <li key={c.number}><Link href={`/chapters/${c.number}/`} className="card block h-full hover:border-[#c9b27c]">
            <Img src={c.image} fallback={c.fallback} alt={c.alt} className="w-full aspect-video object-cover rounded-lg mb-2" />
            <div className="text-xs text-[#8a93a3]">Chapter {c.number}</div><div className="font-semibold">{c.title}</div>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
