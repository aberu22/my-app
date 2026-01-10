import { Sora } from "next/font/google";
import CreateSidebar from "../components/CreateSidebar";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Music Studio | Fantasy AI",
  description: "Generate AI-powered music and audio with Fantasy AI Studio.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MusicLayout({ children }) {
  return (
    <div className={`${sora.className} min-h-dvh bg-black text-white`}>
      {/* Sidebar persists across all studio routes */}
      <CreateSidebar />

      {/* Main canvas */}
      <div className="sm:pl-72">
        <main className="min-h-dvh px-4 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
