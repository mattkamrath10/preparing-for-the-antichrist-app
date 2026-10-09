import chaptersJson from "@/data/chapters.json";
import guideJson from "@/data/guide.json";
import topicsJson from "@/data/topics.json";
export type Chapter = { number: number; sourceSlide: number; title: string; claim: string; sources: string; keyFacts: string; plainLanguage: string; image: string; fallback: string; alt: string };
export type Topic = { id: string; title: string; time: string; claimant: string; claim: string[]; counterpoints: string[]; names: string[]; relatedChapters: number[]; unclear: string[] };
export const chapters = chaptersJson as Chapter[];
export const guide = guideJson as { explanations: Record<string, string>; glossary: { term: string; definition: string; added?: string }[]; note: string };
export const topics = topicsJson as Topic[];
