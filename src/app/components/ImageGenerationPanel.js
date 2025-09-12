"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import GalleryManager from "./GalleryManager"; // (unused, safe to remove if you want)
import SamplerSelector from "./SamplerSelector";
import UpscalerDropdown from "./UpscalerDropdown";
import ImageActionMenu from "./imageActionsMenu";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { saveAssetFromBase64, saveAssetFromUrl } from "../utils/saveAsset";


export default function ImageGenerationPanel({ mode = "image" }) {
  const {
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    onGenerateImage,
    onGenerateVideo,
    loading,
    generatedImages,
    selectedImage,
    setSelectedImage,
    membershipStatus,
    credits,
    selectedSampler,
    generatedVideos,
  } = useImageGeneration();

  // UI state
  const [loraName, setLoraName] = useState("");
  const [fps, setFps] = useState(24);
  const [duration, setDuration] = useState(4);
  const [availableLoras, setAvailableLoras] = useState([]);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [videoFile, setVideoFile] = useState(null);


  const { user } = useAuth();

  const [savingAsset, setSavingAsset] = useState(false);

  function inferName(img) {
  const base = (img?.prompt?.slice(0, 32) || "asset")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, ""); // keep filename safe
  return `${base || "asset"}-${Date.now()}.png`;
}

async function handleSaveToAssets(image) {
  if (!user?.uid) {
    alert("Please sign in first.");
    return;
  }
  if (!image) {
    alert("Nothing selected to save.");
    return;
  }

  setSavingAsset(true);
  try {
    const name = image?.name || inferName(image);

    // If you stored base64 for this item
    if (image?.base64Image && !image?.imageUrl) {
      await saveAssetFromBase64({
        uid: user.uid,
        base64: `data:image/png;base64,${image.base64Image}`,
        name,
      });
    }
    // If you have a URL (re-upload into /assets so owner-only rules apply)
    else if (image?.imageUrl) {
      await saveAssetFromUrl({
        uid: user.uid,
        url: image.imageUrl,   // <-- missing comma fixed
        name,
      });
    }
    // Neither base64 nor URL present
    else {
      throw new Error("No base64 or URL available for this image.");
    }

    alert("Saved to Assets ✅");
  } catch (e) {
    console.error(e);
    alert("Failed to save to Assets");
  } finally {
    setSavingAsset(false);
  }
}

    
      
    







  

  // refs
  const fileInputRef = useRef(null);

  const router = useRouter();
  const isVideoMode = mode === "video";

  // show upgrade when out of credits
  useEffect(() => {
    if (credits === 0) setShowUpgradePopup(true);
  }, [credits]);

  const handleUpgrade = () => router.push("/pricing");

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // create/revoke object URL for preview to avoid leaks
  const previewUrl = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : null), [videoFile]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // sort newest first using Firestore timestamps
  const sortedGeneratedImages = useMemo(() => {
    const copy = [...(generatedImages || [])];
    copy.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
    return copy;
  }, [generatedImages]);

  

  // hide legacy images not under /images/<uid>/ path (new storage rules)
  const uid = user?.uid;
  const visibleImages = useMemo(() => {
    if (!uid) return sortedGeneratedImages;
    return sortedGeneratedImages.filter((img) => {
      if (!img?.imageUrl) return true; // allow base64 or missing
      try {
        const d = decodeURIComponent(img.imageUrl);
        return d.includes(`/images/${uid}/`);
      } catch {
        return true;
      }
    });
  }, [sortedGeneratedImages, uid]);

  // chunk for your sectioned grid
  const chunkImages = useCallback((images, size = 4) => {
    const chunks = [];
    for (let i = 0; i < images.length; i += size) chunks.push(images.slice(i, i + size));
    return chunks;
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setVideoFile(file);
  };

  const handleUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file && file.type.startsWith("image/")) setVideoFile(file);
  };

  const handleGenerate = () => {
    const p = (prompt || "").trim();
    const nneg = (negativePrompt || "").trim();

    if (!p) {
      alert("⚠️ Please enter a prompt.");
      return;
    }

    const safeFps = clamp(Math.round(Number(fps) || 24), 1, 60);
    const safeDuration = clamp(Math.round(Number(duration) || 4), 1, 30);

    if (isVideoMode) {
      if (!videoFile) {
        alert("⚠️ Please upload an image for image-to-video.");
        return;
      }
      onGenerateVideo({
        imageFile: videoFile,
        prompt: p,
        negative_prompt: nneg,
        lora_name: loraName || "",
        fps: safeFps,
        duration: safeDuration,
      });
    } else {
      if (!selectedSampler) {
        alert("⚠️ Please pick a sampler first.");
        return;
      }
      onGenerateImage();
    }
  };

  // helpful logs
  useEffect(() => {
    if (generatedVideos?.length) {
      console.log("🖼️ Updated generatedVideos", generatedVideos);
    }
  }, [generatedVideos]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased max-w-screen-xxl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
          {isVideoMode ? "🎬 Generate Video from Image" : "🖼️ Generate AI Images"}
        </h2>
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/50 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent tracking-tight">
              {isVideoMode ? "Video Mode" : "Image Mode"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-zinc-800/30 px-3.5 py-1.5 rounded-full border border-zinc-700/50 backdrop-blur-sm">
            <span className="text-zinc-400">✨ Membership:</span>
            <span className="font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {membershipStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm bg-zinc-800/30 px-3.5 py-1.5 rounded-full border border-zinc-700/50 backdrop-blur-sm">
            <span className="text-zinc-400">⚡ Credits:</span>
            <span className="font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {credits}
            </span>
          </div>
          {selectedSampler && !isVideoMode && (
            <div className="flex items-center gap-2 text-sm bg-zinc-800/30 px-3.5 py-1.5 rounded-full border border-zinc-700/50 backdrop-blur-sm">
              <span className="text-zinc-400">🎯 Sampler:</span>
              <span className="font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                {selectedSampler}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade Banner */}
      {showUpgradePopup && (
        <div className="mb-8 p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2.5 rounded-lg bg-gradient-to-br from-purple-500/15 to-blue-500/15 backdrop-blur-sm">
              {/* icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M12 2v4" /><path d="m16 6 3-3" /><path d="M18 12h4" /><path d="m16 18 3 3" /><path d="M12 20v-4" /><path d="m8 18-3 3" /><path d="M6 12H2" /><path d="m8 6-3-3" /><circle cx="12" cy="12" r="4" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white text-lg tracking-tight mb-1">Upgrade for more credits</h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">You've used all your credits. Upgrade to continue generating.</p>
              <div className="flex gap-3 mt-4">
                <button onClick={handleUpgrade} className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30">
                  Upgrade Now
                </button>
                <button onClick={() => setShowUpgradePopup(false)} className="px-5 py-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/50 border border-zinc-700/50 text-white font-medium transition-colors">
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompts */}
      <div className="space-y-5 mb-8">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your image prompt..."
            className="w-full p-4 pl-12 rounded-xl bg-zinc-900/40 border border-zinc-800/50 placeholder-zinc-500 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          <div className="absolute left-4 top-4 text-zinc-500">
            {/* icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" /><path d="m16 6 3-3" /><path d="M18 12h4" /><path d="m16 18 3 3" /><path d="M12 20v-4" /><path d="m8 18-3 3" /><path d="M6 12H2" /><path d="m8 6-3-3" /><circle cx="12" cy="12" r="4" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="Negative prompt (optional)"
            className="w-full p-4 pl-12 rounded-xl bg-zinc-900/40 border border-zinc-800/50 placeholder-zinc-500 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
          />
          <div className="absolute left-4 top-4 text-zinc-500">
            {/* icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
        </div>
      </div>

      {/* Video controls */}
      

      {/* Image mode controls */}
      {!isVideoMode && <UpscalerDropdown />}
      {!isVideoMode && <SamplerSelector />}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-10">
        <button
          onClick={handleGenerate}
          disabled={loading || (!isVideoMode && !selectedSampler)}
          className={`flex-1 py-4 rounded-xl font-medium text-white transition-all ${
            loading
              ? "bg-zinc-800/60 cursor-not-allowed border border-zinc-700/50"
              : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-600/90 hover:to-blue-600/90 shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]"
          } relative overflow-hidden`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : isVideoMode ? (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Generate Video
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                <line x1="16" y1="5" x2="22" y2="5" />
                <line x1="19" y1="2" x2="19" y2="8" />
              </svg>
              Generate Image
            </span>
          )}
          {!loading && <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-blue-600/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />}
        </button>

        <button
          onClick={() => {
            setPrompt("");
            setNegativePrompt("");
            setVideoFile(null);
          }}
          className="px-6 py-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/50 border border-zinc-700/50 text-white font-medium transition-colors flex items-center justify-center gap-3 active:scale-[0.98] backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Clear
        </button>
      </div>

      {/* Empty State */}
      {visibleImages.length === 0 && generatedVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center w-full h-[400px] bg-zinc-900/20 rounded-2xl border-2 border-dashed border-zinc-800/50 text-zinc-500 hover:border-zinc-700/50 transition-colors group">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-2xl bg-zinc-900/40 border-2 border-dashed border-zinc-800/50 flex items-center justify-center group-hover:border-purple-500/30 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-purple-500 transition-colors">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2v4" /><path d="m16 6 3-3" /><path d="M18 12h4" /><path d="m16 18 3 3" /><path d="M12 20v-4" /><path d="m8 18-3 3" /><path d="M6 12H2" /><path d="m8 6-3-3" /><circle cx="12" cy="12" r="4" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-300 group-hover:text-white transition-colors">Your generated content will appear here</h3>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed">Start by entering a creative prompt and clicking Generate to create your first AI masterpiece</p>
          </div>
        </div>
      )}

      {/* Gallery */}
      {chunkImages(visibleImages, 4).map((imageGroup, index) => (
        <div key={`group-${index}`} className="mb-16 group/section">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 via-blue-500/15 to-indigo-500/10 backdrop-blur-sm border border-white/5 shadow-sm hover:shadow-purple-500/10 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400/90">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
              Generated Collection
            </h3>
            <span className="ml-auto px-3 py-1 rounded-full bg-zinc-900/80 text-sm font-medium text-zinc-200 border border-zinc-700/60 backdrop-blur-sm flex items-center gap-1.5 hover:bg-zinc-800/60 transition-colors duration-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
              {imageGroup.length} {imageGroup.length > 1 ? "creations" : "creation"}
            </span>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: index * 0.1 } },
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {imageGroup.map((image, i) => (
              <motion.div
                key={`image-${image.id || i}`}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer shadow-lg ${
                  selectedImage?.imageUrl === image.imageUrl
                    ? "border-purple-500/80 shadow-purple-500/30 ring-2 ring-purple-500/50"
                    : "border-zinc-800/60 hover:border-zinc-700/80 bg-zinc-900/50"
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.imageUrl || `data:image/png;base64,${image.base64Image}`}
                    alt={`AI generated image - ${image.prompt?.substring(0, 60) || ""}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/section:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fallback.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="absolute top-3 right-3 z-10 opacity-0 group-hover/section:opacity-100 transition-all duration-300 hover:scale-110">
                    <ImageActionMenu
                      generatedImageUrl={image.imageUrl || image.base64Image}
                      prompt={image.prompt}
                      negativePrompt={image.negativePrompt}
                      modelType={image.modelType || "default"}
                      imageId={image.id}
                      trigger={
                        <button className="p-2 rounded-full bg-zinc-900/90 border border-zinc-700/50 backdrop-blur-sm hover:bg-zinc-800/80 transition-colors duration-200 shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                      }
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover/section:opacity-100 translate-y-2 group-hover/section:translate-y-0 transition-all duration-300">
                    <p className="text-sm text-white font-medium line-clamp-2" title={image.prompt}>
                      {image.prompt || "AI generated image"}
                    </p>
                    {image.modelType && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/50">
                        {image.modelType}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}

      {/* Selected Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          role="dialog"
          aria-modal="true"
          aria-label="Generated image details"
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedImage(null);
          }}
          onClick={() => setSelectedImage(null)} // click outside to close
        >
          <div
            className="relative w-screen h-screen bg-zinc-950 rounded-none overflow-hidden border border-zinc-800/50 shadow-2xl grid grid-rows-1 md:grid-cols-[2fr_1fr]"
            onClick={(e) => e.stopPropagation()} // keep inner clicks from closing
          >
            {/* Back Button (mobile-friendly) */}
            <button
              className="absolute top-4 left-4 z-20 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition-colors border border-zinc-700/50 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Close Button */}
            <button
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-800/80 hover:bg-red-500 transition-colors border border-zinc-700/50 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Left: Image Preview */}
            <div className="w-full h-full bg-black flex items-center justify-center p-6 md:p-8 overflow-auto">
              {(selectedImage?.imageUrl || selectedImage?.base64Image) ? (
                <img
                  src={selectedImage.imageUrl || `data:image/png;base64,${selectedImage.base64Image}`}
                  alt={selectedImage?.prompt ? `Generated: ${selectedImage.prompt}` : "Generated image"}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/fallback.png";
                  }}
                  className="max-h-[92vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-zinc-500 text-center">⚠️ Image could not be loaded</div>
              )}
            </div>

            {/* Right: Details Panel */}
            <div className="w-full h-full p-6 md:p-6 overflow-y-auto bg-zinc-950/95 backdrop-blur-sm border-t md:border-t-0 md:border-l border-zinc-800/50">
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
                Image Details
              </h3>

              {/* Thumbnail Navigation */}
              <div className="mb-8 flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {(typeof visibleImages !== "undefined" ? visibleImages : sortedGeneratedImages).map((img, i) => {
                  const isActive =
                    (selectedImage?.id && img?.id && selectedImage.id === img.id) ||
                    (!selectedImage?.id && selectedImage?.imageUrl && selectedImage.imageUrl === img.imageUrl);

                  const thumbSrc = img?.imageUrl || (img?.base64Image ? `data:image/png;base64,${img.base64Image}` : "/fallback.png");
                  return (
                    <img
                      key={img?.id || img?.imageUrl || i}
                      src={thumbSrc}
                      alt={img?.prompt ? `Thumb: ${img.prompt}` : "Generated thumb"}
                      onClick={() => setSelectedImage(img)}
                      className={`w-28 h-28 object-cover rounded-lg cursor-pointer border-2 transition-all shrink-0 ${
                        isActive ? "border-purple-500 scale-105" : "border-transparent hover:border-zinc-600/50"
                      }`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback.png";
                      }}
                    />
                  );
                })}
              </div>

              {/* Prompt */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold text-zinc-400 mb-2 tracking-wider uppercase">Prompt</h4>
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                  <p className="text-sm text-zinc-300 leading-relaxed break-words">
                    {selectedImage?.prompt || "N/A"}
                  </p>
                </div>
              </div>

              {/* Negative Prompt */}
              {selectedImage?.negativePrompt ? (
                <div className="mb-6">
                  <h4 className="text-xs font-semibold text-zinc-400 mb-2 tracking-wider uppercase">Negative Prompt</h4>
                  <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                    <p className="text-sm text-zinc-300 leading-relaxed break-words">
                      {selectedImage.negativePrompt}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Model Info */}
              <div className="mb-8">
                <h4 className="text-xs font-semibold text-zinc-400 mb-2 tracking-wider uppercase">Model</h4>
                <span className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-800/30 text-sm font-medium">
                  {selectedImage?.modelType || "default"}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setPrompt(selectedImage?.prompt || "");
                    setNegativePrompt(selectedImage?.negativePrompt || "");
                    setSelectedImage(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                  Recreate with Same Prompt
                </button>

                 <button
                    onClick={() => handleSaveToAssets(selectedImage)}
                  disabled={savingAsset}
                  className="w-full py-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/50 border border-zinc-700/50 text-white font-medium transition-colors flex items-center justify-center gap-2 backdrop-blur-sm disabled:opacity-60"
                >
                  {savingAsset ? (
                    <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" className="opacity-25" />
                        <path d="M4 12a8 8 0 0 1 8-8" className="opacity-75" />
                      </svg>       Saving…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14" /><path d="M5 12h14" />
                      </svg>
                      Save to Assets
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const href = selectedImage?.imageUrl || (selectedImage?.base64Image ? `data:image/png;base64,${selectedImage.base64Image}` : "");
                    if (!href) return;
                    const link = document.createElement("a");
                    link.href = href;
                    link.download = `ai-image-${Date.now()}.png`;
                    link.click();
                  }}
                  className="w-full py-3.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/50 border border-zinc-700/50 text-white font-medium transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download High Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
