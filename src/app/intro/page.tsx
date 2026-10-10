import FramePage from "@/components/FramePage";
import { pages } from "@/lib/data";
export const metadata = { title: "Introduction" };
const credits = (
  <section className="card text-sm">
    <div className="label">Credits</div>
    <p>The speaker in the video and transcript is <a className="underline text-[#c9b27c]" href="https://www.instagram.com/richtidwell/" target="_blank" rel="noopener noreferrer">Rich Tidwell</a>. Throughout this app he is referred to as &quot;the speaker.&quot;</p>
    <p className="mt-1">The reel was shared by The Patriot Project (Facebook page).</p>
  </section>
);
export default function Intro() { return <FramePage p={pages.intro} room="chapter-0" label="Introduction" next={{ href: "/chapters/1/", text: "Chapter 1" }} credits={credits} />; }
