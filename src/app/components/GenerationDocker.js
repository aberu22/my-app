// components/GenerationDocker.js
"use client";

export default function GenerationDocker({ onGenerate }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4 flex items-center justify-between">
      {/* Left: mode selection */}
      <div className="flex gap-4 text-sm text-gray-300">
        <button className="px-3 py-1.5 bg-neutral-800 rounded hover:bg-neutral-700">
          Text to Video
        </button>
        <button className="px-3 py-1.5 bg-neutral-800 rounded hover:bg-neutral-700">
          Image to Video
        </button>
        <button className="px-3 py-1.5 bg-neutral-800 rounded hover:bg-neutral-700">
          Browse Templates
        </button>
      </div>

      {/* Right: generate */}
      <button
        onClick={onGenerate}
        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded font-medium transition"
      >
        Generate
      </button>
    </div>
  );
}
