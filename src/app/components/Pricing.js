"use client";

import { useState } from "react";
import { usePlanStatus } from "@/app/hooks/usePlanStatus";
import { loadStripe } from "@stripe/stripe-js";
import BuyCredits from "./BuyCredits";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState("subscriptions");

  const { user, plan: currentPlan, priceId, stripeSubscriptionId } = usePlanStatus();

  const handleSubscribe = async (plan) => {
    if (loadingPlan || !user) return;
    setLoadingPlan(plan);

    try {
      const planPriceMap = {
        basic: "price_1RCB4bGbLZ3kl4Qnbd6PlZeX",
        plus: "price_1RCBBoGbLZ3kl4Qnywms6TCs",
      };

      const newPriceId = planPriceMap[plan];
      if (!newPriceId) throw new Error("Invalid plan selected");

      if (stripeSubscriptionId) {
        // Already subscribed → Upgrade
        const upgradeRes = await fetch("/api/change-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, newPriceId }),
        });

        if (!upgradeRes.ok) {
          const err = await upgradeRes.json();
          throw new Error(err.error || "Subscription upgrade failed.");
        }

        alert("✅ Your subscription was updated successfully.");
      } else {
        // First time subscription → Checkout
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, email: user.email, userId: user.uid }),
        });

        const { sessionId } = await checkoutRes.json();
        if (!sessionId) throw new Error("Stripe session could not be created.");

        const stripe = await stripePromise;
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("🚨 Subscription Error:", error.message);
      alert(error.message || "Something went wrong while processing your subscription.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const renderButton = (plan) => {
    if (currentPlan === plan) {
      return (
        <button className="mt-4 w-full bg-gray-700 text-white py-2 rounded-lg cursor-default">
          Current Plan
        </button>
      );
    }
    return (
      <button
        onClick={() => handleSubscribe(plan)}
        disabled={loadingPlan !== null}
        className={`mt-4 w-full py-2 rounded-lg transition font-semibold tracking-wide shadow-md hover:scale-[1.01] duration-200 ${
          plan === "basic"
            ? "bg-gradient-to-r from-green-400 to-green-600 text-white"
            : plan === "plus"
            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black"
            : "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
        }`}
      >
        {loadingPlan === plan ? "Switching..." : `Subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)}`}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center bg-gradient-to-b from-zinc-950 to-zinc-900 text-white py-12 px-4 min-h-screen">
      <h2 className="text-5xl font-extrabold mb-10 text-center bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
        Choose Your Plan
      </h2>

      <div className="flex space-x-4 mb-10">
        <button
          onClick={() => setActiveTab("subscriptions")}
          className={`px-6 py-2 rounded-full font-semibold text-sm shadow-md ${
            activeTab === "subscriptions"
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => setActiveTab("credits")}
          className={`px-6 py-2 rounded-full font-semibold text-sm shadow-md ${
            activeTab === "credits"
              ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Buy Credits
        </button>
      </div>

      {activeTab === "subscriptions" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          <div className="bg-zinc-900 rounded-2xl border border-gray-800 p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-white">Free</h3>
            <p className="text-lg text-gray-400 mb-4">$0/month</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>✅ Free 4 credits</li>
              <li>✅ Professional 4k images</li>
              <li>✅ 5-second video generation</li>
              <li>❌ No access to realistic or anime models</li>
            </ul>
            <button className="w-full bg-gray-700 text-white py-2 rounded-lg cursor-default">Current Plan</button>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-green-600 p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-green-400">Basic</h3>
            <p className="text-lg text-green-400 mb-4">$5.99/month</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>✅ 600 credits per Month</li>
              <li>✅ Professional 4K images</li>
              <li>✅ Watermark Removal</li>
              <li>✅ 5-second video generation</li>
              <li>✅ Image upscaling</li>
              <li>✅ Unlocking Realistic 4K models</li>
              <li>❌ No access to Anime models or Stable Diffusion XL</li>
            </ul>
            {renderButton("basic")}
          </div>

          <div className="relative bg-zinc-900 rounded-2xl border border-yellow-500 p-6 shadow-xl">
            <span className="absolute top-3 right-3 bg-yellow-500 text-black px-3 py-1 text-xs font-bold rounded-full shadow-md">
              Best Choice
            </span>
            <h3 className="text-2xl font-bold text-yellow-400">Plus</h3>
            <p className="text-lg text-yellow-400 mb-4">$19.99/month</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>✅ 3,000 monthly credits</li>
              <li>✅ Professional 4K & 8K images</li>
              <li>✅ Stable Diffusion XL Access</li>
              <li>✅ Unlimited relaxed generations</li>
              <li>✅ Free daily credits</li>
              <li>✅ Up to 4 tasks in queue</li>
              <li>✅ Up to 4 images per generation</li>
              <li>✅ 10-second video generation</li>
              <li>✅ Watermark-free download</li>
              <li>✅ Access to all AI tools</li>
              <li>✅ Unlocking All Anime models</li>
              <li>✅ Image upscaling</li>
              <li>✅ **NSFW / Uncensored Generations**</li>
            </ul>
            {renderButton("plus")}
          </div>
        </div>
      )}

      {activeTab === "credits" && <BuyCredits />}

      <p className="text-zinc-500 text-sm mt-8 max-w-xl text-center">
        Your subscription plan will take effect in the next billing period. Enjoy your current plan benefits until then.
      </p>
    </div>
  );
};

export default Pricing;
