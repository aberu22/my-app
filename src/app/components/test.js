
// ----------------------------------------------------
// Image Modal (kept Sora styling)
// ----------------------------------------------------
const ImageModal = React.memo(function ImageModal({ open, onClose, selectedImage, images, onPick, onRecreate, onSave, saving }) {
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const canSave = Boolean(selectedImage?.imageUrl || selectedImage?.base64Image);
  const doDownload = useCallback(() => {
    const href = selectedImage?.imageUrl || (selectedImage?.base64Image ? `data:image/png;base64,${selectedImage.base64Image}` : "");
    if (!href) return;
    const a = document.createElement("a");
    a.href = href; a.download = `ai-image-${Date.now()}.png`; a.click();
  }, [selectedImage]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" role="dialog" aria-modal onClick={(e)=> e.currentTarget===e.target && onClose()}>
      <div className="relative w-screen h-screen overflow-hidden grid grid-rows-1 md:grid-cols-[1fr_100px_360px] bg-[#0b0b0c] border border-[rgba(255,255,255,0.06)]">
        <button ref={closeBtnRef} onClick={onClose} aria-label="Go back" className="absolute top-4 left-4 z-20 p-2 rounded-lg bg-[#111215]/80 text-[#cfcfd2] border border-[rgba(255,255,255,0.08)] hover:bg-[#1a1b1e]">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button onClick={onClose} aria-label="Close modal" className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-[#111215]/80 text-[#cfcfd2] border border-[rgba(255,255,255,0.08)] hover:bg-red-500/80 hover:border-red-500/60 hover:text-white">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        {/* Preview */}
        <div className="w-full h-full ${THEME.surface} flex items-center justify-center p-6 md:p-10 overflow-auto">
          {(selectedImage?.imageUrl || selectedImage?.base64Image) ? (
            <img src={selectedImage.imageUrl || `data:image/png;base64,${selectedImage.base64Image}`}
              alt={selectedImage?.prompt || "Generated image"}
              className="max-h-[92vh] max-w-full object-contain rounded-xl shadow-lg" />
          ) : (
            <div className="text-zinc-500 text-center">⚠️ Image could not be loaded</div>
          )}
        </div>
        {/* Rail */}
        <aside className="hidden md:flex flex-col gap-2 p-3 overflow-y-auto ${THEME.panel} border-l ${THEME.border}">
          {images.map((img, i) => {
            const active = (selectedImage?.id && img?.id && selectedImage.id === img.id) || (!selectedImage?.id && selectedImage?.imageUrl && selectedImage.imageUrl === img.imageUrl);
            const thumbSrc = img?.imageUrl || (img?.base64Image ? `data:image/png;base64,${img.base64Image}` : "/fallback.png");
            return (
              <img key={img?.id || img?.imageUrl || i} src={thumbSrc} alt={img?.prompt || "thumb"} onClick={()=> onPick(img)}
                className={`w-20 h-20 object-cover rounded-lg cursor-pointer border transition-all ${active?"border-white/30 ring-2 ring-white/20 scale-[1.02]":"border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]"}`} />
            );
          })}
        </aside>
        {/* Details */}
        <div className={`w-full h-full p-6 overflow-y-auto ${THEME.panel} border-t md:border-t-0 md:border-l ${THEME.border} ${THEME.text}`}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm font-medium">Images</span>
            <span className={`px-2 py-1 rounded-md ${THEME.chipBg} ${THEME.chipBorder} text-xs`}>IMAGE 2.1</span>
            <span className={`px-2 py-1 rounded-md ${THEME.chipBg} ${THEME.chipBorder} text-xs`}>High‑Res</span>
          </div>
          <div className="mb-6">
            <h4 className="text-xs font-semibold ${THEME.subtext} mb-2 tracking-wider uppercase">Prompt</h4>
            <div className={`p-4 rounded-xl ${THEME.surface} ${THEME.border}`}>
              <p className="text-sm leading-relaxed break-words">{selectedImage?.prompt || "N/A"}</p>
            </div>
          </div>
          {selectedImage?.negativePrompt && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold ${THEME.subtext} mb-2 tracking-wider uppercase">Negative Prompt</h4>
              <div className={`p-4 rounded-xl ${THEME.surface} ${THEME.border}`}>
                <p className="text-sm leading-relaxed break-words">{selectedImage.negativePrompt}</p>
              </div>
            </div>
          )}
          <div className="mb-8">
            <h4 className="text-xs font-semibold ${THEME.subtext} mb-2 tracking-wider uppercase">Model</h4>
            <span className={`inline-block px-3 py-1.5 rounded-md ${THEME.chipBg} ${THEME.chipBorder} text-xs`}>{selectedImage?.modelType || "default"}</span>
          </div>
          <div className="space-y-3">
            <button onClick={onRecreate} className={`w-full py-3.5 rounded-lg ${THEME.chipBg} ${THEME.chipBorder} text-sm font-medium hover:bg-[rgba(255,255,255,0.10)]`}>Recreate with Same Prompt</button>
            <button onClick={onSave} disabled={saving || !canSave} className={`w-full py-3.5 rounded-lg ${THEME.chipBg} ${THEME.chipBorder} text-sm font-medium disabled:opacity-60 hover:bg-[rgba(255,255,255,0.10)]`}>
              {saving ? "Saving…" : "Save to Assets"}
            </button>
            <button onClick={doDownload} disabled={!canSave} className={`w-full py-3.5 rounded-lg ${THEME.chipBg} ${THEME.chipBorder} text-sm font-medium disabled:opacity-60 hover:bg-[rgba(255,255,255,0.10)]`}>Download High Resolution</button>
          </div>
        </div>
      </div>
    </div>
  );
});
