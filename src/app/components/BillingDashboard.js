"use client";

import { useState } from "react";
import { usePlanStatus } from "@/app/hooks/usePlanStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "./ui/card";
import toast from "react-hot-toast";
import { Loader2, CreditCard, Calendar, Zap, ArrowUpDown, X } from "lucide-react";

// Your available plans (ids = Stripe Price IDs)
const PLAN_OPTIONS = [
  { id: "price_1RCB4bGbLZ3kl4Qnbd6PlZeX", label: "Basic", credits: "600 credits", status: "basic" },
  { id: "price_1RCBBoGbLZ3kl4Qnywms6TCs", label: "Plus", credits: "3000 credits", status: "plus" },
];

// Helpers
const fmtMoney = (n, currency = "usd") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(Number(n));

const fmtDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const idemKey = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

// Simple Badge component since we don't have the UI library version
const Badge = ({ children, variant = "default" }) => {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-700"
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variantClasses[variant] || variantClasses.default}`}>
      {children}
    </span>
  );
};

export default function BillingDashboard() {
  const { user, plan, credits, priceId, nextBillingDate, loading } = usePlanStatus();
  const [newPlan, setNewPlan] = useState("");
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleChangePlan = async () => {
    if (!newPlan || !user) return;

    setUpdating(true);
    try {
      // 1) PREVIEW the change (to show "charge now" vs "next month")
      const previewRes = await fetch("/api/change-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          newPriceId: newPlan,
          previewOnly: true,
        }),
      });

      const preview = await previewRes.json();
      if (!previewRes.ok) throw new Error(preview?.error || "Failed to preview plan change.");

      const amount = fmtMoney(preview.previewAmount ?? 0, preview.currency ?? "usd");
      const nextWhen = fmtDate(preview.nextBillingDate);

      // Build a clear confirmation based on direction
      let confirmMsg = "Proceed with plan change?";
      if (preview.direction === "upgrade") {
        confirmMsg = preview.willChargeNow
          ? `You'll be charged ${amount} today to upgrade. Continue?`
          : `No charge today (covered by credits). Continue?`;
      } else if (preview.direction === "downgrade") {
        confirmMsg = `No charge today. The lower price starts on ${nextWhen}. Continue?`;
      }

      if (!window.confirm(confirmMsg)) {
        setUpdating(false);
        return;
      }

      // 2) COMMIT the change (idempotent)
      const commitRes = await fetch("/api/change-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idemKey(),
        },
        body: JSON.stringify({ userId: user.uid, newPriceId: newPlan }),
      });

      const data = await commitRes.json();
      if (!commitRes.ok) throw new Error(data?.error || "Failed to update plan.");

      // Tailored success messages
      if (data.direction === "upgrade") {
        toast.success(
          data.willChargeNow
            ? "Upgrade initiated. We'll add credits right after the payment succeeds."
            : "Upgrade applied with no immediate charge (covered by credits)."
        );
      } else if (data.direction === "downgrade") {
        toast.success(`Downgrade scheduled. New price takes effect on ${fmtDate(data.nextBillingDate)}.`);
      } else {
        toast.success("Plan updated.");
      }
    } catch (err) {
      toast.error("❌ " + (err?.message || "Plan change failed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    if (!window.confirm("Are you sure you want to cancel your subscription?")) return;

    setCancelling(true);
    try {
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-idempotency-key": idemKey() },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Cancellation failed");

      toast.success(
        data.cancelAt
          ? `✅ Cancels at the end of the period (${fmtDate(data.cancelAt)}).`
          : "✅ Cancellation requested."
      );
    } catch (err) {
      toast.error("❌ " + (err?.message || "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading billing information...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-gray-400">Manage your subscription plan and billing information</p>
      </div>

      <div className="grid gap-6">
        {/* Current Plan Card */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center justify-between">
              <span>Current Plan</span>
              <Badge variant={plan === "free" ? "secondary" : "default"} className="capitalize">
                {plan || "free"}
              </Badge>
            </h2>
            <p className="text-gray-400 mt-1">
              Your current subscription details
            </p>
          </div>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                <Zap className="h-6 w-6 text-blue-500 mb-2" />
                <span className="text-sm text-gray-400">Credits</span>
                <span className="text-xl font-semibold text-white">{credits ?? 0}</span>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-500 mb-2" />
                <span className="text-sm text-gray-400">Status</span>
                <span className="text-xl font-semibold text-white capitalize">{plan || "free"}</span>
              </div>
              
              <div className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-500 mb-2" />
                <span className="text-sm text-gray-400">Next Billing</span>
                <span className="text-xl font-semibold text-white">{fmtDate(nextBillingDate) || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Plan Card */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <ArrowUpDown className="h-5 w-5 mr-2 text-blue-500" />
              Change Plan
            </h2>
            <p className="text-gray-400 mt-1">
              Upgrade or downgrade your subscription
            </p>
          </div>
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Plan</label>
              <select
                className="w-full p-3 rounded-lg border border-gray-700 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNewPlan(e.target.value)}
                value={newPlan}
              >
                <option value="">Choose a plan</option>
                {PLAN_OPTIONS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    disabled={opt.id === priceId}
                  >
                    {opt.label} - {opt.credits} {opt.id === priceId ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleChangePlan}
              disabled={updating || !newPlan || newPlan === priceId}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Plan...
                </>
              ) : (
                "Update Plan"
              )}
            </Button>

            <div className="rounded-lg bg-gray-800/50 p-4 text-sm">
              <h4 className="font-medium text-gray-300 mb-2">Plan Change Policy</h4>
              <ul className="space-y-1 text-gray-400">
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"></div>
                  <span><strong>Upgrades</strong> charge immediately for the difference</span>
                </li>
                <li className="flex items-start">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2 mr-2 flex-shrink-0"></div>
                  <span><strong>Downgrades</strong> take effect next cycle</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Subscription */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center">
              <X className="h-5 w-5 mr-2 text-red-500" />
              Cancel Subscription
            </h2>
            <p className="text-gray-400 mt-1">
              Cancel your subscription at the end of your billing period
            </p>
          </div>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={cancelling || plan === "free"}
              className="w-full"
              size="lg"
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
            {plan === "free" && (
              <p className="text-center text-gray-400 mt-2 text-sm">
                You're currently on the free plan
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}