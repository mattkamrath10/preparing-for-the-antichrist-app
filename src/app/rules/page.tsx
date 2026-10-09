import { RULES, TERMS } from "@/lib/rules";
export const metadata = { title: "Community rules and terms" };
export default function Rules() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-serif text-[#e8d9b5]">Community rules</h1>
      <ol className="card list-decimal pl-8 space-y-1">{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
      <h2 className="text-xl font-serif text-[#e8d9b5]">Terms of use</h2>
      <div className="card space-y-2">{TERMS.map((t) => <p key={t}>{t}</p>)}</div>
    </div>
  );
}
