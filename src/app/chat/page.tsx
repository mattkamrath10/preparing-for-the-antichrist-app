import Chat from "@/components/Chat";
export const metadata = { title: "Main chat" };
export default function MainChat() {
  return (
    <div>
      <h1 className="text-2xl font-serif text-[#e8d9b5]">Main chat</h1>
      <p className="text-[#c5c9d2] mb-4">One conversation covering all chapters. Each chapter also has its own chat at the end of the page.</p>
      <Chat room="main" />
    </div>
  );
}
