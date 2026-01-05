"use client";

import { useState, useEffect } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext";

export default function UpgradeButton() {
  const { userId } = useImageGeneration();
  const [loading, setLoading] = useState(false);

  // Replace with real Stripe price id
  const priceId = "price_123";

  useEffect(() => {
    console.log("🔍 UpgradeButton userId:", userId);
  }, [userId]);

  const handleUpgrade = async () => {
    if (!userId || !priceId) {
      alert("Missing user or pricing info.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, userId }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || "Checkout failed");
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      alert(err.message || "Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className={`
          group relative overflow-hidden
          rounded-full px-5 py-2.5 text-[12px] font-semibold tracking-wide
          backdrop-blur-xl
          ring-1 ring-white/10
          shadow-[0_10px_30px_-10px_rgba(0,0,0,.8)]
          transition-all duration-200
          ${
            loading
              ? "bg-white/5 text-zinc-400 cursor-not-allowed"
              : "bg-gradient-to-br from-purple-500/80 to-blue-500/80 text-white hover:from-purple-400 hover:to-blue-400"
          }
        `}
      >
        {/* glow */}
        {!loading && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/40 to-blue-500/40 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        <span className="relative z-10 flex items-center gap-2">
          {loading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
              Processing…
            </>
          ) : (
            <>
              ⚡ Upgrade
              <span className="text-[10px] text-white/70">Pro</span>
            </>
          )}
        </span>
      </button>
    </div>
  );
}
