// app/api/change-subscription/route.js
import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

// Optional: local labels for UI reflection (webhook remains source of truth)
const PLAN_DETAILS = {
  "price_1RCB4bGbLZ3kl4Qnbd6PlZeX": { status: "basic", price: 5.99 },
  "price_1RCBBoGbLZ3kl4Qnywms6TCs": { status: "plus",  price: 19.99 },
};

export async function POST(req) {
  try {
    const { userId, newPriceId, previewOnly = false } = await req.json();
    if (!userId || !newPriceId) {
      return new Response(JSON.stringify({ error: "Missing userId or newPriceId" }), { status: 400 });
    }

    // ---- Load user ----
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }
    const user = userSnap.data();

    const subscriptionId = user.stripeSubscriptionId;
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "No active subscription to update" }), { status: 400 });
    }

    // ---- Retrieve subscription (gracefully handle stale/mismatched IDs) ----
    let sub;
    try {
      sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
    } catch (e) {
      if (e?.statusCode === 404) {
        await userRef.set({ stripeSubscriptionId: null, subscriptionStatus: "free" }, { merge: true });
        return new Response(JSON.stringify({ error: "No active subscription to update" }), { status: 400 });
      }
      throw e;
    }

    if (sub.status === "canceled") {
      await userRef.set({ stripeSubscriptionId: null, subscriptionStatus: "canceled" }, { merge: true });
      return new Response(JSON.stringify({ error: "No active subscription to update" }), { status: 400 });
    }

    // If subscription is incomplete, tell client to resolve payment first
    if (sub.status === "incomplete") {
      return new Response(JSON.stringify({ error: "Subscription is incomplete. Complete payment first." }), { status: 400 });
    }

    // ---- Choose the item to change (single-plan sub assumed) ----
    const item = sub.items.data[0];
    if (!item) {
      return new Response(JSON.stringify({ error: "Subscription has no items" }), { status: 400 });
    }

    const currentPriceId = item.price.id;
    if (currentPriceId === newPriceId) {
      return new Response(JSON.stringify({ success: true, planChanged: false, message: "Already on that plan" }));
    }

    // ---- Retrieve new Price & detect direction (upgrade/downgrade) ----
    const newPrice = await stripe.prices.retrieve(newPriceId);
    const direction =
      (newPrice.unit_amount || 0) > (item.price.unit_amount || 0) ? "upgrade" : "downgrade";

    // ---- Preview (mirror commit behavior) ----
   // ---- Preview (mirror commit behavior) ----
const previewProration = direction === "upgrade" ? "create_prorations" : "none";
const upcoming = await stripe.invoices.retrieveUpcoming({
  customer: sub.customer,
  subscription: subscriptionId,
  subscription_items: [{ id: item.id, price: newPriceId }],
  subscription_proration_behavior: previewProration,
});

// Only charge-now = sum of proration lines (not full upcoming total)
const prorationCents = (upcoming.lines?.data || [])
  .filter((l) => l.proration)
  .reduce((sum, l) => sum + (l.amount || 0), 0);

// If you use Stripe Tax and want tax on prorations, add it here:
// const taxCents = upcoming.total_details?.amount_tax || 0;
// const chargeNowCents = prorationCents + taxCents;

const chargeNowCents = prorationCents;
const willChargeNow = direction === "upgrade" && chargeNowCents > 0;

const nextCycleEpoch =
  upcoming.next_payment_attempt ??
  upcoming.next_payment_attempt_at ?? // some fixtures use this
  sub.current_period_end;
const nextBillingDate = nextCycleEpoch ? new Date(nextCycleEpoch * 1000) : null;

if (previewOnly) {
  return new Response(
    JSON.stringify({
      direction,
      previewAmount: (Math.max(chargeNowCents, 0) / 100).toFixed(2),
      currency: upcoming.currency || newPrice.currency || "usd",
      willChargeNow,
      nextBillingDate,
    })
  );
}

    // ---- Commit (policy) ----
    // If user had scheduled cancel, upgrading should resume the sub
    if (direction === "upgrade" && sub.cancel_at_period_end) {
      await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false });
    }

    const proration_behavior = direction === "upgrade" ? "always_invoice" : "none";
    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    const updated = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [{ id: item.id, price: newPriceId }], // update existing item
        billing_cycle_anchor: "unchanged",           // keep same cycle date
        proration_behavior,                          // upgrade: charge now; downgrade: no mid-cycle credit
      },
      { idempotencyKey: idem }
    );

    // ---- Minimal Firestore reflection (webhooks finalize) ----
    const target = PLAN_DETAILS[newPriceId] || null;
    await userRef.set(
      {
        stripePriceId: newPriceId,
        ...(target ? { membershipStatus: target.status, isPremium: true } : {}),
        pendingPlanChangeAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return new Response(
      JSON.stringify({
        success: true,
        planChanged: true,
        direction,
        willChargeNow,
        nextBillingDate,
        subscription: { id: updated.id, status: updated.status },
      })
    );
  } catch (err) {
    console.error("🔥 Subscription change failed:", err);
    const message = err?.raw?.message || err?.message || "Subscription update failed";
    const code = err?.raw?.code;
    return new Response(JSON.stringify({ error: message, code }), { status: err?.statusCode || 500 });
  }
}
