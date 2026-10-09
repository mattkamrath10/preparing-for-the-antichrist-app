import slidesJson from "@/data/slides.json";
import guideJson from "@/data/guide.json";
export type Slide = {
  number: number; kicker: string; title: string;
  subtitle?: string; description?: string; note?: string;
  likelyArgument?: string; evidence?: string; logicBreaks?: string; crossExamination?: string;
  comeback?: string; answer?: string; haveOpen?: string;
  columns?: { label: string; items: string[] }[];
  image: { src: string; alt: string; credit: string };
};
export const slides = slidesJson as Slide[];
export const guide = guideJson as { explanations: Record<string, string>; glossary: { term: string; definition: string }[]; note: string };
