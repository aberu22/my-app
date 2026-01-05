// app/api/change-subscription/route.js
export const runtime = "nodejs";

import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Optional local labels (webhook is source of truth)
const PLAN_LABELS = {
  [process.env.STRIPE_SUB_CREATOR]:   "creator",
  [process.env.STRIPE_SUB_VISIONARY]: "visionary",
  [process.env.STRIPE_SUB_PRO]:       "pro",
};

export async function POST(req) {
  try {
    const { userId, newPriceId, previewOnly = false } = await req.json();

    if (!userId || !newPriceId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or newPriceId" }),
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // Load user
    // ------------------------------------------------
    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();

    if (!snap.exists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const user = snap.data();
let subscriptionId = user.stripeSubscriptionId;

// 🔁 Firestore may be stale — fallback to Stripe
if (!subscriptionId) {
  const subs = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 1,
  });

  const sub = subs.data[0];
  if (!sub) {
    return new Response(
      JSON.stringify({ error: "No active subscription to change" }),
      { status: 400 }
    );
  }

  subscriptionId = sub.id;

  // Heal Firestore for future requests
  await userRef.set(
    {
      stripeSubscriptionId: subscriptionId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}


    

    // ------------------------------------------------
    // Load subscription from Stripe
    // ------------------------------------------------
    let subscription;
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });
    } catch (err) {
      if (err?.statusCode === 404) {
        // Stripe sub deleted but Firestore stale
        await userRef.set(
          { stripeSubscriptionId: null, membershipStatus: "free" },
          { merge: true }
        );
        return new Response(
          JSON.stringify({ error: "Subscription no longer exists" }),
          { status: 400 }
        );
      }
      throw err;
    }

    if (subscription.status === "canceled") {
      return new Response(
        JSON.stringify({ error: "Subscription already canceled" }),
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // Single-plan subscription assumption
    // ------------------------------------------------
    const item = subscription.items.data[0];
    if (!item) {
      return new Response(
        JSON.stringify({ error: "Subscription has no items" }),
        { status: 400 }
      );
    }

    const currentPriceId = item.price.id;
    if (currentPriceId === newPriceId) {
      return new Response(
        JSON.stringify({ success: true, changed: false }),
        { status: 200 }
      );
    }

    // ------------------------------------------------
    // Determine upgrade or downgrade
    // ------------------------------------------------
    const currentAmount = item.price.unit_amount || 0;
    const newPrice = await stripe.prices.retrieve(newPriceId);
    const newAmount = newPrice.unit_amount || 0;

    const direction =
      newAmount > currentAmount ? "upgrade" : "downgrade";

    // ------------------------------------------------
    // Preview proration (for UI confirmation)
    // ------------------------------------------------
    if (previewOnly) {
      const preview = await stripe.invoices.retrieveUpcoming({
        customer: subscription.customer,
        subscription: subscriptionId,
        subscription_items: [{ id: item.id, price: newPriceId }],
        subscription_proration_behavior:
          direction === "upgrade" ? "create_prorations" : "none",
      });

      const prorationTotal = (preview.lines?.data || [])
        .filter((l) => l.proration)
        .reduce((sum, l) => sum + (l.amount || 0), 0);

      return new Response(
        JSON.stringify({
          direction,
          chargeNow: prorationTotal / 100,
          currency: preview.currency,
          nextBillingDate: new Date(
            subscription.current_period_end * 1000
          ),
        }),
        { status: 200 }
      );
    }

    // ------------------------------------------------
    // Commit change
    // ------------------------------------------------
    const proration_behavior =
      direction === "upgrade" ? "always_invoice" : "none";

    const idem =
      req.headers.get("x-idempotency-key") || crypto.randomUUID();

    const updated = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [{ id: item.id, price: newPriceId }],
        billing_cycle_anchor: "unchanged",
        proration_behavior,
        cancel_at_period_end:
          direction === "upgrade" ? false : subscription.cancel_at_period_end,
      },
      { idempotencyKey: idem }
    );

    // ------------------------------------------------
    // Minimal Firestore reflection (webhooks finalize)
    // ------------------------------------------------
    await userRef.set(
      {
        stripePriceId: newPriceId,
        pendingPlanChangeAt:
          admin.firestore.FieldValue.serverTimestamp(),
        membershipStatus: PLAN_LABELS[newPriceId] || user.membershipStatus,
      },
      { merge: true }
    );

    return new Response(
      JSON.stringify({
        success: true,
        direction,
        subscription: {
          id: updated.id,
          status: updated.status,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("🔥 change-subscription error:", err);

    return new Response(
      JSON.stringify({
        error: err?.raw?.message || err?.message || "Subscription update failed",
      }),
      { status: err?.statusCode || 500 }
    );
  }
}

