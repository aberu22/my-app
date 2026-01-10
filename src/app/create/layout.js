import { Inter } from "next/font/google";
import CreateSidebar from "../components/CreateSidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "AI Image & Video Generator | Fantasy AI",
  description:
    "Create AI-generated images and videos from text prompts. Fantasy AI is a powerful alternative to Midjourney and Sora.",
  metadataBase: new URL("https://getfantasyai.com"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function CreateLayout({ children }) {
  return (
    <div className={`min-h-screen bg-[#0a0b0f] text-white ${inter.className}`}>
      <CreateSidebar />
      <div className="sm:pl-72">{children}</div>
    </div>
  );
}
