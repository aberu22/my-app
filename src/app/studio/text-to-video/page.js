"use client";

import VideoGenerationPanel from "../../components/VideoGenerationPanel";
import AccentBar from "../../components/AccentBar";

export default function TextToVideoPage() {
  return (
    <>
      <header className="mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Text to Video
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate cinematic videos with motion, audio, and control.
        </p>
      </header>

      <AccentBar />

      <section className="mt-4 rounded-2xl bg-zinc-950 ring-1 ring-white/10 p-4">
        <VideoGenerationPanel />
      </section>
    </>
  );
}
