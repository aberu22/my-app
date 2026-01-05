"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/** Small helper for 00:00 style times */
function fmt(t) {
  if (!Number.isFinite(t)) return "00:00";
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function VideoTaskPlayer({
  src,
  prompt,
  chips = { model: "Wan2.5", res: "720P", aspect: "16:9", duration: "5s" },
  createdAt,                 // string, optional
  onUse, onRerun, onDelete,  // callbacks, optional
}) {
  const videoRef = useRef(null);
  const wrapRef  = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);

  // progress percent (0…1)
  const pct = useMemo(() => (duration ? Math.min(1, time / duration) : 0), [time, duration]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => { setDuration(v.duration || 0); setReady(true); };
    const onTime   = () => setTime(v.currentTime || 0);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const seekToPct = useCallback((e) => {
    const bar = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - bar.left) / bar.width));
    if (videoRef.current && Number.isFinite(duration)) {
      videoRef.current.currentTime = ratio * duration;
      setTime(ratio * duration);
    }
  }, [duration]);

  const goFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  }, []);

  return (
    <div className="rounded-2xl ring-1 ring-white/10 bg-[#0b0d12]/80 backdrop-blur-xl shadow-[0_8px_40px_-14px_rgba(0,0,0,.7)]">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr),22rem]">
        {/* ===== Left: player ===== */}
        <div ref={wrapRef} className="relative p-3">
          {/* Top-left tiny toolbar */}
          <div className="absolute top-4 left-4 z-10 flex gap-2 rounded-xl bg-black/35 ring-1 ring-white/15 backdrop-blur-md px-2 py-1">
            <button
              onClick={toggleMute}
              className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M16.5 12a4.5 4.5 0 0 0-.9-2.7l1.4-1.4A6.5 6.5 0 0 1 18.5 12h-2Zm3.5 0a8 8 0 0 0-1.6-4.8l1.4-1.4A10 10 0 0 1 22 12h-2ZM3 9v6h4l5 5V4L7 9H3Zm15.7 10.3l-14-14l1.4-1.4l14 14l-1.4 1.4Z"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3Zm10-1.7a6.5 6.5 0 0 1 0 9.4l1.4 1.4a8.5 8.5 0 0 0 0-12.2L13 7.3Zm3.5-3.5a10 10 0 0 1 0 16.9l1.4 1.4a12 12 0 0 0 0-19.7L16.5 5.8Z"/></svg>
              )}
            </button>
            <button onClick={onDelete} className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
            </button>
            <button onClick={onRerun} className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15" title="Rerun">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 6V3L8 7l4 4V8c2.8 0 5 2.2 5 5a5 5 0 1 1-5-5Z"/></svg>
            </button>
            <button className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15" title="Open in new">
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-8.3 8.3l-1.4-1.4L17.6 5H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z"/></svg>
            </button>
          </div>

          {/* Video matte */}
          <div className="rounded-xl bg-[#101317] ring-1 ring-white/10 overflow-hidden">
            <div className="h-[60vh] min-h-[300px] grid">
              <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain bg-black"
                playsInline
                onClick={togglePlay}
              />
            </div>

            {/* Bottom control bar */}
            <div className="px-4 py-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="h-7 w-7 grid place-items-center rounded-md bg-white/10 hover:bg-white/15"
                  title={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19h4V5H6v14Zm8-14v14h4V5h-4Z"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7L8 5Z"/></svg>
                  )}
                </button>

                <span className="text-[12px] tabular-nums text-zinc-300">{fmt(time)} / {fmt(duration)}</span>

                {/* progress */}
                <div
                  className="relative flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer"
                  onClick={seekToPct}
                  title="Seek"
                >
                  <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${pct * 100}%` }} />
                </div>

                <button
                  onClick={goFullscreen}
                  className="h-7 w-7 grid place-items-center rounded-md bg-white/10 hover:bg-white/15"
                  title="Fullscreen"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M7 14H5v5h5v-2H7v-3Zm0-4h2V7h3V5H7v5Zm10 7h-3v2h5v-5h-2v3Zm0-12h-5v2h3v3h2V5Z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Right: info panel ===== */}
        <aside className="p-4 xl:p-5 border-t xl:border-t-0 xl:border-l border-white/10">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/6 ring-1 ring-white/10 px-2.5 py-1 text-xs text-zinc-200">
              <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M4 6h16v10H4z"/><path fill="currentColor" d="M2 18h20v2H2z"/></svg>
              Text to video
            </div>
            <div className="flex gap-2">
              <button onClick={onUse} className="rounded-xl px-4 py-2 text-sm font-medium bg-white/[0.08] hover:bg-white/[0.12] ring-1 ring-white/10">Use</button>
              <button onClick={onRerun} className="rounded-xl px-4 py-2 text-sm bg-white/6 hover:bg-white/10 ring-1 ring-white/10">Rerun</button>
              <button onClick={onDelete} className="rounded-xl p-2 text-sm bg-white/6 hover:bg-white/10 ring-1 ring-white/10" title="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
              </button>
            </div>
          </div>

          {/* prompt */}
          <div className="mt-4 text-sm text-zinc-300 break-words leading-relaxed">
            {prompt || "—"}
          </div>

          {/* chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white/6 ring-1 ring-white/10 text-xs">{chips.model}</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/6 ring-1 ring-white/10 text-xs">{chips.res}</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/6 ring-1 ring-white/10 text-xs">{chips.aspect}</span>
            <span className="px-2.5 py-1 rounded-lg bg-white/6 ring-1 ring-white/10 text-xs">{chips.duration}</span>
          </div>

          {createdAt && (
            <div className="mt-4 text-[12px] text-zinc-500">
              Creation Time<br />
              <span className="text-zinc-300">{createdAt}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
