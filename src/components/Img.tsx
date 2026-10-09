"use client";
import { useState } from "react";
// Shows the uploaded image if it exists, otherwise the built-in illustration.
export default function Img({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className?: string }) {
  const [s, setS] = useState(src);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={s} alt={alt} className={className} onError={() => s !== fallback && setS(fallback)} />;
}
