"use client";

import { Suspense } from "react";
import MusicGenerationPanel from "../components/MusicGenerationPanel";
import AccentBar from "../components/AccentBar";
import { MusicGenerationProvider } from "@/context/MusicGenerationContext";

export default function MusicPage() {
  return (
    <MusicGenerationProvider>
      <>
        <header className="mb-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Text to Music
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Generate AI music with style, mood, and control.
          </p>
        </header>

        <AccentBar />

        <section className="mt-4 rounded-2xl bg-zinc-950 ring-1 ring-white/10 p-4">
          <Suspense fallback={null}>
            <MusicGenerationPanel />
          </Suspense>
        </section>
      </>
    </MusicGenerationProvider>
  );
}
