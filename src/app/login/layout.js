export const metadata = {
  title: "Login | NeonVision.AI",
  description: "Securely log in to access AI-powered video and image generation tools.",
  keywords: ["AI login", "NeonVision login", "AI video tool access", "secure AI platform"],
  metadataBase: new URL("https://yourdomain.com"), // Replace with your actual domain
  openGraph: {
    title: "Login | NeonVision.AI",
    description: "Access your account to create AI-generated content using text and images.",
    url: "/login", // Use relative path; will be resolved with metadataBase
    type: "website",
  },
};

export default function LoginLayout({ children }) {
  return <>{children}</>;
}
