import axios from "axios";
import { enrichWithThumbnailsAndActivation } from "./loader";

const apiBaseUrl = "/api"; // proxy to backend

//
// ────────────────────────────────────────────────────────────────────────────────
//  IMAGE / MODEL / UPSCALER ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────────
//

export const fetchModels = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/sd-models`);
    return await enrichWithThumbnailsAndActivation(response.data, "model");
  } catch (error) {
    console.error("🚨 Error fetching models:", error);
    return [];
  }
};

export const fetchLoras = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/loras`);
    return await enrichWithThumbnailsAndActivation(response.data, "lora");
  } catch (error) {
    console.error("🚨 Error fetching LoRAs:", error);
    return [];
  }
};

export const fetchSamplers = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/samplers`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("🚨 Error fetching samplers:", error);
    return [];
  }
};

export const fetchUpscalers = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/upscalers`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("🚨 Error fetching upscalers:", error);
    return [];
  }
};

export const fetchLatentUpscaleModes = async () => {
  try {
    const res = await axios.get(`${apiBaseUrl}/latent-upscale-modes`);
    return res.data;
  } catch (error) {
    console.error("🚨 Error fetching latent upscale modes:", error);
    return [];
  }
};

export const setOptions = async (options) => {
  try {
    const res = await axios.post(`${apiBaseUrl}/options`, options);
    return res.data;
  } catch (err) {
    console.error("🚨 Failed to set options:", err?.response?.data || err);
    throw err;
  }
};

//
// ────────────────────────────────────────────────────────────────────────────────
//  TXT2IMG
// ────────────────────────────────────────────────────────────────────────────────
//

export const generateImage = async (payload) => {
  try {
    const res = await axios.post(`${apiBaseUrl}/txt2img`, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (!Array.isArray(res.data.images)) {
      throw new Error("No images returned.");
    }

    return res.data;
  } catch (error) {
    console.error("🚨 txt2img failed:", error?.response?.data || error);
    throw error;
  }
};

//
// ────────────────────────────────────────────────────────────────────────────────
//  I2V — Image → Video
// ────────────────────────────────────────────────────────────────────────────────
//

export async function generateVideo({
  imageFile,
  prompt,
  negative_prompt = "",
  token,

  fps,
  duration,

  steps,
  cfg,
  start_latent_strength,
  end_latent_strength,
  noise_aug_strength,
  crf,

  // Explicit HIGH/LOW LoRA
  user_high_loras = [],
  user_high_strengths = [],
  user_low_loras = [],
  user_low_strengths = [],
}) {
  if (!token) throw new Error("Missing auth token");
  if (!imageFile) throw new Error("Missing image file");
  if (!prompt?.trim()) throw new Error("Prompt required");

  const form = new FormData();
  form.append("image", imageFile);
  form.append("prompt", prompt);
  form.append("negative_prompt", negative_prompt);

  // Optional values — send only when defined
  const add = (k, v) => v !== undefined && v !== null && form.append(k, String(v));

  add("fps", fps);
  add("duration", duration);
  add("steps", steps);
  add("cfg", cfg);
  add("start_latent_strength", start_latent_strength);
  add("end_latent_strength", end_latent_strength);
  add("noise_aug_strength", noise_aug_strength);
  add("crf", crf);

  // HIGH/LOW LoRA arrays
  user_high_loras.forEach((x) => form.append("user_high_loras", x));
  user_high_strengths.forEach((x) => form.append("user_high_strengths", x));
  user_low_loras.forEach((x) => form.append("user_low_loras", x));
  user_low_strengths.forEach((x) => form.append("user_low_strengths", x));

  const res = await fetch("/videoapi/generate-video", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.detail || "Failed to start I2V job");
  }

  if (!json?.job_id) throw new Error("Invalid response: missing job_id");

  return json; // { job_id, timeout, queue_position, ... }
}

//
// ────────────────────────────────────────────────────────────────────────────────
//  T2V — Text → Video
// ────────────────────────────────────────────────────────────────────────────────
//

export async function generateTextVideo({
  prompt,
  negative_prompt = "",
  loras = [],
  fps = 24,
  duration = 4,

  token,
}) {
  if (!token) throw new Error("Missing auth token");
  if (!prompt?.trim()) throw new Error("Prompt required");

  const form = new FormData();
  form.append("prompt", prompt);
  form.append("negative_prompt", negative_prompt);
  form.append("fps", fps);
  form.append("duration", duration);

  loras.forEach((x) => form.append("loras", x));

  const res = await fetch("/videoapi/generate-text-video", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.detail || "Failed to start T2V job");
  }

  if (!json?.job_id) throw new Error("Invalid response: missing job_id");

  return json; // { job_id, timeout, etc }
}

//
// ────────────────────────────────────────────────────────────────────────────────
//  JOB STATUS (legacy — used only for debugging)
// ────────────────────────────────────────────────────────────────────────────────
//

export async function checkVideoStatus(jobId, token) {
  const res = await fetch(`/videoapi/job-status?id=${jobId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail || "Status error");

  return data;
}

//
// ────────────────────────────────────────────────────────────────────────────────
//  CANCEL JOB — FIXED (uses job_id, not client_id)
// ────────────────────────────────────────────────────────────────────────────────
//

export async function cancelComfyJob(jobId, token) {
  const res = await fetch(`/api/cancel-job/${jobId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  // 🟢 These are NOT real errors
  if (!res.ok) {
    const msg =
      data?.detail ||
      data?.error ||
      "";

    if (
      msg.includes("Job not found") ||
      msg.includes("already completed") ||
      msg.includes("already cancelled")
    ) {
      return { status: "cancelled" }; // 👈 treat as success
    }

    throw new Error(msg || "Failed to cancel job");
  }

  return data;
}


//
// ────────────────────────────────────────────────────────────────────────────────
//  LORA TEMPLATES
// ────────────────────────────────────────────────────────────────────────────────
//

export const fetchLoraTemplates = async (catalog = "nsfw") => {
  const tryFetch = async (url) => {
    try {
      const res = await fetch(url, { headers: { "Cache-Control": "no-store" } });
      const txt = await res.text();
      return res.ok ? JSON.parse(txt) : null;
    } catch {
      return null;
    }
  };

  const q = `?catalog=${encodeURIComponent(catalog)}`;

  let data = await tryFetch(`/videoapi/list-lora-templates${q}`);
  if (Array.isArray(data)) return data;

  const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/+$/, "");
  if (origin) {
    data = await tryFetch(`${origin}/videoapi/list-lora-templates${q}`);
    if (Array.isArray(data)) return data;
  }

  return [];
};

// wan26 end point //


//** */ ✅ Wan 2.6 Text-to-Video ****
// ✅ Seedance 1.5 Pro (Audio ON)
// ✅ Seedance 1.5 Pro (Text → Video, Audio ON)






