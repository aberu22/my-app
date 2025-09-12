export const metadata = {
  title: "Community Creations | NeonVision.AI",
  description: "Explore AI-generated videos and images shared by the NeonVision.AI community. Get inspired or share your own creations.",
  keywords: ["AI community", "AI-generated videos", "AI image gallery", "user AI creations"],
  metadataBase: new URL("https://yourdomain.com"),
  openGraph: {
    title: "Community Creations | NeonVision.AI",
    description: "Browse stunning content created by our community using NeonVision.AI tools.",
    url: "/community",
    type: "website",
  },
};

export default function CommunityLayout({ children }) {
  return <>{children}</>;
}
