"use client";

import { useState, useCallback } from "react";
import { FaImage, FaSlidersH, FaVideo, FaQuestionCircle } from "react-icons/fa";
import { useImageGeneration } from "../../context/ImageGenrationContext";
import SamplingSettings from "./SamplingSettings";

import ModelGrid from "./ModelGrid";
import LoraGrid from "./LoraGrid";
import { useRouter, usePathname } from "next/navigation";
import Samplingpopover from "./Samplingpopover";
import PopoverCard from "./PopoverCard";
import ModeToggle from "./ModeToggle";
import { ChevronRight } from 'lucide-react';


const CreateSidebar = ({ mode = "image" }) => {
  const {
    setPrompt,
    selectedLora,
    setSelectedLora,
    selectedModel,
    setSelectedModel,
    handleLoraSelect,
    selectedAspectRatio,
    handleAspectRatioChange,
    imageResolution,
  } = useImageGeneration();

  const [showModelGrid, setShowModelGrid] = useState(false);
  const [showLoraGrid, setShowLoraGrid] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);

  const [filteredLoras, setFilteredLoras] = useState([]);

  const handleLoraClick = useCallback(() => setShowLoraGrid(true), []);
  const handleModelClick = useCallback(() => setShowModelGrid(true), []);
  const [showAspectPopover, setShowAspectPopover] = useState(false);
  const [showLoraPopover, setShowLoraPopover] = useState(false)

  const isVideoMode = mode === "video";
  const pathname = usePathname();
  const router = useRouter();

  const toggleMode = () => {
    if (pathname.includes("/image-to-video")) {
      router.push("/create");
    } else {
      router.push("/image-to-video");
    }
  };

  return (
  <div className="relative flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
    {showVideoPanel && (
      <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-2xl flex items-center justify-center">
        <ImageToVideoPanel onClose={() => setShowVideoPanel(false)} />
      </div>
    )}

    {/* Sidebar - Enhanced with glass morphism and better spacing */}
    <aside className="w-[340px] p-6 border-r border-zinc-800/50 space-y-6 bg-zinc-900/30 backdrop-blur-xl">
      {/* Header with improved typography */}
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-500 text-transparent bg-clip-text tracking-tight">
          ⚡ Create Panel
        </h2>
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent my-4"></div>
      </div>

      {/* Model Selection - Enhanced card */}
      <div className="space-y-5">
        <button
          className="flex items-center gap-3 p-3.5 w-full rounded-xl bg-zinc-800/60 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-800 hover:border-zinc-700 group backdrop-blur-sm"
          onClick={handleModelClick}
        >
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/15 to-blue-500/15 group-hover:from-purple-500/25 group-hover:to-blue-500/25 transition-all">
            <FaImage className="text-purple-400 text-base" />
          </div>
          <span className="font-medium text-zinc-200">Browse Model</span>
          <ChevronRight className="ml-auto text-zinc-400 text-sm opacity-80 group-hover:opacity-100 transition-opacity" />
        </button>

        {selectedModel && (
          <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-800/30 border border-zinc-800/50 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-zinc-400 mb-1 tracking-wider uppercase">SELECTED MODEL</h3>
            <p className="text-sm text-center text-zinc-300 mb-4 font-medium">{selectedModel.title}</p>
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-zinc-800/70">
              <img
                src={selectedModel.thumbnail}
                alt={selectedModel.title}
                className="w-full h-full object-cover"
                onError={(e) => (e.target.src = "/models/default-thumbnail.png")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        )}
      </div>

      {/* Aspect Ratio Selector - More polished */}
      <div className="bg-zinc-800/30 p-5 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-2 text-zinc-300 tracking-tight">
            <FaSlidersH className="text-purple-400 opacity-80" /> 
            <span>Image Settings</span>
          </h3>
          <button 
            onClick={() => setShowAspectPopover(true)}
            className="text-zinc-500 hover:text-purple-400 transition-colors p-1 -mr-1"
            aria-label="Aspect ratio help"
          >
            <FaQuestionCircle className="opacity-70 hover:opacity-100" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5 mt-4">
          {[
            "1:1", "4:3", "3:2", "2:3", 
            "3:4", "16:9", "21:9", "9:16",
            "512x768", "768x512", "1024x1024",
            "1024x2024", "HD 1080p"
          ].map((ratio) => (
            <button
              key={ratio}
              className={`p-2 text-xs rounded-lg transition-all duration-150 ${
                selectedAspectRatio === ratio
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                  : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/70 border border-zinc-700/50 hover:border-zinc-600/50"
              } font-medium tracking-tight`}
              onClick={() => handleAspectRatioChange(ratio)}
            >
              {ratio}
            </button>
          ))}
        </div>

        <p className="text-xs text-center mt-4 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50 font-mono tracking-tight">
          📐 {imageResolution.width} × {imageResolution.height} px
        </p>
      </div>

      {/* Sampling Settings - More compact */}
      <div className="space-y-5">
        <SamplingSettings />
        <Samplingpopover />
      </div>

      {/* LoRA Selection - Enhanced */}
      <div className="space-y-3">
        <button
          className="flex items-center gap-3 p-3.5 w-full rounded-xl bg-zinc-800/60 hover:bg-zinc-700/50 transition-all duration-200 border border-zinc-800 hover:border-zinc-700 group backdrop-blur-sm"
          onClick={handleLoraClick}
        >
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/15 to-blue-500/15 group-hover:from-purple-500/25 group-hover:to-blue-500/25 transition-all">
            <FaImage className="text-blue-400 text-base" />
          </div>
          <span className="font-medium text-zinc-200">Browse LoRAs (Optional)</span>
          <ChevronRight className="ml-auto text-zinc-400 text-sm opacity-80 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="flex justify-end">
          <button
            onClick={() => setShowLoraPopover(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-zinc-800/50 rounded-md transition-all"
          >
            <FaQuestionCircle className="text-xs opacity-70" />
            <span>What are LoRAs?</span>
          </button>
        </div>

        {showLoraPopover && (
          <PopoverCard 
            title="What are LoRAs?" 
            onClose={() => setShowLoraPopover(false)}
            gradient="from-purple-900/80 to-blue-900/80"
          >
            <p className="text-sm text-zinc-300 mb-3 leading-relaxed">
              LoRAs (Low-Rank Adaptation) are lightweight fine-tuning layers that modify how your base model behaves.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-zinc-400 leading-relaxed">
              <li>Apply styles, poses, or specific characters</li>
              <li>Lightweight and efficient</li>
              <li>Combine multiple LoRAs for unique effects</li>
            </ul>
            <div className="mt-4 p-2.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
              <p className="text-xs text-zinc-500 font-medium">Pro Tip: Start with subtle weights (0.3-0.7) for best results</p>
            </div>
          </PopoverCard>
        )}

        {selectedLora && (
          <div className="flex flex-col items-center p-5 rounded-xl bg-zinc-800/30 border border-zinc-800/50 mt-2 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-zinc-400 mb-1 tracking-wider uppercase">SELECTED LoRA</h3>
            <p className="text-sm text-center text-zinc-300 mb-4 font-medium">{selectedLora.name}</p>
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-2 border-zinc-800/70">
              <img
                src={selectedLora.thumbnail}
                alt={selectedLora.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        )}
      </div>

      {/* Video Mode Indicator - More prominent */}
      {isVideoMode && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-800/30 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2.5">
            <div className="p-1.5 rounded-full bg-purple-500/20 backdrop-blur-sm">
              <FaVideo className="text-purple-400 text-sm" />
            </div>
            <span className="text-sm font-medium tracking-tight">🎬 Image to Video Mode Active</span>
          </div>
        </div>
      )}
    </aside>

    {/* LoRA Grid Modal - Enhanced overlay */}
    {showLoraGrid && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-3xl z-[1000]">
        <LoraGrid
          isVisible={showLoraGrid}
          loras={filteredLoras}
          onClose={() => setShowLoraGrid(false)}
          onSelect={(lora_name, activation_text, thumbnail) => {
            handleLoraSelect(lora_name, activation_text, thumbnail);
            setSelectedLora({ name: lora_name, activationText: activation_text, thumbnail });
            setPrompt(activation_text);
            setShowLoraGrid(false);
          }}
        />
      </div>
    )}

    {/* Model Grid Modal - Enhanced overlay */}
    {showModelGrid && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/95 backdrop-blur-3xl z-[1000]">
        <ModelGrid
          isVisible={showModelGrid}
          onClose={() => setShowModelGrid(false)}
          onSelect={(model) => {
            setSelectedModel(model);
            setShowModelGrid(false);
          }}
          setFilteredLoras={setFilteredLoras}
        />
      </div>
    )}
  </div>
);
}

export default CreateSidebar;