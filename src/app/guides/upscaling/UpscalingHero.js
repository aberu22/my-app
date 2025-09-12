"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * UpscalingHero (JS)
 * - Hero with background image + overlay
 * - Inline tutorial video (poster + optional captions)
 *
 * Place assets in:
 *   /public/images/guide1.jpg
 *   /public/videos/upscaling-demo.mp4
 *   /public/videos/upscaling-demo.vtt   (optional captions)
 */
export default function UpscalingHero({
  title = "Wan 2.2 Demo",
  tag = "demo",
  coverSrc = "/images/guide1.jpg",
  videoSrc = "/videos/tut3.mp4",
  posterSrc = "/images/guide1.jpg",
  captionTrack = "/videos/upscaling-demo.vtt",
}) {
  return (
    <section className="relative w-full text-white">
      {/* HERO */}
      <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src={coverSrc}
          alt={`${title} Guide Cover`}
          fill
          priority
          className="object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge className="mb-4 bg-purple-600/80 border-none">{tag}</Badge>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{title}</h1>
          
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link href="#tutorial" className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur transition hover:bg-white/15 border border-white/10">
              Watch Demo
            </Link>
            <Link href="#steps" className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold transition hover:brightness-110">
              Read steps
            </Link>
          </div>
        </div>
      </div>

      {/* TUTORIAL */}
      <div id="tutorial" className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Quick Tutorial</h2>
          <p className="text-xs text-white/60">~90 seconds</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow">
          <video
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
            className="h-auto w-full"
          >
            <source src={videoSrc} type="video/mp4" />
            {captionTrack ? (
              <track src={captionTrack} kind="subtitles" srcLang="en" label="English" default />
            ) : null}
            Your browser does not support the video tag.
          </video>
        </div>

        <p className="mt-3 text-xs text-white/60">
          Tip: Keep your source image noise low before upscaling. Store your demo at
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5">/public/videos/upscaling-demo.mp4</code>.
        </p>
      </div>

      {/* Placeholder for rest of guide */}
      <div id="steps" className="mx-auto max-w-5xl px-6 pb-12">
        <h3 className="mb-3 text-lg font-semibold">What you'll learn</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm text-white/85">
          <li>When to choose 2× vs 4× scaling</li>
          <li>Combining upscaling with denoise/refine passes</li>
          <li>Face‑aware vs. texture‑aware upscalers</li>
        </ul>
      </div>
    </section>
  );
}
