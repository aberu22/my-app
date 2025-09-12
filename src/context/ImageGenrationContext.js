"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { generateImage, fetchUpscalers, fetchModels, setOptions,fetchLatentUpscaleModes} from "../app/utils/api"; 
import { useAuth } from "./AuthContext"; 
import { db, storage } from "@/lib/firebase";
import { collection, getDoc, addDoc, serverTimestamp, query, where, onSnapshot, doc,deleteDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL,deleteObject } from "firebase/storage";
import UpgradePopup from "@/app/components/UpgradePopup";
import { increment , runTransaction} from "firebase/firestore";
import { generateVideo, checkVideoStatus, cancelComfyJob,generateTextVideo } from "@/app/utils/api";
import { useRef } from "react";
import {  getPersistedJob,persistJob,clearPersistedJob } from "@/app/components/jobPersist";




const ImageGenerationContext = createContext();

export const ImageGenerationProvider = ({ children }) => {



  //asspect ratio state

const aspectRatioMap = {
  // Common aspect ratios
  "1:1": { width: 512, height: 512 },
  "4:3": { width: 1024, height: 768 },
  "3:2": { width: 960, height: 640 },
  "2:3": { width: 640, height: 960 },
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "21:9": { width: 1440, height: 600 },
  "9:16": { width: 720, height: 1280 },

  // Additional presets
  "512x768": { width: 512, height: 768 },
  "768x512": { width: 768, height: 512 },
  "1024x1024": { width: 1024, height: 1024 }, // <-- Added this line
  "1024x2024": { width: 1024, height: 2024 },

  // Safe HD cap
  "HD 1080p": { width: 1920, height: 1080 },
};



  // 🔹 State Variables
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedSampler, setSelectedSampler] = useState(null);
  const [selectedUpscaler, setSelectedUpscaler] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLora, setSelectedLora] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMetadata, setSelectedMetadata] = useState(null);
  const [credits, setCredits] = useState(null);  // 🔹 Set to `null` to avoid flashes
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upscalers, setUpscalers] = useState([]);
  const [models, setModels] = useState([]);
  const [membershipStatus, setMembershipStatus] = useState("free"); // ✅ Fix: Define state
  const [latentUpscalers, setLatentUpscalers] = useState([]);
  const [selectedLatentUpscaler, setSelectedLatentUpscaler] = useState(null);
  const [allUpscalers, setAllUpscalers] = useState([]);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mode, setMode] = useState("image"); // "image" or "video"
  const [progressText, setProgressText] = useState(null);
  const [progressPercent, setProgressPercent] = useState(null);
  const [currentJobId, setCurrentJobId] = useState(null);
  // in ImageGenerationContext (top-level state)
const [jobActive, setJobActive] = useState(false);

  

    const latestVideoRef = useRef(null);
    const pollHandleRef = useRef(null);   // ✅ inside the component
    const isActiveRef    = useRef(true);   // ✅ add this here
    const currentJobIdRef = useRef(null);

    const isMine = (id) => currentJobIdRef.current && currentJobIdRef.current === id;


    // top of provider component (next to your other refs)


// keep this component "alive" flag updated
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



  useEffect(() => {
    const loadUpscalers = async () => {
      const [standard, latent] = await Promise.all([
        fetchUpscalers(),
        fetchLatentUpscaleModes(),
      ]);
  
      setUpscalers(standard);
      setLatentUpscalers(latent);
  
      const merged = [
        ...latent.map((u) => ({ name: u.name, type: "latent" })),
        ...standard.map((u) => ({ name: u.name, type: "standard" })),
      ];
  
      setAllUpscalers(merged);
      setSelectedUpscaler(merged[0]?.type === "standard" ? merged[0] : null);
      setSelectedLatentUpscaler(merged[0]?.type === "latent" ? merged[0] : null);
    };
  
    loadUpscalers();
  }, []);

 

const [steps, setSteps] = useState(20);
const [cfgScale, setCfgScale] = useState(7);
const [seed, setSeed] = useState(-1);
const [batchSize, setBatchSize] = useState(1);
const [batchCount, setBatchCount] = useState(1)
const [generatedVideos, setGeneratedVideos] = useState([]);

console.log("🔍 Available Upscalers:", upscalers);



  // 🔸 Aspect Ratio Selection & Resolution State
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");
  const [imageResolution, setImageResolution] = useState(aspectRatioMap["1:1"]);
  const { width, height } = imageResolution;

const handleAspectRatioChange = (ratio) => {
  setSelectedAspectRatio(ratio);
  setImageResolution(aspectRatioMap[ratio]);
};





  const { getIdToken, user } = useAuth();
 

  






  useEffect(() => {
    if (!user?.uid) return;
  
    const q = query(collection(db, "images"), where("userId", "==", user.uid));
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("🔥 Firestore snapshot triggered!");
  
      const images = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      console.log("📸 Firestore Updated Images:", images);
      setGeneratedImages(images);
    });
  
    return () => unsubscribe();
  }, [user?.uid]); // ✅ More precise dependency
  


  //delete image in firestone
  
  const deleteImage = async (imageId) => {
    if (!imageId) {
      console.warn("⚠️ No image ID found, skipping delete.");
      return;
    }
  
    console.log("🗑 Deleting image with ID:", imageId);
  
    try {
      const imageRef = doc(db, "images", imageId);
      const imageSnap = await getDoc(imageRef);
  
      if (!imageSnap.exists()) {
        console.warn("🚨 Image already deleted from Firestore!");
        return;
      }
  
      const imageData = imageSnap.data();
      const imageUrl = imageData.imageUrl;

      
  
      const storagePath = imageUrl.startsWith("https://firebasestorage.googleapis.com")
        ? decodeURIComponent(imageUrl.split("/o/")[1].split("?alt=media")[0])
        : imageUrl;
  
      const storageRef = ref(storage, storagePath);
  
      await deleteObject(storageRef).catch((error) => {
        if (error.code === "storage/object-not-found") {
          console.warn("⚠️ Image file already deleted. Skipping...");
        } else {
          throw error;
        }
      });
  
      await deleteDoc(imageRef);
      console.log("✅ Image removed from Firestore & Storage.");
    } catch (error) {
      console.error("🚨 Error deleting image:", error);
      alert("❌ Failed to delete image.");
    }
  };
  
  
 


  

 // 🔹 Listen for Real-Time User Updates (Credits & Membership Status)
 useEffect(() => {
  if (!user?.uid) return;

  const userRef = doc(db, "users", user.uid);
  const unsubscribe = onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const userData = snapshot.data();
      console.log("🔥 Firestore Update Detected:", userData);

      // ✅ Update credits & membership in real-time
      setCredits(userData.credits ?? 50);
      setMembershipStatus(userData.membershipStatus ?? "free");
    }
  });

  return () => unsubscribe();
}, [user, setCredits, setMembershipStatus]); // ✅ Add setCredits and setMembershipStatus as dependencies





  // 🔹 Fetch & Filter Models Based on Membership Status
  useEffect(() => {
    const loadModels = async () => {
      const allModels = await fetchModels();
      const filteredModels = allModels.filter((model) => {
        const isNSFW = model.tags?.includes("NSFW");
        return membershipStatus === "free" ? !isNSFW : true;
      });

      setModels(filteredModels);
    };

    if (membershipStatus) {
      loadModels();
    }
  }, [membershipStatus]);



//generate payload and images

const onGenerateImage = async () => {
  try {
    // Basic guards
    if (!user?.uid) {
      alert("Please sign in to generate images.");
      return;
    }
    if (!prompt.trim()) {
      alert("⚠️ Please enter a prompt.");
      return;
    }
    if (!selectedModel?.title || !selectedSampler) {
      alert("⚠️ Pick a model and a sampler first.");
      return;
    }
    if ((credits ?? 0) <= 0) {
      setShowUpgradePopup(true);
      return;
    }

    // NSFW gate
    const isNSFW =
      selectedModel?.tags?.includes("NSFW") ||
      selectedLora?.name?.toLowerCase?.().includes("nsfw");
    if (isNSFW && membershipStatus === "free") {
      alert("⚠️ NSFW content is only for premium members.");
      return;
    }

    setLoading(true);

    // Build payload
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
      hr_upscaler: selectedUpscaler?.name || "Latent",
      denoising_strength: 0.4,  
      // If your API expects a string, pass name; if it expects object, keep as-is.
      latent_upscaler: selectedLatentUpscaler?.name || selectedLatentUpscaler || null,
    };

     // 🔍 Debug log full payload
    console.log("📝 Image generation payload:", JSON.stringify(metadata, null, 2));

    // Ensure correct model is active server-side (your API design)
    await setOptions({ sd_model_checkpoint: selectedModel.title });
    // A small wait can help if your backend loads models asynchronously
    await new Promise((res) => setTimeout(res, 4000));

    // Generate
    const response = await generateImage(metadata);
    if (!response?.images?.length) {
      throw new Error("🚨 API returned no images.");
    }

    const totalGenerated = response.images.length;
    const userRef = doc(db, "users", user.uid);

    // Upload each image to Storage and create a Firestore doc
    for (const base64 of response.images) {
      const base64Image = `data:image/png;base64,${base64}`;
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${user.uid}.png`;
      const storagePath = `images/${user.uid}/${fileName}`;
      const imageRef = ref(storage, storagePath);

      await uploadString(imageRef, base64Image, "data_url");
      const downloadURL = await getDownloadURL(imageRef);

      await addDoc(collection(db, "images"), {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        avatar: user.photoURL || "/default-avatar.png",
        imageUrl: downloadURL,
        storagePath, // 👈 store path to make deletion easy
        prompt: prompt || "N/A",
        negativePrompt: negativePrompt || "N/A",
        modelType: selectedModel?.title || "default",
        isPublic: false,
        likes: 0,
        createdAt: serverTimestamp(),
      });
    }

    // Deduct credits safely
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error("User document does not exist.");

      const currentCredits = snap.data().credits ?? 0;
      if (currentCredits < totalGenerated) {
        throw new Error("Not enough credits to generate images.");
      }

      transaction.update(userRef, { credits: increment(-totalGenerated) });
      setCredits(currentCredits - totalGenerated); // sync UI
    });
  } catch (err) {
    console.error("🚨 Error generating image:", err);
    alert(err?.message || "An unexpected error occurred.");
  } finally {
    setLoading(false);
  }
};




// 🔹 call on page mount to resume if a job was running


// at top of component (you already have pollHandleRef)

useEffect(() => {
  isActiveRef.current = true;
  return () => { isActiveRef.current = false; };
}, []);

// resume a running job after navigation/refresh




// config.js or directly in the component
// config.js (COMFY_BASE_URL is no longer needed due to Next.js rewrites)
// PollJOb

// still inside ImageGenerationProvider component, NOT exported
// still inside ImageGenerationProvider component, NOT exported

// --- Tiny per-job persistence helpers (safe to keep here) ---


// --- Utilities used inside the poller ---
const sleep = (ms) =>
  new Promise((r) => setTimeout(r, ms + Math.floor(Math.random() * 400)));

const fmtETA = (sec) => {
  if (!Number.isFinite(sec)) return "estimating…";
  if (sec < 60) return "< 1 min";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rm = m % 60;
  return `${h}h ${rm}m`;
};
const fmtQueue = (pos, len) =>
  Number.isFinite(pos) && Number.isFinite(len) ? `#${pos} of ${len}` : "…";



// --- The refresh polling ---

useEffect(() => {
  // Only try to restore when we have an authed user
  if (!user) return;

  const raw = localStorage.getItem("t2v_active_job");
  if (!raw) return;

  (async () => {
    try {
      const saved = JSON.parse(raw);
      const jobId = saved?.id;
      if (!jobId) return;

      // visually resume
      setCurrentJobId(jobId);
      setJobActive(true);
      setProgressText("⏳ Resuming job…");
      setProgressPercent((p) => (p ?? 8));

      const token = await getIdToken();

      // re-enter your existing poller — same callbacks as in onGenerateVideo
      pollJobUntilDone({
        jobId,
        token,
        onUpdate: (id, snap) => {
          if (id !== jobId) return;
          const status = snap?.status || "unknown";
          if (status === "queued") {
            const pos = Number.isFinite(+snap?.queue_position) ? +snap.queue_position : null;
            const len = Number.isFinite(+snap?.queue_length) ? +snap.queue_length : null;
            setProgressText(`📦 In queue ${pos && len ? `#${pos} of ${len}` : "…"}`);
            setProgressPercent((p) => Math.max(p ?? 5, 8));
          } else if (status === "processing") {
            const pct = Number.isFinite(+snap?.progress) ? Math.min(98, Math.max(10, +snap.progress)) : 35;
            setProgressText((snap?.stage || "🎬 Rendering…"));
            setProgressPercent(pct);
          } else if (status === "poll_error") {
            setProgressText("⏳ Checking status…");
          }
        },
        onFinish: (id, final) => {
          if (id !== jobId) return;
          const url = final?.video_url;
          if (url) {
            setVideoUrl(url);
            setGeneratedVideos((v) => [
              { url, jobId: id, prompt: saved?.prompt, fps: saved?.fps, duration: saved?.duration, ts: Date.now() },
              ...v,
            ]);
            setProgressText("✅ Video is ready!");
            setProgressPercent(100);
          } else {
            setProgressText("⚠️ Finished, but no video URL returned.");
            setProgressPercent(null);
          }
          setJobActive(false);
          localStorage.removeItem("t2v_active_job");
        },
        onError: (id, err) => {
          if (id !== jobId) return;
          setProgressText(`❌ ${err?.message || "Job failed."}`);
          setProgressPercent(null);
          setJobActive(false);
          localStorage.removeItem("t2v_active_job");
        },
      });
    } catch (e) {
      console.error("Restore failed:", e);
      localStorage.removeItem("t2v_active_job");
    }
  })();
}, [user]); // depends on user so restore runs after auth is ready




/**
 * Poll a video job until it finishes, fails, or times out.
 * - No global setters. All updates go through callbacks you provide.
 * - Returns a { cancel } handle you can call to abort polling.
 *
 * onUpdate(jobId, snapshot)   // called on every poll tick
 * onFinish(jobId, finalSnap)  // called when job finishes with video_url
 * onError(jobId, error)       // called on failure/cancel/timeout
 */
 // place this INSIDE your context file (no export)
// Poll a single job until it finishes (or errors/cancels).
// Compatible with both old/new backend shapes.
function pollJobUntilDone({
  jobId,
  token,
  baseUrl = "",
  serverEtaSec,          // optional seconds hint from start API
  serverTimeout,         // optional seconds hint from start API
  timeoutMs,             // optional client cap (ms)
  onUpdate,              // (jobId, snapshot) => void
  onFinish,              // (jobId, finalSnapshot) => void
  onError,               // (jobId, error) => void
  onCancel,              // (jobId) => void (optional)
  propagateCancelToServer = true, // TRY to call /videoapi/cancel-job on cancel/timeout
}) {
  if (!jobId) throw new Error("pollJobUntilDone: jobId is required");
  if (!token) throw new Error("pollJobUntilDone: auth token is required");

  // normalize baseUrl once to avoid double slashes
  const root = (baseUrl || "").replace(/\/+$/, "");
  const started = Date.now();
  const controller = new AbortController();
  let cancelled = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const backoff = (n) => Math.min(4000, 600 + n * 300) + Math.floor(Math.random() * 250);

  const serverMs =
    Number.isFinite(+serverEtaSec) ? +serverEtaSec * 1000 :
    Number.isFinite(+serverTimeout) ? +serverTimeout * 1000 : null;

  // prefer server hint; otherwise 30m client cap
  const cap = serverMs ? Math.max(timeoutMs || 0, serverMs) : (timeoutMs || 30 * 60 * 1000);

  const readJSON = async (res) => {
    let txt = "";
    try { txt = await res.text(); } catch {}
    try { return txt ? JSON.parse(txt) : {}; } catch { return {}; }
  };

  // Best-effort backend cancel
  const cancelOnServer = async () => {
    if (!propagateCancelToServer) return;
    try {
      await fetch(`${root}/videoapi/cancel-job`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ client_id: jobId }),
      });
    } catch {
      /* ignore */
    }
  };

  (async () => {
    try {
      let attempt = 0;

      while (!cancelled) {
        // client-side timeout
        if (Date.now() - started > cap) {
          // try to stop compute on the server before erroring out
          await cancelOnServer();
          throw new Error("Timed out waiting for video.");
        }

        if (controller.signal.aborted) {
          if (!cancelled) {
            cancelled = true;
            onCancel?.(jobId);
          }
          return;
        }

        // fetch status for THIS job only
        let res, data;
        try {
          res = await fetch(`${root}/videoapi/job-status?id=${encodeURIComponent(jobId)}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Cache-Control": "no-store",
            },
            signal: controller.signal,
          });
          data = await readJSON(res);
        } catch (err) {
          if (cancelled || controller.signal.aborted) return;
          onUpdate?.(jobId, { status: "poll_error", detail: err?.message || "network_error" });
          await sleep(backoff(attempt++));
          continue;
        }

        // non-2xx handling
        if (!res.ok) {
          if (res.status === 404) {
            // transient: job not registered yet; retry while under cap
            onUpdate?.(jobId, { status: "unknown", http: 404 });
            await sleep(backoff(attempt++));
            continue;
          }
          if (res.status === 429) {
            // rate limited -> backoff more
            onUpdate?.(jobId, { status: "poll_error", http: 429 });
            await sleep(backoff(attempt++));
            continue;
          }
          if (res.status === 410) {
            // gone/expired
            throw new Error(data?.detail || "Job expired.");
          }
          throw new Error(data?.detail || `Status check failed (HTTP ${res.status}).`);
        }

        // emit snapshot to caller (store under state[jobId])
        onUpdate?.(jobId, data);

        const s = (data && data.status) || "unknown";

        // finish path
        if ((s === "complete" || s === "finished") && data?.video_url) {
          onFinish?.(jobId, data);
          return;
        }

        // error/cancel paths
        if (s === "error" || s === "failed" || s === "cancelled" || s === "canceled") {
          const msg = data?.error || data?.detail || `Job ${s}.`;
          throw new Error(msg);
        }

        // adaptive cadence
        let delay = 3000;
        if (s === "queued") {
          const pos = Number.isFinite(+data?.queue_position) ? +data.queue_position : null;
          delay = (pos != null && pos <= 2) ? 2000 : 5000;
        } else if (s === "processing" || (data?.stage || "").toLowerCase().includes("render")) {
          delay = 1800;
        }

        await sleep(delay);
      }
    } catch (err) {
      if (!cancelled && !controller.signal.aborted) {
        onError?.(jobId, err);
      }
    }
  })();

  // per-job cancel handle
  return {
    cancel: async () => {
      if (cancelled) return;
      cancelled = true;
      controller.abort();     // abort current fetch
      await cancelOnServer(); // try to stop the backend job
      onCancel?.(jobId);
    },
  };
}




//ON generate video( image to video )
// ON generate video (image to video)
const onGenerateVideo = async ({
  imageFile,
  prompt,
  negative_prompt = "",
  lora_name = "",
  fps = 20,
  duration = 6,
  setProgressText,
  setProgressPercent,

  // ⬇️ pass this if it's not already available via closure/context
  selectedLoras = [], // [{ label: "HIGH"|"LOW", safetensor, strength?, trigger? }, ...]
}) => {
  // guards
  if (!user) { setError("⚠️ You must be logged in to generate a video."); return; }
  if (!imageFile) { setError("⚠️ A reference image is required."); return; }
  if (!prompt || !prompt.trim()) { setError("⚠️ Prompt is required."); return; }
  if ((credits ?? 0) <= 0) { setError("❌ You have 0 credits left."); setShowUpgradePopup(true); return; }

  // clamp like backend (I2V uses int seconds)
  const fpsInt = Math.max(1, Math.min(60, Math.round(Number(fps) || 24)));
  const durSec = Math.max(1, Math.min(30, Math.floor(Number(duration) || 4)));

  try {
    setJobActive(true);
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setGeneratedVideos([]);
    setProgressText("🚀 Submitting your video job…");
    setProgressPercent(1);

    const token = await getIdToken();

    // ===== Build HIGH/LOW arrays from the LoRA cards =====
   const highs = (selectedLoras||[]).filter(x => x && String(x.label).toUpperCase()==="HIGH");
    const lows  = (selectedLoras||[]).filter(x => x && String(x.label).toUpperCase()==="LOW");


    // (optional) dedupe by safetensor while preserving order
    // Safer dedupe: case-fold + fallback to model
const keyOf = (x) => String(x?.safetensor || x?.model || "").trim().toLowerCase();

const dedupe = (arr) => {
  const seen = new Set();
  return arr.filter((x) => {
    const k = keyOf(x);
    if (!k) return false;           // skip empty keys
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// Use it
const highUnique = dedupe(highs);
const lowUnique  = dedupe(lows);


    const user_high_loras     = highUnique.map(x => x.safetensor);
    const user_high_strengths = highUnique.map(x => (x?.strength != null ? Number(x.strength) : 1.0));
    const user_low_loras      = lowUnique.map(x => x.safetensor);
    const user_low_strengths  = lowUnique.map(x => (x?.strength  != null ? Number(x.strength)  : 1.0));

    // (optional) merge LoRA trigger phrases into the prompt you send
    const triggerTexts = [...highUnique, ...lowUnique]
      .map(x => (x?.trigger || "").trim())
      .filter(Boolean);
    const sendPrompt = [prompt, ...triggerTexts].filter(Boolean).join(", ");

    // ===== Start job (supports both old and new return shapes) =====
    const start = await generateVideo({
      imageFile,
      prompt: sendPrompt,    // or just `prompt` if you don't want triggers appended
      negative_prompt,
      token,

      // ✅ NEW explicit split → HIGH (node 470) / LOW (node 471)
      user_high_loras,
      user_high_strengths,
      user_low_loras,
      user_low_strengths,

      // ⬇️ legacy (optional; keep if other codepaths still depend on it)
      lora_name,

      // core knobs
      fps: fpsInt,
      duration: durSec,
    });

    const job_id = String(start?.job_id || "");
    if (!job_id) throw new Error("🚫 No job_id returned from backend.");

    // Normalize ETA/timeout from either shape
    const timeoutSec =
      Number.isFinite(start?.timeout) ? Number(start.timeout) :
      Number.isFinite(start?.timeoutMs) ? Math.round(Number(start.timeoutMs) / 1000) :
      undefined;

    const etaSec =
      Number.isFinite(start?.eta_seconds) ? Number(start.eta_seconds) :
      Number.isFinite(start?.serverEtaSec) ? Number(start.serverEtaSec) :
      undefined;

    // Prefer exact charged_credits (new backend), fallback to +1 UI decrement
    const charged =
      Number.isFinite(start?.charged_credits) ? Number(start.charged_credits) :
      Number.isFinite(start?.raw?.charged_credits) ? Number(start.raw.charged_credits) :
      1;

    const frames =
      Number.isFinite(start?.frames) ? Number(start.frames) :
      Number.isFinite(start?.raw?.frames) ? Number(start.raw.frames) :
      fpsInt * durSec;

    // mark current job (state + ref)
    setCurrentJobId(job_id);
    currentJobIdRef.current = job_id;

    // Persist active job so refresh/navigation can resume polling
    localStorage.setItem(
      "t2v_active_job",
      JSON.stringify({
        id: job_id,
        kind: "i2v",
        prompt: sendPrompt, // store what you actually sent
        fps: fpsInt,
        duration: durSec,
        frames,
        charged_credits: charged,
        startedAt: Date.now(),
      })
    );

    // deduct credits client-side to reflect backend charge immediately
    setCredits((prev) => Math.max((prev ?? 0) - charged, 0));

    // start polling (do NOT await)
    const handle = pollJobUntilDone({
      jobId: job_id,
      token,
      serverEtaSec: etaSec,
      serverTimeout: timeoutSec,
      onUpdate: (id, snap) => {
        if (!isMine(id)) return; // ⛔ cross-talk guard

        const status = snap?.status || "unknown";
        if (status === "queued") {
          const pos = Number.isFinite(+snap?.queue_position) ? +snap.queue_position : null;
          const len = Number.isFinite(+snap?.queue_length) ? +snap.queue_length : null;
          setProgressText(`📦 In queue ${pos && len ? `#${pos} of ${len}` : "…"}`);
          setProgressPercent((p) => Math.max(p ?? 5, 8));
        } else if (status === "processing") {
          const pct = Number.isFinite(+snap?.progress) ? Math.min(98, Math.max(10, +snap.progress)) : 35;
          const stage = snap?.stage || "rendering";
          setProgressText(stage.includes("render") ? "🎬 Rendering…" : "🧩 Preparing…");
          setProgressPercent(pct);
        } else if (status === "poll_error") {
          setProgressText("⏳ Checking status…");
        }
      },
      onFinish: (id, final) => {
        if (!isMine(id)) return; // ⛔ cross-talk guard

        const url = final?.video_url;
        if (url) {
          setVideoUrl(url);
          setGeneratedVideos((v) => [
            { url, jobId: id, prompt: sendPrompt, fps: fpsInt, duration: durSec, ts: Date.now() },
            ...v,
          ]);
          setProgressText("✅ Video is ready!");
          setProgressPercent(100);
        } else {
          setProgressText("⚠️ Finished, but no video URL returned.");
          setProgressPercent(null);
        }
        setLoading(false);
        setJobActive(false);
      },
      onError: (id, err) => {
        if (!isMine(id)) return; // ⛔ cross-talk guard
        setProgressText(`❌ ${err?.message || "Job failed."}`);
        setProgressPercent(null);
        setLoading(false);
        setJobActive(false);
      },
    });

    pollHandleRef.current = handle;
    setTimeout(() => latestVideoRef.current?.scrollIntoView({ behavior: "smooth" }), 500);
  } catch (err) {
    console.error("🚨 Video generation failed:", err);
    setError(err?.message || "Unexpected error occurred.");
    setProgressText(null);
    setProgressPercent(null);
    setLoading(false);
    setCurrentJobId(null);
    currentJobIdRef.current = null;
    setJobActive(false);
    if (err?.message?.toLowerCase?.().includes("credits")) setShowUpgradePopup(true);
  }
};





// Assumes you have these somewhere in your component:
// const currentJobIdRef = useRef(null);
// const isActiveRef = useRef(true);            // if you already have it, reuse yours
// const [currentJobId, setCurrentJobId] = useState(null);
// const [loading, setLoading] = useState(false);
// const [jobActive, setJobActive] = useState(false);
// const pollHandleRef = useRef(null);

// --- Text → Video ---
const onGenerateTextToVideo = async ({
  prompt,
  negative_prompt = "",
  lora_name = "",
  loras = [],
  fps = 20,
  duration = 10,
  setProgressText,
  setProgressPercent,
}) => {
  // basic guards
  if (!user) { setError("⚠️ You must be logged in to generate a video."); return; }
  if (!prompt || !prompt.trim()) { setError("⚠️ Prompt is required."); return; }
  if ((credits ?? 0) <= 0) { setError("❌ You have 0 credits left."); setShowUpgradePopup(true); return; }

  // clamp like backend
  const fpsInt = Math.max(1, Math.min(60, Math.round(Number(fps) || 24)));
  const durSec = Math.max(0.5, Math.min(30.0, Number(duration) || 4));

  try {
    setJobActive(true);
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setProgressText("🚀 Submitting your text-to-video job…");
    setProgressPercent(1);

    const token = await getIdToken();
    const chosenLoras = Array.isArray(loras) && loras.length
      ? loras.slice(0, 3)
      : (lora_name ? [lora_name] : []);

    // hit backend
    const resp = await generateTextVideo({
      prompt,
      negative_prompt,
      loras: chosenLoras,
      fps: fpsInt,
      duration: durSec,
      token,
    });

    const {
      job_id,
      timeout: serverTimeout,     // seconds
      eta_seconds: serverEtaSec,  // seconds
      queue_position,
      queue_length,
    } = resp || {};

    if (!job_id) throw new Error(`🚫 No job_id returned.`);

    // mark current job (state + ref)
    setCurrentJobId(job_id);
    currentJobIdRef.current = job_id;


    localStorage.setItem(
  "t2v_active_job",
  JSON.stringify({
    id: job_id,
    kind: "t2v",
    prompt,
    fps: fpsInt,
    duration: durSec,
    startedAt: Date.now(),
  })
);


    // deduct 1 credit now (or move to onFinish if you prefer)
    setCredits(prev => Math.max((prev ?? 0) - 1, 0));

    // initial queue UX
    if (Number.isFinite(queue_position) && Number.isFinite(queue_length)) {
      setProgressText(`📦 In queue #${queue_position} of ${queue_length} — estimating…`);
      setProgressPercent(p => Math.max(p ?? 5, 8));
    }

    // start polling (do NOT await)
    const handle = pollJobUntilDone({
      jobId: job_id,
      token,
      serverEtaSec,
      serverTimeout,
      onUpdate: (id, snap) => {
        if (!isMine(id)) return;            // ⛔ cross-talk guard

        const status = snap?.status || "unknown";
        if (status === "queued") {
          const pos = Number.isFinite(+snap?.queue_position) ? +snap.queue_position : null;
          const len = Number.isFinite(+snap?.queue_length) ? +snap.queue_length : null;
          setProgressText(`📦 In queue ${pos && len ? `#${pos} of ${len}` : "…"}`);
          setProgressPercent(p => Math.max(p ?? 5, 8));
        } else if (status === "processing") {
          const pct = Number.isFinite(+snap?.progress) ? Math.min(98, Math.max(10, +snap.progress)) : 35;
          const stage = snap?.stage || "rendering";
          setProgressText(stage.includes("render") ? "🎬 Rendering…" : "🧩 Preparing…");
          setProgressPercent(pct);
        } else if (status === "poll_error") {
          setProgressText("⏳ Checking status…");
        }
      },
      onFinish: (id, final) => {
        if (!isMine(id)) return;            // ⛔ cross-talk guard

        const url = final?.video_url;
        if (url) {
          setVideoUrl(url);
          setGeneratedVideos(v => [
            { url, jobId: id, prompt, fps: fpsInt, duration: durSec, ts: Date.now() },
            ...v,
          ]);
          setProgressText("✅ Video is ready!");
          setProgressPercent(100);
        } else {
          setProgressText("⚠️ Finished, but no video URL returned.");
          setProgressPercent(null);
        }
        setLoading(false);
        setJobActive(false);
      },
      onError: (id, err) => {
        if (!isMine(id)) return;            // ⛔ cross-talk guard
        setProgressText(`❌ ${err?.message || "Job failed."}`);
        setProgressPercent(null);
        setLoading(false);
        setJobActive(false);
      },
    });

    // keep cancel handle if you support Cancel
    pollHandleRef.current = handle;

    setTimeout(() => latestVideoRef.current?.scrollIntoView({ behavior: "smooth" }), 500);
  } catch (err) {
    console.error("🚨 Text-to-video failed:", err);
    setError(err?.message || "Unexpected error occurred.");
    setProgressText(null);
    setProgressPercent(null);
    setLoading(false);
    setCurrentJobId(null);
    currentJobIdRef.current = null;
    setJobActive(false);
    if (err?.message?.toLowerCase?.().includes("credits")) setShowUpgradePopup(true);
  }
};




const cancelPoll = async (jobId) => {
  try {
    pollHandleRef.current?.cancel?.();
    pollHandleRef.current = null;

    if (jobId) {
      const token = await getIdToken();
      try { await cancelComfyJob(jobId, token); } catch {}
      localStorage.removeItem("t2v_active_job");
    }

    setProgressText("❌ Job cancelled.");
    setProgressPercent(null);
    setLoading(false);
    setVideoUrl(null);
    setCurrentJobId(null);
    try { currentJobIdRef.current = null; } catch {}
  } catch (err) {
    console.warn("⚠️ Cancel failed:", err?.message || err);
    setProgressText("⚠️ Cancel failed.");
    setProgressPercent(null);
    setLoading(false);
  }
};


  // 🔹 Function to Send Prompt to Input
  const onSendToPrompt = ({ text, negative }) => {
    
    setPrompt(text);
    setNegativePrompt(negative);
  };


  // 🔹 Function to Handle LoRA Selection
  const selectLora = (name, activationText, thumbnail) => {
    const isNSFW = name.toLowerCase().includes("nsfw");
  
    if (isNSFW && membershipStatus === "free") {
      alert("⚠️ NSFW LoRA models are only available for premium members.");
      return false;
    }
  
    setSelectedLora({ name, activationText, thumbnail });
    return true;
  };
  

  const injectLoraToPrompt = (name, activationText, weight = 1.0) => {
    const tag = `<lora:${name}:${weight}>`;
  
    setPrompt((prev) => {
      const withoutOldLora = prev.replace(/<lora:[^>]+>/g, "").trim();
      return `${withoutOldLora}, ${activationText}, ${tag}`.replace(/^,/, "").trim();
    });
  };
  

  const handleLoraSelect = (name, activationText, thumbnail) => {
    if (selectLora(name, activationText, thumbnail)) {
      injectLoraToPrompt(name, activationText);
    }
  };
  
  
  // 🔹 Function to Open Metadata Modal (When Clicking an Image)
  const handleImageClick = (image) => {
    setSelectedImage(image.img);
    setSelectedMetadata(image.metadata);
  };

  // 🔹 Function to Reuse Metadata for Regenerating an Image

  const handleReuseMetadata = (metadata) => {
    if (!metadata) return;
  
    // Reuse prompts
    setPrompt(metadata.prompt || "");
    setNegativePrompt(metadata.negativePrompt || "");
  
    // Optional: Reuse model settings if available
    if (metadata.modelType && models) {
      const matchedModel = models.find((m) => m.title === metadata.modelType);
      if (matchedModel) {
        setSelectedModel(matchedModel);
      }
    }
  
    // Reuse sampler
    if (metadata.sampler) {
      setSelectedSampler(metadata.sampler);
    }
  
    // Reuse resolution
    setImageResolution(metadata.imageResolution || "512x512");
  
    // Reuse generation parameters
    setCfgScale(metadata.cfgScale || 7);
    setSteps(metadata.steps || 20);
  
    // Clear the selected image from preview
    setSelectedImage(null);
  };
  
  
  

  const handleTemplateSelect = (template) => {
    const {
      lora,
      weight = 1.0,
      activationText = "",
      promptExtras = "",
      negativePrompt = "",
      model,
      cfg,
      steps,
      sampler
    } = template;
  
    const loraName = lora.replace(/\s+/g, "_");
    const loraTag = `<lora:${loraName}:${weight}>`;
  
    // 🧼 Clean old <lora:...> tags just in case
    const cleanedPromptExtras = promptExtras.replace(/<lora:[^>]+>/g, "").trim();
    const cleanedActivation = activationText.replace(/<lora:[^>]+>/g, "").trim();
  
    const fullPrompt = [cleanedActivation, cleanedPromptExtras, loraTag]
      .filter(Boolean)
      .join(", ");
  
    setPrompt(fullPrompt.trim());
    setNegativePrompt(negativePrompt || "");
  
    const matchedModel = models.find((m) => m.title === model);
    if (matchedModel) setSelectedModel(matchedModel);
  
    setCfgScale(cfg || 7);
    setSteps(steps || 20);
    if (sampler) setSelectedSampler(sampler);
  
    setSelectedLora({
      name: loraName,
      activationText,
      thumbnail: `/loras/${loraName}.preview.png`,
    });
  };
  
    














  return (
    <ImageGenerationContext.Provider
      value={{
        prompt,
        setPrompt,
        negativePrompt,
        setNegativePrompt,
        generatedImages,
        setGeneratedImages,
        selectedModel,
        setSelectedModel,
        selectedSampler,
        setSelectedSampler,
        selectedUpscaler,
        setSelectedUpscaler,
        selectedImage,
        setSelectedImage,
        imageResolution,
        setImageResolution,
        loading,
        onGenerateImage, // ✅ Now properly passed in context
        onSendToPrompt,
        handleLoraSelect,
        handleImageClick,
        handleReuseMetadata,
        selectedLora,
        setSelectedLora,
        selectedMetadata,
        setSelectedMetadata,
        credits,
        setCredits,
        showUpgradePopup,
        setShowUpgradePopup,
        upscalers,  // ✅ New global state
        setUpscalers,   
        membershipStatus,
        models,
        deleteImage, // ✅ Now available globally
        setMembershipStatus,
        selectedSampler,
        steps,setSteps,
        cfgScale,setCfgScale,
        seed,setSeed,
        batchSize,setBatchSize,
        batchCount, setBatchCount,
        selectedAspectRatio,
        setSelectedAspectRatio,
        handleAspectRatioChange,
        width,height,
        generatedVideos,
        handleTemplateSelect,
        latentUpscalers,
        selectedLatentUpscaler,
        setSelectedLatentUpscaler,
        allUpscalers,
        error,
        setError,
        videoUrl,
        setVideoUrl,
        mode,
        setMode,
        generatedVideos,
        setGeneratedVideos,
        onGenerateTextToVideo,
        onGenerateVideo,
        setLoading,
         progressText,
        setProgressText,
        progressPercent,
        setProgressPercent,
         cancelPoll,
         currentJobId,
         setCurrentJobId,
         latestVideoRef,
         jobActive,
         setJobActive,
      
         
       

     
        


      }}
    >

      {children}

      
      {showUpgradePopup && <UpgradePopup onClose={() => setShowUpgradePopup(false)} />}
    </ImageGenerationContext.Provider>
  );
};

// 🔹 Hook to Access Context
export const useImageGeneration = () => useContext(ImageGenerationContext);


