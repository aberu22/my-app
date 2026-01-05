'use client';

import React, { forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * images: [
 *  {
 *    id?: string|number,
 *    imageUrl?: string,
 *    base64Image?: string,
 *    prompt?: string,
 *    createdAt?: number|string
 *  }
 * ]
 *
 * props:
 *  - images: array from your context
 *  - loading: boolean
 *  - queuedCount: how many are about to be generated (for skeletons)
 *  - onSelect(image, { images }): when user clicks an image
 */
function PrintedGalleryInner(props, ref) {
  const { images = [], loading, queuedCount = 0, onSelect } = props;

  const hasImages = images && images.length > 0;

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-6xl rounded-2xl bg-[#05060a]/40 ring-1 ring-zinc-800/80
                 shadow-[0_18px_60px_-25px_rgba(0,0,0,0.9)] overflow-hidden"
    >
      {/* Session header */}
      <div className="flex items-center justify-between px-4 py-3 text-xs text-zinc-400 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Session 1
          </span>

          {hasImages && (
            <span className="rounded-full bg-zinc-800/70 px-2 py-0.5 text-[11px] text-zinc-300">
              {images.length} image{images.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {loading && <span className="text-emerald-400">Generating…</span>}
          {!loading && hasImages && <span className="text-zinc-500">Done</span>}
          {!loading && !hasImages && (
            <span className="text-zinc-500">No images yet</span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          gap-[6px] sm:gap-2
          bg-black
        "
      >
        <AnimatePresence initial={false}>
          {images.map((img, index) => {
            const key = img.id != null ? img.id : `${img.imageUrl || 'img'}-${index}`;
            const src =
              img.imageUrl ||
              (img.base64Image
                ? `data:image/png;base64,${img.base64Image}`
                : undefined);

            return (
              <motion.button
                key={key}
                layout
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="
                  group relative
                  aspect-[16/9]
                  overflow-hidden
                  bg-zinc-900
                  ring-1 ring-zinc-800
                  hover:ring-zinc-300/80
                  transition
                "
                onClick={() => onSelect && onSelect(img, { images })}
              >
                {/* Image */}
                {src ? (
                  <img
                    src={src}
                    alt={img.prompt || `Generated image ${index + 1}`}
                    className="
                      h-full w-full
                      object-cover
                      transition-transform duration-500
                      group-hover:scale-[1.02]
                      group-hover:brightness-110
                    "
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                    No preview
                  </div>
                )}

                {/* Hover gradient */}
                <div
                  className="
                    pointer-events-none
                    absolute inset-0
                    bg-gradient-to-t from-black/40 via-transparent to-transparent
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  "
                />

                {/* Caption */}
                <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex justify-between items-end text-[11px] text-zinc-100">
                  <span className="line-clamp-1 drop-shadow-md">
                    {img.prompt || 'Untitled prompt'}
                  </span>
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    #{index + 1}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {/* Skeletons */}
          {loading &&
            Array.from({ length: Math.max(queuedCount, 4) }).map((_, i) => (
              <motion.div
                key={`skeleton-${i}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="
                  aspect-[16/9]
                  bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-800
                  animate-pulse
                "
              />
            ))}
        </AnimatePresence>

        {/* Empty state */}
        {!loading && !hasImages && (
          <div className="col-span-full flex h-52 flex-col items-center justify-center text-sm text-zinc-500">
            <p className="mb-1">No images yet</p>
            <p className="text-xs text-zinc-600">
              Type a prompt below and hit{' '}
              <span className="text-zinc-300">⌘/Ctrl + Enter</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const PrintedGallery = forwardRef(PrintedGalleryInner);
export default PrintedGallery;
