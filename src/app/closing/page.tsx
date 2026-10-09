import FramePage from "@/components/FramePage";
import { pages, chapters } from "@/lib/data";
export const metadata = { title: "Closing" };
export default function Closing() { return <FramePage p={pages.closing} room="chapter-21" label="Closing" prev={{ href: `/chapters/${chapters.length}/`, text: `Chapter ${chapters.length}` }} />; }
