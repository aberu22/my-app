export const metadata = {
  title: "Account Settings | NeonVision.AI",
  description: "Manage your NeonVision.AI account, billing, and subscription preferences.",
  keywords: ["account settings", "NeonVision account", "AI subscription", "billing dashboard"],
  metadataBase: new URL("https://yourdomain.com"), // ← Replace with your real domain
  openGraph: {
    title: "Account Settings | NeonVision.AI",
    description: "Access and manage your NeonVision.AI account and billing securely.",
    url: "/account", // relative path — resolves correctly via metadataBase
    type: "website",
  },
};

export default function AccountLayout({ children }) {
  return <>{children}</>;
}
