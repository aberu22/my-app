"use client";

import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { usePlanStatus } from "@/app/hooks/usePlanStatus";
import BuyCredits from "./BuyCredits";
import toast from "react-hot-toast";


const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("subscriptions");

  const { user, plan: currentPlan, stripeSubscriptionId } = usePlanStatus();

  /* ---------------------------------------------
     Stripe price IDs (PUBLIC, client-safe)
  --------------------------------------------- */
  const PLAN_PRICE_IDS = useMemo(
    () => ({
      creator: process.env.NEXT_PUBLIC_STRIPE_SUB_CREATOR,
      visionary: process.env.NEXT_PUBLIC_STRIPE_SUB_VISIONARY,
      pro: process.env.NEXT_PUBLIC_STRIPE_SUB_PRO,
    }),
    []
  );

  const normalize = (p) => String(p || "").toLowerCase();
  const isCurrentPlan = (p) => normalize(currentPlan) === normalize(p);

  /* ---------------------------------------------
     Guard: require login
  --------------------------------------------- */
  const requireAuth = () => {
    if (!user?.uid) {
      toast("Please log in to continue.");
      return false;
    }
    return true;
  };

  /* ---------------------------------------------
     Subscribe / Upgrade handler
  --------------------------------------------- */
 async function handleSubscribe(planKey) {
  const plan = normalize(planKey);
  if (loadingPlan) return;
  if (!requireAuth()) return;

  // Explorer (free) has no Stripe action
  if (plan === "free") return;

  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    alert("Pricing configuration error. Please contact support.");
    return;
  }

  setLoadingPlan(plan);

  try {
    // 1️⃣ ALWAYS try checkout first (Stripe = source of truth)
    const checkoutRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        email: user.email,
        userId: user.uid,
      }),
    });

    // 2️⃣ Stripe says subscription already exists → upgrade/downgrade
    if (checkoutRes.status === 409) {
      const upgradeRes = await fetch("/api/change-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          newPriceId: priceId,
        }),
      });

      const upgradeData = await upgradeRes.json();
      if (!upgradeRes.ok) {
        throw new Error(upgradeData?.error || "Plan change failed");
      }

      toast.success(
      upgradeData.direction === "upgrade"
    ? "Plan upgraded successfully 🎉"
    : "Downgrade scheduled for next billing cycle ✅"
      );

      return;
    }

    // 3️⃣ Normal checkout success
    const data = await checkoutRes.json();
    if (!checkoutRes.ok) {
      throw new Error(data?.error || "Checkout failed");
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    if (data?.sessionId) {
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
      return;
    }

    throw new Error("Checkout session created but no redirect info.");
  } catch (err) {
    console.error(err);
    toast.error(err.message || "Something went wrong.");
  } finally {
    setLoadingPlan(null);
  }
}


  /* ---------------------------------------------
     Reusable button
  --------------------------------------------- */
  const ActionButton = ({ plan, label, highlight }) => {
    if (isCurrentPlan(plan)) {
      return (
        <button className="w-full mt-6 py-2 rounded-md bg-zinc-800 text-zinc-400 text-xs cursor-default">
          Current Plan
        </button>
      );
    }

    return (
      <button
        onClick={() => handleSubscribe(plan)}
        disabled={loadingPlan !== null}
        className={`w-full mt-6 py-2 rounded-md text-xs font-medium transition disabled:opacity-60 ${
          highlight
            ? "bg-white text-black hover:bg-zinc-200"
            : "bg-zinc-100 text-black hover:bg-white"
        }`}
      >
        {loadingPlan === plan ? "Processing…" : label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 px-6 py-20">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <h1 className="text-3xl font-semibold text-white">
          FantasyVisionAI Pricing
        </h1>
        <p className="mt-3 text-sm text-zinc-400 max-w-2xl mx-auto">
          Cinematic AI image & video generation powered by premium models.
          Start free. Upgrade when you’re ready.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Switch plans anytime — you’ll never be charged twice.
        </p>
      </div>

      {/* TABS */}
      <div className="flex justify-center mb-12">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-full p-1">
          {["subscriptions", "credits"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs transition ${
                activeTab === tab
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab === "subscriptions" ? "Subscriptions" : "Buy Credits"}
            </button>
          ))}
        </div>
      </div>

      {/* SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Explorer */}
          <div className="rounded-xl p-6 bg-zinc-950 border border-zinc-800 flex flex-col">
            <h3 className="text-lg font-medium text-white">Explorer</h3>
            <p className="text-sm text-zinc-400 mt-1">$0 / month</p>

            <ul className="mt-6 text-xs text-zinc-400 space-y-2">
              <li><strong className="text-white">50 free credits</strong></li>
              <li>High-quality image generation</li>
              <li>Basic tools & community workflows</li>
              <li className="text-zinc-500">No premium video models</li>
            </ul>

            <div className="mt-auto">
              <ActionButton plan="free" label="Stay on Explorer" />
            </div>
          </div>

          {/* Creator */}
          <div className="rounded-xl p-6 bg-zinc-950 border border-zinc-800 flex flex-col">
            <h3 className="text-lg font-medium text-white">Creator</h3>
            <p className="text-sm text-zinc-400 mt-1">$12 / month</p>

            <ul className="mt-6 text-xs text-zinc-400 space-y-2">
              <li><strong className="text-white">800 credits / month</strong></li>
              <li>Perfect for experimenting & casual creation</li>
              <li>Images + occasional video</li>
              <li className="text-zinc-500">~3–6 short videos / month</li>
            </ul>

            <ActionButton plan="creator" label="Upgrade to Creator" />
          </div>

          {/* Visionary */}
          <div className="relative rounded-xl p-6 bg-zinc-950 border border-zinc-700 flex flex-col">
            <span className="absolute -top-3 right-4 text-[10px] px-2 py-0.5 rounded-full bg-white text-black">
              Recommended
            </span>

            <h3 className="text-lg font-medium text-white">Visionary</h3>
            <p className="text-sm text-zinc-400 mt-1">$29 / month</p>

            <ul className="mt-6 text-xs text-zinc-400 space-y-2">
              <li><strong className="text-white">3,000 credits / month</strong></li>
              <li>Best for frequent video creators</li>
              <li>Premium models: Seedance + Wan</li>
              <li className="text-zinc-500">~10–20 videos / month</li>
            </ul>

            <ActionButton
              plan="visionary"
              label="Become a Visionary"
              highlight
            />
          </div>

          {/* Pro */}
          <div className="rounded-xl p-6 bg-zinc-950 border border-zinc-700 flex flex-col">
            <h3 className="text-lg font-medium text-white">Pro</h3>
            <p className="text-sm text-zinc-400 mt-1">$59 / month</p>

            <ul className="mt-6 text-xs text-zinc-400 space-y-2">
              <li><strong className="text-white">8,000 credits / month</strong></li>
              <li>For power users & agencies</li>
              <li>Best value per credit</li>
              <li className="text-zinc-500">~30–50 videos / month</li>
            </ul>

            <ActionButton plan="pro" label="Go Pro" />
          </div>
        </div>
      )}

      {/* BUY CREDITS */}
      {activeTab === "credits" && (
        <div className="max-w-4xl mx-auto">
          <BuyCredits />
        </div>
      )}

      {/* FOOTER TRUST */}
      <div className="mt-16 text-center text-xs text-zinc-500 max-w-xl mx-auto">
        Subscriptions renew automatically. Cancel anytime.
        <br />
        Plan changes apply instantly — no double charges, ever.
      </div>
    </div>
  );
}
