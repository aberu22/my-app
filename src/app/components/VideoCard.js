// components/VideoCard.js
"use client";
import { Trash2, RotateCcw, PlayCircle } from "lucide-react";

export default function VideoCard({ src, prompt, onDelete, onRerun, onUse }) {
  return (
    <div className="flex bg-neutral-900 rounded-lg overflow-hidden shadow mb-6">
      {/* Video section */}
      <div className="flex-1 bg-black flex items-center justify-center">
        <video
          className="max-h-[300px] w-full object-contain bg-black"
          src={src}
          controls
        />
      </div>

      {/* Sidebar with actions */}
      <div className="w-56 border-l border-neutral-800 p-3 flex flex-col text-sm text-gray-300">
        <p className="mb-2">Text to video</p>
        <p className="text-gray-400 text-xs mb-4">{prompt}</p>

        <div className="mt-auto space-y-2">
          <button
            onClick={onUse}
            className="w-full bg-neutral-800 hover:bg-neutral-700 py-1.5 rounded transition"
          >
            Use
          </button>
          <button
            onClick={onRerun}
            className="w-full bg-neutral-800 hover:bg-neutral-700 py-1.5 rounded transition flex items-center justify-center gap-1"
          >
            <RotateCcw size={14}/> Rerun
          </button>
          <button
            onClick={onDelete}
            className="w-full bg-red-600 hover:bg-red-500 py-1.5 rounded transition flex items-center justify-center gap-1"
          >
            <Trash2 size={14}/> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
