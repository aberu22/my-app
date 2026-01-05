"use client";

import { useEffect } from "react";
import { VIDEO_MODELS } from "@/config/videoModels";
import { X } from "lucide-react";

export default function VideoModelModal({
  open,
  value,
  onClose,
  onSelect,
}) {
  // ✅ hooks ALWAYS run
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[80] transition ${
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      } bg-black/65 backdrop-blur-md`}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Video Model"
        className="
          fixed left-1/2 top-1/2
          -translate-x-1/2 -translate-y-1/2
          z-[81]
          w-[min(1200px,92vw)]
          max-h-[80vh]
          overflow-hidden
          rounded-3xl
          border border-zinc-800/80
          bg-gradient-to-br from-[#050814] via-black to-[#050814]
          shadow-[0_24px_160px_rgba(0,0,0,0.85)]
          ring-1 ring-cyan-500/20
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-zinc-100">
          <div className="text-sm font-semibold">Select Video Model</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-900/80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto px-6 pb-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VIDEO_MODELS.map((model) => {
              const active = value === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    onClose();
                  }}
                  className={`
                    group relative overflow-hidden rounded-2xl border
                    bg-black/60 text-left transition
                    ${
                      active
                        ? "border-cyan-400/70 ring-1 ring-cyan-400/40"
                        : "border-zinc-800/80 hover:border-cyan-500/60"
                    }
                  `}
                >
                  {model.tag && (
                    <span className="absolute top-3 right-3 z-10 rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                      {model.tag}
                    </span>
                  )}

                  <div className="aspect-video bg-zinc-900">
                    <img
                      src={model.preview || "/models/default-thumbnail.png"}
                      alt={model.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                    />
                  </div>

                  <div className="px-4 py-4">
                    <div className="text-sm font-medium text-zinc-100">
                      {model.name}
                    </div>
                    <div className="mt-1 text-xs text-zinc-400">
                      {model.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
