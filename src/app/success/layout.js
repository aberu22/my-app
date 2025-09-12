// src/app/success/layout.js
export const metadata = {
  // Good to keep a descriptive title/desc for link sharing
  title: "Payment Success | NeonVision.AI",
  description:
    "Thank you for your purchase. Your payment was successful and your account has been updated.",
  keywords: ["payment success", "AI credits", "NeonVision purchase", "subscription confirmation"],

  // Ideally also set metadataBase in your root layout; keeping it here is fine if unique
  metadataBase: new URL("https://your-real-domain.com"), // ← replace with your domain

  // Prevent indexing of the success page
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  alternates: {
    canonical: "/success",
  },

  openGraph: {
    title: "Payment Success | NeonVision.AI",
    description:
      "You’ve successfully completed your purchase. Start creating with NeonVision.AI now.",
    url: "/success", // relative is fine with metadataBase set
    type: "website",
    // Optionally add a share image:
    // images: [{ url: "/og/success.png", width: 1200, height: 630, alt: "NeonVision Payment Success" }],
  },

  // (Optional) Reduce unwanted previews in some clients
  twitter: {
    card: "summary",
    title: "Payment Success | NeonVision.AI",
    description:
      "You’ve successfully completed your purchase. Start creating with NeonVision.AI now.",
  },
};

export default function SuccessLayout({ children }) {
  // Keep this as a simple server wrapper
  return <>{children}</>;
}
