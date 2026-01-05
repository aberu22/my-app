// app/trash/page.js
"use client";

import Link from "next/link";

export default function TrashPage() {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-50">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
          <span className="text-xl">🗑️</span>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-semibold tracking-tight">
          Trash (Coming Soon)
        </h1>

        {/* Description */}
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-zinc-400">
          Deleted videos will appear here. We’re currently building restore and
          permanent delete controls to give you full control over your content.
        </p>

        {/* Status badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Under construction
        </div>

        {/* Back link */}
        <div>
          <Link
            href="/studio/text-to-video"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition"
          >
            ← Back to Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
