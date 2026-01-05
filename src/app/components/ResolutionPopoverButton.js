'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useImageGeneration } from '@/context/ImageGenrationContext';

export default function ResolutionPopoverButton() {
  const {
    selectedAspectRatio,
    setSelectedAspectRatio,     // make sure this is exported by your context
    handleAspectRatioChange,
    imageResolution,
    setImageResolution,         // make sure this is exported by your context
  } = useImageGeneration();

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // Close on outside click / escape
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Current label (e.g., "16:9 720P")
  const currentPreset =
    imageResolution?.width === 1920 && imageResolution?.height === 1080 ? '1080P'
    : imageResolution?.width === 1280 && imageResolution?.height === 720 ? '720P'
    : imageResolution?.height === 480 && (imageResolution?.width === 854 || imageResolution?.width === 640) ? '480P'
    : `${imageResolution?.width}×${imageResolution?.height}`;

  const pillBase =
    'rounded-full px-3 py-1.5 text-xs font-medium tracking-tight transition-all ring-1';
  const pillIdle =
    'bg-white/5 text-zinc-300 ring-white/10 hover:bg-white/10 hover:ring-white/20';
  const pillActive =
    'bg-white/10 text-white ring-white/20 shadow-[0_6px_24px_-8px_rgba(0,0,0,.6)]';

  return (
    <div className="relative">
      {/* Trigger button (Sora style chip) */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full
                   bg-[#0b0d12]/90 text-zinc-200 ring-1 ring-white/10
                   hover:bg-white/[0.06] hover:ring-white/20 transition
                   shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selectedAspectRatio || '16:9'} <span className="opacity-60">·</span> {currentPreset}
        <ChevronDown size={14} className={`ml-1 opacity-70 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover panel */}
      {open && (

        <div
  ref={panelRef}
  role="dialog"
  aria-label="Resolution"
  className="absolute z-50 bottom-full mb-2 w-[360px] -left-2
             rounded-2xl bg-[#0b0d12]/95 backdrop-blur-xl
             ring-1 ring-white/10 shadow-[0_-20px_60px_-20px_rgba(0,0,0,.8)]
             p-3 animate-in fade-in slide-in-from-bottom-1"
>

      
          {/* Top row: resolution presets */}
          <div className="flex items-center justify-between gap-2 mb-3 px-1">
            {[
              { label: '1080P', width: 1920, height: 1080, aspect: '16:9' },
              { label: '720P',  width: 1280, height: 720,  aspect: '16:9' },
              // 480p: true 16:9 is 854×480 (use 640×480 + '4:3' if you prefer classic SD)
              { label: '480P',  width: 854,  height: 480,  aspect: '16:9' },
            ].map((p) => {
              const active =
                imageResolution?.width === p.width && imageResolution?.height === p.height;
              return (
                <button
                  key={p.label}
                  onClick={() => {
                    setImageResolution?.({ width: p.width, height: p.height });
                    setSelectedAspectRatio?.(p.aspect); // keep aspect label in sync
                  }}
                  className={`${pillBase} ${active ? pillActive : pillIdle} flex-1 text-center`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Divider card with aspect icons */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3">
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '16:9', box: 'w-7 h-4' },
                { label: '4:3',  box: 'w-6 h-4' },
                { label: '1:1',  box: 'w-5 h-5' },
                { label: '3:4',  box: 'w-4 h-6' },
                { label: '9:16', box: 'w-4 h-7' },
              ].map(({ label, box }) => {
                const active = selectedAspectRatio === label;
                return (
                  <button
                    key={label}
                    onClick={() => handleAspectRatioChange(label)}
                    className={`flex flex-col items-center gap-1.5 py-2 rounded-xl
                                ${active ? 'bg-white/10 ring-1 ring-white/20 text-white' : 'text-zinc-300 hover:bg-white/5'}
                                transition`}
                  >
                    <div className={`border border-zinc-400/70 rounded-sm ${box}`} />
                    <span className="text-[11px] font-medium tracking-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer: current size */}
          <div className="mt-3 text-center">
            <span className="text-[11px] text-zinc-400 font-mono">
              📐 {imageResolution?.width} × {imageResolution?.height} px
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
