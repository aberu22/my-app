"use client";

import { useState, useCallback, useMemo } from "react";
import { useMusicGeneration } from "@/context/MusicGenerationContext";
import { useAuth } from "@/context/AuthContext";
import AccentBar from "./AccentBar";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */
const MUSIC_COST = 35;

/* ------------------------------------------------------------------ */
/* Small UI Bits */
/* ------------------------------------------------------------------ */
function StatusPill({ busy, text }) {
  return (
    <div className="flex items-center gap-2 text-zinc-400">
      <span
        className={[
          "h-2 w-2 rounded-full",
          busy ? "bg-emerald-400 animate-pulse" : "bg-zinc-500",
        ].join(" ")}
      />
      <span className="truncate max-w-[44vw]">{text || "Idle"}</span>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10 text-zinc-300">
      {children}
    </span>
  );
}

function PrimaryButton({ disabled, busy, children, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "ml-auto h-10 px-6 rounded-full font-medium",
        "bg-white text-black hover:bg-zinc-200",
        "active:scale-[0.98] transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        busy ? "animate-pulse" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ChipToggle({ onClick, active, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-4 h-8 rounded-full text-xs transition",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        active
          ? "bg-white text-black"
          : "bg-white/5 ring-1 ring-white/10 text-zinc-300 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Track List */
/* ------------------------------------------------------------------ */


function TrackList({ tracks, loading, onDelete }) {
  if (!tracks?.length && !loading) {
    return (
      <div className="flex items-center justify-center h-[52vh]">
        <div className="max-w-md text-center">
          <div className="text-zinc-200 font-medium">No tracks yet</div>
          <div className="mt-2 text-sm text-zinc-500">
            Generate your first track using the dock below. Your results will
            show up here as playable artifacts.
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left text-xs">
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4">
              <div className="text-zinc-200 font-medium">Tip</div>
              <div className="mt-1 text-zinc-500">
                Try a clear genre + mood: “Ambient cinematic, warm pads, slow
                build”.
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4">
              <div className="text-zinc-200 font-medium">Tip</div>
              <div className="mt-1 text-zinc-500">
                Add structure: Verse / Chorus / Bridge for more coherent songs.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const togglePublish = async (track) => {
    try {
      await updateDoc(doc(db, "music", track.id), {
        isPublic: !track.isPublic,
      });
    } catch (err) {
      console.error("Failed to toggle publish:", err);
      alert("Failed to update publish status.");
    }
  };

  return (
    <div
      className={[
        "transition",
        loading ? "opacity-70 pointer-events-none" : "opacity-100",
      ].join(" ")}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(tracks || []).map((t) => (
          <div
            key={t.id}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/6 to-white/[0.02] ring-1 ring-white/10 p-4 transition hover:ring-white/20"
          >
            {/* Hover sheen */}
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
              <div className="absolute -inset-24 rotate-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent blur-2xl" />
            </div>

            <div className="relative space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium tracking-wide truncate">
                    {t.title || "Untitled Track"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {Math.round(t.duration || 0)}s · {t.model || "Model"}
                  </div>
                </div>

                {t.isPublic ? (
                  <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    Public
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-white/5 ring-1 ring-white/10 text-zinc-300">
                    Private
                  </span>
                )}
              </div>

              {/* Audio */}
              {t.audioUrl ? (
                <audio controls className="w-full">
                  <source src={t.audioUrl} type="audio/mpeg" />
                </audio>
              ) : (
                <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/10 p-3 text-xs text-zinc-500">
                  No audio URL available for this track.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {/* Download */}
                <a
                  href={t.audioUrl}
                  download={t.storagePath.split("/").pop()}
                  className="text-xs px-3 py-1.5 rounded-full
                            bg-white/5 ring-1 ring-white/10
                            hover:bg-white/10 transition"
                >
                  Download
                </a>


                {/* Delete */}
                  <button
                    onClick={() => onDelete(t)}
                    className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/20 hover:bg-red-500/20 transition"
                  >
                    Delete
                  </button>

                {/* Publish toggle */}
                <button
                  onClick={() => togglePublish(t)}
                  className="ml-auto text-xs px-3 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 transition"
                >
                  {t.isPublic ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
    deleteMusicTrack
  } = useMusicGeneration();

  const { user, credits } = useAuth();

  const [isGen, setIsGen] = useState(false);

  const busy = loading || isGen;
  const notEnoughCredits = (credits ?? 0) < MUSIC_COST;
  const disabled = busy || !user || notEnoughCredits;

  const helperText = useMemo(() => {
    if (!user) return "Sign in to generate";
    if (notEnoughCredits) return "Not enough credits";
    if (busy) return "Generating…";
    return `Generate (${MUSIC_COST})`;
  }, [user, notEnoughCredits, busy]);

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
    if (!instrumental && !prompt.trim()) return alert("Enter lyrics");

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
  }, [user, title, style, prompt, instrumental, notEnoughCredits, onGenerateMusic]);

  /* ------------------------------------------------------------------ */
  /* Render */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen text-zinc-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black">
      {/* Ambient overlays */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
        <div className="absolute -top-40 left-1/2 h-80 w-[70vw] -translate-x-1/2 rounded-full bg-white/[0.04] blur-3xl" />
      </div>

      {/* Top Bar (HUD) */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 text-xs backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="text-zinc-400">Custom Mode</div>

        <StatusPill busy={busy} text={progressText || "Ready"} />

        <div className="flex items-center gap-2">
          {user && <Pill>Credits: {credits ?? 0}</Pill>}
          <Pill>{modelTag}</Pill>
        </div>
      </header>

      {/* Accent */}
      <div className="relative z-10 px-4">
        <AccentBar />
      </div>

      {/* Output */}
      <main className="relative z-10 px-4 pb-56">
        <div className="mx-auto w-full max-w-5xl pt-6">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Music Artifacts
              </div>
              <div className="text-sm text-zinc-500">
                Create tracks from prompts, styles, and lyrics.
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/[0.03] ring-1 ring-white/10 text-zinc-400">
                Cost: {MUSIC_COST} credits
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.03] ring-1 ring-white/10 text-zinc-400">
                Mode: {instrumental ? "Instrumental" : "With Vocals"}
              </span>
            </div>
          </div>

          <TrackList tracks={generatedTracks} loading={busy}onDelete={deleteMusicTrack}/>
        </div>
      </main>

      {/* Bottom Dock */}
      <div className="fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
        <div className="w-full max-w-4xl rounded-3xl bg-zinc-950/80 ring-1 ring-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Dock header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="text-xs text-zinc-400">
              Create · Style · Generate
            </div>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span className="rounded-full bg-white/5 ring-1 ring-white/10 px-2 py-1">
                {user ? "Signed in" : "Guest"}
              </span>
              <span className="rounded-full bg-white/5 ring-1 ring-white/10 px-2 py-1">
                {busy ? "Working" : "Ready"}
              </span>
            </div>
          </div>

          {/* Inputs */}
          <div className="px-4 pb-3 space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              disabled={busy}
              className="w-full h-10 rounded-xl bg-white/5 px-3 text-sm ring-1 ring-white/10 focus:ring-white/30 focus:bg-white/10 transition disabled:opacity-60"
            />

            <input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="Style (e.g. Modern rap, Ambient, EDM)"
              disabled={busy}
              className="w-full h-10 rounded-xl bg-white/5 px-3 text-sm ring-1 ring-white/10 focus:ring-white/30 focus:bg-white/10 transition disabled:opacity-60"
            />

            {!instrumental && (
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Lyrics…"
                rows={4}
                disabled={busy}
                className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm ring-1 ring-white/10 focus:ring-white/30 focus:bg-white/10 transition resize-none disabled:opacity-60"
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <ChipToggle
              onClick={() => setInstrumental((v) => !v)}
              active={instrumental}
              disabled={busy}
            >
              {instrumental ? "Instrumental" : "With Vocals"}
            </ChipToggle>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-zinc-500">
                {user
                  ? notEnoughCredits
                    ? `Need ${MUSIC_COST} credits`
                    : `Will cost ${MUSIC_COST}`
                  : "Sign in required"}
              </span>

              <PrimaryButton disabled={disabled} busy={busy} onClick={handleGenerate}>
                {helperText}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade so content doesn’t clash with dock */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
    </div>
  );
}
