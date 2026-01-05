"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import PrintedGallery from "./PrintedGallery";
import ImageModal from "./ImageModal";
import ImageProviderModal from "./ImageProviderModal";
import { useRouter } from "next/navigation";
import { saveAssetFromBase64, saveAssetFromUrl } from "../utils/saveAsset";
import { useAuth } from "@/context/AuthContext";
import { UpgradeBanner } from "./UpgradeBanner";
import AccentBar from "./AccentBar";
import TemplateLauncher from "./TemplateLauncher";
import ModelGrid from "./ModelGrid";
import ResolutionPopoverButton from "./ResolutionPopoverButton";
import SettingsPopoverButton from "./SettingsPopoverButton";
import SelectedModelBadge from "./SelectedModelBadge";
import ModeTabs from "./ModeTabs";

export default function ImageGenerationPanel({
  value: externalValue = "",
  modelTag = "Flux",
}) {
  const {
    prompt: ctxPrompt,
    setPrompt: setCtxPrompt,
    onGenerateImage,
    onGenerateNanoBanana,
    loading,
    credits,
    selectedModel,
    setSelectedModel,
    selectedSampler,
    generatedImages,
  } = useImageGeneration();

  const { user } = useAuth();
  const router = useRouter();
  const galleryRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /* Provider (single source of truth) */
  /* ------------------------------------------------------------------ */
  const [imageProvider, setImageProvider] = useState("stable-diffusion");
  const isNanoBanana = imageProvider === "nano-banana-pro";

  /* ------------------------------------------------------------------ */
  /* Provider modal */
  /* ------------------------------------------------------------------ */
  const [showProviderModal, setShowProviderModal] = useState(false);

  useEffect(() => {
    if (isNanoBanana) {
      setSelectedModel({
        id: "nano-banana-pro",
        name: "Nano Banana Pro",
      });
    }
  }, [isNanoBanana, setSelectedModel]);

  /* ------------------------------------------------------------------ */
  /* Prompt */
  /* ------------------------------------------------------------------ */
  const [promptLocal, setPromptLocal] = useState(externalValue);
  const prompt = ctxPrompt ?? promptLocal;
  const setPrompt = setCtxPrompt ?? setPromptLocal;

  /* ------------------------------------------------------------------ */
  /* UI state */
  /* ------------------------------------------------------------------ */
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [showModelGrid, setShowModelGrid] = useState(false);
  const [isGen, setIsGen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [thumbs, setThumbs] = useState([]);

  /* ------------------------------------------------------------------ */
  /* Nano Banana options */
  /* ------------------------------------------------------------------ */
  const [nbAspect, setNbAspect] = useState("1:1");
  const [nbResolution, setNbResolution] = useState("1K");
  const [nbFormat, setNbFormat] = useState("png");

  /* ------------------------------------------------------------------ */
  /* Stable Diffusion aspect */
  /* ------------------------------------------------------------------ */
  const [aspect, setAspect] = useState("1:1");
  const cycleAspect = () => {
    const order = ["9:16", "1:1", "16:9"];
    setAspect((a) => order[(order.indexOf(a) + 1) % order.length]);
  };

  /* ------------------------------------------------------------------ */
  /* Guards */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (typeof credits === "number" && credits <= 0) {
      setShowUpgradePopup(true);
    }
  }, [credits]);

  const handleUpgrade = () => router.push("/pricing");

  /* ------------------------------------------------------------------ */
  /* Generate */
  /* ------------------------------------------------------------------ */
  const handleGenerate = useCallback(async () => {
    if (!prompt?.trim()) return alert("Enter a prompt");

    if (!isNanoBanana && !selectedSampler) {
      return alert("Select a sampler");
    }

    if (credits <= 0) return setShowUpgradePopup(true);

    try {
      setIsGen(true);

      if (isNanoBanana) {
        await onGenerateNanoBanana({
          prompt,
          aspect_ratio: nbAspect,
          resolution: nbResolution,
          output_format: nbFormat,
        });
      } else {
        await onGenerateImage();
      }
    } finally {
      setIsGen(false);
    }
  }, [
    prompt,
    isNanoBanana,
    selectedSampler,
    credits,
    onGenerateNanoBanana,
    nbAspect,
    nbResolution,
    nbFormat,
    onGenerateImage,
  ]);

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleGenerate();
    }
  };

  const busy = loading || isGen;

  /* ------------------------------------------------------------------ */
  /* Gallery helpers */
  /* ------------------------------------------------------------------ */
  const handleSelect = (img, setObj) => {
    setSelectedImage(img);
    setThumbs(setObj?.images || []);
    setModalOpen(true);
  };

  const handleSaveToAssets = async (image) => {
    if (!user || !image) return;
    if (image.base64Image) {
      await saveAssetFromBase64({
        uid: user.uid,
        base64: `data:image/png;base64,${image.base64Image}`,
        name: "asset.png",
      });
    } else if (image.imageUrl) {
      await saveAssetFromUrl({
        uid: user.uid,
        url: image.imageUrl,
        name: "asset.png",
      });
    }
    alert("Saved");
  };

  /* ------------------------------------------------------------------ */
  /* Render */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 text-xs border-b border-white/10">
        <ModeTabs />
        <div className="truncate text-zinc-400 max-w-[40vw]">
          {prompt || "Prompt"}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span>{busy ? "Generating…" : "Ready"}</span>
          <span className="px-2 py-0.5 rounded bg-white/5 ring-1 ring-white/10">
            {modelTag}
          </span>
        </div>
      </header>

      <div className="px-4">
        <AccentBar />
      </div>

      {/* Gallery */}
      <div className="px-4 pb-48">
        <PrintedGallery
          ref={galleryRef}
          images={generatedImages}
          loading={!!loading}
          queuedCount={1}
          onSelect={handleSelect}
        />
      </div>

      <UpgradeBanner
        show={showUpgradePopup}
        onUpgrade={handleUpgrade}
        onLater={() => setShowUpgradePopup(false)}
      />

      {/* Bottom Dock */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center px-4">
        <div className="w-full max-w-4xl rounded-2xl bg-zinc-950/90 ring-1 ring-white/10 backdrop-blur-xl shadow-2xl">
          {/* Prompt */}
          <div className="flex items-center gap-2 p-3">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe your image…"
              className="flex-1 h-14 rounded-xl bg-white/5 px-4 text-sm text-white placeholder-zinc-500 ring-1 ring-white/10 focus:ring-white/20 outline-none"
            />

            <button
              onClick={handleGenerate}
              disabled={busy}
              className="h-10 w-10 rounded-full bg-white text-black hover:bg-zinc-200 transition disabled:opacity-60"
            >
              ▶
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2 px-3 pb-3 text-xs">
            <SelectedModelBadge model={selectedModel} />

            {/* Provider modal trigger */}
            <button
              onClick={() => setShowProviderModal(true)}
              className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white/10 flex items-center gap-2"
            >
              {isNanoBanana ? "Nano Banana Pro" : "Stable Diffusion"}
              <span className="opacity-60">▾</span>
            </button>

            <SettingsPopoverButton />

            {/* Aspect */}
            {isNanoBanana ? (
              <select
                value={nbAspect}
                onChange={(e) => setNbAspect(e.target.value)}
                className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
              >
                {[
                  "1:1","2:3","3:2","3:4","4:3",
                  "4:5","5:4","9:16","16:9","21:9","auto"
                ].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={cycleAspect}
                className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
              >
                {aspect}
              </button>
            )}

            {/* Resolution */}
            {isNanoBanana ? (
              <select
                value={nbResolution}
                onChange={(e) => setNbResolution(e.target.value)}
                className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
              >
                {["1K", "2K", "4K"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            ) : (
              <ResolutionPopoverButton />
            )}

            {/* Format */}
            {isNanoBanana && (
              <select
                value={nbFormat}
                onChange={(e) => setNbFormat(e.target.value)}
                className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
              </select>
            )}

            <div className="ml-auto flex gap-2">
              {!isNanoBanana && (
                <TemplateLauncher onSendToPrompt={({ text }) => setPrompt(text)} />
              )}
              {!isNanoBanana && (
                <button
                  onClick={() => setShowModelGrid(true)}
                  className="px-3 h-8 rounded-full bg-white/5 ring-1 ring-white/10"
                >
                  Browse models
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 px-3 py-1 flex justify-between text-[11px] text-zinc-400">
            <span>{modelTag}</span>
            <span>⌘ / Ctrl + Enter</span>
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      <ImageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedImage={selectedImage}
        images={thumbs}
        onPick={setSelectedImage}
        onSave={() => handleSaveToAssets(selectedImage)}
      />

      {/* SD model grid */}
      <ModelGrid
        isVisible={showModelGrid}
        onClose={() => setShowModelGrid(false)}
        onSelect={(model) => {
          setSelectedModel(model);
          setShowModelGrid(false);
        }}
      />

      {/* Provider modal */}
      <ImageProviderModal
        open={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        selected={imageProvider}
        onSelect={(id) => {
          setImageProvider(id);
          setShowProviderModal(false);
        }}
      />
    </div>
  );
}
