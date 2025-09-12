export const metadata = {
  title: "Text to Video Generator | NeonVision.AI",
  description: "Convert text into engaging videos using AI. Customize, preview, and export with ease.",
  keywords: ["text to video", "AI video generator", "NeonVision AI", "convert text to video"],
  metadataBase: new URL("https://yourdomain.com"), // ← Replace with your actual domain
  openGraph: {
    title: "Text to Video Generator | NeonVision.AI",
    description: "Create stunning AI-generated videos from simple text prompts.",
    url: "/text-to-video", // relative path for proper resolution
    type: "website",
  },
};

export default function TextToVideoLayout({ children }) {
  return <>{children}</>;
}
