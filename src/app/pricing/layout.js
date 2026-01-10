export const metadata = {
  title: "AI Video Generator Pricing | Fantasy AI",
  description:
    "Transparent pricing for AI text-to-video and image-to-video generation. Compare plans and choose the best Sora-style AI video generator for your workflow.",

  keywords: [
    "AI video generator pricing",
    "text to video AI pricing",
    "image to video AI cost",
    "Sora alternative pricing",
    "AI video subscription",
    "Fantasy AI pricing",
  ],

  metadataBase: new URL("https://getfantasyai.com"),

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    title: "AI Video Generator Pricing | Fantasy AI",
    description:
      "Compare pricing plans for AI video generation. Create cinematic videos from text or images with Fantasy AI.",
    url: "https://getfantasyai.com/pricing",
    siteName: "Fantasy AI",
  },

  twitter: {
    card: "summary_large_image",
    title: "Fantasy AI Pricing",
    description:
      "Simple and transparent pricing for AI video generation with Fantasy AI.",
  },
};

export default function PricingLayout({ children }) {
  return <>{children}</>;
}
