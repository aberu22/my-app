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

/* 🔥 Firebase */
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  runTransaction,
  increment,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL,deleteObject } from "firebase/storage";

const MusicGenerationContext = createContext(null);

const MUSIC_COST = 35;

export function MusicGenerationProvider({ children }) {
  /* 🔐 AUTH */
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

 /* ============================= */
  /* 🔥 save to firebase*/
  /* ============================= */

  useEffect(() => {
  if (!user?.uid) {
    setGeneratedTracks([]);
    return;
  }

  const q = query(
    collection(db, "music"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tracks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGeneratedTracks(tracks);
    },
    (err) => {
      console.error("Music snapshot error:", err);
    }
  );

  return () => unsubscribe();
}, [user?.uid]);



const deleteMusicTrack = useCallback(
  async (track) => {
    if (!user?.uid || !track?.id) return;

    const confirmed = confirm(
      `Delete "${track.title || "this track"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      // 1️⃣ Delete audio from Storage
      if (track.storagePath) {
        const audioRef = ref(storage, track.storagePath);
        await deleteObject(audioRef);
      }

      // 2️⃣ Delete Firestore document
      await deleteDoc(doc(db, "music", track.id));

      // ❗ Do NOT update state manually
      // Firestore onSnapshot will auto-update UI
    } catch (err) {
      console.error("Failed to delete track:", err);
      alert("Failed to delete track. Please try again.");
    }
  },
  [user]
);



  /* -------------------------------------------------- */
  /* Cleanup */
  /* -------------------------------------------------- */
  const cleanupPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
    activeTaskRef.current = null;
    setLoading(false);
    setProgressText(null);
  }, []);

  useEffect(() => cleanupPolling, [cleanupPolling]);

  /* -------------------------------------------------- */
  /* Poll Suno */
  /* -------------------------------------------------- */
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

          if (status === "text")
            return setProgressText("✍️ Writing lyrics…");
          if (status === "first")
            return setProgressText("🎶 Recording first track…");
          if (status !== "complete")
            return setProgressText("🎧 Generating music…");

          /* -------------------------------------------------- */
          /* ✅ COMPLETE — SAVE TO FIREBASE */
          /* -------------------------------------------------- */
          cleanupPolling();

          if (!user?.uid) throw new Error("User missing");

          /* 🔐 Deduct credits (atomic, abuse-proof) */
          const userRef = doc(db, "users", user.uid);
          const totalCost = MUSIC_COST * (tracks?.length || 1);

          await runTransaction(db, async (tx) => {
            const snap = await tx.get(userRef);
            if (!snap.exists()) throw new Error("User doc missing");

            const currentCredits = snap.data().credits ?? 0;
            if (currentCredits < totalCost) {
              throw new Error("Not enough credits");
            }

            tx.update(userRef, {
              credits: increment(-totalCost),
            });
          });

          const savedTracks = [];

          /* 🔥 Upload + Firestore write */
          for (const t of tracks || []) {
            // Fetch Suno audio
            const audioRes = await fetch(t.audio_url);
            const audioBlob = await audioRes.blob();

            const base64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve(reader.result.split(",")[1]);
              reader.readAsDataURL(audioBlob);
            });

            // Upload to Firebase Storage
            const fileName = `${Date.now()}-${user.uid}.mp3`;
            const storagePath = `music/${user.uid}/${fileName}`;
            const audioRef = ref(storage, storagePath);

            await uploadString(
              audioRef,
              `data:audio/mpeg;base64,${base64}`,
              "data_url"
            );

            const firebaseAudioUrl = await getDownloadURL(audioRef);

            // Save Firestore document
            const docRef = await addDoc(collection(db, "music"), {
              userId: user.uid,
              username: user.displayName || "Anonymous",
              avatar: user.photoURL || "/default-avatar.png",

              title: t.title || title || "Untitled",
              style,
              prompt: instrumental ? "" : prompt,
              instrumental,

              audioUrl: firebaseAudioUrl,
              storagePath,

              duration: t.duration || null,
              model: t.model_name || "suno",

              isPublic: false, // publish later
              createdAt: serverTimestamp(),
            });

            savedTracks.push({
              id: docRef.id,
              title: t.title || "Untitled",
              audioUrl: firebaseAudioUrl,
              duration: t.duration,
              model: t.model_name,
            });
          }

          /* UI update */
          
        } catch (err) {
          console.error("Music polling error:", err);
          setError(err.message || "Music generation failed");
          cleanupPolling();
        }
      }, 4000);
    },
    [
      cleanupPolling,
      user,
      title,
      style,
      prompt,
      instrumental,
    ]
  );

  /* -------------------------------------------------- */
  /* Generate */
  /* -------------------------------------------------- */
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
      setError(err.message || "Music generation failed");
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
        deleteMusicTrack,
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
