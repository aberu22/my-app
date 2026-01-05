// app/layout.js
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
  metadataBase: new URL("https://fantasyai.com"),
  title: {
    default: "Fantasy AI – AI Video & Image Generator",
    template: "%s | Fantasy AI",
  },
  description:
    "Fantasy AI is a powerful AI platform for creating videos and images from text or photos. Generate cinematic content instantly.",
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
