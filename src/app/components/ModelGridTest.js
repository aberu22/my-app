// components/ModelGrid.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Search } from 'lucide-react';

const DEFAULT_MODELS = [
  {
    id: 'flux',
    title: 'Flux 1.0 Fast',
    provider: 'Flux',
    thumbnail: '/models/flux-fast.jpg',
    tags: ['fast', 'general'],
    aspectHints: ['1:1', '9:16', '16:9'],
  },
  {
    id: 'flux-dev',
    title: 'Flux Dev',
    provider: 'Flux',
    thumbnail: '/models/flux-dev.jpg',
    tags: ['detail', 'photoreal'],
    aspectHints: ['3:4', '4:3', '9:16'],
  },
  {
    id: 'sdxl',
    title: 'SDXL',
    provider: 'Stability',
    thumbnail: '/models/sdxl.jpg',
    tags: ['open', 'stylized'],
    aspectHints: ['1:1', '2:3', '3:2'],
  },
  {
    id: 'playv',
    title: 'Play-V',
    provider: 'PlayAI',
    thumbnail: '/models/playv.jpg',
    tags: ['video', 'beta'],
    aspectHints: ['16:9', '9:16'],
  },
];

export default function ModelGrid({
  isVisible,
  onClose,
  onSelect,
  selectedModelId,
  models = DEFAULT_MODELS,
}) {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (!isVisible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isVisible]);

  useEffect(() => { setMounted(true); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models;
    return models.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        (m.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [models, query]);

  if (!mounted) return null;
  if (!isVisible) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={(e) => {
        // click backdrop to close
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* panel */}
      <div
        ref={containerRef}
        className="relative w-[92vw] max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl bg-[#0b0d12]/95 ring-1 ring-white/10 shadow-[0_20px_80px_-20px_rgba(0,0,0,.75)]"
      >
        {/* header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models (name, provider, tag)…"
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/5 text-sm text-gray-200 placeholder-gray-500 outline-none ring-1 ring-white/10 focus:ring-white/20"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          <button
            onClick={onClose}
            className="ml-2 size-9 inline-flex items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-white/20 text-gray-300"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* grid */}
        <div className="p-4 overflow-auto max-h-[calc(85vh-56px)]">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No models match “{query}”.</div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((m) => {
                const selected = m.id === selectedModelId;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelect?.(m)}
                    className={[
                      'group relative overflow-hidden rounded-xl text-left',
                      'bg-white/[0.04] ring-1 ring-white/10 hover:ring-white/20 transition',
                      selected ? 'outline outline-2 outline-indigo-400/60' : '',
                    ].join(' ')}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={m.thumbnail}
                        alt={m.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        onError={(e) => { e.currentTarget.src = '/models/default-thumbnail.png'; }}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-100 truncate">{m.title}</div>
                      <div className="text-xs text-gray-400">{m.provider}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(m.tags || []).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 ring-1 ring-white/10 text-gray-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-[10px] text-gray-400">
                        {m.aspectHints?.join(' · ')}
                      </div>
                    </div>

                    {selected && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-green-500/20 ring-1 ring-green-400/40 text-green-200">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // portal to body to avoid clipping
  return createPortal(modal, document.body);
}
