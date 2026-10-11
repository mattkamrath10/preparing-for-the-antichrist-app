import AdminVideos from "@/components/AdminVideos";
export const metadata = { title: "Admin" };
export default function Page() {
  return <div className="max-w-3xl mx-auto space-y-4"><h1 className="text-2xl font-semibold text-[#e8d9b5]">Admin</h1><AdminVideos /></div>;
}
