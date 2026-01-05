// components/PrintedGallery.js
'use client';

import React, { forwardRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ImageActionMenu from './imageActionsMenu';

function PrintedGalleryInner(props, ref) {
  const {
    images = [],
    loading = false,
    queuedCount = 0,
    onSelect,
    onDocId,
    onDeleted,
    onVisibilityChange,
  } = props;

  // Firestore already gives us newest → oldest (createdAt desc),
  // so just memoize the array; NO reverse here.
  const orderedImages = useMemo(() => images || [], [images]);

  const hasImages = orderedImages.length > 0;

  // how many spinner tiles we show at the very front
  const pendingCount = loading ? Math.max(queuedCount, 1) : 0;

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-6xl rounded-2xl bg-[#05060a]/40 ring-1 ring-zinc-800/80
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
              {orderedImages.length} image{orderedImages.length === 1 ? '' : 's'}
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

      {/* Grid: row-major, left → right, then wrap */}
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
          {/* 1) PENDING / SPINNER TILES AT THE VERY FRONT (NEWEST COMING) */}
          {pendingCount > 0 &&
            Array.from({ length: pendingCount }).map((_, i) => (
              <motion.div
                key={`pending-${i}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="
                  relative
                  aspect-[16/9]
                  bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-800
                  ring-1 ring-zinc-700
                  overflow-hidden
                  flex items-center justify-center
                "
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  <div className="text-[11px] text-zinc-200">
                    Generating…
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 py-1 text-center text-[10px] text-zinc-400/90 bg-black/30 backdrop-blur-sm">
                  Your image will appear here next
                </div>
              </motion.div>
            ))}

          {/* 2) REAL IMAGES – NEWEST FIRST (LEFT) */}
          {orderedImages.map((img, index) => {
            const key =
              img.id != null ? img.id : `${img.imageUrl || 'img'}-${index}`;
            const src =
              img.imageUrl ||
              (img.base64Image
                ? `data:image/png;base64,${img.base64Image}`
                : undefined);

            // index 0 => newest => label #1
            const label = `#${index + 1}`;

            return (
              <motion.div
                key={key}
                layout
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
              >
                {/* whole-tile click */}
                <button
                  type="button"
                  onClick={() =>
                    onSelect && onSelect(img, { images: orderedImages })
                  }
                  className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-white/20"
                >
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
                </button>

                {/* 3-dot menu – your existing ImageActionMenu */}
                <div
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ImageActionMenu
                    generatedImageUrl={img.imageUrl}
                    prompt={img.prompt}
                    negativePrompt={img.negativePrompt}
                    modelType={img.modelType}
                    imageId={img.firestoreId}
                    uiId={img.id}
                    onDocId={(uiId, docId) =>
                      onDocId && onDocId(uiId, docId)
                    }
                    onVisibilityChange={(uiId, isPublic) =>
                      onVisibilityChange &&
                      onVisibilityChange(uiId, isPublic)
                    }
                    onDeleted={(uiId) => onDeleted && onDeleted(uiId)}
                  />
                </div>

                {/* subtle overlay + caption + index label */}
                <div
                  className="
                    pointer-events-none
                    absolute inset-0
                    bg-gradient-to-t from-black/40 via-transparent to-transparent
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  "
                />

                <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex justify-between items-end text-[11px] text-zinc-100">
                  <span className="line-clamp-1 drop-shadow-md">
                    {img.prompt || 'Untitled prompt'}
                  </span>
                  <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    {label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* 3) EMPTY STATE */}
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
