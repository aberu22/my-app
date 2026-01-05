"use client";

/* ------------------------------------------------------------------ */
/* Providers (single source of truth) */
/* ------------------------------------------------------------------ */
export const IMAGE_PROVIDERS = [
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    badge: null,
    thumbnail: "/thumbnails/stb.webp",
    description:
      "Advanced image generation with models, samplers, and templates.",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    badge: "NEW",
    thumbnail: "/thumbnails/nano-banana.png",
    description:
      "Nano Banana Pro, Google Gemini's AI image generator Fast, high-quality image generation with minimal configuration.",
  },
];

/* ------------------------------------------------------------------ */
/* Modal */
/* ------------------------------------------------------------------ */
export default function ImageProviderModal({
  open,
  onClose,
  selected,
  onSelect,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-2xl bg-zinc-950 ring-1 ring-white/10 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">
            Select Image Model
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {IMAGE_PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              active={selected === provider.id}
              onSelect={() => onSelect(provider.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Card */
/* ------------------------------------------------------------------ */
function ProviderCard({ provider, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`relative flex gap-4 rounded-xl p-4 text-left transition ring-1
        ${
          active
            ? "bg-white/10 ring-white"
            : "bg-white/5 ring-white/10 hover:bg-white/10"
        }`}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden  ring-1 ring-white/10 flex-shrink-0">
        <img
          src={provider.thumbnail}
          alt={provider.name}
          className="w-full h-full object-cover grayscale"
        />
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-medium">{provider.name}</h3>
          {provider.badge && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-white text-black">
              {provider.badge}
            </span>
          )}
        </div>

        <p className="mt-1 text-zinc-400 text-xs leading-snug">
          {provider.description}
        </p>
      </div>
    </button>
  );
}
