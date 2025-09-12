"use client";

import { useRouter } from "next/navigation";

const UpgradePopup = ({ onClose }) => {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-extrabold text-white mb-2">⚠ Out of Credits</h2>
        <p className="text-zinc-400 text-sm mb-6">
          You’ve used all your generation credits. Upgrade your plan to continue creating stunning images.
        </p>

        <button
          onClick={() => router.push("/pricing")}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 transition text-white font-semibold shadow-[0_0_20px_rgba(139,92,246,0.5)]"
        >
          View Plans
        </button>

        <button
          onClick={onClose}
          className="mt-4 text-sm text-zinc-400 hover:text-white transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UpgradePopup;
