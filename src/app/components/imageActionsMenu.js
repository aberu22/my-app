// components/ImageActionMenu.js
"use client";
import { useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import GalleryManager from "./GalleryManager";

export default function ImageActionMenu({ generatedImageUrl, prompt, negativePrompt, modelType, imageId }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
      {/* Dots icon */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-400 hover:text-white transition"
      >
        <FiMoreVertical />
      </button>

      {/* Menu Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 p-3">
          <GalleryManager
            generatedImageUrl={generatedImageUrl}
            prompt={prompt}
            negativePrompt={negativePrompt}
            modelType={modelType}
            imageId={imageId}
          />
        </div>
      )}
    </div>
  );
}
