"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useAuth } from "@/context/AuthContext";

const MusicGenerationContext = createContext(null);

const MUSIC_COST = 35;

export function MusicGenerationProvider({ children }) {
  // 🔐 AUTH (THIS WAS MISSING)
  const { user, credits, getIdToken } = useAuth();

  /* Inputs */
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState("");
  const [instrumental, setInstrumental] = useState(false);

  const model = "V5";
  const customMode = true;

  /* Output */
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progressText, setProgressText] = useState(null);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const activeTaskRef = useRef(null);

  const cleanupPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    activeTaskRef.current = null;
    setLoading(false);
    setProgressText(null);
  }, []);

  useEffect(() => cleanupPolling, [cleanupPolling]);

  /* Poll Suno */
  const startPolling = useCallback(
    (taskId) => {
      if (!taskId || activeTaskRef.current === taskId) return;

      activeTaskRef.current = taskId;
      setProgressText("🎵 Generating music…");

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/poll-text-music-suno?taskId=${taskId}`
          );

          const json = await res.json().catch(() => null);
          if (!json) return;

          const { status, tracks } = json;

          if (status === "text") return setProgressText("✍️ Writing lyrics…");
          if (status === "first")
            return setProgressText("🎶 Recording first track…");
          if (status !== "complete")
            return setProgressText("🎧 Generating music…");

          // ✅ COMPLETE
          cleanupPolling();

          setGeneratedTracks(
            (tracks || []).map((t) => ({
              id: t.id,
              title: t.title || "Untitled",
              audioUrl: t.audio_url,
              duration: t.duration,
              model: t.model_name,
            }))
          );
        } catch {
          // silent retry
        }
      }, 4000);
    },
    [cleanupPolling]
  );

  /* Generate */
  const onGenerateMusic = useCallback(async () => {
    if (!user) {
      setError("You must be signed in.");
      return;
    }

    if ((credits ?? 0) < MUSIC_COST) {
      setError("Not enough credits.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setGeneratedTracks([]);

      const token = await getIdToken();

      const res = await fetch("/api/generate-text-music-suno", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          customMode,
          instrumental,
          title,
          style,
          prompt,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.taskId) {
        throw new Error(json?.error || "Generation failed");
      }

      startPolling(json.taskId);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [
    user,
    credits,
    getIdToken,
    model,
    instrumental,
    title,
    style,
    prompt,
    startPolling,
  ]);

  return (
    <MusicGenerationContext.Provider
      value={{
        prompt,
        setPrompt,
        title,
        setTitle,
        style,
        setStyle,
        instrumental,
        setInstrumental,
        generatedTracks,
        loading,
        error,
        progressText,
        onGenerateMusic,
      }}
    >
      {children}
    </MusicGenerationContext.Provider>
  );
}

export function useMusicGeneration() {
  const ctx = useContext(MusicGenerationContext);
  if (!ctx) {
    throw new Error("useMusicGeneration must be used inside provider");
  }
  return ctx;
}
