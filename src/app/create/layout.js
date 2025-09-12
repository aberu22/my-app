export const metadata = {
  title: "Create AI Images | NeonVision.AI",
  description: "Generate stunning images from text prompts using advanced AI models.",
  keywords: ["AI image generator", "create AI visuals", "text to image", "NeonVision AI"],
  metadataBase: new URL("https://yourdomain.com"), // Replace with your real production domain
  openGraph: {
    title: "Create AI Images | NeonVision.AI",
    description: "Use templates or custom prompts to generate high-quality images instantly.",
    url: "/create", // Relative URL, resolves properly with metadataBase
    type: "website",
  },
};

export default function CreateLayout({ children }) {
  
  return <>{children}</>;
}
