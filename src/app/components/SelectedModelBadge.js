// components/SelectedModelBadge.jsx
'use client';

export default function SelectedModelBadge({ model }) {
  if (!model) return null;
  return (
    <div
      className="inline-flex items-center gap-2 rounded-xl bg-white/5 ring-1 ring-white/10
                 px-2.5 py-1.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]"
      title={`Selected model: ${model.title}`}
    >
      <div className="relative w-7 h-7 overflow-hidden rounded-md ring-1 ring-white/10 shrink-0">
        <img
          src={model.thumbnail}
          alt={model.title}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => (e.currentTarget.src = '/models/default-thumbnail.png')}
        />
      </div>
      <span className="text-xs text-zinc-200 truncate max-w-[160px]">{model.title}</span>
    </div>
  );
}
