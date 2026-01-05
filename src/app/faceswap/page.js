// app/faceswap/page.js  (or components/Faceswap.js)
"use client";

import Link from "next/link";

export default function Faceswap() {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
          <span className="text-xl">🧑‍🦱↔️🧑</span>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">
          Face Swap (Coming Soon)
        </h1>

        {/* Description */}
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-zinc-400">
          Face Swap is currently under construction.  
          We’re building identity-safe face replacement with high-fidelity
          motion, lighting, and expression matching.
        </p>

        {/* Status badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Under construction
        </div>

        {/* Back action */}
        <div>
          <Link
            href="/studio/text-to-video"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            ← Back to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
