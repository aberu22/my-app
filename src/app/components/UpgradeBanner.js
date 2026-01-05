'use client';

import { memo, useCallback } from 'react';
import Link from 'next/link';

export const UpgradeBanner = memo(function UpgradeBanner({ show, onUpgrade, onLater }) {
  if (!show) return null;

  const handleUpgrade = useCallback(
    (e) => {
      if (onUpgrade) {
        // If parent wants to intercept upgrade (e.g., open modal or track), prevent nav
        e.preventDefault();
        onUpgrade();
      }
    },
    [onUpgrade]
  );

  return (
    <div
      className="mb-8 p-5 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 shadow-[0_0_30px_rgba(139,92,246,0.2)] backdrop-blur-lg"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-500/15 to-blue-500/15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2v4" />
            <path d="m16 6 3-3" />
            <path d="M18 12h4" />
            <path d="m16 18 3 3" />
            <path d="M12 20v-4" />
            <path d="m8 18-3 3" />
            <path d="M6 12H2" />
            <path d="m8 6-3-3" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </div>

        <div>
          <h3 className="font-medium text-white text-lg tracking-tight mb-1">
            Upgrade for more credits
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            You’ve used all your credits. Upgrade to continue generating.
          </p>

          <div className="flex gap-3 mt-4">
            <Link
              href="/pricing"
              onClick={handleUpgrade}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg shadow-purple-500/20 hover:opacity-90"
            >
              Upgrade Now
            </Link>

            <button
              type="button"
              onClick={onLater}
              className="px-5 py-2.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/50 border border-zinc-700/50 text-white font-medium"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
