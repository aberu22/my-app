import { Inter } from "next/font/google";
import CreateSidebar from "../components/CreateSidebar";

export const metadata = {
  title: "AI Image Generator | Create Images from Text – Fantasy AI",
  description:
    "Generate high-quality AI images from text prompts in seconds. Fantasy AI is a powerful text-to-image generator for creators and teams.",
  metadataBase: new URL("https://fantasyai.com"),
  openGraph: {
    title: "AI Image Generator | Fantasy AI",
    url: "https://fantasyai.com/create",
    type: "website",
  },
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function CreateLayout({ children }) {
  return (
    <div className={`min-h-screen bg-[#0a0b0f] text-white ${inter.className}`}>
      <CreateSidebar />

      {/* main content offset for sidebar */}
      <div className="sm:pl-72">
        {children}
      </div>
    </div>
  );
}
