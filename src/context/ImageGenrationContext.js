'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  generateImage,
  fetchUpscalers,
  fetchModels,
  setOptions,
  fetchLatentUpscaleModes,
  generateVideo,
  checkVideoStatus,
  cancelComfyJob,
  generateTextVideo,
  fetchSamplers,
} from '@/app/utils/api';
import { useAuth } from './AuthContext';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  increment,
  runTransaction,
  orderBy,              // 👈 NEW: used for videos listener
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import UpgradePopup from '@/app/components/UpgradePopup';
import { updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";


// ---- Context
const ImageGenerationContext = createContext();

// ---- Aspect ratio map
const aspectRatioMap = {
  '1:1': { width: 512, height: 512 },
  '4:3': { width: 1024, height: 768 },
  '3:2': { width: 960, height: 640 },
  '2:3': { width: 640, height: 960 },
  '3:4': { width: 768, height: 1024 },
  '16:9': { width: 1280, height: 720 },
  '21:9': { width: 1440, height: 600 },
  '9:16': { width: 720, height: 1280 },
  '512x768': { width: 512, height: 768 },
  '768x512': { width: 768, height: 512 },
  '1024x1024': { width: 1024, height: 1024 },
  '1024x2024': { width: 1024, height: 2024 },
  'HD 1080p': { width: 1920, height: 1080 },
};

export const ImageGenerationProvider = ({ children }) => {
  // ---------- Core state ----------
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generatedVideos, setGeneratedVideos] = useState([]); // videos are synced from Firestore

  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedSampler, setSelectedSampler] = useState(null);
  const [selectedUpscaler, setSelectedUpscaler] = useState(null);
  const [selectedLora, setSelectedLora] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMetadata, setSelectedMetadata] = useState(null);

  const [credits, setCredits] = useState(null);
  const [membershipStatus, setMembershipStatus] = useState('free');

  const [loading, setLoading] = useState(false);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [error, setError] = useState(null);

  // models & upscalers
  const [models, setModels] = useState([]);
  const [upscalers, setUpscalers] = useState([]);
  const [latentUpscalers, setLatentUpscalers] = useState([]);
  const [allUpscalers, setAllUpscalers] = useState([]);
  const [selectedLatentUpscaler, setSelectedLatentUpscaler] = useState(null);

  // Samplers
  const [samplers, setSamplers] = useState([]);
  const [samplersLoading, setSamplersLoading] = useState(false);
  const [samplersError, setSamplersError] = useState(null);

  // params
  const [steps, setSteps] = useState(20);
  const [cfgScale, setCfgScale] = useState(7);
  const [seed, setSeed] = useState(-1);
  const [batchSize, setBatchSize] = useState(1);
  const [batchCount, setBatchCount] = useState(1);

  // resolution
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [imageResolution, setImageResolution] = useState(aspectRatioMap['1:1']);
  const { width, height } = imageResolution;

  // video job state
  const [mode, setMode] = useState('image'); // 'image' | 'video'
  const [videoUrl, setVideoUrl] = useState(null);
  const [progressText, setProgressText] = useState(null);
  const [progressPercent, setProgressPercent] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobActive, setJobActive] = useState(false);
  const [etaTargetMs, setEtaTargetMs] = useState(null);
  const [videoModel, setVideoModel] = useState("wan-2.2");




  // refs
  const latestVideoRef = useRef(null);
  const pollHandleRef = useRef(null);
  const isActiveRef = useRef(true);
  const currentJobIdRef = useRef(null);
  const isMine = (id) => currentJobIdRef.current && currentJobIdRef.current === id;
  const lastSeedanceMetaRef = useRef(null);
  const lastWan26MetaRef = useRef(null);
  const { getIdToken, user } = useAuth();
  const seedancePollingTaskRef = useRef(null);

// shape: { model: "wan-2.2" | "wan-2.6" | "seedance", jobId }


  //non shared refs
  const pollingIntervalRef = useRef(null);
  const realtimeUnsubRef = useRef(null);

// ✅ Dedicated Wan 2.6 polling ref (DO NOT reuse pollHandleRef)
const wan26PollingRef = useRef(null);






  const listenerTokenRef = useRef(0);


  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      if (pollHandleRef.current?.cancel) {
        pollHandleRef.current.cancel();
        pollHandleRef.current = null;
      }
    };
  }, []);

  // ---------- Firestore listeners ----------

  // Images
// Images
useEffect(() => {
  if (!user?.uid) return;

  const q = query(
    collection(db, 'images'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')   // 👈 NEW: newest image ALWAYS first
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const images = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt || null,
      };
    });

    setGeneratedImages(images);
  });

  return () => unsubscribe();
}, [user?.uid]);





  // 🔵 Videos (i2v + t2v) – this is the new listener you asked for
  useEffect(() => {
    if (!user?.uid) {
      setGeneratedVideos([]);
      return;
    }

    const q = query(
      collection(db, 'videos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const vids = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            // normalize timestamps for UI if needed
            createdAt: data.createdAt || null,
          };
        });
        setGeneratedVideos(vids);
      },
      (err) => {
        console.error('videos onSnapshot error:', err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // user doc -> credits & membership
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCredits(data.credits ?? 50);
        setMembershipStatus(data.membershipStatus ?? 'free');
      }
    });
    return () => unsub();
  }, [user]);

  // load models (filter NSFW for free)
  useEffect(() => {
    const load = async () => {
      const all = await fetchModels();
      const filtered =
        membershipStatus === 'free'
          ? all.filter((m) => !(m.tags || []).includes('NSFW'))
          : all;
      setModels(filtered);
    };
    if (membershipStatus) load();
  }, [membershipStatus]);

  // load upscalers (standard + latent)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [standard, latent] = await Promise.all([
          fetchUpscalers(),
          fetchLatentUpscaleModes(),
        ]);

        if (!mounted) return;

        const std = Array.isArray(standard)
          ? standard.map((u) => ({ name: u.name, type: 'standard' }))
          : [];
        const lat = Array.isArray(latent)
          ? latent.map((u) => ({ name: u.name, type: 'latent' }))
          : [];

        setUpscalers(std);
        setLatentUpscalers(lat);
        setAllUpscalers([...lat, ...std]);

        if (!selectedUpscaler && std.length > 0) {
          setSelectedUpscaler(std[0].name);
        }
        if (!selectedLatentUpscaler && lat.length > 0) {
          setSelectedLatentUpscaler(lat[0].name);
        }
      } catch (e) {
        console.error('Failed to load upscalers:', e);
        setUpscalers([]);
        setLatentUpscalers([]);
        setAllUpscalers([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []); // run once

  // ---------- Helpers ----------
  const handleAspectRatioChange = (ratio) => {
    setSelectedAspectRatio(ratio);
    setImageResolution(aspectRatioMap[ratio]);
  };

  const deleteImage = async (imageId) => {
    if (!imageId) return;
    try {
      const imageRef = doc(db, 'images', imageId);
      const snap = await getDoc(imageRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const imageUrl = data.imageUrl;
      const storagePath = imageUrl.startsWith('https://firebasestorage.googleapis.com')
        ? decodeURIComponent(imageUrl.split('/o/')[1].split('?alt=media')[0])
        : imageUrl;

      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef).catch((e) => {
        if (e.code !== 'storage/object-not-found') throw e;
      });
      await deleteDoc(imageRef);
    } catch (e) {
      console.error('Delete failed:', e);
      alert('❌ Failed to delete image.');
    }
  };

  // ---------- Samplers ----------
  const reloadSamplers = useCallback(async () => {
    setSamplersLoading(true);
    setSamplersError(null);
    try {
      const fetched = await fetchSamplers();
      if (!Array.isArray(fetched)) throw new Error('Invalid sampler list');
      setSamplers(fetched);
    } catch (err) {
      console.error('Error fetching samplers:', err);
      setSamplersError('Failed to load samplers');
    } finally {
      setSamplersLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadSamplers();
  }, []); // one-time

  useEffect(() => {
    if (!selectedSampler && samplers.length > 0) {
      setSelectedSampler(samplers[0].name);
    }
  }, [samplers, selectedSampler, setSelectedSampler]);

  // ---------- Image generation ----------
  const onGenerateImage = useCallback(async () => {
    try {
      if (!user?.uid) return alert('Please sign in to generate images.');
      if (!prompt.trim()) return alert('⚠️ Please enter a prompt.');
      if (!selectedModel?.title || !selectedSampler) {
        return alert('⚠️ Pick a model and a sampler first.');
      }
      if ((credits ?? 0) <= 0) {
        setShowUpgradePopup(true);
        return;
      }

      const isNSFW =
        selectedModel?.tags?.includes('NSFW') ||
        selectedLora?.name?.toLowerCase?.().includes('nsfw');
      if (isNSFW && membershipStatus === 'free') {
        return alert('⚠️ NSFW content is only for premium members.');
      }

      setLoading(true);

      const metadata = {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        steps,
        sampler_name: selectedSampler,
        upscaler: selectedUpscaler?.name || null,
        sd_model_checkpoint: selectedModel.title,
        cfg_scale: cfgScale,
        seed,
        batch_size: batchSize,
        n_iter: batchCount,
        restore_faces: true,
        tiling: false,
        send_images: true,
        save_images: false,
        lora: selectedLora?.name || null,
        hr_scale: 2.0,
        hr_upscaler: selectedUpscaler?.name || 'Latent',
        denoising_strength: 0.4,
        latent_upscaler: selectedLatentUpscaler?.name || selectedLatentUpscaler || null,
      };

      console.log("🚀 Sending payload to API:", JSON.stringify(metadata, null, 2));

      await setOptions({ sd_model_checkpoint: selectedModel.title });
      await new Promise((r) => setTimeout(r, 4000));

      const response = await generateImage(metadata);
      if (!response?.images?.length) throw new Error('API returned no images.');

      const total = response.images.length;
      const userRef = doc(db, 'users', user.uid);

      for (const base64 of response.images) {
        const base64Image = `data:image/png;base64,${base64}`;
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${user.uid}.png`;
        const storagePath = `images/${user.uid}/${fileName}`;
        const imageRef = ref(storage, storagePath);
        await uploadString(imageRef, base64Image, 'data_url');
        const downloadURL = await getDownloadURL(imageRef);

        await addDoc(collection(db, 'images'), {
          userId: user.uid,
          username: user.displayName || 'Anonymous',
          avatar: user.photoURL || '/default-avatar.png',
          imageUrl: downloadURL,
          storagePath,
          prompt: prompt || 'N/A',
          negativePrompt: negativePrompt || 'N/A',
          modelType: selectedModel?.title || 'default',
          ...metadata,
          isPublic: false,
          likes: 0,
          createdAt: serverTimestamp(),
        });
      }

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User doc missing.');
        const current = snap.data().credits ?? 0;
        if (current < total) throw new Error('Not enough credits.');
        tx.update(userRef, { credits: increment(-total) });
        setCredits(current - total);
      });
    } catch (err) {
      console.error('Image generation failed:', err);
      alert(err?.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [
    user, prompt, negativePrompt, width, height, steps, selectedSampler,
    selectedUpscaler, selectedModel, cfgScale, seed, batchSize, batchCount,
    selectedLora, selectedLatentUpscaler, credits, membershipStatus,
  ]);

  // ---------- Cleanup job state ----------

 // Cleanup job state
  // ---------- Cleanup job state ----------
// ---------- Cleanup job state ----------
const cleanupJobState = useCallback(() => {
  // 🛑 Stop realtime listener
  if (realtimeUnsubRef.current) {
    realtimeUnsubRef.current();
    realtimeUnsubRef.current = null;
  }

  // 🛑 Stop Wan 2.6 polling
  if (wan26PollingRef.current) {
    clearInterval(wan26PollingRef.current);
    wan26PollingRef.current = null;
  }

  // 🛑 Stop any legacy polling
  if (pollHandleRef.current) {
    clearInterval(pollHandleRef.current);
    pollHandleRef.current = null;
  }

  setJobActive(false);
  setLoading(false);
  setProgressText(null);
  setProgressPercent(null);
  setVideoUrl(null);

  setCurrentJobId(null);
  currentJobIdRef.current = null;
}, []);





// ----------------------------------------------------------------------
// Seedance polling (HTTP-based, no Firestore)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Seedance polling (HTTP-based, no Firestore)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Seedance polling (HTTP-based, with Firestore), Restore polling on refresh
// ----------------------------------------------------------------------






const startSeedancePolling = useCallback(
  (taskId, mode = "text") => {
    if (!taskId) return;

    // 🔒 Prevent duplicate polling
    if (seedancePollingTaskRef.current === taskId) {
      console.log("🛑 Seedance polling already active for:", taskId);
      return;
    }

    seedancePollingTaskRef.current = taskId;

    // Clear previous poll
    if (pollHandleRef.current) {
      clearInterval(pollHandleRef.current);
      pollHandleRef.current = null;
    }

    setJobActive(true);
    setProgressText("⏳ Seedance rendering…");
    setProgressPercent(10);

    const pollUrl =
      mode === "image"
        ? "/api/videoapi/generate-image-video-seedance"
        : "/api/videoapi/generate-text-video-seedance";

    pollHandleRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${pollUrl}?taskId=${taskId}`);
        if (!res.ok) {
          throw new Error(`Polling failed (${res.status})`);
        }

        const json = await res.json();
        const data = json?.data;
        if (!data) return;

        /* ---------------- WAITING ---------------- */
        if (data.state === "waiting") {
          setProgressPercent((p) =>
            Math.min((p || 10) + Math.random() * 6, 92)
          );
          return;
        }

        /* ---------------- FAIL ---------------- */
        /* ---------------- FAIL (Seedance-safe) ---------------- */
if (data.state === "fail") {
  const msg = String(data.failMsg || "").toLowerCase();

  // ⏳ Seedance transient failure — keep polling
  if (msg.includes("timed out") || msg.includes("timeout")) {
    console.warn("⚠️ Seedance timeout — continuing polling");
    return;
  }

  // ❌ Real failure
  throw new Error(data.failMsg || "Seedance job failed");
}

        /* ---------------- SUCCESS ---------------- */
        if (data.state === "success") {
          clearInterval(pollHandleRef.current);
          pollHandleRef.current = null;
          seedancePollingTaskRef.current = null;

          const result =
            typeof data.resultJson === "string"
              ? JSON.parse(data.resultJson)
              : data.resultJson;

          const videoUrl = result?.resultUrls?.[0];
          if (!videoUrl) {
            throw new Error("Seedance returned no video URL");
          }

          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (!currentUser?.uid) {
            cleanupJobState();
            return;
          }

          await addDoc(collection(db, "videos"), {
            userId: currentUser.uid,
            jobId: taskId,
            videoUrl,
            prompt: lastSeedanceMetaRef.current?.prompt || "",
            model: "seedance",
            status: "ready",
            createdAt: serverTimestamp(),
            isPublic: false,
          });

          // 🔥 CRITICAL: clear persisted job
          localStorage.removeItem("active_external_job");

          setProgressText("✅ Seedance complete");
          setProgressPercent(100);

          cleanupJobState();
        }
      } catch (err) {
        console.error("Seedance polling error:", err);

        localStorage.removeItem("active_external_job");

        clearInterval(pollHandleRef.current);
        pollHandleRef.current = null;
        seedancePollingTaskRef.current = null;

        setError(err.message || "Seedance polling failed");
        cleanupJobState();
      }
    }, 2500);
  },
  [cleanupJobState, setError]
);

//end of Restore polling on refresh and startSeedancePolling 

//wanPolling 

// ----------------------------------------------------------------------
// Wan 2.6 polling (TEXT + IMAGE SAFE, Seedance-style)
// ----------------------------------------------------------------------
const startWan26Polling = useCallback(
  (taskId, kind = "t2v") => {
    if (!taskId) return;

    // 🛑 Kill any existing Wan 2.6 poll
    if (wan26PollingRef.current) {
      clearInterval(wan26PollingRef.current);
      wan26PollingRef.current = null;
    }

    console.log("🟣 START WAN 2.6 POLLING", { taskId, kind });

    setJobActive(true);
    setProgressText("⏳ Wan 2.6 rendering…");
    setProgressPercent((p) => (typeof p === "number" ? p : 10));

    wan26PollingRef.current = setInterval(async () => {
      try {
        // ✅ CRITICAL FIX: choose correct polling endpoint
        const pollUrl =
          kind === "i2v"
            ? `/api/videoapi/generate-image-video-wan26?taskId=${taskId}`
            : `/api/videoapi/generate-text-video-wan26?taskId=${taskId}`;

        const res = await fetch(pollUrl);

        if (!res.ok) {
          throw new Error(`Wan 2.6 polling failed (${res.status})`);
        }

        const json = await res.json();
        const data = json?.data;
        if (!data) return;

        const state = data.state;

        // ----------------------------
        // ❌ FAILURE
        // ----------------------------
        if (state === "fail" || state === "error") {
          throw new Error(data.failMsg || "Wan 2.6 job failed");
        }

        // ----------------------------
        // ✅ SUCCESS
        // ----------------------------

        if (state === "success") {
  const result =
    typeof data.resultJson === "string"
      ? JSON.parse(data.resultJson)
      : data.resultJson;

  const videoUrl = result?.resultUrls?.[0];

  // 🔒 CRITICAL FIX
  if (!videoUrl) {
    console.warn(
      "Wan 2.6 success but video not ready yet — continuing polling"
    );
    return; // ⛔ DO NOT cleanup, DO NOT clear interval
  }

  // ✅ NOW we are actually done
  clearInterval(wan26PollingRef.current);
  wan26PollingRef.current = null;

  console.log("✅ WAN 2.6 COMPLETE:", videoUrl);

  setProgressPercent(100);
  setProgressText("✅ Wan 2.6 complete");

  const meta = lastWan26MetaRef.current;
  if (meta?.userId) {
    await addDoc(collection(db, "videos"), {
      userId: meta.userId,
      jobId: taskId,
      videoUrl,
      prompt: meta.prompt || "",
      model: "wan-2.6",
      duration: meta.duration || "5",
      resolution: meta.resolution || "720p",
      status: "ready",
      createdAt: serverTimestamp(),
    });
  }

  localStorage.removeItem("active_external_job");
  cleanupJobState();
}

       

        // ----------------------------
        // ⏳ PROGRESS
        // ----------------------------
        setProgressText("⏳ Wan 2.6 rendering…");
        setProgressPercent((prev) => {
          if (typeof prev !== "number") return 10;
          return Math.min(prev + 4, 92);
        });

      } catch (err) {
        console.error("❌ Wan 2.6 polling error:", err);

        if (wan26PollingRef.current) {
          clearInterval(wan26PollingRef.current);
          wan26PollingRef.current = null;
        }

        setError(err.message || "Wan 2.6 polling failed");
        cleanupJobState();
      }
    }, 2500);
  },
  [cleanupJobState, setError]
);





// end of wan polling


// start useeffect for wan2.6 and seedance 


// 2️⃣ THEN restore effect (AFTER callbacks exist)
useEffect(() => {
  if (!user) return;

  const raw = localStorage.getItem("active_external_job");
  if (!raw) return;

  let job;
  try {
    job = JSON.parse(raw);
  } catch {
    localStorage.removeItem("active_external_job");
    return;
  }

  if (!job?.provider || !job?.taskId) return;

  // 🔍 DEBUG — SINGLE SOURCE OF TRUTH
  console.log("POLLING MODEL:", job.provider, "TASK:", job.taskId);

  setJobActive(true);
  setLoading(true);
  setProgressText("🔄 Restoring render…");
  setProgressPercent(10);

  setCurrentJobId(job.taskId);
  currentJobIdRef.current = job.taskId;

  if (job.provider === "wan-2.6") {
  if (job.meta) {
    lastWan26MetaRef.current = job.meta; // 🔥 REQUIRED
  }
  startWan26Polling(job.taskId, job.kind || "t2v");
  return;
}


  if (job.provider === "seedance") {
    startSeedancePolling(job.taskId);
    return;
  }

  // 🚫 NO FALLBACK
}, [user, startSeedancePolling, startWan26Polling]);






 // ----------------------------------------------------------------------
//  REALTIME JOB LISTENER (Kling-style)
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
//  REALTIME JOB LISTENER (Kling-style, per-job, with isMine guard)
// ----------------------------------------------------------------------


const startRealtimeJobListener = useCallback(
  (jobId) => {
    if (!user?.uid || !jobId) return;

    console.log("🔴 Starting realtime listener for job:", jobId);

    // ---- Invalidate old listeners
    listenerTokenRef.current += 1;
    const token = listenerTokenRef.current;

    // ---- Set active job
    setCurrentJobId(jobId);
    currentJobIdRef.current = jobId;

    // 🛑 Kill any existing realtime listener FIRST
    if (realtimeUnsubRef.current) {
      try {
        realtimeUnsubRef.current();
      } catch (e) {
        console.warn("⚠️ Failed to unsubscribe previous realtime listener", e);
      }
      realtimeUnsubRef.current = null;
    }

    const jobRef = doc(db, "jobs", jobId);

    const unsubscribe = onSnapshot(
      jobRef,
      (snap) => {
        // ---- Ignore stale listeners
        if (token !== listenerTokenRef.current) return;

        if (!snap.exists()) {
          console.warn("⚠️ Job doc missing, cleaning up:", jobId);
          unsubscribe();
          realtimeUnsubRef.current = null;
          cleanupJobState();
          return;
        }

        const data = snap.data();

        // ---- Extra guard: job switched
        if (currentJobIdRef.current !== jobId) return;

        // ---------- QUEUED ----------
        if (data.status === "queued") {
          setProgressText("📦 In queue…");
          setProgressPercent(5);
          return;
        }

        // ---------- PROCESSING ----------
        if (data.status === "processing") {
          setProgressText(data.stage || "🎬 Rendering…");

          // ✅ SMOOTH PROGRESS (real if provided, otherwise simulated)
          setProgressPercent((prev) => {
            if (typeof data.progress === "number") return data.progress;
            if (prev == null) return 20;
            return Math.min(prev + 2, 90);
          });

          return;
        }

        // ---------- COMPLETE ----------
        if (data.status === "complete" && data.videoUrl) {
          console.log("🎉 VIDEO READY:", data.videoUrl);

          setVideoUrl(data.videoUrl);
          setProgressText("✅ Video complete!");
          setProgressPercent(100);

          // 🛑 Stop listener BEFORE cleanup
          unsubscribe();
          realtimeUnsubRef.current = null;

          cleanupJobState();
          return;
        }

        // ---------- ERROR ----------
        if (data.status === "error") {
          console.error("❌ Job error:", data.error);

          setProgressText("❌ Job failed.");
          setError(data.error || "Job failed.");
          setProgressPercent(null);

          unsubscribe();
          realtimeUnsubRef.current = null;

          cleanupJobState();
          return;
        }

        // ---------- CANCELLED ----------
        if (data.status === "cancelled") {
          console.log("🚫 Job cancelled");

          setProgressText("❌ Job cancelled.");
          setProgressPercent(null);

          unsubscribe();
          realtimeUnsubRef.current = null;

          cleanupJobState();
          return;
        }
      },
      (err) => {
        if (token !== listenerTokenRef.current) return;
        console.error("🔥 Realtime listener error:", err);
      }
    );

    // ✅ Store unsubscribe safely
    realtimeUnsubRef.current = unsubscribe;
  },
  [user, cleanupJobState]
);









  // ---------- Video: I2V ----------
 // ---------- Video: I2V ----------
// ---------- Video: I2V ----------
const onGenerateVideo = useCallback(
  async ({
    imageFile,
    prompt: vPrompt,
    negative_prompt = "",
    user_high_loras = [],
    user_high_strengths = [],
    user_low_loras = [],
    user_low_strengths = [],
    fps = 20,
    duration = 6,
   
  }) => {
    try {
      // -------- Guards --------
      if (!user) return setError("Please log in.");
      if (!imageFile) return setError("Reference image required.");
      if (!vPrompt.trim()) return setError("Prompt required.");
      if ((credits ?? 0) <= 0) {
        setShowUpgradePopup(true);
        return;
      }

      // -------- UI State --------
      setJobActive(true);
      setLoading(true);
      setProgressText("🚀 Submitting image-to-video job…");
      setProgressPercent(1);

      const token = await getIdToken();

      // -------- Prompt (already merged with triggers in UI) --------
      const sendPrompt = vPrompt.trim();

      // 🔍 TEMP DEBUG (remove after validation)
      console.log("🎯 I2V LoRA payload", {
        user_high_loras,
        user_high_strengths,
        user_low_loras,
        user_low_strengths,
      });

      // -------- Submit to backend --------
      const start = await generateVideo({
        imageFile,
        prompt: sendPrompt,
        negative_prompt,
        user_high_loras,
        user_high_strengths,
        user_low_loras,
        user_low_strengths,
        fps,
        duration,
        token,
      });

      const jobId = start?.job_id;
      if (!jobId) throw new Error("No job_id returned.");

      console.log("🎬 I2V job submitted:", jobId);

      setCurrentJobId(jobId);
      currentJobIdRef.current = jobId;

      // Persist job for auto-restore
      localStorage.setItem(
        "active_video_job",
        JSON.stringify({
          id: jobId,
          kind: "i2v",
          prompt: sendPrompt,
          fps,
          duration,
          startedAt: Date.now(),
        })
      );

      // -------- START REALTIME TRACKING --------
      startRealtimeJobListener(jobId);

    } catch (err) {
      console.error("❌ I2V generation failed:", err);
      setError(err.message || "Unexpected error.");
      cleanupJobState();
    }
  },
  [user, credits, getIdToken]
);



 // ---------- Video: T2V ----------

const onGenerateTextToVideo = useCallback(
  async ({
    prompt: tPrompt,
    negative_prompt = "",
    loras = [],
    fps = 20,
    duration = 10,
  }) => {
    try {
      // -------- Guards --------
      if (!user) return setError("Please log in.");
      if (!tPrompt.trim()) return setError("Prompt required.");
      if ((credits ?? 0) <= 0) {
        setShowUpgradePopup(true);
        return;
      }

      // -------- Initial UI state --------
      setJobActive(true);
      setLoading(true);
      setProgressText("🚀 Submitting text-to-video job…");
      setProgressPercent(1);

      const token = await getIdToken();
      const chosen = loras.slice(0, 3);

      // -------- Call backend --------
      const resp = await generateTextVideo({
        prompt: tPrompt,
        negative_prompt,
        loras: chosen,
        fps,
        duration,
        token,
      });

      const jobId = resp?.job_id;
      if (!jobId) throw new Error("No job_id returned.");
      console.log("🎬 T2V job submitted:", jobId);

      // Save active job
      setCurrentJobId(jobId);
      currentJobIdRef.current = jobId;

      // Persist in localStorage for restore-on-refresh
      localStorage.setItem(
        "active_video_job",
        JSON.stringify({
          id: jobId,
          kind: "t2v",
          prompt: tPrompt,
          fps,
          duration,
          startedAt: Date.now(),
        })
      );

      // -------- START REALTIME LISTENER 🎉 --------
      startRealtimeJobListener(jobId);

    } catch (err) {
      console.error("❌ T2V Error:", err);
      setError(err.message || "Unexpected error.");
      cleanupJobState();   // <-- REALTIME CLEANUP
    }
  },
  [user, credits, getIdToken]
);

// Seeddance t2v'

// Seedance Text-to-Video

// Seedance Text-to-Video

// Seedance Text-to-Video (FINAL FIXED VERSION)
// Seedance — Text → Video
const onGenerateSeedanceVideo = useCallback(
  async ({
    prompt,
    aspect_ratio = "16:9",
    resolution = "720p",
    duration = "8",
    fixed_lens = false,
    generate_audio = true,
  }) => {
    try {
      /* --------------------------------------------------
         🔒 Prevent double billing / resume existing job
      -------------------------------------------------- */
      const existing = localStorage.getItem("active_external_job");
      if (existing) {
        try {
          const job = JSON.parse(existing);
          if (job?.provider === "seedance" && job?.taskId) {
            setJobActive(true);
            setLoading(true);
            setProgressText("⏳ Resuming Seedance render…");
            setProgressPercent(10);
            startSeedancePolling(job.taskId);
            return; // 🔥 do NOT create a new job
          }
        } catch {
          localStorage.removeItem("active_external_job");
        }
      }

      /* --------------------------------------------------
         VALIDATION
      -------------------------------------------------- */
      if (!user?.uid) {
        throw new Error("Please log in.");
      }

      const cleanPrompt = prompt?.trim();
      if (!cleanPrompt) {
        throw new Error("Prompt is required.");
      }

      /* --------------------------------------------------
         NORMALIZE INPUT (Seedance spec)
      -------------------------------------------------- */
      const safeAspectRatio = [
        "1:1",
        "21:9",
        "4:3",
        "3:4",
        "16:9",
        "9:16",
      ].includes(aspect_ratio)
        ? aspect_ratio
        : "16:9";

      const safeResolution = ["480p", "720p"].includes(resolution)
        ? resolution
        : "720p";

      const safeDuration = ["4", "8", "12"].includes(String(duration))
        ? String(duration)
        : "8";

      /* --------------------------------------------------
         SAVE META (used by polling / Firestore)
      -------------------------------------------------- */
      lastSeedanceMetaRef.current = {
        userId: user.uid,
        prompt: cleanPrompt,
        model: "seedance",
        aspect_ratio: safeAspectRatio,
        resolution: safeResolution,
        duration: safeDuration,
        createdAt: Date.now(),
      };

      /* --------------------------------------------------
         UI STATE
      -------------------------------------------------- */
      setJobActive(true);
      setLoading(true);
      setError(null);
      setProgressText("🚀 Submitting Seedance job…");
      setProgressPercent(5);

      /* --------------------------------------------------
         CALL BACKEND (Seedance T2V)
      -------------------------------------------------- */
      const token = await getIdToken();

      const res = await fetch(
        "/api/videoapi/generate-text-video-seedance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: cleanPrompt,
            aspect_ratio: safeAspectRatio,
            resolution: safeResolution,
            duration: safeDuration,
            fixed_lens: Boolean(fixed_lens),
            generate_audio: Boolean(generate_audio),
          }),
        }
      );

      const rawText = await res.text();
      let json;

      try {
        json = JSON.parse(rawText);
      } catch {
        console.error("Seedance non-JSON response:", rawText);
        throw new Error("Seedance returned invalid JSON.");
      }

      const taskId =
        json?.taskId ||
        json?.task_id ||
        json?.data?.taskId ||
        json?.data?.task_id;

      if (!res.ok || !taskId) {
        console.error("Seedance createTask failed:", json);
        throw new Error(json?.error || json?.msg || "Seedance createTask failed");
      }

      /* --------------------------------------------------
         SAVE JOB FOR REFRESH RECOVERY
      -------------------------------------------------- */
      localStorage.setItem(
        "active_external_job",
        JSON.stringify({
          provider: "seedance",
          taskId,
          startedAt: Date.now(),
        })
      );

      /* --------------------------------------------------
         START POLLING
      -------------------------------------------------- */
      setCurrentJobId(taskId);
      currentJobIdRef.current = taskId;

      setProgressText("⏳ Seedance rendering…");
      setProgressPercent(15);

      startSeedancePolling(taskId);

    } catch (err) {
      console.error("❌ Seedance T2V error:", err);

      localStorage.removeItem("active_external_job"); // 🔥 critical cleanup

      setError(err.message || "Seedance generation failed");
      setJobActive(false);
      setLoading(false);
      setProgressPercent(0);
    }
  },
  [user, startSeedancePolling]
);




//SeedDance ongenerateImage to video
// Seedance — Image → Video
const onGenerateSeedanceImageVideo = useCallback(
  async ({
    prompt,
    imageUrl,
    aspect_ratio = "16:9",
    resolution = "480p",
    duration = "8",
    fixed_lens = false,
    generate_audio = true,
  }) => {
    try {
      /* --------------------------------------------------
         🔒 Prevent double billing / resume existing job
      -------------------------------------------------- */
      const existing = localStorage.getItem("active_external_job");
      if (existing) {
        const job = JSON.parse(existing);
        if (job?.provider === "seedance" && job?.taskId) {
          setJobActive(true);
          setLoading(true);
          setProgressText("⏳ Resuming Seedance render…");
          setProgressPercent(10);
          startSeedancePolling(job.taskId);
          return;
        }
      }

      /* --------------------------------------------------
         VALIDATION
      -------------------------------------------------- */
      if (!user?.uid) throw new Error("Please log in.");
      if (!prompt?.trim()) throw new Error("Prompt is required.");
      if (!imageUrl) throw new Error("Image is required for image-to-video.");

      /* --------------------------------------------------
         NORMALIZE INPUT (Seedance spec)
      -------------------------------------------------- */
      const safeAspectRatio = [
        "1:1",
        "21:9",
        "4:3",
        "3:4",
        "16:9",
        "9:16",
      ].includes(aspect_ratio)
        ? aspect_ratio
        : "16:9";

      const safeResolution = ["480p", "720p"].includes(resolution)
        ? resolution
        : "480p";

      const safeDuration = ["4", "8", "12"].includes(String(duration))
        ? String(duration)
        : "8";

      /* --------------------------------------------------
         UI STATE
      -------------------------------------------------- */
      setJobActive(true);
      setLoading(true);
      setError(null);
      setProgressText("🖼️ Submitting image-to-video job…");
      setProgressPercent(5);

      const token = await getIdToken();

      /* --------------------------------------------------
         CALL BACKEND (Seedance I2V)
      -------------------------------------------------- */
      const res = await fetch(
        "/api/videoapi/generate-image-video-seedance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            input_urls: [imageUrl], // ✅ REQUIRED BY SEEDANCE I2V
            aspect_ratio: safeAspectRatio,
            resolution: safeResolution,
            duration: safeDuration,
            fixed_lens: Boolean(fixed_lens),
            generate_audio: Boolean(generate_audio),
          }),
        }
      );

      const json = await res.json();
      const taskId =
        json?.taskId ||
        json?.task_id ||
        json?.data?.taskId ||
        json?.data?.task_id;

      if (!res.ok || !taskId) {
        throw new Error(json?.error || json?.msg || "Seedance I2V failed");
      }

      /* --------------------------------------------------
         SAVE JOB + START POLLING
      -------------------------------------------------- */
      localStorage.setItem(
        "active_external_job",
        JSON.stringify({
          provider: "seedance",
          taskId,
          startedAt: Date.now(),
        })
      );

      setCurrentJobId(taskId);
      setProgressPercent(15);
      startSeedancePolling(taskId);

    } catch (err) {
      console.error("❌ Seedance I2V error:", err);

      localStorage.removeItem("active_external_job"); // 🔥 important cleanup

      setError(err.message || "Seedance image-to-video failed");
      setJobActive(false);
      setLoading(false);
      setProgressPercent(0);
    }
  },
  [user, startSeedancePolling]
);


// end




// wan26 generate 



// Wan 2.6 Text-to-Video (FINAL, RESTORE-SAFE VERSION)
const onGenerateWan26Video = useCallback(
  async ({
    prompt,
    duration = "5",
    resolution = "720p",
    multi_shots = false,
  }) => {
    try {
      // --------------------------------------------------
      // 1. Auth + input validation
      // --------------------------------------------------
      if (!user?.uid) {
        throw new Error("Please log in to generate videos.");
      }

      const cleanPrompt = prompt?.trim();
      if (!cleanPrompt) {
        throw new Error("Prompt is required.");
      }

      // --------------------------------------------------
      // 2. Normalize API enums (CRITICAL)
      // --------------------------------------------------
      const safeDuration = ["5", "10", "15"].includes(String(duration))
        ? String(duration)
        : "5";

      const safeResolution = ["720p", "1080p"].includes(resolution)
        ? resolution
        : "720p";

      // --------------------------------------------------
      // 3. Save metadata EARLY (used by polling + Firestore)
      // --------------------------------------------------
      lastWan26MetaRef.current = {
        userId: user.uid,
        prompt: cleanPrompt,
        model: "wan-2.6",
        duration: safeDuration,
        resolution: safeResolution,
        multi_shots: Boolean(multi_shots),
        createdAt: Date.now(),
      };

      // --------------------------------------------------
      // 4. UI state
      // --------------------------------------------------
      setJobActive(true);
      setLoading(true);
      setError(null);
      setProgressText("🚀 Submitting Wan 2.6 job…");
      setProgressPercent(1);

      // --------------------------------------------------
      // 5. Create task
      // --------------------------------------------------

      const token = await getIdToken();

      const res = await fetch("/api/videoapi/generate-text-video-wan26", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ REQUIRED
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
        duration: safeDuration,
        resolution: safeResolution,
        multi_shots: Boolean(multi_shots),
      }),
    });


      
      

      const rawText = await res.text();
      let json;

      try {
        json = JSON.parse(rawText);
      } catch {
        console.error("Wan 2.6 non-JSON response:", rawText);
        throw new Error("Wan 2.6 returned invalid JSON.");
      }

      const taskId =
        json?.data?.taskId ||
        json?.taskId ||
        json?.job_id;

      if (!res.ok || !taskId) {
        console.error("Wan 2.6 createTask failed:", json);
        throw new Error(json?.msg || "Wan 2.6 createTask failed.");
      }

      // --------------------------------------------------
      // 6. Persist job for refresh recovery 🔁
      // --------------------------------------------------

      // --------------------------------------------------
// 6. Persist job for refresh recovery 🔁 (SOURCE OF TRUTH)
// --------------------------------------------------
localStorage.setItem(
  "active_external_job",
  JSON.stringify({
    provider: "wan-2.6",
    taskId,
    kind: "t2v", // ✅ ADD THIS
    meta: {
      userId: user.uid,
      prompt: cleanPrompt,
      duration: safeDuration,
      resolution: safeResolution,
    },
    startedAt: Date.now(),
  })
);

      
      // --------------------------------------------------
      // 7. Start polling
      // --------------------------------------------------
      setCurrentJobId(taskId);
      currentJobIdRef.current = taskId;

      setProgressText("⏳ Wan 2.6 rendering…");
      setProgressPercent(10);

      startWan26Polling(taskId, "t2v");


    } catch (err) {
      console.error("❌ Wan 2.6 generation error:", err);
      setError(err?.message || "Wan 2.6 generation failed.");

      // ❌ DO NOT cleanup persisted job here
      setJobActive(false);
      setLoading(false);
    }
  },
  [
    user,
    startWan26Polling,
  ]
);



//end

//image to video wan26



// Wan 2.6 — Image → Video
const onGenerateWan26ImageVideo = useCallback(async ({
  prompt,
  imageUrl,
  duration = "5",
  resolution = "720p",
  multi_shots = false,
}) => {
  try {
    if (!user?.uid) {
      throw new Error("Please log in.");
    }

    if (!imageUrl) {
      throw new Error("Wan 2.6 image-to-video requires an image.");
    }

    // ✅ 🔥 MUST BE HERE (BEFORE FETCH)
    lastWan26MetaRef.current = {
      userId: user.uid,
      prompt: prompt?.trim() || "",
      model: "wan-2.6",
      duration,
      resolution,
      kind: "i2v",
      createdAt: Date.now(),
    };

    setJobActive(true);
    setLoading(true);
    setError(null);
    setProgressText("🚀 Submitting Wan 2.6 image job…");
    setProgressPercent(1);

    const token = await getIdToken();

    const res = await fetch(
      "/api/videoapi/generate-image-video-wan26",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          image_urls: [imageUrl],
          duration,
          resolution,
          multi_shots,
        }),
      }
    );

    const raw = await res.text();
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error("Wan 2.6 returned invalid JSON.");
    }

    const taskId =
      json?.taskId ||
      json?.task_id ||
      json?.data?.taskId ||
      json?.data?.task_id;

    if (!res.ok || !taskId) {
      throw new Error(json?.error || json?.msg || "Wan 2.6 I2V failed");
    }

    // ✅ PERSIST FULL META (THIS IS WHY REFRESH WORKS)
    localStorage.setItem(
      "active_external_job",
      JSON.stringify({
        provider: "wan-2.6",
        taskId,
        kind: "i2v",
        meta: lastWan26MetaRef.current,
        startedAt: Date.now(),
      })
    );

    setCurrentJobId(taskId);
    currentJobIdRef.current = taskId;

    setProgressText("⏳ Wan 2.6 rendering…");
    setProgressPercent(10);

    startWan26Polling(taskId, "i2v");

  } catch (err) {
    console.error("❌ Wan 2.6 I2V error:", err);
    setError(err.message || "Wan 2.6 image generation failed");
    setJobActive(false);
    setLoading(false);
  }
}, [user, getIdToken, startWan26Polling]);

//End

// Nano banana google

// Nano Banana (Firestore-first, single source of truth)
const onGenerateNanoBanana = async ({
  prompt,
  aspect_ratio,
  resolution,
  output_format,
}) => {
  if (!user?.uid) {
    setError("Please log in to generate images.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const res = await fetch("/api/nano-banana", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
        resolution,
        output_format,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || "Nano Banana failed");
    }

    const urls = json.resultUrls || [];
    if (!urls.length) {
      throw new Error("Nano Banana returned no images");
    }

    // ✅ WRITE RESULTS TO FIRESTORE (ONCE)
    for (const url of urls) {
      await addDoc(collection(db, "images"), {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        avatar: user.photoURL || "/default-avatar.png",

        imageUrl: url,
        prompt: prompt || "N/A",

        // 🔖 IMPORTANT: tag the model
        modelType: "nano-banana-pro",

        isPublic: false,
        likes: 0,
        createdAt: serverTimestamp(),
      });
    }

    // ❌ DO NOT call setGeneratedImages here
    // Firestore onSnapshot will update the gallery automatically
  } catch (err) {
    console.error("❌ Nano Banana error:", err);
    setError(err.message || "Nano Banana generation failed");
  } finally {
    setLoading(false);
  }
};









//



  // ---------- Restore active job on mount ----------

  

  // ---------- Cancel job ----------

  // ---------- Cancel job ----------

  const cancelPoll = useCallback(
  async (jobId) => {
    try {
      const token = await getIdToken();
      await cancelComfyJob(jobId, token);
    } catch (err) {
      console.warn("Cancel API failed, forcing cleanup:", err);
    }

    // ✅ ALWAYS cleanup
    cleanupJobState();
  },
  [getIdToken, cleanupJobState]
);



 

  // ---------- LoRA & Metadata helpers ----------
  const onSendToPrompt = ({ text, negative }) => {
    setPrompt(text || '');
    setNegativePrompt(negative || '');
  };

  const selectLora = (name, activationText, thumbnail) => {
    const isNSFW = name.toLowerCase().includes('nsfw');
    if (isNSFW && membershipStatus === 'free') {
      alert('⚠️ NSFW LoRA models are only available for premium members.');
      return false;
    }
    setSelectedLora({ name, activationText, thumbnail });
    return true;
  };

  const injectLoraToPrompt = (name, activationText, weight = 1.0) => {
    const tag = `<lora:${name}:${weight}>`;
    setPrompt((prev) => {
      const withoutOldLora = prev.replace(/<lora:[^>]+>/g, '').trim();
      return `${withoutOldLora}${withoutOldLora ? ', ' : ''}${activationText}, ${tag}`.trim();
    });
  };

  const handleLoraSelect = (name, activationText, thumbnail) => {
    if (selectLora(name, activationText, thumbnail)) {
      injectLoraToPrompt(name, activationText);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image.img);
    setSelectedMetadata(image.metadata);
  };

  const handleReuseMetadata = (metadata) => {
    if (!metadata) return;
    setPrompt(metadata.prompt || '');
    setNegativePrompt(metadata.negativePrompt || '');
    if (metadata.modelType && models) {
      const matched = models.find((m) => m.title === metadata.modelType);
      if (matched) setSelectedModel(matched);
    }
    if (metadata.sampler) setSelectedSampler(metadata.sampler);
    setImageResolution(metadata.imageResolution || { width: 512, height: 512 });
    setCfgScale(metadata.cfgScale || 7);
    setSteps(metadata.steps || 20);
    setSelectedImage(null);
  };

  const handleTemplateSelect = (template) => {
    const { lora, weight = 1.0, activationText = '', promptExtras = '', negativePrompt = '', model, cfg, steps, sampler } = template;
    const loraName = lora.replace(/\s+/g, '_');
    const loraTag = `<lora:${loraName}:${weight}>`;
    const cleanedExtras = promptExtras.replace(/<lora:[^>]+>/g, '').trim();
    const cleanedActivation = activationText.replace(/<lora:[^>]+>/g, '').trim();
    const fullPrompt = [cleanedActivation, cleanedExtras, loraTag].filter(Boolean).join(', ');
    setPrompt(fullPrompt.trim());
    setNegativePrompt(negativePrompt || '');
    const matched = models.find((m) => m.title === model);
    if (matched) setSelectedModel(matched);
    setCfgScale(cfg || 7);
    setSteps(steps || 20);
    if (sampler) setSelectedSampler(sampler);
    setSelectedLora({ name: loraName, activationText, thumbnail: `/loras/${loraName}.preview.png` });
  };

  return (
    <ImageGenerationContext.Provider
  value={{
    // prompts
    prompt, setPrompt,
    negativePrompt, setNegativePrompt,

    // images
    generatedImages, setGeneratedImages,
    deleteImage,

    // models & samplers
    models,
    selectedModel, setSelectedModel,
    selectedSampler, setSelectedSampler,

    // upscalers
    upscalers, setUpscalers,
    latentUpscalers,
    allUpscalers,
    selectedUpscaler, setSelectedUpscaler,
    selectedLatentUpscaler, setSelectedLatentUpscaler,

    // samplers
    samplers,
    samplersLoading,
    samplersError,
    reloadSamplers,

    // params
    steps, setSteps,
    cfgScale, setCfgScale,
    seed, setSeed,
    batchSize, setBatchSize,
    batchCount, setBatchCount,

    // resolution
    selectedAspectRatio, setSelectedAspectRatio,
    imageResolution, setImageResolution,
    handleAspectRatioChange,
    width, height,

    // lora & metadata
    selectedLora, setSelectedLora,
    selectedImage, setSelectedImage,
    selectedMetadata, setSelectedMetadata,
    handleLoraSelect,
    handleImageClick,
    handleReuseMetadata,
    handleTemplateSelect,
    onSendToPrompt,

    // user / plan
    credits, setCredits,
    membershipStatus, setMembershipStatus,

    // UI / loading
    loading, setLoading,
    showUpgradePopup, setShowUpgradePopup,
    error, setError,

    // video state
    mode, setMode,
    videoUrl, setVideoUrl,               // optional / legacy
    generatedVideos, setGeneratedVideos, // primary source
    currentJobId, setCurrentJobId,
    jobActive, setJobActive,
    progressText, setProgressText,
    progressPercent, setProgressPercent,
    etaTargetMs, setEtaTargetMs,
    latestVideoRef,
    cleanupJobState,

    // actions
    onGenerateImage,
    onGenerateVideo,          // Wan I2V
    onGenerateTextToVideo,    // Wan T2V
    onGenerateSeedanceVideo,
    onGenerateSeedanceImageVideo,   // Seedance T2V
    onGenerateWan26Video,
    onGenerateWan26ImageVideo,
    onGenerateNanoBanana,

    cancelPoll,

    videoModel,
    setVideoModel,
  }}
>
      {children}
      {showUpgradePopup && <UpgradePopup onClose={() => setShowUpgradePopup(false)} />}
    </ImageGenerationContext.Provider>
  );
};

export const useImageGeneration = () => useContext(ImageGenerationContext);
