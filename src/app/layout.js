// app/layout.js
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { ImageGenerationProvider } from "../context/ImageGenrationContext";

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
  title: "FantasyVision.AI",
  description: "AI-powered image generation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ImageGenerationProvider>
            <Navbar />
            <main>{children}</main>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          </ImageGenerationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
