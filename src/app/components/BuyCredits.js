"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function BuyCredits() {
  const [loadingPack, setLoadingPack] = useState(null);
  const [credits, setCredits] = useState(0);

  /* ---------------------------------------------
     Redirect back after Stripe success
  --------------------------------------------- */
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.href.includes("/success")) {
      setTimeout(() => window.location.replace("/pricing"), 2000);
    }
  }, []);

  /* ---------------------------------------------
     Fetch current user credits
  --------------------------------------------- */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      try {
        const res = await fetch(`/api/user-plan?uid=${user.uid}`);
        const data = await res.json();
        setCredits(Number(data?.credits ?? 0));
      } catch {
        // silent
      }
    });
    return () => unsub();
  }, []);

  /* ---------------------------------------------
     Stripe checkout handler
  --------------------------------------------- */
  async function handleBuyCredits(packAmount) {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to buy credits.");
      return;
    }

    setLoadingPack(packAmount);

    try {
      const res = await fetch("/api/buy-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key":
            globalThis.crypto?.randomUUID?.() ||
            `${user.uid}-${packAmount}-${Date.now()}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          packType: String(packAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      if (data?.sessionId) {
        const stripe = await stripePromise;
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (err) {
      console.error("Buy credits error:", err);
      alert(err.message || "Unexpected error.");
    } finally {
      setLoadingPack(null);
    }
  }

  /* ---------------------------------------------
     STRIPE-SAFE CREDIT PACKS
  --------------------------------------------- */
  const packs = [
    {
      amount: 500,
      price: "$9",
      label: "Starter Pack",
      description: "Good for testing & 1 cinematic video",
    },
    {
      amount: 1000,
      price: "$18",
      label: "Creator Pack",
      description: "Best for short projects",
      highlight: true,
    },
    {
      amount: 2000,
      price: "$35",
      label: "Studio Pack",
      description: "Maximum flexibility without a subscription",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Credits banner */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
        Current credits:{" "}
        <span className="text-white font-medium">{credits}</span>
        {credits > 0 && (
          <span className="ml-2 text-zinc-500">
            · You can top up anytime if you need more credits
          </span>
        )}
      </div>

      {/* Explanation */}
      <p className="mb-6 text-center text-xs text-zinc-400 max-w-xl mx-auto">
        Credit packs are best for one-off projects or extra renders.
        <br />
        <span className="text-zinc-500">
          Subscriptions offer the lowest cost per video.
        </span>
      </p>

      {/* Credit packs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {packs.map((pack) => {
          const disabled = loadingPack === pack.amount; // ✅ ONLY disable while redirecting

          return (
            <div
              key={pack.amount}
              className={`relative rounded-xl border p-6 flex flex-col bg-zinc-950 ${
                pack.highlight ? "border-white" : "border-zinc-800"
              }`}
            >
              {pack.highlight && (
                <span className="absolute -top-3 right-4 text-[10px] px-2 py-0.5 rounded-full bg-white text-black">
                  Most Popular
                </span>
              )}

              <h3 className="text-sm font-medium text-white">{pack.label}</h3>
              <p className="mt-1 text-xs text-zinc-400">{pack.amount} credits</p>

              <p className="mt-4 text-2xl font-semibold text-white">{pack.price}</p>
              <p className="mt-1 text-xs text-zinc-500">{pack.description}</p>

              <ul className="mt-4 text-xs text-zinc-400 space-y-2">
                <li>Instant access</li>
                <li>No subscription required</li>
                <li>Credits never expire</li>
                <li>Higher per-credit cost than plans</li>
              </ul>

              <button
                onClick={() => handleBuyCredits(pack.amount)}
                disabled={disabled}
                className="mt-auto pt-6"
              >
                <div
                  className={`w-full py-2 rounded-md text-xs font-medium transition text-center ${
                    disabled
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {loadingPack === pack.amount ? "Redirecting…" : "Buy credits"}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-10 text-center text-xs text-zinc-500 max-w-xl mx-auto">
        One-time purchases. No renewals.  
        For the best value per video, upgrade to a subscription.
      </p>
    </div>
  );
}
