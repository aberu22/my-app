"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function StyleReferenceHero({
  title = "Nsfw Text to Video Demo",
  tag = "Style Reference",
  coverSrc = "/images/image6.jpg",
  // NSFW demo assets (put these files under /public/videos & /public/images)
  videoSrc = "/videos/vid2.mp4",
  posterSrc = "/images/dt1.jpg",
  captionTrack = "", // e.g. "/videos/style-ref-demo.vtt"
  consentKey = "nsfwConsent:style-reference", // localStorage key
}) {
  const [allowed, setAllowed] = useState(false);
  const [checked, setChecked] = useState(false);

  // read saved consent once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(consentKey);
      if (saved === "yes") setAllowed(true);
    } catch {}
  }, [consentKey]);

  const confirm18 = () => {
    setAllowed(true);
    try {
      localStorage.setItem(consentKey, "yes");
    } catch {}
  };

  return (
    <section className="relative w-full text-white">
      {/* HERO */}
      <div className="relative flex h-[60vh] w-full items-center justify-center">
        <Image
          src={coverSrc}
          alt="Style Reference Guide Cover"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />

        <div className="relative z-10 max-w-3xl px-6 text-center">
          <Badge className="mb-4 bg-pink-600/80 border-none">{tag}</Badge>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{title}</h1>
          <p className="text-lg text-white/80">
            Discover how the quality of text to video from wan 2.2 engine does nsfw. Cinematic
          </p>
        </div>
      </div>

      {/* TUTORIAL (NSFW-gated) */}
      <div id="tutorial" className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Demo (18+)</h2>
          <p className="text-xs text-white/60">Sensitive content</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow">
          {/* When NOT allowed: show a gated cover (no <video> element at all) */}
          {!allowed ? (
            <div className="relative">
              {/* Static cover so no NSFW frames ever load before consent */}
              <Image
                src={posterSrc}
                alt="Content warning cover"
                width={1280}
                height={720}
                className="w-full h-auto object-cover opacity-60"
                priority={false}
              />

              {/* Gate overlay */}
              <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm p-6">
                <div className="max-w-md rounded-xl border border-white/15 bg-zinc-900/80 p-5 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                    18+
                  </div>
                  <h3 className="text-lg font-semibold">Adult Content Ahead</h3>
                  <p className="mt-2 text-sm text-white/80">
                    This Demo may contain nudity or otherwise sensitive material. You must be at least{" "}
                    <span className="font-semibold">18 years old</span> to view it.
                  </p>

                  <label className="mt-4 flex items-center justify-center gap-2 text-xs text-white/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-pink-500"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                    />
                    I confirm I am 18 or older.
                  </label>

                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      disabled={!checked}
                      onClick={confirm18}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                        checked
                          ? "bg-white text-black hover:brightness-110"
                          : "bg-white/40 text-black/60 cursor-not-allowed"
                      }`}
                    >
                      I’m 18+ — show video
                    </button>
                    <a
                      href="#"
                      className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
                    >
                      Cancel
                    </a>
                  </div>

                  <p className="mt-3 text-[11px] text-white/60">
                    We won’t show this again on this device after you confirm.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Allowed: render the actual <video>
            <video
              controls
              playsInline
              preload="metadata"
              poster={posterSrc}
              className="h-auto w-full"
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
          )}
        </div>

        <p className="mt-3 text-xs text-white/60">
          We restrict sensitive previews by default. Click “I’m 18+” to load the tutorial video.
        </p>
      </div>
    </section>
  );
}
