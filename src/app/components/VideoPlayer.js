"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * Fully robust modern video player (JS, React, Next 13+)
 * - Dual sources (webm & mp4) + fallback reorder if first choice errors
 * - Autoplay handling with muted fallback
 * - canPlayType logging (webm/mp4) + URL logging
 * - Overlay with title/actions (download, copy, PiP, fullscreen)
 * - Offscreen auto-pause for perf
 */
export default function VideoPlayer({
  srcWebm,
  srcMp4,
  poster,
  title,
  className = "",
  autoPlay = true,
  loop = true,
  muted = true,
  controls = true,
  preload = "metadata",
  crossOrigin = "anonymous",
  showOverlay = true,
  autoPauseOffscreen = true,
  downloadUrl, // optional override for the download button
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Prefer webm first (smaller/better) by default; we can flip on error
  const [preferWebmFirst, setPreferWebmFirst] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!!muted);

  // Capability check only runs client-side
  const canPlay = useMemo(() => {
    if (typeof document === "undefined") return { mp4: "", webm: "" };
    const v = document.createElement("video");
    return {
      mp4: v.canPlayType("video/mp4"),
      webm: v.canPlayType("video/webm"),
    };
  }, []);

  // Debug logging on every render of URLs and capabilities
  useEffect(() => {
    // Logs both URLs so you can validate them immediately
    console.log("[VideoPlayer] URLs →", { srcWebm, srcMp4, poster, preferWebmFirst });
    // Logs codec support
    console.log("[VideoPlayer] canPlayType →", canPlay);
  }, [srcWebm, srcMp4, poster, preferWebmFirst, canPlay]);

  // Try to kick off autoplay and fall back to muted autoplay if needed
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !autoPlay) return;

    const tryPlay = async () => {
      try {
        await el.play();
        setIsPlaying(true);
      } catch (err) {
        // Some browsers require muted to autoplay
        if (!el.muted) {
          el.muted = true;
          setIsMuted(true);
          try {
            await el.play();
            setIsPlaying(true);
          } catch (err2) {
            console.warn("[VideoPlayer] Autoplay blocked:", err2?.message || err2);
          }
        } else {
          console.warn("[VideoPlayer] Autoplay blocked:", err?.message || err);
        }
      }
    };

    tryPlay();
  }, [autoPlay]);

  // Auto pause when scrolled offscreen (saves CPU/GPU)
  useEffect(() => {
    if (!autoPauseOffscreen || typeof IntersectionObserver === "undefined") return;
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) return;
        if (entry.isIntersecting) {
          if (autoPlay && !el.paused) return; // already playing
          if (autoPlay) el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { root: null, threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [autoPauseOffscreen, autoPlay]);

  // Event handlers
  const handleError = (e) => {
    const el = e.currentTarget;
    const failedSrc = el?.currentSrc || "";
    const info = {
      failedSrc,
      networkState: el?.networkState,
      readyState: el?.readyState,
      error: el?.error ? { code: el.error.code, message: el.error.message } : null,
    };
    console.error("[VideoPlayer] onError →", info);

    // Fallback: if we have both sources and it failed, try swapping order once
    if (srcWebm && srcMp4) {
      const failedIsWebm = failedSrc.toLowerCase().includes(".webm");
      const failedIsMp4 = failedSrc.toLowerCase().includes(".mp4");

      // If the one we preferred failed, flip preference
      if ((preferWebmFirst && failedIsWebm) || (!preferWebmFirst && failedIsMp4)) {
        console.warn("[VideoPlayer] Swapping source preference and retrying…");
        setPreferWebmFirst((p) => !p);
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setIsMuted(el.muted);
  };

  const enterPip = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && typeof el.requestPictureInPicture === "function") {
        await el.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("[VideoPlayer] PiP error:", err?.message || err);
    }
  };

  const enterFullscreen = async () => {
    const el = containerRef.current || videoRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch (err) {
      console.warn("[VideoPlayer] Fullscreen error:", err?.message || err);
    }
  };

  // Keyboard shortcuts (space play/pause, m mute)
  const onKeyDown = (e) => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.key.toLowerCase() === "m") {
      toggleMute();
    }
  };

  // Source order based on preference
  const sources = useMemo(() => {
    const arr = [];
    if (preferWebmFirst) {
      if (srcWebm) arr.push({ src: srcWebm, type: "video/webm" });
      if (srcMp4) arr.push({ src: srcMp4, type: "video/mp4" });
    } else {
      if (srcMp4) arr.push({ src: srcMp4, type: "video/mp4" });
      if (srcWebm) arr.push({ src: srcWebm, type: "video/webm" });
    }
    return arr;
  }, [preferWebmFirst, srcWebm, srcMp4]);

  const resolvedDownloadUrl = downloadUrl || srcMp4 || srcWebm || "";

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-2xl bg-black/40 ring-1 ring-white/10 ${className}`}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label={title || "Video player"}
    >
      {/* Background blurred layer (decorative) */}
      {(srcWebm || srcMp4) && (
        <video
          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          {sources.map((s) => (
            <source key={`bg-${s.src}`} src={s.src} type={s.type} />
          ))}
        </video>
      )}

      {/* Foreground player */}
      <video
        ref={videoRef}
        poster={poster}
        className="relative z-10 w-full h-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        controls={controls}
        preload={preload}
        crossOrigin={crossOrigin}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
      >
        {sources.map((s) => (
          <source key={s.src} src={s.src} type={s.type} />
        ))}
        Your browser does not support HTML5 video.
      </video>

      {/* Overlay */}
      {showOverlay && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex items-center gap-3">
          <div className="text-white text-sm font-medium line-clamp-1">
            {title || "Generated video"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 9v6h4l5 5V4l-5 5H9z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4z" />
                  <path d="M15 9a5 5 0 0 1 0 6" />
                  <path d="M18 6a9 9 0 0 1 0 12" />
                </svg>
              )}
            </button>

            {/* Download */}
            {resolvedDownloadUrl ? (
              <a
                href={resolvedDownloadUrl}
                download
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
                title="Download"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  <path d="M7 11l5 5 5-5" />
                  <path d="M12 4v12" />
                </svg>
              </a>
            ) : null}

            {/* Copy link */}
            {(srcMp4 || srcWebm) && (
              <button
                onClick={() => {
                  const toCopy = srcMp4 || srcWebm;
                  if (!toCopy) return;
                  navigator.clipboard?.writeText(toCopy).then(() => {
                    console.log("[VideoPlayer] Copied URL:", toCopy);
                  });
                }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
                title="Copy video link"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 12v-1a8 8 0 0 1 16 0v1" />
                  <path d="M12 16v5m0 0l-3-3m3 3l3-3" />
                </svg>
              </button>
            )}

            {/* PiP */}
            <button
              onClick={enterPip}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
              title="Picture in Picture"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="14" rx="2" />
                <rect x="12" y="9" width="7" height="5" rx="1" />
              </svg>
            </button>

            {/* Fullscreen */}
            <button
              onClick={enterFullscreen}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition"
              title="Fullscreen"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

VideoPlayer.propTypes = {
  srcWebm: PropTypes.string,
  srcMp4: PropTypes.string,
  poster: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  autoPlay: PropTypes.bool,
  loop: PropTypes.bool,
  muted: PropTypes.bool,
  controls: PropTypes.bool,
  preload: PropTypes.oneOf(["none", "metadata", "auto"]),
  crossOrigin: PropTypes.string,
  showOverlay: PropTypes.bool,
  autoPauseOffscreen: PropTypes.bool,
  downloadUrl: PropTypes.string,
};
