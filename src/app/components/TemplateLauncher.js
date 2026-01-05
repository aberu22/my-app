"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TemplateSelection from "./TempleteSelection";
import { FaTimes } from "react-icons/fa";

export default function TemplateLauncher({ onSendToPrompt }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // mount guard for createPortal (Next.js/SSR)
  useEffect(() => setMounted(true), []);

  // disable body scroll when open
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // handle selection from the gallery
  const handleSelect = useCallback((data) => {
    onSendToPrompt?.(data);
    setOpen(false);
  }, [onSendToPrompt]);

  return (
    <>
      {/* The small button that sits in your sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full
                   bg-[#0b0d12]/90 text-zinc-200 ring-1 ring-white/10
                   hover:bg-white/[0.06] hover:ring-white/20 transition
                   shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]"
      >
        Browse Templates
      </button>

      {/* Full-screen portal overlay */}
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Panel (scrollable) */}
          <div className="absolute inset-0 overflow-y-auto">
            <div className="mx-auto max-w-[1600px] p-4 md:p-6">
              <div className="relative rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900 shadow-2xl">
                {/* Sticky header with close */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur">
                  <div className="text-sm md:text-base font-semibold text-zinc-200">
                    AI Template Gallery
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    aria-label="Close template gallery"
                  >
                    <FaTimes />
                    <span className="hidden sm:inline">Close</span>
                  </button>
                </div>

                {/* Content */}
                <TemplateSelection
                  onSendToPrompt={(data) => {
                    handleSelect(data); // closes after “Use This Template”
                  }}
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
