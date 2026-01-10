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

  // 🔑 THIS IS THE ONLY NEW PART
  verification: {
    google: "My5JtJK1khfuwW0T",
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
