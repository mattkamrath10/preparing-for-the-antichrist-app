import Link from "next/link";
import { chapters, pages } from "@/lib/data";
import Img from "@/components/Img";
import FullVideo from "@/components/FullVideo";
function Card({ href, img, fb, alt, kicker, title, sub }: { href: string; img: string; fb: string; alt: string; kicker: string; title: string; sub?: string }) {
  return <li><Link href={href} className="card block h-full hover:border-[#c9b27c]"><Img src={img} fallback={fb} alt={alt} className="w-full aspect-video object-cover rounded-lg mb-2" /><div className="text-xs text-[#8a93a3]">{kicker}</div><div className="font-semibold">{title}</div>{sub && <div className="text-xs text-[#8a93a3] mt-1">{sub}</div>}</Link></li>;
}
export default function Home() {
  const { intro, closing } = pages;
  return (
    <div>
      <section className="card mb-6">
        <Img src="/images/hero.png" fallback="/images/hero-fallback.svg" alt="App illustration" className="w-full max-h-80 object-contain bg-[#1e2a3a] rounded-xl mb-4" />
        <h1 className="text-3xl md:text-4xl font-serif text-[#e8d9b5]">Answering the Edomite Myth</h1>
        <p className="mt-2 text-[#c5c9d2]">The claims in the video, in the order the speaker makes them, with the sources he cites and the evidence and counterpoints for each.</p>
        <p className="mt-2 text-sm text-[#c9b27c]">Antisemitic claims are presented for critical examination, not endorsement.</p>
        <div className="mt-4 flex gap-3 flex-wrap text-sm">
          <Link className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" href="/intro/">Start with the introduction</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/chat/">Main chat</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/glossary/">Glossary</Link>
        </div>
      </section>
      <div className="mb-6"><FullVideo startLabel title="Full video" /></div>
      <h2 className="label">Introduction, {chapters.length} chapters and closing</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card href="/intro/" img={intro.image} fb={intro.fallback} alt={intro.alt} kicker="Introduction" title={intro.title} />
        {chapters.map((c) => <Card key={c.number} href={`/chapters/${c.number}/`} img={c.image} fb={c.fallback} alt={c.alt} kicker={`Chapter ${c.number}`} title={c.title} sub={c.times[0]} />)}
        <Card href="/closing/" img={closing.image} fb={closing.fallback} alt={closing.alt} kicker="Closing" title={closing.title} />
      </ul>
    </div>
  );
}
