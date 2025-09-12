"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * CharactersHero
 * - Hero with background image + overlay
 * - Inline tutorial video player (with poster + captions)
 * - Works in plain JS (no TS)
 *
 * Place assets in:
 *   /public/images/guide3.jpg
 *   /public/videos/characters-demo.mp4
 *   /public/videos/characters-demo.vtt   (optional captions)
 */
export default function CharactersHero({
  title = "Text to Video demo",
  tag = "Characters",
  coverSrc = "/images/guide3.jpg",
  videoSrc = "/videos/t2v.mp4",
  posterSrc = "/images/guide3.jpg",
  captionTrack = "/videos/characters-demo.vtt",
}) {
  return (
    <section className="relative w-full text-white">
      {/* HERO */}
      <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src={coverSrc}
          alt={`${title} Cover`}
          fill
          priority
          className="object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge className="mb-4 bg-emerald-600/80 border-none">{tag}</Badge>
          <h1 className="mb-3 text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="mx-auto max-w-2xl text-base text-white/85 md:text-lg">
            Learn techniques for keeping your AI-generated characters consistent across multiple
            poses, outfits, and scenes. Watch the short demo below, then follow the step‑by‑step guide.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="#tutorial"
              className="rounded-xl bg-white/10 px-4 py-2 text-sm backdrop-blur transition hover:bg-white/15 border border-white/10"
            >
              Watch T2V
            </Link>
            <Link
              href="#steps"
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold transition hover:brightness-110"
            >
              Read steps
            </Link>
          </div>
        </div>
      </div>

      {/* TUTORIAL */}
      <div id="tutorial" className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Text to Video sample</h2>
          <p className="text-xs text-white/60">~2 min</p>
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
            {/* Optional captions */}
            {captionTrack ? (
              <track
                src={captionTrack}
                kind="subtitles"
                srcLang="en"
                label="English"
                default
              />
            ) : null}
            Your browser does not support the video tag.
          </video>
        </div>

        <p className="mt-3 text-xs text-white/60">
          man running in the rain at night wearing  raincoat t
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5"></code>.
        </p>
      </div>

      {/* Placeholder for the rest of the guide */}
      <div id="steps" className="mx-auto max-w-5xl px-6 pb-12">
        <h3 className="mb-3 text-lg font-semibold">What you'll learn</h3>
        <ul className="list-disc space-y-1 pl-6 text-sm text-white/85">
          <li>⚡ Example Workflow in Wan 2.1
            Upload style_ref.jpg (an oil painting brushwork sample).

            Prompt: “A futuristic city skyline at dusk with flying cars.”

            Set Style Reference Strength = 0.6.

            Generate → outputs look futuristic, but with oil-paint texture carried from the style ref</li>
          <li>Prompt patterns for faces, outfits and poses</li>
          <li>When to use reference images vs. text-only prompts</li>

        </ul>
      </div>
    </section>
  );
}