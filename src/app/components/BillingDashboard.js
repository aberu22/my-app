"use client";

import { useState } from "react";
import { usePlanStatus } from "@/app/hooks/usePlanStatus";
import toast from "react-hot-toast";
import { Loader2, Zap, ArrowUpDown, X } from "lucide-react";

/* ---------------- helpers ---------------- */

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const idemKey = () =>
  crypto?.randomUUID?.() || Math.random().toString(36).slice(2);

/* ---------------- plans (ENV = source of truth) ---------------- */

const PLAN_OPTIONS = [
  {
    id: process.env.NEXT_PUBLIC_STRIPE_SUB_CREATOR,
    label: "Creator",
    credits: "800 credits / month",
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_SUB_VISIONARY,
    label: "Visionary",
    credits: "3,000 credits / month",
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_SUB_PRO,
    label: "Pro",
    credits: "8,000 credits / month",
  },
];

/* ---------------- UI atoms ---------------- */

const Card = ({ children }) => (
  <div className="rounded-2xl bg-[#0b0d12]/90 ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,.85)]">
    {children}
  </div>
);

const Section = ({ title, subtitle, icon: Icon, danger }) => (
  <div className="border-b border-white/10 px-6 py-5">
    <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
      {Icon && (
        <Icon
          className={`h-4 w-4 ${danger ? "text-red-400" : "text-purple-400"}`}
        />
      )}
      {title}
    </h2>
    {subtitle && (
      <p className="mt-1 text-[12px] text-zinc-400">{subtitle}</p>
    )}
  </div>
);

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10 text-center">
      <div className="text-[11px] text-zinc-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

/* ---------------- main ---------------- */

export default function BillingDashboard() {
  const {
    user,
    plan,
    credits,
    priceId,
    nextBillingDate,
    loading,
  } = usePlanStatus();

  const [newPlan, setNewPlan] = useState("");
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading billing details…
      </div>
    );
  }

  /* ---------------- actions ---------------- */

  const handleChangePlan = async () => {
    if (!newPlan || !user) return;
    if (newPlan === priceId) {
      toast("You’re already on this plan");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/change-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idemKey(),
        },
        body: JSON.stringify({
          userId: user.uid,
          newPriceId: newPlan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");

      toast.success(
        data.direction === "upgrade"
          ? "Plan upgraded successfully 🎉"
          : "Downgrade scheduled for next billing cycle ✅"
      );

      setNewPlan("");
    } catch (e) {
      toast.error(e.message || "Plan update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
  if (!user) return;

  if (!confirm("Cancel subscription at the end of this billing period?")) {
    return;
  }

  setCancelling(true);
  try {
    const res = await fetch("/api/cancel-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-idempotency-key": idemKey(),
      },
      body: JSON.stringify({ userId: user.uid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Cancel failed");

    // ✅ SUCCESS TOAST (this is the important part)
    if (data.cancelAt) {
      toast.success(
        `Subscription will cancel on ${fmtDate(data.cancelAt)}`
      );
    } else {
      toast.success("Subscription will cancel at the end of the billing period");
    }
  } catch (e) {
    toast.error(e.message || "Cancellation failed");
  } finally {
    setCancelling(false);
  }
};

  /* ---------------- render ---------------- */

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-white">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-[12px] text-zinc-400">
          Manage your plan and billing details
        </p>
      </header>

      {/* Current Plan */}
      <Card>
        <Section
          title="Current plan"
          subtitle="Your active subscription details"
          icon={Zap}
        />
        <div className="grid grid-cols-3 gap-3 px-6 py-5">
          <Stat label="Credits" value={credits ?? 0} />
          <Stat label="Plan" value={plan || "free"} />
          <Stat label="Next billing" value={fmtDate(nextBillingDate)} />
        </div>
      </Card>

      {/* Change Plan */}
      <Card>
        <Section
          title="Change plan"
          subtitle="Upgrade or downgrade your subscription"
          icon={ArrowUpDown}
        />
        <div className="px-6 py-5 space-y-4">
          <select
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            className="
              w-full rounded-xl bg-white/[0.04] px-3 py-2
              text-sm text-white
              ring-1 ring-white/10
              focus:outline-none focus:ring-white/20
            "
          >
            <option value="">Select a plan</option>
            {PLAN_OPTIONS.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === priceId}>
                {p.label} — {p.credits}
                {p.id === priceId ? " (current)" : ""}
              </option>
            ))}
          </select>

          <button
            onClick={handleChangePlan}
            disabled={!newPlan || newPlan === priceId || updating}
            className="
              w-full rounded-xl py-2.5 text-[13px] font-semibold
              bg-gradient-to-br from-purple-500/80 to-blue-500/80
              ring-1 ring-white/10
              hover:from-purple-400 hover:to-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition
            "
          >
            {updating ? "Updating…" : "Update plan"}
          </button>

          <p className="text-[11px] text-zinc-400">
            Upgrades apply immediately (prorated). Downgrades take effect next
            billing cycle.
          </p>
        </div>
      </Card>

      {/* Cancel */}
      <Card>
        <Section
          title="Cancel subscription"
          subtitle="Ends at the current billing period"
          icon={X}
          danger
        />
        <div className="px-6 py-5">
          <button
            onClick={handleCancel}
            disabled={plan === "free" || cancelling}
            className="
              w-full rounded-xl py-2.5 text-[13px] font-semibold
              bg-white/[0.04] text-red-400
              ring-1 ring-red-500/30
              hover:bg-red-500/10
              disabled:opacity-50
              transition
            "
          >
            {cancelling ? "Cancelling…" : "Cancel subscription"}
          </button>
        </div>
      </Card>
    </div>
  );
}
