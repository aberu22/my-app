import { useEffect, useMemo, useState } from "react";
import { fetchLoraTemplates } from "../utils/api";

/**
 * Props:
 * - selected?: Set<string>               // model ids currently selected (multi-select)
 * - onToggleTemplate?: (tpl) => void     // toggles a template in/out of selection
 * - max?: number                         // max selectable (default 3 user LoRAs)
 * - onSelectTemplate?: (tpl) => void     // legacy single-select callback (fallback)
 */
export default function LoraTemplateGrid({
  selected,
  onToggleTemplate,
  max = 3,                // ✅ 3 user LoRAs (backend adds 2 base = 5 total)
  onSelectTemplate,       // legacy
}) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [legacyIndex, setLegacyIndex] = useState(null); // used only in single-select mode

  const isMulti = useMemo(
    () => selected instanceof Set && typeof onToggleTemplate === "function",
    [selected, onToggleTemplate]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchLoraTemplates();
        if (mounted) setTemplates(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load templates");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Prefer safetensor as the identity (what the backend/front API actually sends),
  // then fall back to model/lora_name.
  const idOf = (tpl) =>
    String(tpl?.safetensor ?? tpl?.model ?? tpl?.lora_name ?? "").trim();

  const labelOf = (tpl) =>
    String(tpl?.label || "HIGH").toUpperCase(); // default HIGH if not provided

  const selectedCount = isMulti
    ? (selected?.size ?? 0)
    : (legacyIndex !== null ? 1 : 0);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-zinc-300">🎨 Select LoRA Templates</h3>
        {isMulti && (
          <div className="text-xs text-zinc-400">
            Selected: <span className="font-semibold text-white">{selectedCount}</span> / {max}
          </div>
        )}
      </div>

      {loading && <div className="text-sm text-zinc-400 py-4">Loading templates…</div>}
      {err && <div className="text-sm text-red-400 py-4">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {templates.map((template, index) => {
          const model = idOf(template);
          const isSelectable = Boolean(model);

          // Unique-ish key to avoid collisions
          const baseKey =
            template.id?.toString().trim() ||
            model ||
            [template?.name, template?.trigger].filter(Boolean).join("|").trim() ||
            "lora";
          const renderKey = `${baseKey}::${index}`;

          const isSelected = isMulti
            ? (isSelectable && selected?.has(model))
            : legacyIndex === index;

          // Cap logic: in multi-select, prevent new selections when at max
          const atMax = isMulti ? ((selected?.size ?? 0) >= max && !isSelected) : false;

          const handleClick = () => {
            if (!isSelectable) {
              console.warn("Ignoring template without a valid model id:", template);
              return;
            }

            if (isMulti) {
              if (!isSelected && atMax) return; // cap reached
              // Forward the fields your onGenerateVideo expects
              onToggleTemplate?.({
                ...template,
                safetensor: template?.safetensor ?? template?.model ?? template?.lora_name ?? "",
                model: template?.model ?? template?.safetensor ?? template?.lora_name ?? "",
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

          const branch = labelOf(template); // HIGH / LOW for badge

          return (
            <button
              key={renderKey}
              onClick={handleClick}
              disabled={!isSelectable || atMax}
              aria-pressed={isSelected}
              title={
                !isSelectable
                  ? "This template is missing a model id and cannot be selected."
                  : atMax
                  ? `You can select up to ${max} user LoRAs`
                  : isSelected
                  ? "Selected"
                  : "Select"
              }
              className={[
                "relative flex flex-col items-center p-3 rounded-xl border transition text-center w-full min-w-[160px]",
                isSelected
                  ? "border-purple-500 text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600"
                  : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700",
                (!isSelectable || atMax) ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              {/* Selected ribbon */}
              {isSelected && (
                <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow">
                  Selected
                </span>
              )}

              {/* Branch badge (HIGH/LOW) */}
              <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full bg-white/10 ring-1 ring-white/15">
                {branch}
              </span>

              {/* Thumbnail */}
              {template?.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template?.name || model || "LoRA"}
                  className="w-[240px] h-80 object-cover rounded mb-2 border border-white/10"
                />
              ) : (
                <div className="w-[240px] h-80 rounded mb-2 bg-zinc-900 border border-zinc-700" />
              )}

              {/* Name */}
              <span className="text-sm text-white font-medium whitespace-normal break-words leading-snug">
                {template?.name || model || "LoRA"}
              </span>

              {/* Trigger */}
              {template?.trigger ? (
                <span className="text-xs text-purple-200/90 italic mt-1">
                  Trigger: "{template.trigger}"
                </span>
              ) : (
                <span className="text-xs text-zinc-300/60 italic mt-1">No trigger</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper hint when capped */}
      {isMulti && (selected?.size ?? 0) >= max && (
        <div className="mt-3 text-xs text-zinc-400">
          You’ve selected {max}. Click a selected card to <strong>deselect</strong> it.
        </div>
      )}
    </div>
  );
}
