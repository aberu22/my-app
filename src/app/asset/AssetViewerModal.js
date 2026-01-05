function AssetViewerModal({ asset, onClose, onDownload, onDelete }) {
  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm">
      {/* Click outside to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 h-full w-full flex">
        {/* CENTER IMAGE */}
        <div className="flex-1 flex items-center justify-center p-10">
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="max-h-full max-w-full rounded-xl shadow-2xl"
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[360px] border-l border-zinc-800 bg-zinc-950/80 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold truncate">
            {asset.name}
          </h2>

          <p className="text-xs text-neutral-400">
            Created {asset.createdAt?.toDate?.().toLocaleString?.()}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => onDownload(asset)}
              className="w-full px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
            >
              Download
            </button>

            <button
              onClick={() => onDelete(asset)}
              className="w-full px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              Delete
            </button>
          </div>

          <div className="mt-auto text-xs text-neutral-500">
            Generated with Kling-style UI ✨
          </div>
        </div>
      </div>
    </div>
  );
}
