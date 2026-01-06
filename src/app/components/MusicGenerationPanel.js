"use client";

import { useState, useCallback } from "react";
import { useMusicGeneration } from "@/context/MusicGenerationContext";
import { useAuth } from "@/context/AuthContext";
import AccentBar from "./AccentBar";

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */
const MUSIC_COST = 35;

/* ------------------------------------------------------------------ */
/* Track List */
/* ------------------------------------------------------------------ */
function TrackList({ tracks, loading }) {
  if (!tracks?.length && !loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-zinc-500 text-sm">
        Your generated tracks will appear here
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tracks.map((t) => (
        <div
          key={t.id}
          className="rounded-xl bg-zinc-950 ring-1 ring-white/10 p-4"
        >
          <div className="text-sm mb-2">
            {t.title || "Untitled Track"}
          </div>

          {t.audioUrl && (
            <audio controls className="w-full">
              <source src={t.audioUrl} type="audio/mpeg" />
            </audio>
          )}

          <div className="mt-2 text-xs text-zinc-500">
            {Math.round(t.duration || 0)}s · {t.model}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Panel */
/* ------------------------------------------------------------------ */
export default function MusicGenerationPanel({ modelTag = "Suno V5" }) {
  const {
    prompt,
    setPrompt,
    title,
    setTitle,
    style,
    setStyle,
    instrumental,
    setInstrumental,
    loading,
    progressText,
    generatedTracks,
    onGenerateMusic,
  } = useMusicGeneration();

  const { user, credits } = useAuth();

  const [isGen, setIsGen] = useState(false);

  const busy = loading || isGen;
  const notEnoughCredits = (credits ?? 0) < MUSIC_COST;
  const disabled = busy || !user || notEnoughCredits;

  /* ------------------------------------------------------------------ */
  /* Generate */
  /* ------------------------------------------------------------------ */
  const handleGenerate = useCallback(async () => {
    if (!user) {
      alert("Please sign in to generate music.");
      return;
    }

    if (!title.trim()) return alert("Enter a title");
    if (!style.trim()) return alert("Enter a style");
    if (!instrumental && !prompt.trim()) {
      return alert("Enter lyrics");
    }

    if (notEnoughCredits) {
      alert("Not enough credits.");
      return;
    }

    try {
      setIsGen(true);
      await onGenerateMusic();
    } finally {
      setIsGen(false);
    }
  }, [
    user,
    title,
    style,
    prompt,
    instrumental,
    notEnoughCredits,
    onGenerateMusic,
  ]);

  /* ------------------------------------------------------------------ */
  /* Render */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 text-xs border-b border-white/10">
        <div className="text-zinc-400">Custom Mode</div>

        <div className="truncate text-zinc-400 max-w-[40vw]">
          {progressText || "Ready"}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <span className="px-2 py-0.5 rounded bg-white/5 ring-1 ring-white/10">
              Credits: {credits ?? 0}
            </span>
          )}

          <span className="px-2 py-0.5 rounded bg-white/5 ring-1 ring-white/10">
            {modelTag}
          </span>
        </div>
      </header>

      <div className="px-4">
        <AccentBar />
      </div>

      {/* Output */}
      <div className="px-4 pb-48">
        <TrackList tracks={generatedTracks} loading={busy} />
      </div>

      {/* Bottom Dock */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
        <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/90 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">

          {/* Inputs */}
          <div className="p-3 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full h-10 rounded-lg bg-white/5 px-3 text-sm ring-1 ring-white/10"
            />

            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Style (e.g. Modern rap, Ambient, EDM)"
              className="w-full h-10 rounded-lg bg-white/5 px-3 text-sm ring-1 ring-white/10"
            />

            {!instrumental && (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Lyrics…"
                rows={4}
                className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10"
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-3 pb-3 text-xs">
            <button
              onClick={() => setInstrumental((v) => !v)}
              className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
            >
              {instrumental ? "Instrumental" : "With Vocals"}
            </button>

            <button
              onClick={handleGenerate}
              disabled={disabled}
              className="ml-auto h-9 px-4 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-60"
            >
              {busy
                ? "Generating…"
                : !user
                ? "Sign in to generate"
                : notEnoughCredits
                ? "Not enough credits"
                : `Generate (${MUSIC_COST})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
