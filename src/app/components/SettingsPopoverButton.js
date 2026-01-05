'use client';

import { useEffect, useRef, useState } from 'react';
import { Settings, X, ChevronDown, RefreshCw } from 'lucide-react';
import { useImageGeneration } from '@/context/ImageGenrationContext';

export default function SettingsPopoverButton() {
  const {
    // generation params from context
    selectedSampler, setSelectedSampler,
    steps, setSteps,
    cfgScale, setCfgScale,
    seed, setSeed,

    // samplers from context (with loader wired in provider)
    samplers,
    samplersLoading,
    samplersError,
    reloadSamplers,

    // upscalers from context
    upscalers,                    // array of { name, ... } (standard)
    selectedUpscaler,            // could be object or string depending on provider
    setSelectedUpscaler,

    latentUpscalers,             // array of { name, ... }
    selectedLatentUpscaler,      // could be object or string
    setSelectedLatentUpscaler,
  } = useImageGeneration();

  // local UI state
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState({
    sampler: selectedSampler || '',
    steps: steps ?? 20,
    cfg: cfgScale ?? 7,
    seed: seed ?? -1,
    upscaler: typeof selectedUpscaler === 'string'
      ? selectedUpscaler
      : (selectedUpscaler?.name || ''),
    latentUpscaler: typeof selectedLatentUpscaler === 'string'
      ? selectedLatentUpscaler
      : (selectedLatentUpscaler?.name || ''),
  });

  const btnRef = useRef(null);
  const panelRef = useRef(null);

  // keep local in sync with context when it changes elsewhere
  useEffect(() => {
    setLocal({
      sampler: selectedSampler || '',
      steps: steps ?? 20,
      cfg: cfgScale ?? 7,
      seed: seed ?? -1,
      upscaler: typeof selectedUpscaler === 'string'
        ? selectedUpscaler
        : (selectedUpscaler?.name || ''),
      latentUpscaler: typeof selectedLatentUpscaler === 'string'
        ? selectedLatentUpscaler
        : (selectedLatentUpscaler?.name || ''),
    });
  }, [
    selectedSampler,
    steps,
    cfgScale,
    seed,
    selectedUpscaler,
    selectedLatentUpscaler,
  ]);

  // fetch samplers on first open if empty (provider fetch is preferred)
  useEffect(() => {
    if (open && !samplersLoading && (samplers?.length ?? 0) === 0) {
      reloadSamplers?.();
    }
  }, [open, samplers, samplersLoading, reloadSamplers]);

  // close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // apply → write back to context (normalize to numbers where needed)
  const apply = () => {
    setSelectedSampler?.(local.sampler || null);
    setSteps?.(Number(local.steps));
    setCfgScale?.(Number(local.cfg));
    setSeed?.(Number(local.seed));

    // upscalers: your payload expects names (strings)
    setSelectedUpscaler?.(local.upscaler || null);
    setSelectedLatentUpscaler?.(local.latentUpscaler || null);

    setOpen(false);
  };

  const fieldLabel = 'text-[11px] uppercase tracking-wide text-zinc-400';
  const inputBase =
    'w-full h-9 rounded-lg bg-white/5 ring-1 ring-white/10 px-3 text-sm text-zinc-200 ' +
    'placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition';

  return (
    <div className="relative">
      {/* Trigger chip */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-full
                   bg-[#0b0d12]/90 text-zinc-200 ring-1 ring-white/10
                   hover:bg-white/[0.06] hover:ring-white/20 transition
                   shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Settings size={14} className="opacity-80" />
        Settings
        <ChevronDown size={14} className={`opacity-70 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover panel — opens upward (Sora vibe) */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Settings"
          className="absolute z-50 bottom-full mb-2 w-[360px] right-0
                     rounded-2xl bg-[#0b0d12]/95 backdrop-blur-xl
                     ring-1 ring-white/10 shadow-[0_-20px_60px_-20px_rgba(0,0,0,.8)]
                     p-4 animate-in fade-in slide-in-from-bottom-1"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Generation Settings
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => reloadSamplers?.()}
                className="p-1 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
                title="Reload samplers"
                aria-label="Reload samplers"
              >
                <RefreshCw size={14} className={samplersLoading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Sampler */}
          <div className="mb-3">
            <div className={fieldLabel}>Sampler</div>
            <select
              value={local.sampler}
              onChange={(e) => setLocal((s) => ({ ...s, sampler: e.target.value }))}
              className={inputBase}
              disabled={samplersLoading || (samplers?.length ?? 0) === 0}
            >
              {samplersLoading && <option>Loading samplers…</option>}

              {!samplersLoading && samplersError && (
                <option value="">Failed to load samplers</option>
              )}

              {!samplersLoading && !samplersError && (samplers?.length ?? 0) === 0 && (
                <option value="">No samplers available</option>
              )}

              {!samplersLoading && !samplersError && (samplers?.length ?? 0) > 0 &&
                samplers.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Standard Upscaler */}
          <div className="mb-3">
            <div className={fieldLabel}>Upscaler (Standard)</div>
            <select
              value={local.upscaler}
              onChange={(e) => setLocal((s) => ({ ...s, upscaler: e.target.value }))}
              className={inputBase}
              disabled={(upscalers?.length ?? 0) === 0}
            >
              {(upscalers?.length ?? 0) === 0 && (
                <option value="">No upscalers</option>
              )}
              {(upscalers?.length ?? 0) > 0 &&
                upscalers.map((u) => {
                  const name = u?.name ?? String(u ?? '');
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              Used for the HR upscaler (e.g. ESRGAN/4x, etc.).
            </p>
          </div>

          {/* Latent Upscaler */}
          <div className="mb-3">
            <div className={fieldLabel}>Latent Upscaler</div>
            <select
              value={local.latentUpscaler}
              onChange={(e) => setLocal((s) => ({ ...s, latentUpscaler: e.target.value }))}
              className={inputBase}
              disabled={(latentUpscalers?.length ?? 0) === 0}
            >
              {(latentUpscalers?.length ?? 0) === 0 && (
                <option value="">No latent upscalers</option>
              )}
              {(latentUpscalers?.length ?? 0) > 0 &&
                latentUpscalers.map((lu) => {
                  const name = lu?.name ?? String(lu ?? '');
                  return (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  );
                })}
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              Used during latent upscaling / high-res fix stages.
            </p>
          </div>

          {/* Steps */}
          <div className="mb-3">
            <div className={fieldLabel}>Steps</div>
            <input
              type="number"
              min={1}
              max={150}
              value={local.steps}
              onChange={(e) => setLocal((s) => ({ ...s, steps: e.target.value }))}
              className={inputBase}
              placeholder="20"
            />
          </div>

          {/* CFG Scale */}
          <div className="mb-3">
            <div className={fieldLabel}>CFG Scale</div>
            <input
              type="number"
              step="0.5"
              min={0}
              max={30}
              value={local.cfg}
              onChange={(e) => setLocal((s) => ({ ...s, cfg: e.target.value }))}
              className={inputBase}
              placeholder="7"
            />
          </div>

          {/* Seed */}
          <div className="mb-4">
            <div className={fieldLabel}>Seed</div>
            <input
              type="number"
              value={local.seed}
              onChange={(e) => setLocal((s) => ({ ...s, seed: e.target.value }))}
              className={inputBase}
              placeholder="-1 (random)"
            />
            <p className="mt-1 text-[11px] text-zinc-500">
              Use -1 for random seed. Same seed + params ⇒ reproducible image.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="h-9 px-3 rounded-lg bg-white/5 ring-1 ring-white/10 text-zinc-200 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={apply}
              disabled={samplersLoading}
              className="h-9 px-3 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600
                         text-white shadow-lg shadow-purple-500/20 hover:brightness-110 transition
                         disabled:opacity-60"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
