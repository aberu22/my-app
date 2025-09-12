"use client";
import { useState } from "react";
import PopoverCard from "./PopoverCard";

export default function SamplingSettings() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative bg-zinc-800 p-4 rounded-md mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          🧪 Sampling Settings
        </h3>
        <button
          onClick={() => setShowHelp(true)}
          className="text-xs text-purple-400 hover:text-purple-300"
        >
          ❓ Help
        </button>
      </div>

      {/* Your existing controls like sampler, steps, cfg scale here */}

      {showHelp && (
        <PopoverCard title="What is Sampling?" onClose={() => setShowHelp(false)}>
          <p>
            Sampling is how the AI generates images step by step. Different samplers affect quality, coherence, and speed.
          </p>
          <p className="text-zinc-400 text-sm">
            For example, <kbd className="bg-zinc-700 px-2 py-1 rounded text-xs">Euler a</kbd> is good for fast, stylized results. Try it with 20–30 steps.
          </p>
          <pre className="bg-zinc-800 p-3 rounded-md text-sm text-green-400 overflow-x-auto">
{`{
  "sampler": "Euler a",
  "steps": 25,
  "cfg_scale": 7.5
}`}
          </pre>
        </PopoverCard>
      )}
    </div>
  );
}
