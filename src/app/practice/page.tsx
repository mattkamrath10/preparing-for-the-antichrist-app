import Link from "next/link";
export const metadata = { title: "Practice" };
const rules = ["Run 5 rounds: a 2-minute opening, then 1-minute replies.", "Argue only what the transcript says. Don't invent new claims.", "After each round, step out of character and discuss which answers worked.", "Swap roles so you both hear each side.", "Either person can call \"time out\" if it gets personal.", "Answer from the reference binder, one source at a time."];
const claims: [string, string, number][] = [["Expelled from 100+ countries", "0:03", 9], ["Edom \"small and despised\" = Jews", "0:27", 4], ["Idumeans converted; Herod a \"half Jew\"", "0:57", 5], ["\"Synagogue of Satan\"", "0:48", 7], ["Epstein as a Mossad asset", "2:55", 21], ["Talmud quotes", "5:25-6:10", 8], ["Bolsheviks killed 20-60 million", "6:15", 13], ["DNA and \"Canaanite blood\"", "8:04", 18], ["Rothschild = \"Shield of Edom\"", "9:44", 10], ["\"Greater Israel,\" Noahide laws", "11:06", 15]];
const tactics: [string, string, number][] = [["Rapid fire", "five claims in one minute", 23], ["Label switch", "\"not Jews, Edomites\"", 2], ["Shifting the burden", "\"prove me wrong\"", 3], ["The shield", "\"of course they deny it\"", 21], ["Moral trap", "\"so you support genocide?\"", 20], ["Name-calling", "\"Zionist shill\"", 24]];
export default function Practice() {
  return (
    <div className="space-y-5">
      <div><div className="label">Practice tool • One page</div>
        <h1 className="text-2xl font-serif text-[#e8d9b5]">Role-play sheet for the person playing the opponent</h1>
        <p className="text-[#c5c9d2] mt-1">These are the opponent&apos;s claims, listed only so you can practice answering them. The &quot;slide&quot; numbers point to the matching page in the debate prep deck, where the answer is.</p></div>
      <section className="card"><div className="label">Ground rules</div><ul className="list-disc pl-5 space-y-1">{rules.map((r) => <li key={r}>{r}</li>)}</ul></section>
      <section className="card overflow-x-auto"><div className="label">His 10 main claims, in the order to raise them</div>
        <table className="w-full text-sm"><thead><tr className="text-left text-[#8a93a3]"><th className="py-1">#</th><th>Claim</th><th>Video time</th><th>Answer on slide</th></tr></thead>
          <tbody>{claims.map(([c, t, s], i) => <tr key={c} className="border-t border-[#2c374a]"><td className="py-2">{i + 1}</td><td>{c}</td><td>{t}</td><td><Link className="text-[#c9b27c] underline" href={`/slides/${s}/`}>{s}</Link></td></tr>)}</tbody></table></section>
      <section className="card overflow-x-auto"><div className="label">Tactics to practice against</div>
        <table className="w-full text-sm"><thead><tr className="text-left text-[#8a93a3]"><th className="py-1">Tactic</th><th>What it sounds like</th><th>Answer on slide</th></tr></thead>
          <tbody>{tactics.map(([a, b, s]) => <tr key={a} className="border-t border-[#2c374a]"><td className="py-2">{a}</td><td>{b}</td><td><Link className="text-[#c9b27c] underline" href={`/slides/${s}/`}>{s}</Link></td></tr>)}</tbody></table></section>
      <section className="card"><div className="label">After the session</div><p>Note which claims caught you off guard, look up those slides and binder pages, and practice those answers out loud.</p><p className="mt-1 font-semibold">Calm, specific, sourced answers win audiences.</p></section>
    </div>
  );
}
