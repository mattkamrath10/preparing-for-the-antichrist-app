import { guide } from "@/lib/data";
export const metadata = { title: "Glossary" };
export default function Glossary() {
  return (
    <div>
      <h1 className="text-2xl font-serif text-[#e8d9b5] mb-1">Words you&apos;ll see</h1>
      <p className="text-[#8a93a3] mb-4 text-sm">From the plain-language guide to the debate prep deck.</p>
      <dl className="grid md:grid-cols-2 gap-3">
        {guide.glossary.map((g) => <div key={g.term} className="card"><dt className="font-semibold text-[#e8d9b5]">{g.term}</dt><dd className="mt-1 text-[#c5c9d2]">{g.definition}</dd></div>)}
      </dl>
      <p className="card mt-5 text-sm"><span className="label block">A note on why this matters</span>{guide.note}</p>
    </div>
  );
}
