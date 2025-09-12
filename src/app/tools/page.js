"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchModels,
  fetchLoras,
  fetchSamplers,
  generateImage,
  setOptions,
} from "../utils/api";

/**
 * Refactor goals (no backend delete API):
 *  - Removed nonexistent deleteImage/fetchGeneratedImages imports and usage
 *  - History is kept in localStorage; delete only affects local state/storage
 *  - Fixed Promise.all destructuring bug
 *  - Added helpers for history + prompt history + safe ID generation
 *  - Minor UX: confirm delete, clear all, defensive guards
 */

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
  { id: "4:5", w: 768, h: 960, icon: "🟪" }, // Instagram Portrait (safe multiples of 64)
  { id: "3:4", w: 768, h: 1024, icon: "📱" },
  { id: "4:3", w: 1024, h: 768, icon: "📺" },
  { id: "9:16", w: 832, h: 1472, icon: "📱" }, // Stories/Reels
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
    <div className="min-h-[calc(100vh-64px)] bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              AI Influencer Studio
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Create stunning AI influencer portraits with fine-grained control
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("generate")}
              className={`rounded-xl px-4 py-2 font-medium ${
                activeTab === "generate" ? "bg-indigo-600" : "bg-neutral-800 hover:bg-neutral-700"
              }`}
            >
              Generate
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`rounded-xl px-4 py-2 font-medium ${
                activeTab === "history" ? "bg-indigo-600" : "bg-neutral-800 hover:bg-neutral-700"
              }`}
            >
              History
            </button>
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="rounded-xl border border-indigo-500 bg-indigo-600 px-4 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {isLoading ? "Generating…" : "Generate"}
            </button>
          </div>
        </header>

        {activeTab === "generate" ? (
          <div className="grid gap-6 lg:grid-cols-[440px,1fr]">
            {/* Controls */}
            <form onSubmit={onGenerate} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
              {/* Prompt */}
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Prompt</label>
                <button
                  type="button"
                  onClick={applyPromptTemplate}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Random template
                </button>
              </div>
              <textarea
                className="mt-2 w-full text-black rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />

              {promptHistory.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-neutral-500 mb-1">Recent prompts:</p>
                  <div className="flex flex-wrap gap-1">
                    {promptHistory.slice(0, 3).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(p)}
                        className="text-xs bg-neutral-800 hover:bg-neutral-700 rounded-lg px-2 py-1 truncate max-w-[140px]"
                        title={p}
                      >
                        {p.substring(0, 20)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative */}
              <div className="mt-4">
                <label className="block text-sm font-medium">Negative prompt</label>
                <input
                  className="mt-2 w-full text-black rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={negative}
                  onChange={(e) => setNegative(e.target.value)}
                />
              </div>

              {/* Style + Ratio */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Style preset</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setStyleId(s.id); if (s.suggestedRatio) setRatio(s.suggestedRatio); }}
                        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${
                          styleId === s.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                        }`}
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium">Aspect ratio</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {RATIOS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRatio(r.id)}
                        className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm ${
                          ratio === r.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
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
                  <label className="block text-sm font-medium">Model</label>
                  <select
                    className="mt-2 w-full text-black rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium">Sampler</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-sm font-medium">Steps: {steps}</label>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="1"
                    value={steps}
                    onChange={(e) => setSteps(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">CFG: {cfg}</label>
                  <input
                    type="range"
                    min="1"
                    max="14"
                    step="0.5"
                    value={cfg}
                    onChange={(e) => setCfg(Number(e.target.value))}
                    className="mt-2 w-full"
                  />
                </div>
              </div>

              {/* Batch & Seed */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Images</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Seed</label>
                  <input
                    placeholder="blank = random"
                    className="mt-2 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="flex items-center text-sm text-indigo-400 hover:text-indigo-300"
                >
                  {showAdvanced ? "▼" : "►"} Advanced Options
                </button>

                {showAdvanced && (
                  <div className="mt-2 space-y-3 p-3 rounded-xl bg-neutral-800/50">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Restore Faces</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restoreFaces}
                          onChange={() => setRestoreFaces(!restoreFaces)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm">High Resolution</label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={highRes}
                          onChange={() => setHighRes(!highRes)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {highRes && (
                      <>
                        <div>
                          <label className="block text-sm">High Res Scale: {hrScale}</label>
                          <input
                            type="range"
                            min="1.5"
                            max="3"
                            step="0.1"
                            value={hrScale}
                            onChange={(e) => setHrScale(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm">High Res Steps: {hrSteps}</label>
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={hrSteps}
                            onChange={(e) => setHrSteps(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* LoRAs */}
              <div className="mt-6">
                <label className="block text-sm font-medium">LoRAs</label>
                <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-auto rounded-xl border border-neutral-800 p-2">
                  {loras.map((l) => {
                    const name = l.alias || l.name;
                    const active = selectedLoras.some((x) => x.name === name);
                    return (
                      <button
                        type="button"
                        key={name}
                        onClick={() => toggleLora(l)}
                        className={`truncate rounded-lg border px-2 py-2 text-left text-sm ${
                          active
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
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
                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3"
                      >
                        <span className="w-40 truncate text-sm">{x.name}</span>
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={x.weight}
                          onChange={(e) => setLoraWeight(x.name, Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-12 text-right text-sm">{x.weight.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedLoras((prev) => prev.filter((l) => l.name !== x.name))}
                          className="rounded-lg border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
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
                className="mt-6 w-full rounded-2xl border border-indigo-500 bg-indigo-600 px-4 py-3 font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {isLoading ? "Generating…" : "Generate"}
              </button>

              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

              <p className="mt-4 text-xs text-neutral-500">
                Tip: add camera & lens hints (e.g. "85mm, f/1.8"), mood ("golden hour"), and wardrobe ("monochrome blazer").
              </p>
            </form>

            {/* Results */}
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Results</h2>
                {images.length > 0 && (
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
                    className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
                  >
                    Download all
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-800">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="mt-2 text-neutral-400">Rendering avatars…</p>
                  </div>
                </div>
              )}

              {!isLoading && images.length === 0 && (
                <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-800 text-neutral-500">
                  No images yet. Generate to see results here.
                </div>
              )}

              {!isLoading && images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((img) => (
                    <figure key={img.id} className="group overflow-hidden rounded-2xl border border-neutral-800 relative">
                      <img
                        src={img.url}
                        alt="AI influencer"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center">
                        <a
                          href={img.url}
                          download={`avatar_${img.i + 1}.png`}
                          className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-2 text-sm"
                        >
                          Download
                        </a>
                      </div>
                    </figure>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          // ---------------------- History Tab ----------------------
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generation History</h2>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Clear all history?")) clearAllHistory();
                  }}
                  className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-800"
                >
                  Clear all
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border border-neutral-800 text-neutral-500">
                No generation history yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {history.map((img) => (
                  <figure key={img.id} className="group overflow-hidden rounded-2xl border border-neutral-800 relative">
                    <img
                      src={img.url}
                      alt="Generated influencer"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-80 transition-all opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-3">
                      <p className="text-xs text-neutral-300 text-center mb-2 line-clamp-3">
                        {(img.prompt || '').substring(0, 100)}...
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={img.url}
                          download={`avatar_${img.timestamp || Date.now()}.png`}
                          className="bg-indigo-600 hover:bg-indigo-500 rounded-lg px-3 py-1 text-xs"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => {
                            if (confirm("Delete this image from local history?")) {
                              deleteHistoryImage(img);
                            }
                          }}
                          className="bg-red-600 hover:bg-red-500 rounded-lg px-3 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
