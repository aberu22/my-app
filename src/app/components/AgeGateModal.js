"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AgeGateModal({ onConfirm }) {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Age verification"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-zinc-800">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-purple-400" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Adults Only (18+)</h2>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed">
          You must be <span className="font-semibold text-white">18 years or older</span> to use this website.
          By clicking <span className="font-semibold">I am 18+</span>, you confirm that you are of legal age and agree to our{" "}
          <a href="/terms" className="underline decoration-dotted hover:opacity-90">Terms</a> and{" "}
          <a href="/privacy" className="underline decoration-dotted hover:opacity-90">Privacy Policy</a>.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition"
          >
            I am 18+
          </button>

          <a
            href="https://www.google.com"
            className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-center hover:bg-zinc-800 transition"
          >
            I am under 18
          </a>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          We use localStorage/cookies to remember your choice. This is not legal advice; requirements can vary by region.
        </p>
      </motion.div>
    </div>
  );
}
