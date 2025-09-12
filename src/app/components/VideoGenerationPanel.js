"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import Link from "next/link";
import LoraTemplateGrid from "./LoraTemplateGrid";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import EnhancedVideoPlayer from "./EnhancedVideoPlayer";

export default function VideoGenerationPanel() {
  const {
    onGenerateVideo,
    loading,
    setVideoUrl,
    setGeneratedVideos,
    generatedVideos,
    credits,
    membershipStatus,
    progressText,
    setProgressText,
    progressPercent,
    setProgressPercent,
    cancelPoll,
    currentJobId,
    latestVideoRef,
    onGenerateTextToVideo,
    setError,
    setShowUpgradePopup,
  } = useImageGeneration();

  const [selectedLoras, setSelectedLoras] = useState([]);
  const [fps, setFps] = useState(20);
  const [duration, setDuration] = useState(5);
  const [showUpgradePopupLocal, setShowUpgradePopupLocal] = useState(false);
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [showLoraModal, setShowLoraModal] = useState(false);
  const modalRef = useRef(null);
  const [videoMode, setVideoMode] = useState("image-to-video");
  const [jobActive, setJobActive] = useState(false);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // Credit gate - fixed logic
  useEffect(() => {
    if (credits === 0) {
      if (setShowUpgradePopup) {
        setShowUpgradePopup(true);
      } else {
        setShowUpgradePopupLocal(true);
      }
    }
  }, [credits, setShowUpgradePopup]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowLoraModal(false);
      }
    };
    if (showLoraModal) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLoraModal]);

  // Lock scroll while modal open
  useEffect(() => {
    document.body.style.overflow = showLoraModal ? "hidden" : "";
  }, [showLoraModal]);

  // Firebase token debug
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken(true);
        console.log("ID Token:", token);
      } else {
        console.log("⚠️ No user signed in yet");
      }
    });
    return () => unsubscribe();
  }, []);

  // Toggle LoRA in/out of selection
  const toggleLora = (tpl) => {
    setSelectedLoras((prev) => {
      const safetensor = tpl?.safetensor || "";
      const model = tpl?.model ?? tpl?.lora_name ?? safetensor ?? "";
      if (!model) return prev;

      // Check if already selected
      const exists = prev.find((p) => p.model === model);
      if (exists) {
        return prev.filter((p) => p.model !== model);
      }

      // Enforce max of 3 LoRAs
      if (prev.length >= 3) return prev;

      // Add new LoRA
      const next = {
        model,
        name: tpl?.name ?? tpl?.title ?? model,
        thumbnail: tpl?.thumbnail ?? "",
        trigger: tpl?.trigger ?? "",
        label: tpl?.label || "HIGH",
        safetensor,
        strength: tpl?.strength,
      };

      return [...prev, next];
    });
  };

  // Auto-insert unique triggers into prompt
  useEffect(() => {
    const unique = Array.from(new Set(selectedLoras.map((l) => l.trigger).filter(Boolean)));
    setPrompt((prev = "") => {
      const missing = unique.filter((t) => !prev.includes(t));
      return missing.length ? `${prev ? prev + " " : ""}${missing.join(" ")}` : prev;
    });
  }, [selectedLoras]);

  const getFullUrl = useCallback((path) => {
    if (!path) return "";
    if (/^(https?:|blob:|data:)/i.test(path)) return path;
    try {
      return new URL(path, window.location.origin).toString();
    } catch {
      return path;
    }
  }, []);

  // Generate handler - fixed to pass selectedLoras correctly
  const handleGenerate = async () => {
    if (jobActive) return;

    const p = (prompt || "").trim();
    const nneg = (negativePrompt || "").trim();

    // Fixed duration calculation - backend expects seconds
    const durationSeconds = duration;

    // Clamp values
    const safeFps = clamp(Math.round(Number(isNaN(+fps) ? 24 : fps)), 1, 60);
    const safeDuration = clamp(Math.round(Number(isNaN(+durationSeconds) ? 4 : durationSeconds)), 1, 30);

    // Validation
    if (!p) {
      alert("⚠️ Please enter a prompt.");
      return;
    }
    if (videoMode === "image-to-video" && !videoFile) {
      alert("⚠️ Please upload an image for image-to-video.");
      return;
    }
    
    // Fixed credit check logic
    if (credits <= 0) {
      if (setShowUpgradePopup) {
        setShowUpgradePopup(true);
      } else {
        setShowUpgradePopupLocal(true);
      }
      return;
    }

    try {
      setJobActive(true);
      setVideoUrl(null);
      setGeneratedVideos([]);
      setProgressText("🚀 Submitting your job…");
      setProgressPercent(1);

      const models = selectedLoras.slice(0, 3).map((x) => x.model);

      if (videoMode === "image-to-video") {
        // Fixed: Pass selectedLoras to onGenerateVideo
        await onGenerateVideo({
          imageFile: videoFile,
          prompt: p,
          negative_prompt: nneg,
          lora_name: models[0] || "",
          fps: safeFps,
          duration: safeDuration,
          setProgressText,
          setProgressPercent,
          selectedLoras // This was missing
        });
      } else {
        await onGenerateTextToVideo({
          prompt: p,
          negative_prompt: nneg,
          loras: models,
          fps: safeFps,
          duration: safeDuration,
          setProgressText,
          setProgressPercent
        });
      }
    } catch (err) {
      const message = err?.message || "Something went wrong.";
      console.error("🚨 Video generation failed:", message, err);
      setProgressText(null);
      setProgressPercent(null);
      if (setError) setError(message);
      alert(message);
      setJobActive(false);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) setVideoFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) setVideoFile(file);
  };

  const selectedSet = new Set(selectedLoras.map((x) => x.model));
  const showUpgrade = setShowUpgradePopup ? false : showUpgradePopupLocal;

  return (
    <div className="relative flex min-h-screen text-zinc-100">
      {/* gradient mesh background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-[#0a0c10] via-[#0b0f17] to-[#0a0c10]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(60%_60%_at_50%_20%,#000_10%,transparent_70%)]"
        style={{
          background:
            "radial-gradient(800px 400px at 10% 0%, #4f46e5 10%, transparent 40%), radial-gradient(600px 300px at 90% 10%, #22d3ee 10%, transparent 45%), radial-gradient(700px 350px at 50% 10%, #7c3aed 10%, transparent 40%)",
        }}
      />

      {/* Sidebar */}
      <aside className="w-full sm:w-80 shrink-0 p-6 border-r border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-sky-300 bg-clip-text text-transparent">
              Video Settings
            </span>
          </h2>
          <div className="w-8 h-8 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center text-[10px] font-semibold">
            AI
          </div>
        </div>

        {/* FPS */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-300">Frame Rate</label>
              <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white/5 ring-1 ring-white/10">
                🎞️ {fps} FPS
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={24}
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value))}
              className="w-full accent-indigo-400 ai-range"
              aria-label="Frame rate"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Cinematic</span>
              <span>Smooth</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-300">Duration</label>
              <span className="text-[11px] font-mono px-2 py-1 rounded-md bg-white/5 ring-1 ring-white/10">
                ⏱️ {duration * 1}s
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-sky-400 ai-range"
              aria-label="Duration"
            />
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Short</span>
              <span>Extended</span>
            </div>
          </div>
        </div>

        {/* Templates */}
        <button
          onClick={() => setShowLoraModal(true)}
          className="mt-6 group relative w-full rounded-2xl px-4 py-3 text-left transition-all ring-1 ring-white/10 hover:ring-white/20 bg-white/5 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-violet-500/0 to-sky-500/0 opacity-0 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/20 grid place-items-center">
              {/* icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-300">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-zinc-100">Browse Templates</p>
              <p className="text-[11px] text-zinc-400">AI-curated styles</p>
            </div>
          </div>
        </button>

        {/* Selected LoRAs */}
        {selectedLoras.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="text-[11px] text-zinc-400">
              Selected: <span className="font-semibold text-zinc-100">{selectedLoras.length}</span> / 3
            </div>
            <div className="space-y-2">
              {selectedLoras.map((l) => (
                <div
                  key={l.model}
                  className="flex items-center gap-3 p-2 rounded-xl ring-1 ring-white/10 bg-white/5"
                >
                  {l.thumbnail ? (
                    <img
                      src={l.thumbnail}
                      alt={l.name}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/5 ring-1 ring-white/10" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{l.name}</div>
                    {l.trigger ? (
                      <div className="text-[11px] text-zinc-400 truncate">
                        Trigger: <span className="text-zinc-200">{l.trigger}</span>
                      </div>
                    ) : null}
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 text-white shadow-sm">
                    Selected
                  </span>

                  <button
                    onClick={() => toggleLora(l)}
                    className="ml-2 px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Templates Modal */}
      {showLoraModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center p-4">
          <div
            ref={modalRef}
            className="bg-[#0c0f14] ring-1 ring-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-300">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                </svg>
                Select Templates (up to 3)
              </h2>
              <button
                onClick={() => setShowLoraModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-100 transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <LoraTemplateGrid
                selected={selectedSet}
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

      {/* Main */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200 bg-clip-text text-transparent">
                  {videoMode === "image-to-video" ? "Image-to-Video Generator" : "Text-to-Video Generator"}
                </span>
              </h1>
              <p className="text-zinc-400 mt-1">
                {videoMode === "image-to-video"
                  ? "Transform static images into dynamic videos with AI."
                  : "Generate short videos directly from your prompt."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 ring-1 ring-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium">AI Ready</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Credits</p>
                  <p className="font-medium text-sky-300">{credits}</p>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-xs text-zinc-400">Plan</p>
                  <p className="font-medium text-indigo-300">{membershipStatus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade banner */}
          {showUpgrade && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-sky-950/30 ring-1 ring-indigo-500/20 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-300">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5" />
                    <path d="M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-zinc-100">Upgrade for more credits</h3>
                  <p className="text-sm text-zinc-400 mt-1">
                    You've used all your credits. Upgrade to continue generating videos.
                  </p>
                  <Link href="/pricing">
                    <button className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 text-white font-medium text-sm hover:opacity-90 transition-opacity">
                      View Plans
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="mb-6 p-4 rounded-2xl bg-white/5 ring-1 ring-white/10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/15 ring-1 ring-amber-400/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-300">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8h.01M12 12v4" />
                </svg>
              </div>
              <p className="text-sm text-zinc-300">
                <span className="font-medium">Pro tip:</span> Include each LoRA's <em>trigger phrase</em> in your prompt
                for best results.
              </p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Prompts */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-1" htmlFor="prompt">
                  Prompt
                  <span className="text-xs text-zinc-400" title="Include the LoRA's trigger phrase(s) in your prompt.">
                    ❓
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the animation you want to create..."
                    rows={3}
                    className="w-full p-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                  />
                  <div className="pointer-events-none absolute right-3 top-3 text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300" htmlFor="neg">
                  Negative Prompt
                </label>
                <div className="relative">
                  <textarea
                    id="neg"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="What to exclude from the animation..."
                    rows={2}
                    className="w-full p-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                  />
                  <div className="pointer-events-none absolute right-3 top-3 text-zinc-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M4.93 4.93 19.07 19.07" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Mode + Upload */}
            <div>
              {/* Segmented control */}
              <div className="inline-flex rounded-xl p-1 bg-white/5 ring-1 ring-white/10 mb-4">
                {["image-to-video", "text-to-video"].map((m) => (
                  <button
                    key={m}
                    data-state={videoMode === m ? "active" : "inactive"}
                    onClick={() => setVideoMode(m)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-sky-500 data-[state=active]:text-white data-[state=inactive]:text-zinc-300 data-[state=inactive]:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    aria-pressed={videoMode === m}
                  >
                    {m === "image-to-video" ? "Image-to-Video" : "Text-to-Video"}
                  </button>
                ))}
              </div>

              {videoMode === "image-to-video" && (
                <div className="space-y-2">
                  <label htmlFor="image" className="text-sm font-medium text-zinc-300">
                    Input Image
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInputRef.current?.click()}
                    className={`group border-2 border-dashed rounded-2xl p-6 text-center bg-white/[0.03] ring-1 ring-white/10 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                      videoFile ? "border-sky-500/40" : "border-white/10 hover:border-white/20"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUpload} hidden id="image" />
                    {videoFile ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(videoFile)}
                          alt="Uploaded"
                          className="w-full h-auto max-h-64 mx-auto rounded-xl ring-1 ring-white/10 object-cover"
                        />
                        <button
                          className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 ring-1 ring-white/15 hover:bg-black/60 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoFile(null);
                          }}
                          aria-label="Remove image"
                        >
                          <svg xmlns="http://www.w3.org2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                            <path d="M16 5h6M19 2v6" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                        <p className="font-medium text-zinc-200">Drag & drop an image</p>
                        <p className="text-sm mt-1 text-zinc-500">or click to browse files</p>
                        <p className="text-[11px] mt-3 text-zinc-600">Supports JPG, PNG (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <button
              onClick={handleGenerate}
              disabled={jobActive || (videoMode === "image-to-video" && !videoFile)}
              className={`flex-1 py-3.5 rounded-xl font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                jobActive
                  ? "bg-white/5 ring-1 ring-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 hover:opacity-90 shadow-lg shadow-indigo-500/10"
              }`}
              title={
                jobActive
                  ? "A job is currently running…"
                  : (videoMode === "image-to-video" && !videoFile ? "Upload an image first" : "Generate")
              }
            >
              {jobActive ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0a12 12 0 00-12 12h4z" />
                  </svg>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {videoMode === "image-to-video" ? "Generate Video(80)" : "Generate from Text(60)"}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setPrompt("");
                setNegativePrompt("");
                setVideoFile(null);
                setGeneratedVideos([]);
                setVideoUrl(null);
                setSelectedLoras([]);
              }}
              className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 text-white font-medium transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear
            </button>

            <button
              onClick={async () => {
                if (!currentJobId) {
                  console.warn("❌ No currentJobId, cannot cancel.");
                  return;
                }
                await cancelPoll(currentJobId);
                setJobActive(false);
              }}
              disabled={!jobActive}
              className={`px-4 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 ${
                jobActive
                  ? "bg-red-600/90 hover:bg-red-600 text-white"
                  : "bg-white/5 text-zinc-500 ring-1 ring-white/10 cursor-not-allowed"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93 19.07 19.07" />
              </svg>
              Cancel
            </button>
          </div>

          {/* Progress */}
          {(progressText || progressPercent !== null) && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-zinc-300">{progressText || "Processing..."}</span>
                <span className="text-xs font-mono text-zinc-500">{progressPercent ?? 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {generatedVideos?.length > 0 ? (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-300">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">Generated Videos</h3>
                <span className="ml-auto px-3 py-1 rounded-full bg-white/5 ring-1 ring-white/10 text-sm">
                  {generatedVideos.length} {generatedVideos.length > 1 ? "videos" : "video"}
                </span>
              </div>

              <EnhancedVideoPlayer 
                generatedVideos={generatedVideos} 
                getFullUrl={getFullUrl} 
              />
            </div>
          ) : (
            <div className="mt-12 py-16 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              <div className="mx-auto w-16 h-16 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-items-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-zinc-100 mb-2">No videos generated yet</h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                Your generated videos will appear here. Start by uploading an image and entering a prompt.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}