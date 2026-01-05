export const metadata = {
  title: "Login | Fantasy AI",
  description: "Log in to your Fantasy AI account.",
  robots: {
    index: false,
    follow: false,
  },
  metadataBase: new URL("https://fantasyai.com"), // your real domain
  openGraph: {
    title: "Login | Fantasy AI",
    description: "Access your Fantasy AI account.",
    url: "/login",
    type: "website",
  },
};


export default function LoginLayout({ children }) {
  return <>{children}</>;
}
