"use client";

import { useRouter } from "next/navigation";

export default function UpgradePopup({ onClose }) {
  const router = useRouter();

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70 backdrop-blur-md
        px-4
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          relative w-full max-w-md
          rounded-2xl
          bg-[#0b0d12]/90
          ring-1 ring-white/10
          shadow-[0_20px_60px_-15px_rgba(0,0,0,.85)]
          p-6
        "
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="
            absolute right-4 top-4
            h-7 w-7 rounded-full
            flex items-center justify-center
            bg-white/[0.04]
            ring-1 ring-white/10
            text-zinc-400
            hover:text-white hover:bg-white/[0.08]
            transition
          "
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Out of credits
          </h2>
          <p className="mt-1 text-[12px] text-zinc-400 leading-relaxed">
            You’ve used all your available generation credits.
            Upgrade your plan to keep creating without interruption.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push("/pricing")}
          className="
            group relative w-full
            rounded-xl px-4 py-2.5
            text-[13px] font-semibold
            text-white
            bg-gradient-to-br from-purple-500/80 to-blue-500/80
            ring-1 ring-white/10
            shadow-[0_10px_30px_-10px_rgba(0,0,0,.8)]
            transition-all duration-200
            hover:from-purple-400 hover:to-blue-400
          "
        >
          <span className="relative z-10">
            View plans
          </span>

          {/* glow */}
          <span
            className="
              absolute inset-0 rounded-xl
              bg-gradient-to-r from-purple-500/40 to-blue-500/40
              blur-xl opacity-0
              group-hover:opacity-100
              transition-opacity
            "
          />
        </button>

        {/* Secondary */}
        <button
          onClick={onClose}
          className="
            mt-3 w-full
            text-[12px] text-zinc-400
            hover:text-white
            transition
          "
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
