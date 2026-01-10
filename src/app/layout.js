// src/app/layout.js
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import { ImageGenerationProvider } from "@/context/ImageGenrationContext";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://getfantasyai.com"),

  title: {
    default: "Fantasy AI – AI Video & Image Generator",
    template: "%s | Fantasy AI",
  },

  description:
    "Fantasy AI is a powerful AI platform for creating videos and images from text or photos. Generate cinematic AI content instantly.",

  keywords: [
    "AI video generator",
    "AI image generator",
    "text to video AI",
    "text to image AI",
    "AI content creation",
    "Fantasy AI",
  ],

  authors: [{ name: "Fantasy AI" }],
  creator: "Fantasy AI",
  publisher: "Fantasy AI",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    type: "website",
    url: "https://getfantasyai.com",
    title: "Fantasy AI – AI Video & Image Generator",
    description:
      "Create cinematic AI videos and images from text or photos with Fantasy AI.",
    siteName: "Fantasy AI",
  },

  twitter: {
    card: "summary_large_image",
    title: "Fantasy AI – AI Video & Image Generator",
    description:
      "Generate AI-powered videos and images instantly with Fantasy AI.",
  },

  // ✅ GOOGLE SEARCH CONSOLE VERIFICATION
  verification: {
    google: "My5ltJKl1khfuwW0TcjovDXo8JIfOFe4DiTkg-JAFms",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ImageGenerationProvider>
            <main>{children}</main>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </ImageGenerationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
