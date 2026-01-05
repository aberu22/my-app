import HeroClient from "./HeroClient";

export default function HomePage() {
  return (
    <>
      {/* Main hero renders H1 immediately */}
      <HeroClient />

      {/* Subtle SEO reinforcement (safe + natural) */}
      <section className="sr-only">
        <h2>AI Video Generator</h2>
        <p>
          Fantasy AI is an AI-powered platform that helps creators generate
          cinematic videos from text prompts and images using advanced
          generative models.
        </p>
      </section>
    </>
  );
}
