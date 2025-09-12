import axios from "axios";
import { enrichWithThumbnailsAndActivation } from "./loader";

const apiBaseUrl = "/api"; // No more /sdapi/v1





// === Text/Image API ===

export const fetchModels = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/sd-models`);
    const enriched = await enrichWithThumbnailsAndActivation(response.data, "model");
    console.log("🧠 Enriched models:", enriched);
    return enriched;
  } catch (error) {
    console.error("🚨 Error fetching models:", error);
    return [];
  }
};

export const fetchLoras = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/loras`);
    const enriched = await enrichWithThumbnailsAndActivation(response.data, "lora");
    console.log("🎯 Enriched LoRAs:", enriched);
    return enriched;
  } catch (error) {
    console.error("🚨 Error fetching LoRAs:", error);
    return [];
  }
};

export const fetchSamplers = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/samplers`);
    console.log("🔍 Fetched samplers:", response.data);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("🚨 Error fetching samplers:", error);
    return [];
  }
};

export const fetchUpscalers = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/upscalers`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("🚨 Error fetching upscalers:", error);
    return [];
  }
};

export const fetchLatentUpscaleModes = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/latent-upscale-modes`);
    return response.data;
  } catch (error) {
    console.error("🚨 Error fetching latent upscale modes:", error);
    return [];
  }
};

export const generateImage = async (requestBody) => {
  try {
    const response = await axios.post(`${apiBaseUrl}/txt2img`, requestBody, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("🚨 API Call Failed:", error);
    throw error;
  }
};

export const setOptions = async (options) => {
  try {
    const response = await axios.post(`${apiBaseUrl}/options`, options, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    const msg = error?.response?.data || error.message;
    console.error("🚨 Failed to set options:", msg);
    throw new Error(msg);
  }
};

// === Video API ===

// === Video API ===
// --- helpers (local to this file) -------------------------------------------
const readJsonSafe = async (res) => {
  let txt = "";
  try { txt = await res.text(); } catch {}
  try { return txt ? JSON.parse(txt) : {}; } catch { return {}; }
};
const asNum = (v) => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);

// === Video API ===
// === Video API (final, aligned) ===

/**
 * Start an image-to-video job.
 * Returns normalized fields for your poller and UI.
 */
// api.js (or wherever you export this)
export async function generateVideo({
  imageFile,
  prompt,
  token,
  negative_prompt = "",
  baseUrl = "",

  // Legacy / simple LoRA
  lora_name = "",
  loras,
  lora_strengths,
  base_lora_strict,

  // ✅ NEW explicit HIGH/LOW split for node 470/471
  user_high_loras,
  user_high_strengths,
  user_low_loras,
  user_low_strengths,

  // Optional overrides (omit/undefined to let workflow/RuntimeKnobs decide)
  fps,                 // number | undefined
  duration,            // number (seconds) | undefined
  steps,               // number | undefined
  cfg,                 // number | undefined
  start_latent_strength, // number | undefined
  end_latent_strength,   // number | undefined
  noise_aug_strength,    // number | undefined
  crf,                 // number | undefined (optional: expose in UI if you want)
} = {}) {
  if (!token) throw new Error("Missing Firebase auth token.");
  if (!imageFile) throw new Error("No image file provided.");
  if (!prompt || !prompt.trim()) throw new Error("Prompt is required.");

  const root = (baseUrl || "").replace(/\/+$/, "");
  const url = `${root}/videoapi/generate-video`;

  // Helpers
  const isSetNum = (v) => v !== undefined && v !== null && `${v}`.trim() !== "";
  const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v))));
  const clampFloor = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v))));

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("prompt", prompt);
  formData.append("negative_prompt", negative_prompt);

  // Timing/knobs — ONLY send if user actually set them
  if (isSetNum(fps))       formData.append("fps", String(clampInt(fps, 1, 60)));
  if (isSetNum(duration))  formData.append("duration", String(clampFloor(duration, 1, 30))); // seconds
  if (isSetNum(steps))     formData.append("steps", String(Math.max(1, Math.round(Number(steps)))));
  if (isSetNum(cfg))       formData.append("cfg", String(Number(cfg)));
  if (isSetNum(start_latent_strength)) formData.append("start_latent_strength", String(Number(start_latent_strength)));
  if (isSetNum(end_latent_strength))   formData.append("end_latent_strength",   String(Number(end_latent_strength)));
  if (isSetNum(noise_aug_strength))    formData.append("noise_aug_strength",    String(Number(noise_aug_strength)));
  if (isSetNum(crf))       formData.append("crf", String(Math.max(0, Math.round(Number(crf)))));

  // Legacy LoRA params (kept for backward compatibility)
  if (lora_name) formData.append("lora_name", lora_name);
  if (Array.isArray(loras)) {
    for (const n of loras) if (n && `${n}`.trim()) formData.append("loras", n);
  }
  if (Array.isArray(lora_strengths)) {
    for (const s of lora_strengths) {
      const v = Number(s);
      if (Number.isFinite(v)) formData.append("lora_strengths", String(v));
    }
  }
  if (typeof base_lora_strict === "boolean") {
    formData.append("base_lora_strict", String(base_lora_strict));
  }

  // ✅ Explicit HIGH/LOW arrays (append each item separately)
  if (Array.isArray(user_high_loras)) {
    for (const n of user_high_loras) if (n && `${n}`.trim()) formData.append("user_high_loras", n);
  }
  if (Array.isArray(user_high_strengths)) {
    for (const s of user_high_strengths) {
      const v = Number(s);
      if (Number.isFinite(v)) formData.append("user_high_strengths", String(v));
    }
  }
  if (Array.isArray(user_low_loras)) {
    for (const n of user_low_loras) if (n && `${n}`.trim()) formData.append("user_low_loras", n);
  }
  if (Array.isArray(user_low_strengths)) {
    for (const s of user_low_strengths) {
      const v = Number(s);
      if (Number.isFinite(v)) formData.append("user_low_strengths", String(v));
    }
  }

  // --- Request ---
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }, // Don't set Content-Type with FormData
      body: formData,
    });
  } catch (err) {
    console.error("[API] ❌ Network error when submitting I2V job:", err);
    throw new Error("Network error — unable to contact server.");
  }

  // --- Parse / validate ---
  let data;
  try {
    const text = await response.text();
    if (!text) throw new Error("Empty response from server.");
    data = JSON.parse(text);
  } catch (e) {
    console.error("[API] ❌ Failed to parse JSON from backend:", e);
    throw new Error("Server returned invalid or empty JSON. Try again later.");
  }

  if (!response.ok) {
    console.error("[API] ❌ Backend error response (I2V):", data);
    throw new Error(data?.detail || `Failed to generate video (HTTP ${response.status})`);
  }

  if (!data?.job_id || data?.timeout == null) {
    console.warn("[API] ⚠️ I2V response missing job_id or timeout:", data);
    throw new Error(
      `Invalid job response. job_id: ${data?.job_id}, timeout: ${data?.timeout}, detail: ${data?.detail || "n/a"}`
    );
  }

  const timeoutSec = Number(data.timeout);
  const etaSec = data?.eta_seconds != null ? Number(data.eta_seconds) : null;

  return {
    job_id: String(data.job_id),
    timeoutMs: Number.isFinite(timeoutSec) ? timeoutSec * 1000 : undefined,
    serverEtaSec: Number.isFinite(etaSec) ? etaSec : undefined,
    queue_position: Number.isFinite(+data.queue_position) ? +data.queue_position : undefined,
    queue_length: Number.isFinite(+data.queue_length) ? +data.queue_length : undefined,
    charged_credits: Number.isFinite(+data.charged_credits) ? +data.charged_credits : undefined,
    frames: Number.isFinite(+data.frames) ? +data.frames : undefined,
    raw: data,
  };
}



/**
 * Start a text-to-video job.
 * Returns normalized fields for your poller and UI.
 */
export async function generateTextVideo({
  prompt,
  lora_name = "",
  loras = [],       // e.g. ["style1.safetensors","style2.safetensors"]
  fps = 24,
  duration = 4,     // allow float; clamped below
  token,
  negative_prompt = "",
  baseUrl = "",
}) {
  if (!token) throw new Error("Missing Firebase auth token.");
  if (!prompt || !prompt.trim()) throw new Error("Prompt is required.");

  // Clamp like backend
  const fpsInt = Math.max(1, Math.min(60, Math.round(Number(fps) || 24)));
  const durationSec = Math.max(0.5, Math.min(30.0, Number(duration) || 4));

  // Prefer list; fallback to single name
  const chosen = Array.isArray(loras) && loras.length
    ? loras.slice(0, 3)
    : (lora_name ? [lora_name] : []);

  const root = (baseUrl || "").replace(/\/+$/, "");
  const url = `${root}/videoapi/generate-text-video`;

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("fps", String(fpsInt));
  formData.append("duration", String(durationSec));
  if (negative_prompt) formData.append("negative_prompt", negative_prompt);
  for (const name of chosen) {
    if (name && name.trim()) formData.append("loras", name.trim());
  }

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (err) {
    console.error("[API] ❌ Network error when submitting T2V job:", err);
    throw new Error("Network error — unable to contact server.");
  }

  let rawText;
  try {
    rawText = await response.text();
  } catch (err) {
    console.error("[API] ❌ Failed to read T2V server response:", err);
    throw new Error("Server responded with an unreadable payload.");
  }

  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    console.error("[API] ❌ Unexpected T2V payload (not JSON):", rawText);
    throw new Error("Server returned invalid JSON.");
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("Authentication expired. Please sign in again.");
    if (response.status === 403) throw new Error(data?.detail || "Not enough credits.");
    if (response.status === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    throw new Error(data?.detail || `Text-to-video failed (HTTP ${response.status})`);
  }

  if (!data || data.job_id == null || data.timeout == null) {
    console.error("[API] ❌ T2V response missing job_id or timeout:", data);
    throw new Error("Server response missing job_id or timeout.");
  }

  const requestId =
    (globalThis.crypto && globalThis.crypto.randomUUID)
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const timeoutSec = Number(data.timeout);
  const etaSec = data.eta_seconds != null ? Number(data.eta_seconds) : undefined;

  const result = {
    job_id: String(data.job_id),
    requestId,
    prompt,
    timeoutMs: Number.isFinite(timeoutSec) ? timeoutSec * 1000 : undefined,
    serverEtaSec: Number.isFinite(etaSec) ? etaSec : undefined,
    queue_position: Number.isFinite(+data.queue_position) ? +data.queue_position : undefined,
    queue_length: Number.isFinite(+data.queue_length) ? +data.queue_length : undefined,
    raw: data,
    startedAt: Date.now(),
  };

  console.log(
    `[API] T2V started: job_id=${result.job_id} requestId=${requestId} timeout=${timeoutSec}s qpos=${result.queue_position ?? "?"}/${result.queue_length ?? "?"} eta=${result.serverEtaSec ?? "?"}s`
  );

  return result;
}


/**
 * Poll a job until it finishes, fails, or times out.
 *
 * Usage:
 *   const { job_id, timeoutMs } = await generateTextVideo(...);
 *   const status = await pollJobStatus(job_id, {
 *     timeoutMs,
 *     baseUrl: "", // optional
 *     onUpdate: (snap) => setJobs(s => ({ ...s, [job_id]: { ...s[job_id], ...snap } })),
 *     signal,      // optional AbortSignal: new AbortController().signal
 *   });
 *
 * The critical part is that the caller stores state *under the job_id key* only.
 */

export async function pollJobStatus(job_id, {
  timeoutMs = 3 * 60 * 1000, // fallback 3 min
  baseUrl = "",
  onUpdate,                   // function(snapshot) {}
  signal,                     // optional AbortSignal
} = {}) {
  if (!job_id) throw new Error("pollJobStatus: job_id is required.");

  const started = Date.now();

  const sleep = (ms, signal) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      if (signal) {
        const onAbort = () => {
          clearTimeout(t);
          reject(new DOMException("Aborted", "AbortError"));
        };
        if (signal.aborted) {
          clearTimeout(t);
          return reject(new DOMException("Aborted", "AbortError"));
        }
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });

  const backoff = (attempt) => {
    // 0.5s → up to ~4s, with small jitter to avoid thundering herd
    const base = Math.min(4000, 500 + attempt * 250);
    const jitter = Math.floor(Math.random() * 150);
    return base + jitter;
  };

  let attempt = 0;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    let res, text, data;
    try {
      res = await fetch(`${baseUrl}/videoapi/job-status?id=${encodeURIComponent(job_id)}`, {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
        signal,
      });
    } catch (err) {
      // transient network hiccup—report and retry until timeout
      console.warn(`[T2V] ⚠️ Poll network error (attempt ${attempt}):`, err);
      if (onUpdate) onUpdate({ status: "poll_error", detail: "network_error", attempt });
      if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for video (network).");
      await sleep(backoff(attempt++), signal);
      continue;
    }

    try {
      text = await res.text();
    } catch (err) {
      console.warn("[T2V] ⚠️ Failed to read poll response:", err);
      if (onUpdate) onUpdate({ status: "poll_error", detail: "read_error" });
      if (Date.now() - started > timeoutMs) throw new Error("Timed out waiting for video (read).");
      await sleep(backoff(attempt++), signal);
      continue;
    }

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.warn("[T2V] ⚠️ Poll returned non-JSON:", text);
      data = {};
    }

    // Let the caller update per-attempt UI (queue position, ETA, etc.)
    if (onUpdate) onUpdate(data);

    // Normalize server status handling
    // Expect fields like: { status: 'queued'|'running'|'finished'|'failed'|'canceled', video_url?, detail? }
    if (!res.ok) {
      if (res.status === 404) {
        // Job not known yet or evicted briefly—treat as transient
        if (Date.now() - started > timeoutMs) throw new Error("Job not found and timeout exceeded.");
      } else if (res.status === 410) {
        throw new Error(data.detail || "Job expired.");
      } else {
        throw new Error(data.detail || `Status check failed (HTTP ${res.status}).`);
      }
    }

    const status = (data && data.status) || "unknown";

    if (status === "finished" && data.video_url) {
      return data; // <- resolved with final snapshot for *this* job_id only
    }

    if (status === "failed" || status === "canceled") {
      const why = data && (data.detail || data.error);
      throw new Error(why || `Job ${status}.`);
    }

    if (Date.now() - started > timeoutMs) {
      throw new Error("Timed out waiting for video.");
    }

    // Keep polling
    await sleep(backoff(attempt++), signal);
  }
}



export const fetchLoraTemplates = async () => {
  const tryFetch = async (url) => {
    const res = await fetch(url, { headers: { "Cache-Control": "no-store" } });
    const txt = await res.text();
    if (!res.ok) {
      console.error("✖ Lora templates HTTP", res.status, "raw:", txt.slice(0, 200));
      return null;
    }
    try { return JSON.parse(txt); } catch {
      console.error("✖ Lora templates non-JSON:", txt.slice(0, 200));
      return null;
    }
  };

  // 1) go through Next rewrite
  let data = await tryFetch("/videoapi/list-lora-templates");
  if (Array.isArray(data)) return data;

  // 2) optional fallback: direct origin (set in your .env as NEXT_PUBLIC_BACKEND_URL)
  const origin = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, "");
  if (origin) {
    data = await tryFetch(`${origin}/videoapi/list-lora-templates`);
    if (Array.isArray(data)) return data;
  }

  return [];
};


export const cancelComfyJob = async (client_id, token) => {
  const res = await fetch("/videoapi/cancel-job", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data?.detail || "Failed to cancel job.");
  }
};


export async function checkVideoStatus(jobId, token, signal) {
  let response;
  try {
    response = await fetch(`/videoapi/job-status?id=${encodeURIComponent(jobId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Network error while checking video status.");
  }

  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {
    throw new Error("Invalid JSON response from server.");
  }

  if (!response.ok) {
    throw new Error(data?.detail || `Job status error (status ${response.status})`);
  }

  return data;
}
