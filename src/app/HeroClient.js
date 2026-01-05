"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";

const HERO_VIDEOS = [
  "/hero/hero-1.mp4",
  "/hero/hero-2.mp4",
  "/hero/hero-3.mp4",
  "/hero/hero-4.mp4",
];

export default function HeroLandingSEO() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [activeVideo, setActiveVideo] = useState(0);

  // Rotate background videos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((i) => (i + 1) % HERO_VIDEOS.length);
    }, 6000); // change every 6s

    return () => clearInterval(interval);
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    const q = prompt.trim();
    router.push(
      q
        ? `/studio/text-to-video?prompt=${encodeURIComponent(q)}`
        : "/studio/text-to-video"
    );
  };

  return (
    <main className="relative isolate w-full bg-black text-white">
      {/* ================= HERO ================= */}
      <section
        aria-label="AI Video Generator Hero"
        className="relative min-h-screen w-full overflow-hidden"
      >
        {/* === BACKGROUND VIDEOS === */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {HERO_VIDEOS.map((src, index) => (
            <video
              key={src}
              aria-hidden="true"
              muted
              playsInline
              autoPlay
              loop
              preload="none"
              poster="/hero/poster.jpg"
              className={`
                absolute inset-0 h-full w-full object-cover
                transition-opacity duration-1000
                ${index === activeVideo ? "opacity-100" : "opacity-0"}
              `}
              src={src}
            />
          ))}

          {/* Overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
        </div>

        {/* Navbar */}
        <Navbar variant="marketing" className="absolute inset-x-0 top-0 z-20" />

        {/* Hero Content */}
        <div className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            AI Video Generator from Text & Images
          </h1>

          <p className="mt-4 max-w-3xl text-lg sm:text-xl text-zinc-200">
            Create cinematic videos using AI. Turn text prompts or images into
            dynamic scenes with camera motion, lighting, and visual storytelling
            — all in minutes.
          </p>

          <p className="mt-2 text-sm uppercase tracking-widest text-zinc-400">
            FantasyVision.AI — One prompt. Infinite directions.
          </p>

          {/* Prompt CTA */}
          <form
            onSubmit={handleGenerate}
            className="mt-10 flex w-full max-w-2xl items-center gap-2 rounded-full border border-white/20 bg-black/40 p-1 pl-4 backdrop-blur-md shadow-xl"
          >
            <label htmlFor="hero-prompt" className="sr-only">
              Describe your video
            </label>
            <input
              id="hero-prompt"
              className="h-12 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-400 outline-none"
              placeholder="A handheld cinematic shot of a starfighter taking off in the rain"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition"
            >
              Generate Video
            </button>
          </form>

          {/* Feature bullets */}
          <ul className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-zinc-400">
            <li>Text → Video</li>
            <li>Image → Video</li>
            <li>Camera Motion</li>
            <li>Lighting Control</li>
            <li>LoRA Templates</li>
          </ul>
        </div>
      </section>

      {/* ================= SEO SUPPORT ================= */}
      <section
        aria-label="What is FantasyVision AI"
        className="bg-black py-24"
      >
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="text-3xl font-semibold">
            Create cinematic AI videos in seconds
          </h2>

          <p className="mt-6 text-zinc-400 leading-relaxed">
            FantasyVision.AI is an advanced AI video generation platform that
            allows creators, filmmakers, and storytellers to generate
            high-quality videos from simple text prompts or reference images.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/studio/text-to-video" className="rounded-full border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition">
              Text to Video AI
            </Link>
            <Link href="/image-to-video" className="rounded-full border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition">
              Image to Video AI
            </Link>
            <Link href="/guides/upscaling" className="rounded-full border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition">
              Learn More
            </Link>

            <Link href="/privacy" className="rounded-full border border-white/20 px-6 py-2 hover:bg-white hover:text-black transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black py-12 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} FantasyVision.AI — AI Video Generation Platform
      </footer>
    </main>
  );
}
