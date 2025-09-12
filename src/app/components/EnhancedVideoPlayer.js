'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

/**
 * EnhancedVideoPlayer.jsx
 * TailwindCSS v4.0 + React (Next.js 13+) — JS only
 *
 * Enhanced Features:
 * - Modern glassmorphism design with advanced backdrop effects
 * - Smooth micro-animations and spring transitions
 * - Dynamic color-shifting gradients and shadows
 * - Advanced hover states and focus rings
 * - Responsive typography with fluid scaling
 * - Enhanced accessibility with better contrast
 * - Modern scrollbar styling and smooth interactions
 */

const RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function EnhancedVideoPlayer({ generatedVideos = [], getFullUrl }) {
  const [active, setActive] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [hoverTime, setHoverTime] = useState(null);
  const [toast, setToast] = useState(null);

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimeout = useRef(null);

  const currentVideo = generatedVideos[active] || {};

  const src = useMemo(() => {
    const item = generatedVideos[active];
    const raw =
      (item && (item.videoUrl || item.video_url || item.url)) ||
      (typeof item === "string" ? item : "");
    return raw ? getFullUrl(raw) : "";
  }, [generatedVideos, active, getFullUrl]);

  const poster = currentVideo?.posterUrl || undefined;

  // Helpers
  const formatTime = (t = 0) => {
    if (!Number.isFinite(t)) return '0:00';
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 1600);
  };

  // Autohide controls on mouse move
  const onMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 2000);
  };

  // Play / Pause
  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  // Seek bar click/drag
  const seekToClientX = (clientX, target) => {
    const rect = target.getBoundingClientRect();
    const pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const t = pct * (duration || 0);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const onProgressBarClick = (e) => seekToClientX(e.clientX, e.currentTarget);

  const onProgressBarMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHoverTime(pct * (duration || 0));
  };

  const onProgressBarLeave = () => setHoverTime(null);

  // Volume
  const setVol = (v) => {
    const nv = Math.min(Math.max(v, 0), 1);
    setVolume(nv);
    if (videoRef.current) {
      videoRef.current.volume = nv;
      if (nv > 0 && isMuted) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Rate
  const setPlaybackRate = (r) => {
    setRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    const root = playerRef.current;
    if (!root) return;
    if (!document.fullscreenElement) {
      try { await root.requestFullscreen(); setIsFullscreen(true); } catch {}
    } else {
      try { await document.exitFullscreen(); setIsFullscreen(false); } catch {}
    }
  };

  // Picture-in-Picture
  const handlePiP = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await el.requestPictureInPicture();
      }
    } catch {}
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const el = videoRef.current; if (!el) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey) return;
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); togglePlay(); break;
        case 'j': el.currentTime = Math.max(0, el.currentTime - 10); break;
        case 'l': el.currentTime = Math.min(duration, el.currentTime + 10); break;
        case 'ArrowLeft': el.currentTime = Math.max(0, el.currentTime - 5); break;
        case 'ArrowRight': el.currentTime = Math.min(duration, el.currentTime + 5); break;
        case 'ArrowUp': e.preventDefault(); setVol(volume + 0.05); break;
        case 'ArrowDown': e.preventDefault(); setVol(volume - 0.05); break;
        case 'm': toggleMute(); break;
        case 'f': toggleFullscreen(); break;
        case ',': {
          const idx = Math.max(0, RATES.indexOf(rate) - 1); setPlaybackRate(RATES[idx]); break;
        }
        case '.': {
          const idx = Math.min(RATES.length - 1, RATES.indexOf(rate) + 1); setPlaybackRate(RATES[idx]); break;
        }
        default: break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [duration, rate, volume, isMuted]);

  // Wire up media element events
  useEffect(() => {
    const el = videoRef.current; if (!el) return;
    const onTimeUpdate = () => setCurrentTime(el.currentTime || 0);
    const onLoadedMeta = () => { setDuration(el.duration || 0); setVideoLoaded(true); };
    const onCanPlay = () => setVideoLoaded(true);
    const onProgress = () => {
      try {
        if (el.buffered.length) setBufferedEnd(el.buffered.end(el.buffered.length - 1));
      } catch {}
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('progress', onProgress);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    // apply current settings
    el.volume = volume; el.muted = isMuted; el.playbackRate = rate;
    if (isPlaying) el.play().catch(() => {});

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [src]);

  // Clean-up
  useEffect(() => () => controlsTimeout.current && clearTimeout(controlsTimeout.current), []);

  // When switching videos, reset time & buffered; keep vol/rate
  const changeVideo = (idx) => {
    setActive(idx);
    setCurrentTime(0);
    setBufferedEnd(0);
    setVideoLoaded(false);
    setIsPlaying(true);
  };

  // Actions
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(src); showToast('Link copied'); } catch { showToast('Copy failed'); }
  };

  const progressPct = duration ? (currentTime / duration) * 100 : 0;
  const bufferPct = duration ? (bufferedEnd / duration) * 100 : 0;
  const hoverPct = hoverTime ? (hoverTime / (duration || 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 p-4 font-sans">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto">
        {/* Main Player */}
        <div className="flex-1">
          <div
            ref={playerRef}
            className="relative w-full mx-auto aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-black to-zinc-900 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-xl group transition-all duration-700 ease-out hover:shadow-3xl hover:shadow-purple-900/20 hover:ring-white/10"
            onMouseMove={onMouseMove}
            onMouseLeave={() => setShowControls(false)}
            style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `
            }}
          >
            {/* Dynamic ambient glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-1000 ease-out -z-10" />

            {/* Ambient blurred back layer */}
            <div className="absolute inset-0 opacity-20 blur-3xl pointer-events-none overflow-hidden rounded-3xl">
              {src ? (
                <video autoPlay muted loop playsInline className="w-full h-full object-cover scale-110">
                  <source src={src} type="video/mp4" />
                </video>
              ) : null}
            </div>

            {/* Loading spinner */}
            {!videoLoaded && (
              <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-md bg-black/20">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-white/80 shadow-lg" />
                  <div className="absolute inset-0 h-16 w-16 animate-pulse rounded-full border-4 border-transparent border-t-blue-400/40" style={{animationDelay: '0.5s'}} />
                </div>
              </div>
            )}

            {/* Main media */}
            <video
              ref={videoRef}
              key={src}
              src={src}
              poster={poster}
              autoPlay
              playsInline
              loop={false}
              className="relative z-10 w-full h-full object-contain bg-gradient-to-br from-black/80 to-zinc-900/60 transition-all duration-500"
              onDoubleClick={toggleFullscreen}
              onClick={togglePlay}
            />

            {/* Big Center Play on pause */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 z-20 grid place-items-center text-white group/play"
                aria-label="Play"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-white/5 blur-xl scale-150 group-hover/play:scale-175 transition-all duration-500" />
                  <div className="relative rounded-full backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 p-8 ring-1 ring-white/20 shadow-2xl shadow-black/50 group-hover/play:from-white/25 group-hover/play:to-white/10 group-hover/play:ring-white/30 group-hover/play:scale-110 transition-all duration-300 ease-out">
                    <svg viewBox="0 0 24 24" className="h-12 w-12 fill-current drop-shadow-lg">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </button>
            )}

            {/* Controls Overlay */}
            <div
              className={`absolute inset-0 z-30 flex flex-col justify-end transition-all duration-500 ease-out ${
                showControls 
                  ? 'opacity-100 bg-gradient-to-t from-black/90 via-black/20 to-transparent' 
                  : 'opacity-0 bg-gradient-to-t from-black/60 via-transparent to-transparent'
              }`}
            >
              {/* Progress bar */}
              <div className="px-6 mb-4">
                <div
                  className="relative h-2.5 w-full cursor-pointer rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm shadow-inner transition-all duration-200 hover:h-3 group/progress"
                  onClick={onProgressBarClick}
                  onMouseMove={onProgressBarMove}
                  onMouseLeave={onProgressBarLeave}
                  aria-label="Seek"
                  role="slider"
                  aria-valuemin={0}
                  aria-valuemax={duration || 0}
                  aria-valuenow={currentTime}
                >
                  {/* Buffered */}
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/20 to-white/10 transition-all duration-200" 
                    style={{ width: `${bufferPct}%` }} 
                  />
                  {/* Played */}
                  <div 
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 shadow-lg shadow-blue-500/25 transition-all duration-200" 
                    style={{ width: `${progressPct}%` }} 
                  />
                  {/* Thumb */}
                  <div 
                    className="absolute -top-1 -translate-x-1/2 h-4 w-4 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-xl shadow-black/30 ring-2 ring-white/20 backdrop-blur-sm transition-all duration-200 group-hover/progress:scale-125 group-hover/progress:shadow-2xl" 
                    style={{ left: `${progressPct}%` }} 
                  />
                  {/* Hover preview */}
                  {hoverTime !== null && (
                    <>
                      <div 
                        className="absolute -top-12 -translate-x-1/2 rounded-lg bg-gradient-to-br from-black/90 to-zinc-900/90 backdrop-blur-xl px-3 py-2 text-xs font-medium text-white shadow-2xl ring-1 ring-white/10 transition-all duration-150" 
                        style={{ left: `${hoverPct}%` }}
                      >
                        {formatTime(hoverTime)}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
                      </div>
                      <div 
                        className="absolute inset-y-0 -ml-0.5 w-1 bg-gradient-to-b from-white/80 to-white/40 rounded-full shadow-lg" 
                        style={{ left: `${hoverPct}%` }} 
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="flex items-center gap-4 px-6 pb-6 text-white select-none">
                {/* Play/Pause */}
                <IconButton title={isPlaying ? 'Pause (K)' : 'Play (K)'} onClick={togglePlay} variant="primary">
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </IconButton>

                {/* Skip -5s/+5s */}
                <IconButton title="Back 5s (←)" onClick={() => (videoRef.current.currentTime = Math.max(0, currentTime - 5))}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M11 18V6l-8.5 6 8.5 6zm2-12v12l8.5-6L13 6z"/>
                  </svg>
                </IconButton>
                <IconButton title="Forward 5s (→)" onClick={() => (videoRef.current.currentTime = Math.min(duration, currentTime + 5))}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M13 6v12l8.5-6L13 6zM11 6L2.5 12 11 18V6z"/>
                  </svg>
                </IconButton>

                {/* Volume */}
                <div className="flex items-center gap-3">
                  <IconButton title={isMuted ? 'Unmute (M)' : 'Mute (M)'} onClick={toggleMute}>
                    {isMuted || volume === 0 ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M16.5 12l4.5 4.5-1.5 1.5L15 13.5 10.5 18H6V6h4.5L15 10.5l4.5-4.5 1.5 1.5L16.5 12z"/>
                      </svg>
                    ) : volume > 0.5 ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm9-5.5v2.06c2.89.86 5 3.54 5 6.69s-2.11 5.83-5 6.69V20.5c3.99-.91 7-4.49 7-8.75s-3.01-7.84-7-8.75z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm9-2.5v11c2.33-.82 4-3.04 4-5.5s-1.67-4.68-4-5.5z"/>
                      </svg>
                    )}
                  </IconButton>
                  <div className="relative">
                    <input
                      type="range"
                      min="0" max="1" step="0.01" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVol(parseFloat(e.target.value))}
                      className="w-24 h-2 rounded-full bg-white/10 appearance-none cursor-pointer slider-thumb:appearance-none slider-thumb:h-4 slider-thumb:w-4 slider-thumb:rounded-full slider-thumb:bg-gradient-to-br slider-thumb:from-white slider-thumb:to-gray-200 slider-thumb:shadow-lg slider-thumb:ring-2 slider-thumb:ring-white/20 hover:slider-thumb:scale-110 transition-all duration-200"
                      aria-label="Volume"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="font-mono text-sm tabular-nums text-white/90 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg ring-1 ring-white/10">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Rate dropdown */}
                <div className="relative group">
                  <IconButton title="Speed">
                    <span className="text-xs font-bold">{rate}×</span>
                  </IconButton>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden flex-col rounded-xl border border-white/10 bg-gradient-to-br from-black/90 to-zinc-900/90 backdrop-blur-xl p-2 shadow-2xl shadow-black/50 group-hover:flex min-w-[80px]">
                    {RATES.map((r) => (
                      <button 
                        key={r}
                        onClick={() => setPlaybackRate(r)}
                        className={`px-3 py-2 text-sm rounded-lg text-left transition-all duration-200 font-medium ${
                          r === rate 
                            ? 'text-white bg-gradient-to-r from-blue-500/20 to-purple-500/20 ring-1 ring-white/20' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {r}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacer/title */}
                <div className="ml-2 hidden min-w-0 flex-1 items-center gap-3 truncate sm:flex">
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                  <span className="truncate text-sm text-white/90 font-medium bg-gradient-to-r from-white to-white/80 bg-clip-text">
                    {currentVideo?.prompt || 'Untitled video'}
                  </span>
                </div>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-2">
                  {/* PiP */}
                  <IconButton title="Picture-in-Picture" onClick={handlePiP}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M19 7H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-7 6H6v-2h6v2z"/>
                    </svg>
                  </IconButton>

                  {/* Copy */}
                  <IconButton title="Copy link" onClick={handleCopy}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </IconButton>

                  {/* Download */}
                  <a
                    href={src}
                    download
                    className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-2.5 text-white hover:from-white/20 hover:to-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
                    title="Download"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/>
                    </svg>
                  </a>

                  {/* Fullscreen */}
                  <IconButton title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'} onClick={toggleFullscreen}>
                    {isFullscreen ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M7 14H5v5h5v-2H7v-3zm0-4h3V7h2V5H5v5h2zm10 7h-3v2h5v-5h-2v3zm0-14V5h-5v2h3v3h2V5z"/>
                      </svg>
                    )}
                  </IconButton>

                  {/* Playlist (mobile) */}
                  <IconButton className="lg:hidden" title="Toggle playlist" onClick={() => setShowPlaylist(v => !v)}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                    </svg>
                  </IconButton>
                </div>
              </div>
            </div>

            {/* Toast */}
            {toast && (
              <div className="pointer-events-none absolute bottom-24 left-1/2 z-50 -translate-x-1/2 transform">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl bg-gradient-to-br from-black/90 to-zinc-900/90 backdrop-blur-xl px-4 py-2.5 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10">
                  {toast}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playlist */}
        <div className={`lg:w-96 w-full transition-all duration-300 ${showPlaylist ? 'block' : 'hidden'} lg:block`}>
          <div className="h-full overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950/80 to-black/60 backdrop-blur-xl p-6 ring-1 ring-white/10 shadow-2xl shadow-black/30">
            <h3 className="mb-6 flex items-center justify-between text-white">
              <span className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text">Generated Videos</span>
              <span className="text-xs text-white/60 bg-white/5 backdrop-blur-sm px-2 py-1 rounded-lg ring-1 ring-white/10">
                {generatedVideos.length} item{generatedVideos.length === 1 ? '' : 's'}
              </span>
            </h3>
            
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30 scrollbar-thumb-rounded-full">
              <div className="space-y-3">
                {generatedVideos.map((v, i) => {
                  const url = getFullUrl(v.videoUrl);
                  const th = v.posterUrl || undefined;
                  const isActive = i === active;
                  
                  return (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => changeVideo(i)}
                      className={`group relative w-full flex items-center gap-4 rounded-xl p-3 text-left transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-pink-500/20 ring-1 ring-white/20 shadow-lg shadow-blue-500/10' 
                          : 'bg-white/5 hover:bg-white/10 ring-1 ring-white/5 hover:ring-white/15 hover:scale-[1.02]'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                        <img 
                          src={th} 
                          alt={v.prompt || 'Video thumbnail'} 
                          className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-[1px] transition-opacity group-hover:opacity-80">
                          <div className={`rounded-full p-2 transition-all duration-300 ${
                            isActive 
                              ? 'bg-white/20 backdrop-blur-sm' 
                              : 'bg-white/10 group-hover:bg-white/20 group-hover:scale-110'
                          }`}>
                            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white drop-shadow-sm">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 ring-2 ring-white/20 shadow-lg animate-pulse" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white group-hover:text-white transition-colors">
                          {v.prompt || 'Untitled video'}
                        </div>
                        <div className={`mt-1 text-xs transition-colors ${
                          isActive 
                            ? 'text-blue-300 font-medium' 
                            : 'text-white/60 group-hover:text-white/80'
                        }`}>
                          {isActive ? '⚡ Now Playing' : '▶ Tap to play'}
                        </div>
                      </div>
                      
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({ children, className = '', title, onClick, variant = 'default' }) {
  const baseClasses = "rounded-xl border backdrop-blur-sm text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl";
  const variants = {
    default: "border-white/10 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 hover:border-white/20 p-2.5",
    primary: "border-white/20 bg-gradient-to-br from-white/15 to-white/8 hover:from-white/25 hover:to-white/15 hover:border-white/30 p-3"
  };
  
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}