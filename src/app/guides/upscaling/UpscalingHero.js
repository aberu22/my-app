"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useId, useState } from "react";

/**
 * UpscalingHero (JavaScript / React)
 * - Responsive hero with background image + gradient overlay
 * - Accessible inline video section with optional captions
 * - Clean, editable specs table (pass your own rows)
 *
 * Drop your assets in:
 *   /public/images/...
 *   /public/videos/...
 */

const DEFAULT_SPECS = [
  {
    label: "Supported inputs",
    wan: "Text→Video, Image→Video, TI2V (varies)",
    kling: "Text→Video, Image→Video, first/last-frame",
    veo: "Text, Image; prompt w/ audio desc.",
  },
  {
    label: "Max resolution",
    wan: "Up to ~720p (some 480p modes)",
    kling: "Up to 1080p (Pro)",
    veo: "1080p; 16:9 & 9:16",
  },
  {
    label: "Frame rate",
    wan: "~24 fps",
    kling: "24–30 fps (mode dependent)",
    veo: "~24 fps",
  },
  {
    label: "Max clip length",
    wan: "~10 s",
    kling: "~5–10 s (Pro)",
    veo: "~8 s (varies by plan)",
  },
  {
    label: "Audio generation",
    wan: "No (add separately)",
    kling: "Limited/none (external audio)",
    veo: "Yes (dialogue/ambient/effects)",
  },
];

export default function UpscalingHero({
  title = "Wan 2.2 Demo",
  tag = "demo",
  coverSrc = "/images/com.jpg",
  videoSrc = "/videos/tut3.mp4",
  posterSrc = "/images/com.jpg",
  captionTrack = null,
  durationLabel = "~90 seconds",
  primaryCtaHref = "#tutorial",
  primaryCtaLabel = "Watch demo",
  secondaryCtaHref = "#steps",
  secondaryCtaLabel = "Read specs",
  priorityImage = true,
  specs = DEFAULT_SPECS,
}) {
  const headingId = useId();
  const [videoError, setVideoError] = useState(null);

  return (
    <section aria-labelledby={headingId} className="relative w-full text-white">
      {/* HERO */}
      <div className="relative flex h-[60vh] w-full items-center justify-center overflow-hidden">
        {/* Background image */}
        <Image
          src={coverSrc}
          alt="Background cover for upscaling demo"
          fill
          priority={priorityImage}
          sizes="100vw"
          className="object-cover"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge className="mb-4 border-none bg-purple-600/80">{tag}</Badge>
          <h1 id={headingId} className="mb-4 text-4xl font-bold md:text-5xl">
            {title}
          </h1>

          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href={primaryCtaHref}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryCtaHref}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>

      {/* TUTORIAL */}
      <div id="tutorial" className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick comparison: Wan 2.2, Kling AI, Veo 3
          </h2>
          <p className="text-xs text-white/70">{durationLabel}</p>
        </div>

        <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow">
          <video
            controls
            playsInline
            preload="metadata"
            poster={posterSrc}
            className="h-auto w-full"
            onError={() => setVideoError("Could not load the demo video. Check the src path.")}
          >
            <source src={videoSrc} type="video/mp4" />
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
          {videoError ? (
            <figcaption className="px-4 py-3 text-sm text-red-300">
              {videoError}
            </figcaption>
          ) : null}
        </figure>

        <p className="mt-3 text-xs text-white/70">
          Tip: keep your source image noise low before upscaling. Store your demo at
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5">/public/videos/tut3.mp4</code>.
        </p>
      </div>

      {/* SPECS */}
      <div id="steps" className="mx-auto max-w-5xl px-6 pb-14">
        <h3 className="mb-4 text-lg font-semibold">Specs</h3>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-4 bg-white/5 text-sm font-medium">
            <div className="px-4 py-3">Spec</div>
            <div className="px-4 py-3">Wan 2.2</div>
            <div className="px-4 py-3">Kling AI</div>
            <div className="px-4 py-3">Veo 3</div>
          </div>
          <dl className="divide-y divide-white/10">
            {specs.map((row, i) => (
              <div
                key={row.label + i}
                className="grid grid-cols-4 bg-white/[0.03] odd:bg-transparent"
              >
                <dt className="px-4 py-3 text-sm text-white/90">{row.label}</dt>
                <dd className="px-4 py-3 text-xs text-white/80">{row.wan}</dd>
                <dd className="px-4 py-3 text-xs text-white/80">{row.kling}</dd>
                <dd className="px-4 py-3 text-xs text-white/80">{row.veo}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="mt-6 list-disc space-y-1 pl-6 text-sm text-white/85">
          <li>Combine upscaling with denoise/refine passes.</li>
          <li>Pick face‑aware vs. texture‑aware upscalers based on subject.</li>
          <li>For motion content, keep shutter/blur consistent before scaling.</li>
        </ul>
      </div>
    </section>
  );
}
