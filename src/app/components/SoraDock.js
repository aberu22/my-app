// components/SoraDock.js
"use client";
import React from "react";

export default function SoraDock({
  value,
  onChange,
  onGenerate,
  disabled,
  durationLabel = "5s",
  resLabel = "480p",
  aspectLabel = "2:3",
  modelLabel = "1v",
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-50 flex justify-center px-3 sm:px-6">
      <div
        className={[
          "pointer-events-auto w-full max-w-5xl rounded-[28px]",
          "bg-gradient-to-b from-[#1b1e22]/80 via-[#1a1d20]/70 to-[#0f1114]/60",
          "backdrop-blur-xl supports-[backdrop-filter]:backdrop-saturate-150",
          "ring-1 ring-white/10 shadow-[0_12px_48px_-16px_rgba(0,0,0,.9)]",
        ].join(" ")}
      >
        {/* Input row */}
        <div className="relative px-4 sm:px-6 pt-3 pb-2">
          <div className="flex items-center gap-3">
            {/* "+" */}
            <button
              type="button"
              className="shrink-0 grid place-items-center h-8 w-8 rounded-full bg-white/[0.08] ring-1 ring-white/10 hover:bg-white/[0.12]"
              title="Add"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
              </svg>
            </button>

            {/* Prompt input */}
            <input
              value={value}
              onChange={(e) => onChange && onChange(e.target.value)}
              placeholder="Describe your video..."
              className="flex-1 h-10 rounded-xl bg-white/[0.06] px-4 text-[15px] text-gray-200 placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-white/20"
            />

            {/* Storyboard (right pill) */}
            <button
              type="button"
              className="shrink-0 rounded-full px-4 h-10 text-sm font-medium bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.12]"
              title="Storyboard"
            >
              Storyboard
            </button>

            {/* Upload arrow */}
            <button
              type="button"
              className="shrink-0 grid place-items-center h-10 w-10 rounded-full bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.12]"
              title="Upload"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M5 20h14v-2H5v2Zm7-16l-5 5h3v4h4v-4h3l-5-5Z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Controls row (pills) */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pb-3">
          <Pill>Video</Pill>
          <Pill>{aspectLabel}</Pill>
          <Pill>
            {/* diamond icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
              <path
                fill="currentColor"
                d="M12 2L3 9l9 13l9-13l-9-7Z"
              />
            </svg>
            {resLabel}
          </Pill>
          <Pill>
            {/* clock icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
              <path
                fill="currentColor"
                d="M12 8v5l4 2l.5-.9l-3.5-1.6V8h-1ZM12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Z"
              />
            </svg>
            {durationLabel}
          </Pill>
          <Pill>
            {/* screen icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
              <path fill="currentColor" d="M4 5h16v10H4V5Zm0 12h16v2H4v-2Z" />
            </svg>
            {modelLabel}
          </Pill>
          <Pill muted>
            {/* layers icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
              <path
                fill="currentColor"
                d="m12 2l10 6l-10 6L2 8l10-6Zm0 14l8.66-5.2L22 12l-10 6l-10-6l1.34-.8L12 16Z"
              />
            </svg>
            Preset
          </Pill>
          <Pill muted>
            <svg width="14" height="14" viewBox="0 0 24 24" className="mr-1">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"
              />
            </svg>
            ?
          </Pill>

          {/* spacer */}
          <div className="ml-auto" />

          {/* Generate (glow) */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={disabled}
            className="relative h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 ring-1 ring-white/10 shadow-[0_10px_30px_-8px_rgba(99,102,241,.8)] disabled:opacity-60"
            title="Generate"
            aria-label="Generate"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" className="absolute inset-0 m-auto text-white">
              <path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* Small pill button used above */
function Pill({ children, muted }) {
  return (
    <button
      type="button"
      className={[
        "rounded-full px-4 h-9 text-sm inline-flex items-center",
        "ring-1 ring-white/10",
        muted
          ? "bg-white/[0.06] text-zinc-400"
          : "bg-white/[0.06] hover:bg-white/[0.12] text-zinc-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
