import React, { useEffect, useMemo, useState } from "react";
import { fetchLoraTemplates } from "../utils/api";

export default function LoraTemplateGrid({
  selected,
  onToggleTemplate,
  max = 3,
  onSelectTemplate,
  catalog = "nsfw",
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [legacyIndex, setLegacyIndex] = useState(null);

  const isMulti = useMemo(
    () => selected instanceof Set && typeof onToggleTemplate === "function",
    [selected, onToggleTemplate]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchLoraTemplates(catalog);
        if (mounted) setTemplates(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load templates");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [catalog]);

  const idOf = (tpl) =>
    String(tpl?.safetensor ?? tpl?.model ?? tpl?.lora_name ?? "").trim();

  const labelOf = (tpl) =>
    String(tpl?.label || "HIGH").toUpperCase();

  const selectedCount = isMulti
    ? selected?.size ?? 0
    : legacyIndex !== null
    ? 1
    : 0;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
          LoRA templates
        </h3>

        <div className="flex items-center gap-3">
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] ring-1",
              catalog === "sfw"
                ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20"
                : catalog === "nsfw"
                ? "bg-rose-500/15 text-rose-300 ring-rose-400/20"
                : "bg-indigo-500/15 text-indigo-300 ring-indigo-400/20",
            ].join(" ")}
          >
            {catalog.toUpperCase()}
          </span>

          {isMulti && (
            <div className="text-[11px] text-zinc-400">
              Selected{" "}
              <span className="font-semibold text-zinc-100">
                {selectedCount}
              </span>{" "}
              / {max}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="py-6 text-center text-xs text-zinc-500">
          Loading templates…
        </div>
      )}

      {err && (
        <div className="py-4 text-center text-xs text-rose-400">
          {err}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {templates.map((template, index) => {
          const model = idOf(template);
          const isSelectable = Boolean(model);
          const isSelected = isMulti
            ? isSelectable && selected?.has(model)
            : legacyIndex === index;

          const atMax =
            isMulti && (selected?.size ?? 0) >= max && !isSelected;

          const handleClick = () => {
            if (!isSelectable) return;

            if (isMulti) {
              if (!isSelected && atMax) return;
              onToggleTemplate?.({
                ...template,
                safetensor:
                  template?.safetensor ??
                  template?.model ??
                  template?.lora_name ??
                  "",
                model:
                  template?.model ??
                  template?.safetensor ??
                  template?.lora_name ??
                  "",
                label: labelOf(template),
              });
            } else {
              const nextIndex = isSelected ? null : index;
              setLegacyIndex(nextIndex);
              onSelectTemplate?.(
                nextIndex === null
                  ? { lora_name: "", prompt: "", trigger: "", name: "", thumbnail: "" }
                  : {
                      lora_name: model,
                      prompt: template?.trigger || "",
                      trigger: template?.trigger || "",
                      name: template?.name || model,
                      thumbnail: template?.thumbnail || "",
                    }
              );
            }
          };

          const branch = labelOf(template);

          return (
            <button
              key={`${model || "lora"}-${index}`}
              onClick={handleClick}
              disabled={!isSelectable || atMax}
              aria-pressed={isSelected}
              className={[
                "relative flex flex-col items-center p-3 w-full min-w-[160px]",
                "rounded-2xl border backdrop-blur-xl transition-all duration-200",
                isSelected
                  ? "border-white/30 bg-zinc-900/90 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]"
                  : "border-white/10 bg-zinc-900/60 hover:bg-zinc-900/80",
                (!isSelectable || atMax)
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:-translate-y-[1px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)]",
              ].join(" ")}
            >
              {/* Selected badge */}
              {isSelected && (
                <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-black">
                  Selected
                </span>
              )}

              {/* HIGH / LOW badge */}
              <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-zinc-300 ring-1 ring-white/10">
                {branch}
              </span>

              {/* Catalog badge (optional) */}
              {template?.catalog && (
                <span
                  className={[
                    "absolute left-16 top-2 rounded-full px-2 py-0.5 text-[10px] ring-1",
                    template.catalog === "sfw"
                      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20"
                      : template.catalog === "nsfw"
                      ? "bg-rose-500/15 text-rose-300 ring-rose-400/20"
                      : "bg-indigo-500/15 text-indigo-300 ring-indigo-400/20",
                  ].join(" ")}
                >
                  {template.catalog.toUpperCase()}
                </span>
              )}

              {/* Thumbnail */}
              {template?.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template?.name || model || "LoRA"}
                  className="mb-2 h-80 w-[240px] rounded-xl border border-white/10 object-cover shadow-inner"
                />
              ) : (
                <div className="mb-2 h-80 w-[240px] rounded-xl border border-white/10 bg-zinc-950" />
              )}

              {/* Name */}
              <span className="text-sm font-medium text-zinc-100 leading-snug text-center">
                {template?.name || model || "LoRA"}
              </span>

              {/* Trigger */}
              {template?.trigger ? (
                <span className="mt-1 text-xs italic text-zinc-400">
                  Trigger: “{template.trigger}”
                </span>
              ) : (
                <span className="mt-1 text-xs italic text-zinc-500">
                  No trigger
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cap hint */}
      {isMulti && (selected?.size ?? 0) >= max && (
        <div className="mt-4 text-center text-xs text-zinc-400">
          You’ve selected {max}. Click a selected card to deselect it.
        </div>
      )}
    </div>
  );
}
