"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const COLOR = {
  green: {
    border: "border-green-500",
    price: "text-green-400",
    btn: "bg-green-500 hover:bg-green-600 text-black",
  },
  yellow: {
    border: "border-yellow-500",
    price: "text-yellow-400",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-black",
  },
  purple: {
    border: "border-purple-500",
    price: "text-purple-400",
    btn: "bg-purple-500 hover:bg-purple-600 text-white",
  },
};

export default function BuyCredits() {
  const [loadingPack, setLoadingPack] = useState(null); // "500" | "1000" | "2000" | null
  const [credits, setCredits] = useState(0);

  // Gentle redirect when returning from success page
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.href.includes("/success")) {
      setTimeout(() => window.location.replace("/pricing"), 3000);
    }
  }, []);

  // Fetch current credits on auth change
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const res = await fetch(`/api/user-plan?uid=${user.uid}`);
        const data = await res.json();
        setCredits(Number(data?.credits ?? 0));
      } catch {
        // ignore fetch errors here
      }
    });
    return () => unsub();
  }, []);

  async function handleBuyCredits(packType /* "500" | "1000" | "2000" */) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to buy credits.");
      return;
    }
    setLoadingPack(String(packType));

    try {
      const res = await fetch("/api/buy-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key":
            globalThis.crypto?.randomUUID?.() || `${user.uid}-${packType}-${Date.now()}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          packType: String(packType), // ensure string
        }),
      });

      // Prefer JSON; fall back to text (e.g., if an HTML 500 page returns)
      let data = null;
      let rawText = null;
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        data = await res.json();
      } else {
        rawText = await res.text();
      }

      if (!res.ok) {
        console.error("❌ /api/buy-credits error", {
          status: res.status,
          statusText: res.statusText,
          json: data,
          text: rawText,
        });
        alert(
          (data && data.error) ||
            rawText ||
            `Unable to start checkout (HTTP ${res.status}). Check server logs for details.`
        );
        return;
      }

      // Server can return a URL (simplest)
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Or a sessionId if you want to use stripe-js redirect
      if (data?.sessionId) {
        const stripe = await stripePromise;
        if (!stripe) {
          alert("Stripe.js failed to load.");
          return;
        }
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          console.error("Stripe redirect error:", error.message);
          alert(error.message || "Redirect failed.");
        }
        return;
      }

      console.warn("Unexpected /api/buy-credits response:", { data, rawText });
      alert("Unexpected server response. Check console.");
    } catch (err) {
      console.error("🚨 Buy Credits client exception:", err);
      alert(err?.message || "Unexpected error starting checkout.");
    } finally {
      setLoadingPack(null);
    }
  }

  const creditPacks = [
    { amount: 500, price: "$5.00", color: "green" },
    { amount: 1000, price: "$8.00", color: "yellow" },
    { amount: 2000, price: "$15.00", color: "purple" },
  ];

  return (
    <div className="w-full max-w-4xl">
      {/* Banner with current credits */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
        Current credits: <span className="font-semibold">{credits}</span>
        {credits > 0 && (
          <span className="ml-2 text-xs text-zinc-400">
            (Purchases are disabled until you use existing credits.)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {creditPacks.map((pack) => {
          const styles = COLOR[pack.color];
          const disabled = loadingPack === String(pack.amount) || credits > 0;

          return (
            <div
              key={pack.amount}
              className={`p-6 rounded-2xl border bg-zinc-900/60 text-center ${styles.border} ${
                disabled ? "opacity-90" : ""
              }`}
            >
              <h3 className="text-2xl font-bold text-white">{pack.amount} Credits</h3>
              <p className={`mt-1 text-lg ${styles.price}`}>{pack.price}</p>

              <ul className="mt-4 text-sm text-zinc-400 space-y-2">
                <li>✅ One-time purchase</li>
                <li>✅ No subscription required</li>
                <li>✅ Instant access to generations</li>
              </ul>

              <button
                onClick={() => handleBuyCredits(String(pack.amount))}
                disabled={disabled}
                className={`mt-4 w-full py-2 rounded-lg font-semibold transition ${
                  disabled ? "bg-zinc-800 text-white cursor-not-allowed" : styles.btn
                }`}
              >
                {credits > 0
                  ? "Use your credits first"
                  : loadingPack === String(pack.amount)
                  ? "Starting checkout…"
                  : `Buy ${pack.amount} Credits`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
