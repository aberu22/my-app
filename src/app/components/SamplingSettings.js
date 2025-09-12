import { useImageGeneration } from "@/context/ImageGenrationContext";
import { FaSlidersH } from "react-icons/fa";

export default function SamplingSettings() {
  const {
    steps, setSteps,
    cfgScale, setCfgScale,
    seed, setSeed,
    batchSize, setBatchSize,
    batchCount, setBatchCount,
  } = useImageGeneration();


  console.log("Batch Size:", batchSize);
console.log("Batch Count:", batchCount);


  return (
    <div className="mt-6 bg-zinc-800 p-4 rounded-xl border border-zinc-700">
      <h3 className="text-sm font-medium flex items-center gap-2 text-white mb-4">
        <FaSlidersH /> Sampling Settings
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Steps */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Sampling Steps</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* CFG Scale */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">CFG Scale</label>
          <input
            type="number"
            value={cfgScale}
            onChange={(e) => setCfgScale(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Seed */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Seed</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
            />
            <button
              onClick={() => setSeed(-1)}
              className="text-xs text-purple-400 hover:underline whitespace-nowrap"
            >
              🎲 Random
            </button>
          </div>
        </div>




        {/* Batch Size */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Batch Size</label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
          />
        </div>

        {/* Batch Count */}
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Batch Count</label>
          <input
            type="number"
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
