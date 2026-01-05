import { Sora } from "next/font/google";
import CreateSidebar from "../../components/CreateSidebar";


const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "Studio | FantasyVisionAI",
  description: "Create images and videos with AI",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }) {
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
