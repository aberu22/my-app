"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Sora } from "next/font/google";
import {
  fetchModels,
  fetchLoras,
  fetchSamplers,
  generateImage,
  setOptions,
} from "../utils/api";


import CreateSidebar from "../components/CreateSidebar";

/**
 * Sora Theme & Layout Notes
 * - Typography: Sora (variable) applied globally to the component
 * - Palette: sky/indigo/fuchsia accents, soft glass surfaces, subtle grid backdrop
 * - Layout: sticky controls panel on the left, responsive gallery on the right
 * - Components: compact tab buttons, elevated cards, consistent radius (2xl), subtle rings
 * - Functionality: identical to your original; only styling & layout improved
 */

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["300","400","500","600","700"] });

// ---------------------- Constants ----------------------
const STYLE_PRESETS = [
  {
    id: "glam",
    label: "Glamour",
    prompt:
      "ultra-realistic beauty portrait, fashion editorial lighting, soft diffusion, sharp eyes, glossy skin, studio background, 85mm lens, f/1.8",
    icon: "✨",
  },
  {
    id: "studio",
    label: "Studio",
    prompt:
      "studio headshot, single key light, softbox, seamless background, crisp details, color graded",
    icon: "📸",
  },
  {
    id: "street",
    label: "Street",
    prompt:
      "street style fashion influencer, candid, natural light, shallow depth of field, urban background, golden hour",
    icon: "🏙️",
  },
  {
    id: "cyber",
    label: "Cyberpunk",
    prompt:
      "futuristic influencer, neon rim light, cyberpunk city, techwear, moody cinematic",
    icon: "🔮",
  },
  {
    id: "fantasy",
    label: "Fantasy",
    prompt:
      "fantasy character influencer, ethereal lighting, ornate costume, cinematic volumetric fog",
    icon: "🧚",
  },
  // —— Instagram-oriented presets ——
  {
    id: "ig-clean",
    label: "IG Clean",
    prompt:
      "instagram-style clean edit, soft natural light, subtle film grain, gentle highlight rolloff, neutral color grade, airy minimal background, high clarity, lifestyle aesthetic",
    icon: "🟪",
    suggestedRatio: "4:5",
  },
  {
    id: "ig-moody",
    label: "IG Moody",
    prompt:
      "instagram moody editorial, deep contrast, matte blacks, desaturated palette with warm skin tones, cinematic shadow falloff, window light, cozy vibe",
    icon: "🌘",
    suggestedRatio: "4:5",
  },
  {
    id: "ig-travel",
    label: "IG Travel",
    prompt:
      "instagram travel photo, golden hour backlight, wide-open background bokeh, candid moment, warm cinematic color grade, sun flares, lifestyle composition",
    icon: "✈️",
    suggestedRatio: "4:5",
  },
  {
    id: "ig-food",
    label: "IG Food",
    prompt:
      "instagram food flatlay, natural window light, soft shadows, vibrant yet true-to-life colors, minimal props, marble tabletop, crisp texture detail",
    icon: "🍽️",
    suggestedRatio: "4:5",
  },
  {
    id: "ig-stories",
    label: "IG Story/Reel",
    prompt:
      "instagram story aesthetic, vertical composition, dynamic framing, subtle film grain, punchy contrast, clean typography space",
    icon: "📲",
    suggestedRatio: "9:16",
  },
];

const RATIOS = [
  { id: "1:1", w: 768, h: 768, icon: "⬜" },
  { id: "4:5", w: 768, h: 960, icon: "🟪" },
  { id: "3:4", w: 768, h: 1024, icon: "📱" },
  { id: "4:3", w: 1024, h: 768, icon: "📺" },
  { id: "9:16", w: 832, h: 1472, icon: "📱" },
  { id: "16:9", w: 1472, h: 832, icon: "📺" },
];

const PROMPT_TEMPLATES = [
  "portrait of a {age}yo fashion influencer, {pose}, {makeup}, {background}",
  "{age}yo influencer wearing {outfit}, {setting}, {lighting}",
  "professional headshot of a {age}yo model, {style} makeup, {expression}",
];

// ---------------------- Local Storage Helpers ----------------------
const LS_HISTORY_KEY = "ai_influencer_history";
const LS_PROMPTS_KEY = "promptHistory";

function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(LS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(list) {
  try {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(list));
  } catch {}
}

function loadPromptHistory() {
  try {
    const raw = localStorage.getItem(LS_PROMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePromptHistory(list) {
  try {
    localStorage.setItem(LS_PROMPTS_KEY, JSON.stringify(list));
  } catch {}
}

function makeId(i = 0) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}_${i}`;
}

// ---------------------- UI Helpers (tiny components) ----------------------
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 font-medium transition-colors ${
        active
          ? "bg-sky-600 text-white shadow-[0_0_0_1px_rgba(56,189,248,.35)]"
          : "bg-neutral-800/80 hover:bg-neutral-700 text-neutral-100"
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white/90">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function AiInfluencerStudio() {
  // Controls
  const [prompt, setPrompt] = useState(
    "portrait of a 24yo fashion influencer, confident pose, editorial makeup, clean background"
  );
  const [negative, setNegative] = useState(
    "blurry, lowres, bad hands, extra fingers, deformed, artifacts, text, watermark"
  );
  const [styleId, setStyleId] = useState("glam");
  const [ratio, setRatio] = useState("1:1");
  const [sampler, setSampler] = useState("");
  const [steps, setSteps] = useState(28);
  const [cfg, setCfg] = useState(6.5);
  const [seed, setSeed] = useState("");
  const [count, setCount] = useState(2);
  const [restoreFaces, setRestoreFaces] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [hrScale, setHrScale] = useState(2);
  const [hrSteps, setHrSteps] = useState(10);

  // Models / LoRAs
  const [models, setModels] = useState([]);
  const [loras, setLoras] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedLoras, setSelectedLoras] = useState([]);
  const [samplers, setSamplers] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("generate");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);

  // Load dropdown data and local histories
  useEffect(() => {
    (async () => {
      try {
        const [m, l, s] = await Promise.all([
          fetchModels(),
          fetchLoras(),
          fetchSamplers(),
        ]);
        setModels(m || []);
        setLoras(l || []);
        setSamplers(s || []);

        // sensible defaults
        if (s?.length) setSampler(typeof s[0] === "string" ? s[0] : s[0]?.name || "");
        if (m?.length) setSelectedModel(m[0]);

        // local histories
        setHistory(loadLocalHistory());
        setPromptHistory(loadPromptHistory());
      } catch (err) {
        setError("Failed to fetch initial data.");
        console.error(err);
      }
    })();
  }, []);

  // Compose final prompt with style + LoRA tags
  const composedPrompt = useMemo(() => {
    const style = STYLE_PRESETS.find((x) => x.id === styleId)?.prompt || "";
    const loraTokens =
      selectedLoras
        .filter((x) => x?.name && !Number.isNaN(x.weight))
        .map((x) => `<lora:${x.name}:${x.weight || 0.8}>`)
        .join(" ") || "";
    return `${prompt}, ${style} ${loraTokens}`.trim();
  }, [prompt, styleId, selectedLoras]);

  // Helper
  const ratioToWH = useMemo(
    () => RATIOS.find((r) => r.id === ratio) || RATIOS[0],
    [ratio]
  );

  const switchModelIfNeeded = useCallback(async () => {
    if (!selectedModel) return;
    try {
      await setOptions({
        sd_model_checkpoint:
          selectedModel?.title || selectedModel?.model_name || selectedModel?.name,
      });
    } catch (e) {
      console.warn("Could not set model:", e?.message);
    }
  }, [selectedModel]);

  const onGenerate = useCallback(
    async (e) => {
      e?.preventDefault?.();
      setError("");
      setIsLoading(true);
      setImages([]);

      try {
        await switchModelIfNeeded();

        const body = {
          prompt: composedPrompt,
          negative_prompt: negative,
          steps: Number(steps),
          sampler_name: sampler,
          cfg_scale: Number(cfg),
          width: ratioToWH.w,
          height: ratioToWH.h,
          seed: seed === "" ? -1 : Number(seed),
          n_iter: 1,
          batch_size: Number(count),
          restore_faces: restoreFaces,
          enable_hr: highRes,
          hr_scale: hrScale,
          hr_upscaler: "Latent",
          hr_second_pass_steps: hrSteps,
        };

        const res = await generateImage(body);
        const imgs = (res?.images || []).map((b64, i) => ({
          url: `data:image/png;base64,${b64}`,
          i,
          prompt: composedPrompt,
          negative,
          model: selectedModel?.title || selectedModel?.name,
          timestamp: new Date().toISOString(),
          id: makeId(i),
        }));

        setImages(imgs);

        setHistory((prev) => {
          const next = [...imgs, ...prev];
          saveLocalHistory(next);
          return next;
        });

        if (prompt && !promptHistory.includes(prompt)) {
          const newHistory = [prompt, ...promptHistory].slice(0, 10);
          setPromptHistory(newHistory);
          savePromptHistory(newHistory);
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Generation failed");
      } finally {
        setIsLoading(false);
      }
    },
    [
      composedPrompt,
      negative,
      steps,
      sampler,
      cfg,
      ratioToWH,
      seed,
      count,
      restoreFaces,
      highRes,
      hrScale,
      hrSteps,
      selectedModel,
      switchModelIfNeeded,
      prompt,
      promptHistory,
    ]
  );

  const toggleLora = useCallback((l) => {
    const name = l.alias || l.name;
    setSelectedLoras((prev) =>
      prev.some((x) => x.name === name)
        ? prev.filter((x) => x.name !== name)
        : [...prev, { name, weight: 0.8 }]
    );
  }, []);

  const setLoraWeight = useCallback((name, weight) => {
    setSelectedLoras((prev) => prev.map((x) => (x.name === name ? { ...x, weight } : x)));
  }, []);

  const applyPromptTemplate = useCallback(() => {
    const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];
    const replacements = {
      age: Math.floor(Math.random() * 30) + 18,
      pose: [
        "confident pose",
        "casual stance",
        "thoughtful expression",
        "dynamic movement",
      ][Math.floor(Math.random() * 4)],
      makeup: ["editorial makeup", "natural makeup", "bold makeup", "minimal makeup"][
        Math.floor(Math.random() * 4)
      ],
      background: [
        "clean background",
        "studio background",
        "urban environment",
        "natural setting",
      ][Math.floor(Math.random() * 4)],
      outfit: ["designer clothing", "casual wear", "business attire", "streetwear"][
        Math.floor(Math.random() * 4)
      ],
      setting: [
        "urban environment",
        "studio setting",
        "natural landscape",
        "luxury interior",
      ][Math.floor(Math.random() * 4)],
      lighting: ["dramatic lighting", "soft lighting", "natural light", "studio lighting"][
        Math.floor(Math.random() * 4)
      ],
      style: ["glamorous", "natural", "editorial", "avant-garde"][Math.floor(Math.random() * 4)],
      expression: ["smiling", "serious", "confident", "mysterious"][Math.floor(Math.random() * 4)],
    };

    const newPrompt = template.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
    setPrompt(newPrompt);
  }, []);

  // Local-only delete (no API)
  const deleteHistoryImage = useCallback((image) => {
    setHistory((prev) => {
      const next = prev.filter((img) => img.id !== image.id);
      saveLocalHistory(next);
      return next;
    });
  }, []);

  const clearAllHistory = useCallback(() => {
    setHistory([]);
    saveLocalHistory([]);
  }, []);

  return (
    <div className={`${sora.className} min-h-[100dvh] text-neutral-100 bg-[#07080c] relative overflow-hidden`}>
      {/* Sora background grid + glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(217,70,239,.06),transparent_60%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
          <svg className="h-full w-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <CreateSidebar/>

      <div className="mx-auto max-w-7xl px-4 py-8 relative">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">AI Influencer Studio</span>
            </h1>
            <p className="mt-2 text-sm text-white/60">Create stunning AI influencer portraits with fine‑grained control</p>
          </div>
          <div className="flex gap-2">
            <TabButton active={activeTab === "generate"} onClick={() => setActiveTab("generate")}>Generate</TabButton>
            <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}>History</TabButton>
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="rounded-xl border border-sky-500/50 bg-sky-600 px-4 py-2 font-semibold hover:bg-sky-500 disabled:opacity-60 shadow-[0_0_0_1px_rgba(56,189,248,.25)]"
            >
              {isLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </header>

        {activeTab === "generate" ? (
          <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
            {/* Controls */}
            <form onSubmit={onGenerate} className="lg:sticky lg:top-4 rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
              {/* Prompt */}
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white/80">Prompt</label>
                <button
                  type="button"
                  onClick={applyPromptTemplate}
                  className="text-xs text-sky-300 hover:text-sky-200"
                >
                  Random template
                </button>
              </div>
              <textarea
                className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />

              {promptHistory.length > 0 && (
                <div className="mt-2">
                  <p className="mb-1 text-xs text-white/40">Recent prompts:</p>
                  <div className="flex flex-wrap gap-1">
                    {promptHistory.slice(0, 3).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(p)}
                        className="text-xs bg-neutral-800/80 hover:bg-neutral-700 rounded-lg px-2 py-1 truncate max-w-[160px] ring-1 ring-white/5"
                        title={p}
                      >
                        {p.substring(0, 24)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-white/80">Negative prompt</label>
                <input
                  className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                  value={negative}
                  onChange={(e) => setNegative(e.target.value)}
                />
              </div>

              {/* Style + Ratio */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/80">Style preset</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setStyleId(s.id); if (s.suggestedRatio) setRatio(s.suggestedRatio); }}
                        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          styleId === s.id
                            ? "border-sky-500/50 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,.25)]"
                            : "border-white/10 bg-neutral-950/50 hover:bg-neutral-900"
                        }`}
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80">Aspect ratio</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRatio(r.id)}
                        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          ratio === r.id
                            ? "border-fuchsia-500/40 bg-fuchsia-500/10 shadow-[0_0_0_1px_rgba(217,70,239,.25)]"
                            : "border-white/10 bg-neutral-950/50 hover:bg-neutral-900"
                        }`}
                      >
                        <span>{r.icon}</span>
                        <span>{r.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model + Sampler */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/80">Model</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                    value={selectedModel?.title || selectedModel?.name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const m = models.find((x) => x.title === val || x.name === val) || null;
                      setSelectedModel(m);
                    }}
                  >
                    {models.map((m) => (
                      <option key={m.title || m.name} value={m.title || m.name}>
                        {m.title || m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80">Sampler</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                    value={sampler}
                    onChange={(e) => setSampler(e.target.value)}
                  >
                    {samplers.map((s) => {
                      const name = typeof s === "string" ? s : s.name;
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Steps / CFG */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/80">Steps: {steps}</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="mt-2 w-full accent-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80">CFG: {cfg}</label>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    step="0.5"
                    value={cfg}
                    onChange={(e) => setCfg(Number(e.target.value))}
                    className="mt-2 w-full accent-fuchsia-500"
                  />
                </div>
              </div>

              {/* Batch & Seed */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white/80">Images</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80">Seed</label>
                  <input
                    placeholder="blank = random"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950/60 p-3 outline-none focus:ring-2 focus:ring-sky-500/60"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-sm text-sky-300 hover:text-sky-200"
                >
                  {showAdvanced ? "▼" : "►"} Advanced Options
                </button>

                {showAdvanced && (
                  <div className="mt-2 space-y-3 p-3 rounded-xl bg-neutral-950/40 ring-1 ring-white/10">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-white/80">Restore Faces</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restoreFaces}
                          onChange={() => setRestoreFaces(!restoreFaces)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-white/80">High Resolution</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={highRes}
                          onChange={() => setHighRes(!highRes)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-fuchsia-600"></div>
                      </label>
                    </div>

                    {highRes && (
                      <>
                        <div>
                          <label className="block text-sm text-white/80">High Res Scale: {hrScale}</label>
                          <input
                            type="range"
                            min="1.5"
                            max="3"
                            step="0.1"
                            value={hrScale}
                            onChange={(e) => setHrScale(Number(e.target.value))}
                            className="w-full accent-sky-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">High Res Steps: {hrSteps}</label>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={hrSteps}
                            onChange={(e) => setHrSteps(Number(e.target.value))}
                            className="w-full accent-fuchsia-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* LoRAs */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-white/80">LoRAs</label>
                <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded-xl border border-white/10 p-2 bg-neutral-950/40">
                  {loras.map((l) => {
                    const name = l.alias || l.name;
                    const active = selectedLoras.some((x) => x.name === name);
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => toggleLora(l)}
                        className={`truncate rounded-lg border px-2 py-2 text-left text-sm transition-colors ${
                          active
                            ? "border-sky-500/50 bg-sky-500/10 shadow-[0_0_0_1px_rgba(56,189,248,.25)]"
                            : "border-white/10 bg-neutral-950/50 hover:bg-neutral-900"
                        }`}
                        title={name}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>

                {selectedLoras.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedLoras.map((x) => (
                      <div
                        key={x.name}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-950/60 p-3"
                      >
                        <span className="w-40 truncate text-sm text-white/80">{x.name}</span>
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={x.weight}
                          onChange={(e) => setLoraWeight(x.name, Number(e.target.value))}
                          className="flex-1 accent-sky-500"
                        />
                        <span className="w-12 text-right text-sm text-white/70">{x.weight.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLoras((prev) => prev.filter((l) => l.name !== x.name))}
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs hover:bg-neutral-900"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full rounded-2xl border border-sky-500/50 bg-sky-600 px-4 py-3 font-semibold hover:bg-sky-500 disabled:opacity-60 shadow-[0_0_0_1px_rgba(56,189,248,.25)]"
              >
                {isLoading ? "Generating…" : "Generate"}
              </button>

              {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

              <p className="mt-4 text-xs text-white/50">
                Tip: add camera & lens hints (e.g. "85mm, f/1.8"), mood ("golden hour"), and wardrobe ("monochrome blazer").
              </p>
            </form>

            {/* Results */}
            <SectionCard
              title="Results"
              action={
                images.length > 0 && (
                  <button
                    onClick={() => {
                      images.forEach((img, i) => {
                        const a = document.createElement("a");
                        a.href = img.url;
                        a.download = `avatar_${i + 1}.png`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      });
                    }}
                    className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-neutral-900"
                  >
                    Download all
                  </button>
                )
              }
            >
              {isLoading && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-white/10">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
                    <p className="mt-2 text-white/60">Rendering avatars…</p>
                  </div>
                </div>
              )}

              {!isLoading && images.length === 0 && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 text-white/50">
                  No images yet. Generate to see results here.
                </div>
              )}

              {!isLoading && images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((img) => (
                    <figure key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                      <img
                        src={img.url}
                        alt="AI influencer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={img.url}
                            download={`avatar_${img.i + 1}.png`}
                            className="bg-sky-600 hover:bg-sky-500 rounded-lg px-3 py-2 text-sm font-medium"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </figure>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        ) : (
          // ---------------------- History Tab ----------------------
          <SectionCard
            title="Generation History"
            action={
              history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all history?")) clearAllHistory();
                  }}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-neutral-900"
                >
                  Clear all
                </button>
              )
            }
          >
            {history.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 text-white/50">
                No generation history yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {history.map((img) => (
                  <figure key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/10">
                    <img
                      src={img.url}
                      alt="Generated influencer"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-colors">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
                        <p className="mb-2 line-clamp-3 text-center text-xs text-white/80">{(img.prompt || "").substring(0, 110)}...</p>
                        <div className="flex gap-2">
                          <a
                            href={img.url}
                            download={`avatar_${img.timestamp || Date.now()}.png`}
                            className="bg-sky-600 hover:bg-sky-500 rounded-lg px-3 py-1 text-xs"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => {
                              if (confirm("Delete this image from local history?")) {
                                deleteHistoryImage(img);
                              }
                            }}
                            className="bg-rose-600 hover:bg-rose-500 rounded-lg px-3 py-1 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}
