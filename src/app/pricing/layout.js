export const metadata = {
  title: "Pricing | NeonVision.AI",
  description: "Flexible and affordable pricing plans for AI video and image generation. Choose a plan that fits your creative needs.",
  keywords: ["AI pricing", "NeonVision plans", "AI video generator cost", "image generator subscription"],
  metadataBase: new URL("https://yourdomain.com"), // ← Replace with actual domain
  openGraph: {
    title: "Pricing | NeonVision.AI",
    description: "Explore pricing options for powerful AI video and image generation tools. Simple, transparent, and scalable.",
    url: "/pricing", // relative path; resolves correctly with metadataBase
    type: "website",
  },
};

export default function PricingLayout({ children }) {
  return <>{children}</>;
}
