// src/lib/frontendCreditCosts.js

export function getVideoCreditCost({
  model,
  duration,
  resolution,
}) {
  // ---- WAN 2.6 ----
  if (model === "wan-2.6") {
    const d = String(duration);
    if (resolution === "720p") {
      if (d === "5") return 70;
      if (d === "10") return 140;
      if (d === "15") return 210;
    }
    if (resolution === "1080p") {
      if (d === "5") return 105;
      if (d === "10") return 210;
      if (d === "15") return 315;
    }
  }

  // ---- SEEDANCE ----
  if (model === "seedance") {
    const d = String(duration);
    const r = String(resolution);

    const SEEDANCE_COSTS = {
      "480p": { "4": 40, "8": 80, "12": 120 },
      "720p": { "4": 80, "8": 160, "12": 240 },
    };

    return SEEDANCE_COSTS?.[r]?.[d] ?? 0;
  }

  // ---- WAN 2.2 ----
  if (model === "wan-2.2") {
    return 110; // placeholder
  }

  return 0;
}
