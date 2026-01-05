// app/components/VideoPlayer.js
"use client";

import React, { useEffect, useRef, useState, useCallback, useId } from "react";
import {
  Trash2,
  Download,
  Volume2,
  VolumeX,
  Maximize2,
  Pause,
  Play as PlayIcon,
  PanelRight,
  PanelsTopLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(s) {
  if (!Number.isFinite(s)) return "00:00";
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoPlayer({
  src,
  poster,
  rightPanelTitle = "Text to video",
  creationTime = "02 Oct 2025 16:16:00",
  promptText = "a",
   onUseTemplate,
 onRerun,
 onDelete,
 onOpenFullscreen,
}) {
  const shellRef = useRef(null);
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [errMsg, setErrMsg] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoId = useId();

  //test debug src player
    useEffect(() => {
    console.log("VideoPlayr src =", src);
  }, [src]);


  // --- media sync
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTime = () => setCurrent(v.currentTime || 0);
    const onMeta = () => {
      setDuration(Number.isFinite(v.duration) ? v.duration : 0);
      setCurrent(v.currentTime || 0);
      setIsMuted(v.muted);
      setVolume(v.volume);
      setPlaybackRate(v.playbackRate || 1);
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // --- fullscreen tracking
  useEffect(() => {
    const onFsChange = () => {
      const doc = document;
      const active =
        !!doc.fullscreenElement ||
        !!doc.webkitFullscreenElement ||
        !!doc.msFullscreenElement;
      setIsFullscreen(active);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // --- shortcuts
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onKey = (e) => {
      const v = videoRef.current;
      if (!v) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowRight":
          v.currentTime = Math.min((v.currentTime || 0) + 5, v.duration || 0);
          break;
        case "ArrowLeft":
          v.currentTime = Math.max((v.currentTime || 0) - 5, 0);
          break;
        case "Home":
          v.currentTime = 0;
          break;
        case "End":
          v.currentTime = v.duration || 0;
          break;
        default:
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const togglePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      if (v.readyState < 2) {
        await new Promise((res, rej) => {
          const onCanPlay = () => {
            v.removeEventListener("canplay", onCanPlay);
            v.removeEventListener("error", onErr);
            res();
          };
          const onErr = (e) => {
            v.removeEventListener("canplay", onCanPlay);
            v.removeEventListener("error", onErr);
            rej((e && e.error) || new Error("Media error"));
          };
          v.addEventListener("canplay", onCanPlay, { once: true });
          v.addEventListener("error", onErr, { once: true });
        });
      }

      if (v.paused) await v.play();
      else v.pause();

      setErrMsg(null);
    } catch (e) {
      const name = e && e.name ? e.name : "PlaybackError";
      let msg = "Couldn't start playback.";
      if (name === "NotSupportedError")
        msg = "This browser can't play the provided media (codec or container unsupported).";
      if (name === "NotAllowedError")
        msg = "Autoplay or playback was blocked. Try pressing play again or unmute first.";
      if (name === "AbortError") msg = "Playback was interrupted.";

      if (src && /^https?:\/\//.test(src)) {
        msg += " If this video is hosted on another domain, ensure CORS is enabled.";
      }

      setErrMsg(msg);
    }
  }, [src]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const onVolumeChange = (val) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.min(Math.max(val, 0), 1);
    v.volume = next;
    setVolume(next);
    if (next > 0 && v.muted) {
      v.muted = false;
      setIsMuted(false);
    }
  };

  const onRateChange = (val) => {
    const v = videoRef.current;
    if (!v) return;
    const allowed = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const next = allowed.includes(val) ? val : 1;
    v.playbackRate = next;
    setPlaybackRate(next);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  // --- scrubbing
  const seekToClientX = (clientX) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const r = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    v.currentTime = ratio * (v.duration || 0);
  };
  const onPointerDown = (e) => {
    setIsScrubbing(true);
    seekToClientX(e.clientX);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };
  const onPointerMove = (e) => {
    if (!isScrubbing) return;
    seekToClientX(e.clientX);
  };
  const onPointerUp = () => {
    setIsScrubbing(false);
    window.removeEventListener("pointermove", onPointerMove);
  };

  const onProgressKeyDown = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const step = 5;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        v.currentTime = Math.min((v.currentTime || 0) + step, v.duration || 0);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        v.currentTime = Math.max((v.currentTime || 0) - step, 0);
        break;
      case "Home":
        e.preventDefault();
        v.currentTime = 0;
        break;
      case "End":
        e.preventDefault();
        v.currentTime = v.duration || 0;
        break;
      default:
    }
  };

  // --- fullscreen
  const requestNativeFullscreen = (el) => {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  };
  const exitNativeFullscreen = () => {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
  };
  const toggleFullscreen = () => {
    const el = shellRef.current;
    if (!el) return;
    if (isFullscreen) exitNativeFullscreen();
    else requestNativeFullscreen(el);
  };

  // ---- UI
  return (
    <section className="w-full px-3 sm:px-4">
      {/* Outer card: Sora theme – long/wide container */}
      <div
        className="mx-auto my-3 w-full rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl"
      >
        {/* Header strip (filters/actions) */}

        <div className="flex items-center justify-between px-4 py-3 text-zinc-300">
  {/* LEFT: View full screen */}
  <button
    type="button"
    onClick={onOpenFullscreen}
    className="
      inline-flex items-center gap-2
      rounded-full bg-black/60 px-3 py-1.5
      text-xs text-white
      ring-1 ring-white/10
      hover:bg-black/80
      transition
    "
  >
    View full screen
  </button>

  {/* RIGHT: Panel */}
  <span className="hidden items-center gap-1 rounded bg-zinc-800/60 px-3 py-1 text-[11px] sm:flex">
    <PanelRight className="h-4 w-4" />
    Panel
  </span>
</div>

        

        {/* Shell: full-width player + right panel */}
        <div
          id="vp-shell"
          ref={shellRef}
          className="flex w-full gap-4 px-3 pb-4 focus:outline-none"
          tabIndex={0}
          aria-label="Custom video player shell"
        >
          {/* PLAYER */}
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-[#0b0e13]">
            {/* Stage keeps aspect and centers content; gutter space left/right like screenshot */}
            <div className="relative w-full bg-black">
              <div className="mx-auto aspect-video w-full">
                <video
                  id={videoId}
                  ref={videoRef}
                  src={src}
                  poster={poster}
                  playsInline
                  crossOrigin="anonymous"
                  preload="metadata"
                  className="h-full w-full object-contain"
                  aria-label="video"
                  onError={() =>
                    setErrMsg("Failed to load media (network, CORS, or format issue).")
                  }
                  onClick={togglePlay}
                 
                />
              </div>

              {/* Optional watermark bottom-right (Sora-like) */}
              <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/40 px-2 py-1 text-[10px] text-white/80">
                Wan
              </div>

              {/* Minimal white control strip (bottom-left) */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0">
                {/* progress line */}
                <div
                  ref={progressRef}
                  onPointerDown={onPointerDown}
                  onKeyDown={onProgressKeyDown}
                  className="pointer-events-auto relative mx-7 mb-2 h-[3px] cursor-pointer rounded bg-white/25"
                  role="slider"
                  tabIndex={0}
                  aria-controls={videoId}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(pct)}
                  aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
                  aria-label="Seek"
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-white transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="pointer-events-auto flex items-center justify-between px-5 pb-4 text-xs text-white">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="rounded p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                      aria-label={isPlaying ? "Pause" : "Play"}
                      aria-controls={videoId}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                    </button>
                    <span className="tabular-nums">
                      {formatTime(current)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 sm:flex">
                      <button
                        onClick={toggleMute}
                        className="rounded p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                        aria-controls={videoId}
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(volume * 100)}
                        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
                        aria-label="Volume"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(volume * 100)}
                        className="h-1.5 w-24 cursor-pointer appearance-none rounded bg-white/25 accent-white"
                      />
                    </div>

                    <select
                      className="hidden rounded-md border border-white/20 bg-black/30 px-2 py-1 text-[11px] text-white sm:block"
                      value={playbackRate}
                      onChange={(e) => onRateChange(Number(e.target.value))}
                      aria-label="Playback rate"
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                        <option key={r} value={r}>{r}×</option>
                      ))}
                    </select>

                    
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {errMsg && (
              <div
                className="m-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                aria-live="polite"
              >
                {errMsg}
              </div>
            )}
          </div>

          {/* RIGHT PANEL (Sora themed) */}
          <aside className="w-[300px] shrink-0 rounded-xl border border-zinc-900 bg-zinc-900 p-4">
            <div className="mb-3 text-sm font-semibold text-white/90">{rightPanelTitle}</div>

            {/* prompt snippet */}
            <div className="mb-3 text-[13px] text-zinc-300 line-clamp-3">{promptText}</div>

            {/* tags row like screenshot */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-200">Wan2.6</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-200">1080P</span>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-200">16:9</span>
            </div>

            {/* creation time */}
            <div className="mb-6 text-[11px] text-zinc-500">
              Creation Time <span className="ml-2 text-zinc-300">{creationTime}</span>
            </div>

            {/* actions exactly like screenshot */}
            <div className="mt-auto grid grid-cols-3 gap-2">
              <Button
              variant="secondary"
              className="col-span-2 h-10 rounded-lg bg-zinc-200 text-black hover:bg-zinc-100"
              onClick={() => {
                if (promptText) onUseTemplate?.(promptText);
              }}
            >
              Use
            </Button>

             
              <Button
              variant="secondary"
              className="h-10 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              onClick={() => {
                onRerun?.();
              }}
            >
              Rerun
            </Button>

            


              <Button
                variant="secondary"
                className="col-span-2 h-10 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                onClick={() => {
                  if (!src) return;
                  const a = document.createElement("a");
                  a.href = src;
                  a.download = "video.mp4";
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Save
              </Button>



              <Button
              variant="secondary"
              className="h-10 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              title="Delete"
              aria-label="Delete"
              onClick={() => {
                if (confirm("Delete this video?")) {
                  onDelete?.();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              </Button>


              
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
