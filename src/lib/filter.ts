// Client-side hate-term filter (a matching server-side check lives in the SQL migration).
// Kept intentionally short and generic; extend the list in both places.
const BLOCKED = ["kike", "k1ke", "heeb", "zhid", "christkiller", "christ killer", "oven dodger", "gas the", "1488", "14/88", "sieg heil", "white power", "race traitor", "subhuman", "vermin"];
export function containsHateTerm(text: string): boolean {
  const t = text.toLowerCase().replace(/[^a-z0-9/ ]/g, " ").replace(/\s+/g, " ");
  return BLOCKED.some((w) => t.includes(w));
}
