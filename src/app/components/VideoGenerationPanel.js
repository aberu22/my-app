// app/components/VideoGenerationPanel.js
"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Upload, Settings, X, BookOpen } from "lucide-react";
import LoraTemplateGrid from "./LoraTemplateGrid";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import VideoPlayer from "./VideoPlayer";
import VideoActionMenu from "./VideoActionMenu";

import { useSearchParams } from "next/navigation";
import { getVideoCreditCost } from "@/lib/frontendCreditCosts";
import { uploadSeedanceImage } from "@/lib/uploadSeedanceImage";
import VideoModelModal from "./VideoModelModal";





/* ------------------------------ utils: focus trap ------------------------------ */
function useFocusTrap(enabled, containerRef) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;
    const root = containerRef.current;

    const getFocusable = () =>
      Array.from(
        root.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const nodes = getFocusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [enabled, containerRef]);
}

/* ------------------------------ Spellbook Modal ------------------------------ */
function SpellbookModal({ open, onClose, onInsert }) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const [tab, setTab] = useState("Lighting");

  useFocusTrap(open, dialogRef);

  // 🔒 Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ⌨️ ESC + outside click handling
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    const onDown = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, { passive: true });

    // focus dialog on open
    setTimeout(() => dialogRef.current?.focus?.(), 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, onClose]);

  const lighting = [
    { label: "Daylight", img: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop" },
    { label: "Artificial Light", img: "https://images.unsplash.com/photo-1497015289631-2bf9a44a2c30?q=80&w=600&auto=format&fit=crop" },
    { label: "Moonlight", img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=600&auto=format&fit=crop" },
    { label: "Fluorescent Light", img: "https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=600&auto=format&fit=crop" },
    { label: "Overcast Light", img: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=600&auto=format&fit=crop" },
    { label: "Sunny Light", img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=600&auto=format&fit=crop" },
    { label: "Soft Light", img: "https://images.unsplash.com/photo-1520975922284-7b683c7c0415?q=80&w=600&auto=format&fit=crop" },
    { label: "Top Light", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop" },
    { label: "Side Light", img: "https://images.unsplash.com/photo-1520975934955-9f8a6c80d0da?q=80&w=600&auto=format&fit=crop" },
    { label: "Back Light", img: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=600&auto=format&fit=crop" },
    { label: "Bottom Light", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600&auto=format&fit=crop" },
    { label: "Silhouette", img: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600&auto=format&fit=crop" },
  ];

  const tabs = ["Lighting", "Camera&Lenses", "Camera Movement", "Style"];

  return (
    <div
      ref={overlayRef}
      aria-hidden={!open}
      className={`
        fixed inset-0 z-[60] bg-black/80 backdrop-blur-md transition-opacity
        ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
      `}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Spellbook"
        className="
          fixed left-1/2 bottom-[120px] z-[61]
          w-[min(1100px,92vw)]
          -translate-x-1/2
          overflow-hidden
          rounded-3xl
          border border-zinc-800/80
          bg-gradient-to-br from-[#050814] via-black to-[#050814]
          shadow-[0_24px_160px_rgba(0,0,0,0.85)]
          ring-1 ring-cyan-500/20
          focus:outline-none
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-zinc-100">
          <div className="text-sm font-semibold tracking-tight">
            Prompt Spellbook
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-6 overflow-x-auto border-y border-zinc-800/80 bg-black/60 px-6 text-sm text-zinc-300"
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`relative px-1 py-3 text-xs font-medium uppercase tracking-wide ${
                tab === t
                  ? "text-cyan-300"
                  : "text-zinc-500 hover:text-zinc-100"
              }`}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-0 -bottom-px mx-auto h-[3px] w-16 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400 shadow-[0_0_22px_rgba(56,189,248,0.95)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 pt-4">
          {tab === "Lighting" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {lighting.map((it) => (
                <button
                  key={it.label}
                  onClick={() => onInsert(` ${it.label.toLowerCase()} lighting`)}
                  className="group overflow-hidden rounded-2xl border border-zinc-800/80 bg-black/60 text-left transition hover:border-cyan-500/70 hover:bg-black/80"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={it.img}
                      alt={it.label}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-100">
                    <span>{it.label}</span>
                    <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-cyan-300">
                      Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800/80 bg-black/70 p-6 text-sm text-zinc-400">
              Templates for “{tab}” will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Spinner (bottom, Sora-style) -------------------- */

function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full
        border-2 border-white/30 border-t-white ${className}`}
      aria-hidden
    />
  );
}



/* -------------------- Prompt Dock (bottom, Sora-style) -------------------- */
function PromptDock({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  videoMode,
  setVideoMode,
  fps,
  setFps,
  duration,
  setDuration,
  onGenerate,
  busy,
  onUpload,
  fileInputRef,
  onDockKeyDown,
  onDockDrop,
  previewUrl,
  onClearImage,
  setCatalog,
  setShowLoraModal,
  selectedLoras = [],
  onRemoveLora,
  jobProgress,
  jobProgressText,
  etaSeconds,
  cancelPoll,
  currentJobId,
  videoModel,        
  setVideoModel,
   resolution,
  setResolution,
  credits,
  estimatedCredits,
  aspectRatio,
setAspectRatio,
modelOpen,
setModelOpen
  
}) {
  const [openFnMenu, setOpenFnMenu] = useState(false);
  const fnButtonRef = useRef(null);
  const [openDur, setOpenDur] = useState(false);
  const [openFps, setOpenFps] = useState(false);
  const durRef = useRef(null);
  const fpsRef = useRef(null);
  const [showSpellbook, setShowSpellbook] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);



const durationOptions =
  videoModel === "seedance"
    ? [4, 8, 12]
    : videoModel === "wan-2.6"
    ? ["5", "10", "15"]
    : [2, 4, 6, 8, 10];



    const resolutionOptions =
  videoModel === "seedance"
    ? ["480p", "720p"]
    : videoModel === "wan-2.6"
    ? ["720p", "1080p"]
    : ["720p"]; // wan 2.2: keep simple for now


    useEffect(() => {
  if (!resolutionOptions.includes(resolution)) {
    setResolution(resolutionOptions[0]);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [videoModel]);




    const wan26DurationOptions = ["5", "10", "15"];


  const fpsOptions = [12, 16, 24];
  const [durIdx, setDurIdx] = useState(
    Math.max(0, durationOptions.indexOf(duration))
  );
  const [fpsIdx, setFpsIdx] = useState(Math.max(0, fpsOptions.indexOf(fps)));

  const formatEta = (seconds) => {
  if (!seconds) return null;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};


  const toggleMode = (mode) => {
    setVideoMode(mode);
    setOpenFnMenu(false);
  };
  const insertFromSpellbook = (text) => {
    setPrompt((p) =>
      `${p}${p && !p.endsWith(" ") ? " " : ""}${text}`.trim()
    );
    setShowSpellbook(false);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenDur(false);
        setOpenFps(false);
        setOpenFnMenu(false);
      }
    };
    const onDown = (e) => {
      if (openDur && durRef.current && !durRef.current.contains(e.target))
        setOpenDur(false);
      if (openFps && fpsRef.current && !fpsRef.current.contains(e.target))
        setOpenFps(false);
      if (
        openFnMenu &&
        fnButtonRef.current &&
        !fnButtonRef.current.closest("div")?.contains(e.target)
      )
        setOpenFnMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [openDur, openFps, openFnMenu]);

  const onDurKey = (e) => {
    if (!openDur) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next =
        (durIdx + dir + durationOptions.length) % durationOptions.length;
      setDurIdx(next);
      setDuration(durationOptions[next]);
    }
    if (e.key === "Enter") setOpenDur(false);
  };
  const onFpsKey = (e) => {
    if (!openFps) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const next = (fpsIdx + dir + fpsOptions.length) % fpsOptions.length;
      setFpsIdx(next);
      setFps(fpsOptions[next]);
    }
    if (e.key === "Enter") setOpenFps(false);
  };

  useEffect(() => {
    setDurIdx(Math.max(0, durationOptions.indexOf(duration)));
  }, [duration]);
  useEffect(() => {
    setFpsIdx(Math.max(0, fpsOptions.indexOf(fps)));
  }, [fps]);


const fpsDisabled =
  videoModel === "seedance" || videoModel === "wan-2.6";



  return (
  <div
    className="w-full"
    onKeyDown={onDockKeyDown}
    onDrop={onDockDrop}
    onDragOver={(e) => e.preventDefault()}
  >
    <Card
      className="
        relative
        rounded-[26px]
        border border-white/10
        bg-gradient-to-b from-zinc-900/70 via-zinc-900/60 to-zinc-950/80
        backdrop-blur-2xl
        shadow-[0_30px_120px_rgba(0,0,0,0.85)]
        ring-1 ring-white/5
      "
    >
      {/* top chrome highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <CardContent className="p-0">
        {/* Top row */}
        <div className="flex items-center justify-between gap-3 px-5 pt-4 text-zinc-200">
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-zinc-300/80" />
            <span className="uppercase tracking-[0.22em]">Generate</span>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full border border-white/10 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800/70"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Image-to-video upload */}
        {videoMode === "image-to-video" && (
          <div className="flex items-start gap-4 px-5 pb-4 pt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="
                relative flex h-24 w-24 shrink-0 items-center justify-center
                overflow-hidden rounded-2xl
                border border-white/10
                bg-zinc-900/60
                text-zinc-200
                backdrop-blur-md
                transition
                hover:bg-zinc-800/70
              "
              aria-label="Upload first frame"
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-100">
                    First frame
                  </span>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearImage();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onClearImage();
                      }
                    }}
                    className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/70 p-1 hover:bg-black"
                    aria-label="Remove image"
                  >
                    <X className="h-3.5 w-3.5" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-xs">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/60 border border-white/10">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] text-zinc-200">
                    Drop or upload
                  </span>
                  <span className="text-[10px] text-zinc-500">First frame</span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onUpload}
              />
            </button>

            <div className="space-y-1 pt-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-300 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                <span>Image to video</span>
              </div>
              <div className="text-sm font-medium text-zinc-50">
                Use an image as the opening shot
              </div>
              <div className="text-xs text-zinc-500">
                Upload a single frame and describe how the scene should evolve.
              </div>
            </div>
          </div>
        )}

        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Prompt area */}
        <div className="px-5 py-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Scene description
            </span>
            <span className="text-[11px] text-zinc-500">
              e.g. “A cinematic tracking shot through neon-lit Tokyo at night…”
            </span>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              videoMode === "image-to-video"
                ? "Describe how the scene should move and evolve from the first frame..."
                : "Describe the dynamic scene you want to generate as a video..."
            }
            className="
              min-h-[96px]
              resize-none
              rounded-2xl
              border border-white/10
              bg-zinc-900/60
              px-4 py-3
              text-sm text-zinc-100
              placeholder:text-zinc-500
              shadow-inner
              focus-visible:outline-none
              focus-visible:ring-1
              focus-visible:ring-white/20
            "
            aria-label="Prompt"
          />
        </div>

        {/* Selected LoRAs preview chips */}
        {selectedLoras?.length > 0 && (
          <div className="px-5 pb-2">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                Templates active
              </div>
              <div className="text-[11px] text-zinc-500">Click a chip to remove</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedLoras.map((tpl) => (
                <button
                  key={tpl.model}
                  type="button"
                  onClick={() => onRemoveLora?.(tpl.model)}
                  className="
                    group inline-flex items-center gap-2 rounded-full
                    border border-white/10
                    bg-zinc-900/60
                    px-2.5 py-1
                    text-[11px] text-zinc-100
                    backdrop-blur-md
                    hover:bg-zinc-800/70
                    transition
                  "
                  title="Click to remove this template"
                >
                  {tpl.thumbnail && (
                    <span className="h-5 w-5 overflow-hidden rounded-full border border-white/10">
                      <img
                        src={tpl.thumbnail}
                        alt={tpl.name || tpl.model}
                        className="h-full w-full object-contain"
                      />
                    </span>
                  )}
                  <span className="max-w-[120px] truncate">
                    {tpl.name || tpl.model}
                  </span>
                  <span className="ml-1 rounded-full bg-black/50 px-1.5 py-0.5 text-[9px] text-zinc-300 group-hover:bg-white group-hover:text-black">
                    ✕
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Advanced prompt toggle */}
        <div className="px-5 pb-2">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="
              inline-flex items-center gap-2 rounded-full
              border border-white/10
              bg-zinc-900/60
              px-3 py-1.5
              text-[11px] text-zinc-300
              hover:bg-zinc-800/70
              transition
            "
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/10 text-[10px]">
              {showAdvanced ? "−" : "+"}
            </span>
            <span>Advanced prompt (negative / control)</span>
          </button>
        </div>

        {showAdvanced && (
          <div className="px-5 pb-3">
            <Textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="What should the model avoid? (e.g. flicker, distortion, extra limbs, glitches...)"
              className="
                min-h-[64px]
                resize-none
                rounded-2xl
                border border-white/10
                bg-zinc-900/60
                px-4 py-3
                text-xs text-zinc-100
                placeholder:text-zinc-500
                shadow-inner
                focus-visible:outline-none
                focus-visible:ring-1
                focus-visible:ring-white/20
              "
              aria-label="Negative prompt"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              We use this to steer the model away from artifacts or unwanted styles.
            </p>
          </div>
        )}

        {/* Controls + Generate */}
        <div className="flex flex-col gap-3 border-t border-white/10 px-5 pb-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex flex-wrap items-center gap-3">
            {/* Mode pill / menu */}
            <div className="flex items-center gap-1 rounded-full bg-zinc-900/60 p-1 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => toggleMode("text-to-video")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  videoMode === "text-to-video"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                Text → Video
              </button>
              <button
                type="button"
                onClick={() => toggleMode("image-to-video")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  videoMode === "image-to-video"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                Image → Video
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-zinc-900/60 p-1 border border-white/10">
            </div>

            <button
              type="button"
              onClick={() => setModelOpen(true)}
              className="
                inline-flex items-center gap-2
                rounded-full
                bg-zinc-900/80
                px-4 py-2
                text-sm font-medium text-white
                border border-white/10
                backdrop-blur-md
                shadow-[0_4px_20px_rgba(0,0,0,0.4)]
                hover:bg-zinc-800/80
                hover:border-white/20
                transition
              "
            >
              <span>
                {videoModel === "wan-2.2" && "Wan 2.2"}
                {videoModel === "wan-2.6" && "Wan 2.6"}
                {videoModel === "seedance" && "Seedance 1.5 Pro"}
              </span>

              {/* caret */}
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${
                  modelOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>








             



            {/* Model / resolution badges */}

            {/* Resolution */}
            <div className="relative">
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="
                  appearance-none rounded-full bg-zinc-900/60
                  px-4 py-1.5 text-xs text-zinc-200
                  border border-white/10
                  hover:bg-zinc-800/70 transition
                  focus:outline-none
                "
              >
                {resolutionOptions.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>


        



            {/* Aspect Ratio */}
              <div className="flex items-center gap-1 rounded-full bg-zinc-900/60 p-1 border border-white/10">
                {["1:1", "16:9"].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      aspectRatio === ratio
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>



        


    
            
           

            {/* Duration */}
            <div ref={durRef} className="relative" onKeyDown={onDurKey}>
              <button
                type="button"
                onClick={() => setOpenDur((v) => !v)}
                className="rounded-full bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-200 border border-white/10 hover:bg-zinc-800/70 transition"
                aria-haspopup="listbox"
                aria-expanded={openDur}
                aria-activedescendant={
                  openDur ? `duration-${durationOptions[durIdx]}` : undefined
                }
              >
                {duration || 5}s
              </button>

              {openDur && (
                <div
                  className="
                    absolute bottom-[115%] left-0 z-50 min-w-[180px]
                    rounded-2xl border border-white/10
                    bg-zinc-950/90 backdrop-blur-xl
                    p-2 text-zinc-100 shadow-2xl
                  "
                  role="listbox"
                  aria-label="Duration"
                >
                  {durationOptions.map((sec) => (
                    <button
                      key={sec}
                      id={`duration-${sec}`}
                      type="button"
                      onClick={() => {
                        setDuration(sec);
                        setDurIdx(durationOptions.indexOf(sec));
                        setOpenDur(false);
                      }}
                      role="option"
                      aria-selected={duration === sec}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
                    >
                      <span>{sec}s</span>
                      {duration === sec && <span className="text-zinc-100">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* FPS */}

            {/* FPS */}

            {/* FPS */}
<div ref={fpsRef} className="relative" onKeyDown={onFpsKey}>
  {/*
    FPS is only supported by Wan 2.2.
    Seedance 1.5 + Wan 2.6 must disable this control.
  */}
  {(() => {
    const fpsDisabled =
      videoModel === "seedance" || videoModel === "wan-2.6";

    return (
      <>
        <button
          type="button"
          disabled={fpsDisabled}
          onClick={() => {
            if (fpsDisabled) return;
            setOpenFps((v) => !v);
          }}
          className={`
            rounded-full px-3 py-1.5 text-xs border transition
            ${
              fpsDisabled
                ? "bg-zinc-900/40 text-zinc-500 border-white/5 cursor-not-allowed"
                : "bg-zinc-900/60 text-zinc-200 border-white/10 hover:bg-zinc-800/70"
            }
          `}
          aria-haspopup="listbox"
          aria-expanded={openFps && !fpsDisabled}
          aria-disabled={fpsDisabled}
          aria-activedescendant={
            openFps && !fpsDisabled ? `fps-${fpsOptions[fpsIdx]}` : undefined
          }
        >
          {fps || 24} fps
        </button>

        {/* FPS dropdown (Wan 2.2 only) */}
        {openFps && !fpsDisabled && (
          <div
            className="
              absolute bottom-[115%] left-0 z-50 min-w-[180px]
              rounded-2xl border border-white/10
              bg-zinc-950/90 backdrop-blur-xl
              p-2 text-zinc-100 shadow-2xl
            "
            role="listbox"
            aria-label="FPS"
          >
            {fpsOptions.map((val) => (
              <button
                key={val}
                id={`fps-${val}`}
                type="button"
                onClick={() => {
                  setFps(val);
                  setFpsIdx(fpsOptions.indexOf(val));
                  setOpenFps(false);
                }}
                role="option"
                aria-selected={fps === val}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5"
              >
                <span>{val} fps</span>
                {fps === val && (
                  <span className="text-zinc-100">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </>
    );
  })()}
</div>



           

            {/* Spellbook */}
            <button
              type="button"
              onClick={() => setShowSpellbook(true)}
              className="
                inline-flex items-center gap-1 rounded-full
                bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-200
                border border-white/10
                hover:bg-zinc-800/70 transition
              "
              aria-label="Open templates"
              title="Prompt Spellbook"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Spellbook</span>
            </button>

            {/* SFW / NSFW selectors */}
            <div className="flex overflow-hidden rounded-full bg-zinc-900/60 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setCatalog("sfw");
                  setShowLoraModal(true);
                }}
                className="px-3 py-1.5 text-[11px] text-zinc-200 hover:bg-white/5 transition"
              >
                SFW
              </button>
              <button
                type="button"
                onClick={() => {
                  setCatalog("nsfw");
                  setShowLoraModal(true);
                }}
                className="border-l border-white/10 px-3 py-1.5 text-[11px] text-zinc-200 hover:bg-white/5 transition"
              >
                NSFW
              </button>
            </div>
          </div>

          {/* Generate */}
          {/* Generate / Progress */}
<div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
  {/* Progress bar */}
  {busy && (
    <div className="flex w-full max-w-[260px] flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-zinc-400">
        <span>{jobProgressText || "Processing…"}</span>
        {etaSeconds && (
          <span className="text-zinc-500">
            ETA {formatEta(etaSeconds)}
          </span>
        )}
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="
            h-full rounded-full
            bg-gradient-to-r from-sky-400 via-cyan-300 to-violet-400
            transition-all duration-300
          "
          style={{ width: `${Math.max(2, jobProgress || 2)}%` }}
        />
      </div>
    </div>
  )}

  {/* Generate / Cancel button */}
  {!busy ? (

    <Button
  type="button"
  onClick={onGenerate}
  disabled={busy || credits < estimatedCredits}
  className={`
    h-11 rounded-full px-6
    text-sm font-semibold
    transition
    ${
      credits < estimatedCredits
        ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
        : "bg-white text-black hover:bg-zinc-100 shadow-[0_0_40px_rgba(255,255,255,0.25)]"
    }
  `}
>
  {credits < estimatedCredits
    ? `Need ${estimatedCredits - credits} more credits`
    : `Generate · ${estimatedCredits} credits`}
</Button>

  
  ) : (

    <Button
  type="button"
  onClick={() => currentJobId && cancelPoll(currentJobId)}
  className="
    h-11 rounded-full
    bg-zinc-900 px-6
    text-sm font-semibold text-zinc-100
    ring-1 ring-red-500/40
    hover:bg-red-950/60
    hover:ring-red-500
    transition
    inline-flex items-center gap-2
  "
>
  <Spinner className="opacity-70" />
  <span>Cancel</span>
</Button>

  
  )}
</div>

          
         
        </div>
      </CardContent>

      {/* bottom chrome */}
      <div className="pointer-events-none absolute inset-x-6 bottom-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </Card>

    <SpellbookModal
      open={showSpellbook}
      onClose={() => setShowSpellbook(false)}
      onInsert={insertFromSpellbook}
    />
  </div>
);
}

 

/* -------------------- Fixed bottom dock portal -------------------- */
function DockLayer({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-[1200px]">
        {children}
      </div>
    </div>,
    document.body
  );
}

/* -------------------- FULL-SCREEN DETAIL MODAL -------------------- */
function VideoDetailModal({ open, video, onClose, videoMode, onUseTemplate }) {
  const [openActions, setOpenActions] = useState(false);

  // ✅ BONUS: close action menu on outside click
  useEffect(() => {
    if (!openActions) return;

    const close = () => setOpenActions(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [openActions]);

  if (!open || !video) return null;

  const createdAtLabel = video.createdAt
    ? new Date(video.createdAt).toLocaleString()
    : "";

  return createPortal(
    <div className="fixed inset-0 z-[90] flex bg-gradient-to-b from-black via-black-950 to-black">
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-[92] inline-flex h-9 items-center justify-center rounded-full bg-black/80 px-3 text-xs font-medium text-zinc-100 shadow-lg hover:bg-black/95"
      >
        <span className="mr-1 text-lg leading-none">‹</span>
        <span>Back to studio</span>
      </button>

      {/* Main content */}
      <div className="flex h-full w-full items-center justify-center px-6 lg:px-12">
        {/* Centered tall video */}
        <div className="flex flex-1 items-center justify-center">
          <div className="relative max-w-[90vw] max-h-[80vh] w-full flex items-relative center justify-center overflow-hidden rounded-[28px] border border-zinc-700/80 bg-black/60 shadow-[0_40px_140px_rgba(0,0,0,0.95)]">
            <video
              src={video.src}
              controls
              playsInline
              crossOrigin="anonymous"
              className="max-h-[80vh] max-w-[90vw] object-contain"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>
        </div>

        {/* Right meta column */}
        <aside className="hidden h-full w-[320px] flex-col border-l border-white/5 bg-black/70 px-7 py-8 text-sm text-zinc-100 backdrop-blur-xl lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-sm font-semibold text-black">
              {video.prompt?.[0]?.toUpperCase?.() || "U"}
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-100">
                Your prompt
              </div>
              {createdAtLabel && (
                <div className="text-[11px] text-zinc-500">
                  {createdAtLabel}
                </div>
              )}
            </div>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Render settings
          </div>
          <div className="mb-5 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-zinc-200">
              {videoMode === "image-to-video"
                ? "Image to video"
                : "Text to video"}
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-zinc-200">
              720p
            </span>
            <span className="rounded-full bg-zinc-900 px-3 py-1 text-zinc-200">
              {video.fps ? `${video.fps} fps` : "24 fps"}
            </span>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Prompt
          </div>
          <div className="mb-6 max-h-[40vh] overflow-y-auto text-[13px] leading-relaxed text-zinc-100">
            {video.prompt || "—"}
          </div>

          <div className="flex-1" />

          {/* ACTION ROW */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (video?.prompt) {
                  onUseTemplate?.(video.prompt);
                }
              }}
              className="
                inline-flex flex-1 items-center justify-center
                rounded-full bg-zinc-100 px-4 py-2
                text-[13px] font-medium text-black
                hover:bg-zinc-200
              "
            >
              + Use as template
            </button>

            <button
              type="button"
              className="inline-flex h-9 min-w-[44px] items-center justify-center rounded-full bg-zinc-900 px-3 text-[13px] text-zinc-200 hover:bg-zinc-800"
            >
              ♥ 52
            </button>

            {/* ⋯ ACTION MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActions((v) => !v);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                aria-haspopup="menu"
                aria-expanded={openActions}
              >
                <span className="text-lg leading-none">⋯</span>
              </button>

              {openActions && (
                <div
                  className="
                    absolute right-0 bottom-11 z-50 w-44
                    rounded-xl border border-white/10
                    bg-zinc-950/95 backdrop-blur-xl
                    shadow-2xl
                  "
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                  >
                    View details
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      navigator.clipboard.writeText(video.prompt || "");
                      setOpenActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                  >
                    Copy prompt
                  </button>

                  <div className="my-1 h-px bg-white/10" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      window.open(video.src, "_blank");
                      setOpenActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-white/5"
                  >
                    Open video
                  </button>
                </div>
              )}


              
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
}

/* -------------------- Video Generation Panel -------------------- */
export function VideoGenerationPanel() {
  const {
    onGenerateVideo,
    onGenerateTextToVideo,
    loading,
    setError,
    jobActive,
    credits,
    currentJobId,
    progressPercent: jobProgress,
    progressText: jobProgressText,
    videoUrl: finalVideoUrl,
    generatedVideos,
    cancelPoll,
     onGenerateSeedanceVideo,
     videoModel,        
    setVideoModel,
    onGenerateWan26Video,
    onGenerateSeedanceImageVideo,
    onGenerateWan26ImageVideo,
  } = useImageGeneration();

  const [expandedVideo, setExpandedVideo] = useState(null);
  const [items, setItems] = useState([]);


  





  const searchParams = useSearchParams();

useEffect(() => {
  const p = searchParams.get("prompt");
  if (p) {
    setPrompt(decodeURIComponent(p));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // 🔄 Keep panel items in sync with Firestore-backed generatedVideos
  useEffect(() => {
    if (!Array.isArray(generatedVideos)) return;

    setItems((prev) => {
      const persisted = generatedVideos.map((v) => {
        const createdAt =
          v.createdAt && typeof v.createdAt.toMillis === "function"
            ? v.createdAt.toMillis()
            : v.createdAt || v.ts || Date.now();

        const src = v.videoUrl || v.video_url || v.url || v.src || null;

        return {
          id: v.id || v.jobId || src || String(createdAt),
          prompt: v.prompt || "",
          src,
          fps: v.fps || 24,
          duration: v.duration || null,
          createdAt,
          status: src ? "ready" : "error",
          isPublic: Boolean(v.isPublic),
        };
      });

      const running = prev.filter(
        (it) =>
          it.status !== "ready" && !persisted.find((p) => p.id === it.id)
      );

      return [...running, ...persisted].sort(
        (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
      );
    });
  }, [generatedVideos]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const lastPromptRef = useRef("");

  // Local controls
  const [selectedLoras, setSelectedLoras] = useState([]);
  const [fps, setFps] = useState(24);
  const [duration, setDuration] = useState(4);
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showLoraModal, setShowLoraModal] = useState(false);
  const modalRef = useRef(null);
  const [videoMode, setVideoMode] = useState("image-to-video");
  const [catalog, setCatalog] = useState("sfw");
  const [etaTargetMs, setEtaTargetMs] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(null);
  const [resolution, setResolution] = useState("720p");
 const [aspectRatio, setAspectRatio] = useState("16:9");
 const [seedanceImageUrl, setSeedanceImageUrl] = useState(null);
const [modelOpen, setModelOpen] = useState(false);





  // 2️⃣ THEN derived values
const estimatedCredits = useMemo(() => {
  return getVideoCreditCost({
    model: videoModel,
    duration,
    resolution,
    aspectRatio,
    videoMode,
  });
}, [videoModel, duration, resolution, aspectRatio, videoMode]);

 



  useEffect(() => {
    if (!jobActive || !jobProgress) return;
    const AVG_JOB_TIME = 120;
    const remainingPercent = 100 - jobProgress;
    const secondsLeft = Math.max(
      1,
      Math.round((remainingPercent / 100) * AVG_JOB_TIME)
    );
    setEtaSeconds(secondsLeft);
  }, [jobProgress, jobActive]);


  useEffect(() => {
  if (videoModel === "wan-2.6") {
    // force valid Wan 2.6 defaults
    if (!["5", "10", "15"].includes(String(duration))) {
      setDuration(5);
    }
    if (!["720p", "1080p"].includes(resolution)) {
      setResolution("720p");
    }
  }

  if (videoModel === "seedance") {
    if (!["4", "8", "12"].includes(String(duration))) {
      setDuration(8);
    }
    if (!["480p", "720p"].includes(resolution)) {
      setResolution("480p");
    }
  }
}, [videoModel]);


 

  const removeLora = useCallback((model) => {
    setSelectedLoras((prev) => prev.filter((l) => l.model !== model));
  }, []);

  const FPS_MIN = 1,
    FPS_MAX = 24;
  const DUR_MIN = 1,
    DUR_MAX = 7;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    if (!videoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (_) {}
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleLora = useCallback((tpl) => {
  setSelectedLoras((prev) => {
    const safetensor = tpl?.safetensor || "";
    const model = tpl?.model ?? tpl?.lora_name ?? safetensor ?? "";
    if (!model) return prev;

    const exists = prev.find((p) => p.model === model);
    if (exists) return prev.filter((p) => p.model !== model);
    if (prev.length >= 3) return prev;

    const next = {
      model,
      name: tpl?.name ?? tpl?.title ?? model,
      thumbnail: tpl?.thumbnail ?? "",
      trigger: tpl?.trigger ?? "",
      slot: tpl?.slot ?? tpl?.label?.toLowerCase() ?? "high", // ✅ FIX
      strength: Number.isFinite(+tpl?.strength)
        ? Number(tpl.strength)
        : 1.0,
    };

    return [...prev, next];
  });
}, []);


  

  useEffect(() => {
    const unique = Array.from(
      new Set(selectedLoras.map((l) => l.trigger).filter(Boolean))
    );
    setPrompt((prev = "") => {
      const missing = unique.filter((t) => !prev.includes(t));
      const trimmed = prev.trim();
      return missing.length
        ? `${trimmed}${trimmed ? " " : ""}${missing.join(" ")}`
        : prev;
    });
  }, [selectedLoras]);

  useEffect(() => {
    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = showLoraModal ? "hidden" : prev;
    return () => {
      body.style.overflow = prev;
    };
  }, [showLoraModal]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target))
        setShowLoraModal(false);
    };
    if (showLoraModal)
      document.addEventListener("pointerdown", handleClickOutside, {
        passive: true,
      });
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [showLoraModal]);

  const selectedSet = useMemo(
    () => new Set(selectedLoras.map((x) => x.model)),
    [selectedLoras]
  );

  const currentVideo = useMemo(() => {
    if (!items.length) return null;
    const latestReady = [...items]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .find((it) => it.status === "ready" && it.src);
    return latestReady || items[items.length - 1];
  }, [items]);

  const currentCreationTime = useMemo(() => {
    if (!isMounted || !currentVideo?.createdAt) return "";
    try {
      return new Date(currentVideo.createdAt).toLocaleString();
    } catch {
      return "";
    }
  }, [isMounted, currentVideo]);

  // progress
  const rawProgress =
    typeof jobProgress === "number" && !Number.isNaN(jobProgress)
      ? jobProgress
      : currentVideo?.progress ?? 1;

  const displayProgress = Math.max(1, Math.min(99, Math.round(rawProgress)));


// handleGenerate function

// 🔑 Split selected LoRAs into HIGH / LOW arrays for backend
// 🔑 Split selected LoRAs into HIGH / LOW arrays for backend
const splitLorasBySlot = useCallback((loras) => {
  const high = [];
  const low = [];
  const highStrengths = [];
  const lowStrengths = [];

  for (const l of loras) {
    const slot = (l.slot || l.label || "high").toLowerCase();
    const strength =
      Number.isFinite(+l.strength) ? Number(l.strength) : 1.0;

    if (slot === "low") {
      low.push(l.model);
      lowStrengths.push(strength);
    } else {
      // default → HIGH
      high.push(l.model);
      highStrengths.push(strength);
    }
  }

  return {
    user_high_loras: high,
    user_high_strengths: highStrengths,
    user_low_loras: low,
    user_low_strengths: lowStrengths,
  };
}, []);


const handleGenerate = useCallback(async () => {
  if (jobActive) return;

  const p = (prompt || "").trim();
  const nneg = (negativePrompt || "").trim();

  if (!p) {
    alert("⚠️ Please enter a prompt.");
    return;
  }

  /* ======================================================
     HARD VALIDATION — IMAGE REQUIREMENTS
  ====================================================== */

  // 🟣 Seedance requires a PUBLIC image URL for I2V
  if (
    videoModel === "seedance" &&
    videoMode === "image-to-video" &&
    !seedanceImageUrl
  ) {
    alert("⚠️ Please upload an image.");
    return;
  }

  // 🔵 Wan models require a File for I2V
  if (
    videoModel !== "seedance" &&
    videoMode === "image-to-video" &&
    !videoFile
  ) {
    alert("⚠️ Please upload an image.");
    return;
  }

  lastPromptRef.current = p;

  /* ======================================================
     SAFETY CLAMPS
  ====================================================== */

  const safeFps = Math.max(
    1,
    Math.min(24, Math.round(Number.isFinite(+fps) ? +fps : 24))
  );

  const safeWan22Duration = Math.max(
    1,
    Math.min(7, Math.round(Number.isFinite(+duration) ? +duration : 4))
  );

  try {
    setError?.(null);

    /* ======================================================
       🟣 SEEDANCE 1.5 PRO
    ====================================================== */
    if (videoModel === "seedance") {
      const seedanceDuration =
        ["4", "8", "12"].includes(String(duration))
          ? String(duration)
          : "8";

      // ---------- IMAGE → VIDEO ----------
      if (videoMode === "image-to-video") {
        await onGenerateSeedanceImageVideo({
          prompt: p,
          imageUrl: seedanceImageUrl, // ✅ single source of truth
          aspect_ratio: aspectRatio,
          resolution,
          duration: seedanceDuration,
          fixed_lens: false,
          generate_audio: true,
        });
        return;
      }

      // ---------- TEXT → VIDEO ----------
      await onGenerateSeedanceVideo({
        prompt: p,
        aspect_ratio: aspectRatio,
        resolution,
        duration: seedanceDuration,
        fixed_lens: false,
        generate_audio: true,
      });
      return;
    }

    /* ======================================================
       🔵 WAN 2.6 — IMAGE → VIDEO
    ====================================================== */
    if (videoModel === "wan-2.6" && videoMode === "image-to-video") {
      // Upload image → public URL
      const imageUrl = await uploadSeedanceImage(videoFile);

      await onGenerateWan26ImageVideo({
        prompt: p,
        imageUrl,
        duration: ["5", "10", "15"].includes(String(duration))
          ? String(duration)
          : "5",
        resolution: ["720p", "1080p"].includes(resolution)
          ? resolution
          : "720p",
        multi_shots: false,
      });
      return;
    }

    /* ======================================================
       🔵 WAN 2.6 — TEXT → VIDEO
    ====================================================== */
    if (videoModel === "wan-2.6" && videoMode === "text-to-video") {
      await onGenerateWan26Video({
        prompt: p,
        duration: ["5", "10", "15"].includes(String(duration))
          ? String(duration)
          : "5",
        resolution: ["720p", "1080p"].includes(resolution)
          ? resolution
          : "720p",
        multi_shots: false,
      });
      return;
    }

    /* ======================================================
       🔵 WAN 2.2 — IMAGE → VIDEO
    ====================================================== */
    if (videoModel === "wan-2.2" && videoMode === "image-to-video") {
      const loraPayload = splitLorasBySlot(selectedLoras);

      await onGenerateVideo({
        imageFile: videoFile,
        prompt: p,
        negative_prompt: nneg,
        fps: safeFps,
        duration: safeWan22Duration,
        ...loraPayload,
      });
      return;
    }

    /* ======================================================
       🔵 WAN 2.2 — TEXT → VIDEO
    ====================================================== */
    if (videoModel === "wan-2.2" && videoMode === "text-to-video") {
      const T2V_FPS_ALLOWED = [8, 12, 16];
      const T2V_DUR_ALLOWED = [2, 4, 6];

      const t2vFps = T2V_FPS_ALLOWED.includes(safeFps)
        ? safeFps
        : 12;

      const t2vDuration = T2V_DUR_ALLOWED.includes(safeWan22Duration)
        ? safeWan22Duration
        : 4;

      await onGenerateTextToVideo({
        prompt: p,
        fps: t2vFps,
        duration: t2vDuration,
      });
      return;
    }

    /* ======================================================
       ❌ SHOULD NEVER HAPPEN
    ====================================================== */
    throw new Error("Unsupported video model or mode");

  } catch (err) {
    console.error("❌ Video generation failed:", err);

    const message =
      err?.message ||
      err?.response?.data?.msg ||
      "Something went wrong.";

    setError?.(message);
    alert(message);
  }
}, [
  jobActive,
  prompt,
  negativePrompt,
  videoMode,
  videoFile,
  seedanceImageUrl,
  fps,
  duration,
  resolution,
  aspectRatio,
  videoModel,
  selectedLoras,
  onGenerateVideo,
  onGenerateTextToVideo,
  onGenerateSeedanceVideo,
  onGenerateSeedanceImageVideo,
  onGenerateWan26Video,
  onGenerateWan26ImageVideo,
  splitLorasBySlot,
  setError,
]);



  // handleGenerate end

  const onDockKeyDown = useCallback(
    (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

  const onDockDrop = useCallback(async (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please drop an image file.");
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    alert("Image too large (max 15MB).");
    return;
  }

  setVideoFile(file);

  if (videoModel === "seedance") {
    try {
      setSeedanceImageUrl(null);
      const url = await uploadSeedanceImage(file);
      setSeedanceImageUrl(url);
    } catch (err) {
      console.error("Seedance image upload failed:", err);
      alert("Failed to upload image for Seedance.");
    }
  }
}, [videoModel]);



  //end of handleGenerate function

  // handleUpload function
const handleUpload = useCallback(async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    alert("Image too large (max 15MB).");
    return;
  }

  // 🔵 Wan still needs the File
  setVideoFile(file);

  // 🟣 Seedance needs a PUBLIC URL
  if (videoModel === "seedance") {
    try {
      setSeedanceImageUrl(null); // reset old one
      const url = await uploadSeedanceImage(file); // 👈 THIS LINE
      setSeedanceImageUrl(url);
    } catch (err) {
      console.error("Seedance image upload failed:", err);
      alert("Failed to upload image for Seedance.");
    }
  }
}, [videoModel]);


 
// clearImage function
 const clearImage = useCallback(() => {
  setVideoFile(null);
  setPreviewUrl(null);
  setSeedanceImageUrl(null);
  if (fileInputRef.current) fileInputRef.current.value = "";
}, []);


useEffect(() => {
  console.log("Seedance image URL:", seedanceImageUrl);
}, [seedanceImageUrl]);


  const busy = loading || jobActive;

  const feed = useMemo(
    () =>
      [...items]
        .filter((it) => it.id !== currentVideo?.id)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [items, currentVideo?.id]
  );

  useEffect(() => {
    console.log("CTX →", {
      jobActive,
      currentJobId,
      jobProgress,
      jobProgressText,
      finalVideoUrl,
    });
  }, [jobActive, currentJobId, jobProgress, jobProgressText, finalVideoUrl]);


//End of VideoGenerationPanel component



return (
  <>

  {/* MAIN SORA-THEMED CONTENT */}
<div className="relative w-full bg-black text-zinc-50 overflow-hidden">
  {/* Background glows */}
  <div className="pointer-events-none absolute inset-x-0 -top-48 h-96 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_65%)]" />
  <div className="pointer-events-none absolute inset-x-0 top-[420px] h-[420px] bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.16),_transparent_65%)]" />

  <div className="relative mx-auto w-full max-w-[1100px] px-4 pt-10 pb-48">
    {/* Header */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-black/80 px-3 py-1 text-[11px] font-medium ring-1 ring-white/10">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.9)]" />
          <span className="uppercase tracking-[0.25em] text-zinc-500">
            Sora-style Studio
          </span>
        </div>

        


        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Turn text and images into cinematic videos.
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          Describe a scene or drop in a keyframe. We handle motion, lighting,
          and camera for you – inspired by modern AI T2V workflows.
        </p>
      </div>

      {/* Credits */}
      <div className="flex items-center justify-start sm:justify-end">
        <div className="flex items-center gap-2 rounded-full bg-black/90 px-3 py-1 text-[11px] ring-1 ring-cyan-400/40 shadow-[0_0_32px_rgba(56,189,248,0.55)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300" />
          <span className="uppercase tracking-[0.25em] text-zinc-500">
            Credits
          </span>
          <span className="font-semibold text-zinc-50">
            {credits ?? "—"}
          </span>
        </div>
      </div>
    </div>

    {/* MAIN PLAYER */}
    <div className="mt-10">
      <div className="mx-auto max-w-[920px]">
        <div
          className="
            enter justify-center overflow-hidden rounded-[28px]
            bg-gradient-to-b from-black via-[#050814] to-black
            ring-1 ring-white/5
            shadow-[0_40px_160px_rgba(0,0,0,0.95)]
          "
        >
          {currentVideo?.src && (
            <>
              <VideoPlayer
                src={currentVideo.src}
                poster={undefined}
                rightPanelTitle={
                  videoMode === "image-to-video"
                    ? "Image to video"
                    : "Text to video"
                }
                creationTime={currentCreationTime}
                promptText={currentVideo?.prompt || ""}
                onUseTemplate={(prompt) => {
                setPrompt(prompt);
              }}

              onRerun={() => {
              setPrompt(currentVideo.prompt);
              handleGenerate();
            }}

            onDelete={() => {
              setItems((prev) => prev.filter((v) => v.id !== currentVideo.id));
            }}
                onOpenFullscreen={() => setExpandedVideo(currentVideo)}


                videoId={currentVideo.id}
                isPublic={currentVideo.isPublic}
                onVisibilityChange={(id, pub) =>
                  setItems((prev) =>
                    prev.map((v) =>
                      v.id === id ? { ...v, isPublic: pub } : v
                    )
                  )
                }
                onDeleted={(id) =>
                  setItems((prev) => prev.filter((v) => v.id !== id))
                }
                            
              />

               

               

              {/* Action Menu */}
             

             

           
            </>
          )}

          {/* Empty / Progress states unchanged */}
        </div>
      </div>
    </div>


    {/* FEED / HISTORY */}
    <div className="mt-10 mx-auto max-w-[920px]">
  <div className="mb-3 flex items-center justify-between">
    <h2 className="text-sm font-semibold tracking-tight">
      Recent generations
    </h2>
    <span className="text-[11px] text-zinc-500">
      Click a card to open details
    </span>
  </div>

  

      {feed.length === 0 ? (
        <div className="rounded-2xl bg-black/70 px-4 py-6 text-center text-xs text-zinc-500 ring-1 ring-white/10">
          Once you generate a few clips, they’ll be listed here for quick reuse.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feed.map((it) => (

            <div
              key={it.id}
              role="button"
              tabIndex={0}
              onClick={() => setExpandedVideo(it)}
              className="
                group relative rounded-2xl bg-black/80 p-3
                ring-1 ring-white/5
                shadow-[0_16px_60px_rgba(0,0,0,0.85)]
                transition
                hover:ring-cyan-500/40
                hover:shadow-[0_0_40px_rgba(56,189,248,0.15)]
              "
                >
                    
          <div
            className="
              absolute top-2 right-2 z-20
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100
              transition-opacity
            "
            onClick={(e) => e.stopPropagation()}
          >

            
            <div className="rounded-full bg-black/75 backdrop-blur ring-1 ring-white/10 shadow-lg">
              <VideoActionMenu
                videoId={it.id}
                prompt={it.prompt}
                isPublic={it.isPublic}
                onVisibilityChange={(id, pub) =>
                  setItems((prev) =>
                    prev.map((v) =>
                      v.id === id ? { ...v, isPublic: pub } : v
                    )
                  )
                }
                onDeleted={(id) =>
                  setItems((prev) => prev.filter((v) => v.id !== id))
                }
              />
            </div>

            
    
          </div>

          {/* VIDEO */}
          <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-950">
            {it.src ? (
              <video
                src={it.src}
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                No preview
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          </div>

          {/* META */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
            <span className="rounded-full bg-black/80 px-2 py-0.5 ring-1 ring-white/10">
              {it.fps ?? 24} fps
            </span>
            <span>
              {it.createdAt ? new Date(it.createdAt).toLocaleTimeString() : ""}
            </span>
          </div>

          <div className="mt-2 line-clamp-2 text-[11px] text-zinc-400">
            {it.prompt || "No prompt stored."}
          </div>
        </div>

          
          ))}
        </div>
      )}
    </div>
  </div>
</div>

<VideoModelModal
  open={modelOpen}
  value={videoModel}
  onClose={() => setModelOpen(false)}
  onSelect={(model) => {
    setVideoModel(model);
    setModelOpen(false);
  }}
/>

    
    

    {/* FIXED PROMPT DOCK */}
    <DockLayer>
      <PromptDock
        prompt={prompt}
        setPrompt={setPrompt}
        negativePrompt={negativePrompt}
        setNegativePrompt={setNegativePrompt}
        videoMode={videoMode}
        setVideoMode={setVideoMode}
        fps={fps}
        setFps={setFps}
        duration={duration}
        setDuration={setDuration}
        onGenerate={handleGenerate}
        busy={busy}
        onUpload={handleUpload}
        fileInputRef={fileInputRef}
        onDockKeyDown={onDockKeyDown}
        onDockDrop={onDockDrop}
        previewUrl={previewUrl}
        onClearImage={clearImage}
        setCatalog={setCatalog}
        setShowLoraModal={setShowLoraModal}
        selectedLoras={selectedLoras}
        onRemoveLora={removeLora}
         jobProgress={jobProgress}
        jobProgressText={jobProgressText}
        etaSeconds={etaSeconds}
        cancelPoll={cancelPoll}
        currentJobId={currentJobId}
         videoModel={videoModel}        
        setVideoModel={setVideoModel}
         credits={credits}
         setResolution={setResolution}
         estimatedCredits={estimatedCredits}
         aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        modelOpen={modelOpen}
        setModelOpen={setModelOpen}


      />
    </DockLayer>

    {/* LoRA Modal */}
    {showLoraModal && (
      <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
        <div
          ref={modalRef}
          className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-950 shadow-[0_32px_160px_rgba(0,0,0,0.95)] ring-1 ring-cyan-500/30 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between border-b border-zinc-800/80 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-cyan-300"
                aria-hidden
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
              Select Templates (up to 3)
            </h2>
            <button
              type="button"
              onClick={() => setShowLoraModal(false)}
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            <LoraTemplateGrid
              selected={selectedSet}
              catalog={catalog}
              onToggleTemplate={(template) => {
                toggleLora(template);
                if (!prompt && template?.trigger) setPrompt(template.trigger);
              }}
              max={3}
            />
          </div>
        </div>
      </div>
    )}

    {/* FULL-SCREEN DETAIL MODAL */}
    <VideoDetailModal
      open={!!expandedVideo}
      video={expandedVideo}
      onClose={() => setExpandedVideo(null)}
      videoMode={videoMode}
      onUseTemplate={(promptText) => {
      setPrompt(promptText);
      setExpandedVideo(null);
 }}
    />
  </>
);
}




  

/* --------------------------------- Page wrapper ------------------------------------- */
export default function SoraUIPage() {
  return (
    <div className="min-h-screen w-full bg-black font-sans antialiased text-zinc-50">
      <VideoGenerationPanel />
    </div>
  );
}
