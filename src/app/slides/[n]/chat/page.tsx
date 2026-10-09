import Link from "next/link";
import { slides } from "@/lib/data";
import Chat from "@/components/Chat";
export function generateStaticParams() { return slides.map((s) => ({ n: String(s.number) })); }
export default async function ChatPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params; const s = slides[Number(n) - 1];
  return (
    <div>
      <Link href={`/slides/${n}/`} className="text-sm text-[#c9b27c]">← Back to slide {n}</Link>
      <h1 className="text-2xl font-serif text-[#e8d9b5] mt-2">Debate chat: slide {n}</h1>
      <p className="text-[#c5c9d2] mb-4">{s?.title}</p>
      <Chat slide={Number(n)} />
    </div>
  );
}
