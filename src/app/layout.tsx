import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import SW from "@/components/SW";
export const metadata: Metadata = {
  title: "Preparing For The Antichrist App",
  description: "A chapter-by-chapter guide to the Edom identity argument in the video, with other perspectives and sources.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#11161f", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-[#2c374a] sticky top-0 z-10 bg-[#11161f]/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-x-5 gap-y-2 items-center text-sm">
            <Link href="/" className="font-semibold text-[#e8d9b5] mr-auto">Preparing For The Antichrist</Link>
            <Link href="/">Chapters</Link>
            <Link href="/intro/">Intro</Link>
            <Link href="/glossary/">Glossary</Link>
            <Link href="/chat/">Main chat</Link>
            <Link href="/rules/">Rules</Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-[#8a93a3]">Video and transcript: <a className="underline" href="https://www.instagram.com/richtidwell/" target="_blank" rel="noopener noreferrer">Rich Tidwell</a>. Shared by The Patriot Project.</footer>
        <SW />
      </body>
    </html>
  );
}
