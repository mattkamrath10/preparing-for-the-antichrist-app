import FramePage from "@/components/FramePage";
import { pages } from "@/lib/data";
export const metadata = { title: "Introduction" };
export default function Intro() { return <FramePage p={pages.intro} room="chapter-0" label="Introduction" next={{ href: "/chapters/1/", text: "Chapter 1" }} />; }
