import { VIDEO_MODELS } from "@/config/videoModels";

export default function VideoModelSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {VIDEO_MODELS.map((model) => {
        const active = value === model.id;

        return (
          <button
            key={model.id}
            onClick={() => onChange(model.id)}
            className={`rounded-xl border p-4 text-left transition
              ${active ? "border-white bg-zinc-800" : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800"}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">
                {model.label}
              </span>

              {model.tag && (
                <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded">
                  {model.tag}
                </span>
              )}
            </div>

            <p className="text-sm text-zinc-400 mt-2">
              {model.description}
            </p>

            <p className="text-xs text-zinc-500 mt-3">
              {model.resolutions.join(" • ")} <br />
              {model.durations.join(" • ")}
            </p>
          </button>
        );
      })}
    </div>
  );
}
