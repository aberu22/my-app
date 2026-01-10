export const metadata = {
  title: "AI Video Generator | Text & Image to Video – Fantasy AI",
  description:
    "Create cinematic AI videos from text or images. Fantasy AI is a powerful Sora-style text-to-video generator built for creators and teams.",

  keywords: [
    "AI video generator",
    "text to video AI",
    "image to video AI",
    "Sora alternative",
    "AI video maker",
    "Fantasy AI",
  ],

  metadataBase: new URL("https://getfantasyai.com"),

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url: "https://getfantasyai.com",
    title: "AI Video Generator – Fantasy AI",
    description:
      "Generate high-quality AI videos from text or images with Fantasy AI, a modern Sora-style video generator.",
    siteName: "Fantasy AI",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Video Generator – Fantasy AI",
    description:
      "Create cinematic AI videos from text or images using Fantasy AI.",
  },
};

export default function HomeLayout({ children }) {
  return <>{children}</>;
}
