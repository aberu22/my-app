export const metadata = {
  title: "Login | Fantasy AI",
  description: "Log in to your Fantasy AI account.",

  metadataBase: new URL("https://getfantasyai.com"),

  robots: {
    index: false,
    follow: true,
  },

  openGraph: {
    type: "website",
    title: "Login | Fantasy AI",
    description: "Access your Fantasy AI account.",
    url: "https://getfantasyai.com/login",
    siteName: "Fantasy AI",
  },
};

export default function LoginLayout({ children }) {
  return <>{children}</>;
}
