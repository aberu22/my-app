/**
 * Centralized credit pricing table
 * DO NOT compute credits anywhere else.
 */

/* =========================================================
   Seedance 1.5 Pro Pricing
   (adjust easily later)
========================================================= */

export const SEEDANCE_PRICING = {
  "480p": {
    "4": 40,
    "8": 80,
    "12": 120,
  },
  "720p": {
    "4": 80,
    "8": 160,
    "12": 240,
  },
};

/**
 * Calculate Seedance credit cost
 */
export function getSeedanceCreditCost({
  duration,
  resolution = "720p",
}) {
  const d = String(duration);
  const r = resolution;

  const price = SEEDANCE_PRICING?.[r]?.[d];

  if (!price) {
    throw new Error(
      `Invalid Seedance pricing: ${resolution} / ${duration}s`
    );
  }

  return price;
}

/* =========================================================
   Wan 2.6 Pricing (your provided numbers)
========================================================= */

export const WAN26_PRICING = {
  "720p": {
    "5": 70,
    "10": 140,
    "15": 210,
  },
  "1080p": {
    "5": 105,
    "10": 210,
    "15": 315,
  },
};

/**
 * Calculate Wan 2.6 credit cost
 */
export function getWan26CreditCost({
  duration,
  resolution = "720p",
}) {
  const d = String(duration);
  const r = resolution;

  const price = WAN26_PRICING?.[r]?.[d];

  if (!price) {
    throw new Error(
      `Invalid Wan 2.6 pricing: ${resolution} / ${duration}s`
    );
  }

  return price;
}

/* =========================================================
   Generic helper (future-proof)
========================================================= */

export function getVideoCreditCost({
  model,
  duration,
  resolution,
}) {
  switch (model) {
    case "seedance":
      return getSeedanceCreditCost({ duration, resolution });

    case "wan-2.6":
      return getWan26CreditCost({ duration, resolution });

    default:
      throw new Error(`Unknown model for pricing: ${model}`);
  }
}
