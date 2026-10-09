import Link from "next/link";
import { topics } from "@/lib/data";
export const metadata = { title: "Transcript topics" };
export default function Topics() {
  return (
    <div>
      <h1 className="text-2xl font-serif text-[#e8d9b5]">Transcript topics</h1>
      <p className="text-[#c5c9d2] mt-1 mb-4 max-w-3xl">Every subject raised in the opponent&apos;s video transcript, in the order it comes up. Each page says who makes the claim, what the claim is, and the evidence or counterpoints. Claims are reported as claims, not facts.</p>
      <ol className="grid md:grid-cols-2 gap-3">
        {topics.map((t, i) => (
          <li key={t.id}><Link href={`/topics/${t.id}/`} className="card block h-full hover:border-[#c9b27c]">
            <div className="text-xs text-[#8a93a3]">{i + 1}. Video time {t.time}</div>
            <div className="font-semibold">{t.title}</div>
          </Link></li>
        ))}
      </ol>
    </div>
  );
}
