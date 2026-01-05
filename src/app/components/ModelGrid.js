'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useImageGeneration } from '@/context/ImageGenrationContext';
import { X, Search, Lock, Check } from 'lucide-react';
import { fetchModels, fetchLoras } from '../utils/api';

/* ---------------- Compatibility Map ---------------- */
const MODEL_LORA_COMPATIBILITY = {
  Pony: ['pony', 'sdxl 1.0', 'illustrious'],
  illustrious: ['pony', 'sdxl 1.0', 'illustrious'],
  'SDXL 1.0': ['pony', 'sdxl 1.0', 'illustrious'],
  'SD 1.5': ['sd 1.5', 'flux', 'realistic', 'photo'],
};

/* ---------------- Helpers ---------------- */
const s = (v) => (v || '').toString().toLowerCase().trim();

function isPlusModel(model) {
  if (typeof model?.isPlus === 'boolean') return model.isPlus;
  if (typeof model?.plusOnly === 'boolean') return model.plusOnly;
  const name = s(model?.model_name || model?.name);
  const tags = (model?.tags || []).map(s);
  return tags.includes('plus') || name.includes('plus');
}

/* ---------------- Component ---------------- */
export default function ModelGrid({
  isVisible,
  onClose,
  onSelect,
  setFilteredLoras,
}) {
  const { selectedModel, setSelectedModel, membershipStatus } =
    useImageGeneration();

  const [mounted, setMounted] = useState(false);
  const [models, setModels] = useState([]);
  const [loras, setLoras] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  /* ---------------- Mount ---------------- */
  useEffect(() => setMounted(true), []);

  /* ---------------- Load Models on Browse ---------------- */
  useEffect(() => {
    if (!isVisible) return;

    setIsLoading(true);

    (async () => {
      try {
        const m = await fetchModels(membershipStatus);
        const l = await fetchLoras();

        const safeModels = Array.isArray(m) ? m : [];
        setModels(safeModels);
        setLoras(Array.isArray(l) ? l : []);

        // Auto-select first available model (Sora-style)
        if (!hasAutoSelected && safeModels.length) {
          const firstSelectable = safeModels.find(
            (model) => !isPlusModel(model) || membershipStatus === 'plus'
          );
          if (firstSelectable) {
            handleModelSelect(firstSelectable);
            setHasAutoSelected(true);
          }
        }
      } catch (e) {
        console.error('ModelGrid load error:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isVisible, membershipStatus]);

  /* ---------------- ESC + Scroll Lock ---------------- */
  useEffect(() => {
    if (!isVisible) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isVisible, onClose]);

  /* ---------------- Filter Models ---------------- */
  const filteredModels = useMemo(() => {
    const q = s(query);
    return models.filter((m) => {
      const name = s(m.model_name || m.name);
      const provider = s(m.provider);
      const tags = (m.tags || []).map(s);

      if (
        q &&
        !name.includes(q) &&
        !provider.includes(q) &&
        !tags.some((t) => t.includes(q))
      ) {
        return false;
      }

      return true;
    });
  }, [models, query]);

  /* ---------------- Handle Select ---------------- */
  const handleModelSelect = (model) => {
    if (isPlusModel(model) && membershipStatus !== 'plus') {
      window.location.href = '/pricing';
      return;
    }

    setSelectedModel?.(model);
    onSelect?.(model);

    const name = s(model.model_name || model.name);
    const keys = new Set();

    Object.values(MODEL_LORA_COMPATIBILITY).forEach((arr) =>
      arr.forEach((k) => keys.add(s(k)))
    );

    const compatibleLoras = loras.filter((l) => {
      const base = s(l.baseModel);
      const lname = s(l.name);
      return [...keys].some((k) => base.includes(k) || lname.includes(k));
    });

    setFilteredLoras?.(compatibleLoras);
    onClose();
  };

  if (!mounted || !isVisible) return null;

  /* ---------------- UI ---------------- */
  const ui = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[92vw] max-w-6xl max-h-[86vh] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/5 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-white/30"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>

          <button
            onClick={onClose}
            className="size-9 rounded-lg bg-white/5 ring-1 ring-white/10 hover:ring-white/30 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white/70" />
          </button>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-auto max-h-[calc(86vh-56px)]">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl bg-white/[0.04] ring-1 ring-white/10 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-white/[0.06]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 bg-white/[0.08] rounded" />
                    <div className="h-2 w-1/2 bg-white/[0.06] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="p-12 text-center text-white/50">
              No models found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredModels.map((m) => {
                const name = m.model_name || m.name;
                const selected =
                  s(selectedModel?.model_name || selectedModel?.name) ===
                  s(name);
                const locked =
                  isPlusModel(m) && membershipStatus !== 'plus';

                return (
                  <button
                    key={m.id || name}
                    onClick={() => handleModelSelect(m)}
                    disabled={locked}
                    className={`relative rounded-xl overflow-hidden bg-white/[0.04] ring-1 ring-white/10 hover:ring-white/30 transition ${
                      locked ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="aspect-[4/3]">
                      <Image
                        src={m.thumbnail || '/models/default-thumbnail.png'}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="p-3">
                      <div className="text-sm text-white truncate">
                        {name}
                      </div>
                      <div className="text-xs text-white/40">
                        {m.provider || '—'}
                      </div>
                    </div>

                    {selected && (
                      <div className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-white/10 ring-1 ring-white/20 text-white flex items-center gap-1">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}

                    {locked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm grid place-items-center">
                        <div className="text-xs text-white/80 border border-white/20 px-3 py-1.5 rounded-full">
                          Upgrade to Plus
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return createPortal(ui, document.body);
}
