import Link from "next/link";
import { slides, topics } from "@/lib/data";
export default function Home() {
  const cover = slides[0];
  return (
    <div>
      <section className="card mb-6">
        <div className="label">{cover.kicker}</div>
        <h1 className="text-3xl md:text-4xl font-serif text-[#e8d9b5]">{cover.title}</h1>
        <p className="text-lg mt-1">{cover.subtitle}</p>
        <p className="mt-3 text-[#c5c9d2]">{cover.description}</p>
        <p className="mt-3 text-sm text-[#c9b27c]">{cover.note}</p>
        <div className="mt-4 flex gap-3 flex-wrap text-sm">
          <Link className="px-3 py-2 rounded bg-[#c9b27c] text-[#11161f] font-semibold" href="/slides/2/">Start at slide 2</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/topics/">Transcript topics</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/practice/">Role-play practice</Link>
          <Link className="px-3 py-2 rounded border border-[#c9b27c]" href="/glossary/">Glossary</Link>
        </div>
      </section>
      <section className="card mb-6"><div className="label">Transcript topics</div><p className="mb-2">{topics.length} subjects from the opponent&apos;s video, each with the claim and the counterpoints.</p><Link href="/topics/" className="underline text-[#c9b27c]">Browse transcript topics →</Link></section>
      <h2 className="label">All 26 slides</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slides.map((s) => (
          <li key={s.number}>
            <Link href={`/slides/${s.number}/`} className="card block h-full hover:border-[#c9b27c]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image.src} alt={s.image.alt} className="w-full rounded-lg mb-2" />
              <div className="text-xs text-[#8a93a3]">Slide {String(s.number).padStart(2, "0")}</div>
              <div className="font-semibold">{s.title}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
