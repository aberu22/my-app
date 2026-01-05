// app/api/cancel-subscription/route.js
import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { userId, immediate = false } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    const user = userSnap.data();
    let subscriptionId = user.stripeSubscriptionId;

    // 🔁 Stripe fallback if Firestore is stale
    if (!subscriptionId) {
      const subs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      const sub = subs.data[0];
      if (!sub) {
        return new Response(JSON.stringify({ error: "No active subscription" }), { status: 400 });
      }

      subscriptionId = sub.id;

      await userRef.set(
        {
          stripeSubscriptionId: subscriptionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    if (sub.status === "canceled") {
      return new Response(JSON.stringify({ success: true, alreadyCanceled: true }));
    }

    if (sub.cancel_at_period_end && !immediate) {
      return new Response(
        JSON.stringify({
          success: true,
          cancelsAtPeriodEnd: true,
          cancelAt: new Date(sub.current_period_end * 1000),
        })
      );
    }

    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    let result, cancelAt = null;

    if (immediate) {
      result = await stripe.subscriptions.cancel(
        subscriptionId,
        { prorate: false },
        { idempotencyKey: idem }
      );

      await userRef.set(
        {
          requestedImmediateCancel: true,
          requestedImmediateCancelAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      result = await stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true },
        { idempotencyKey: idem }
      );

      cancelAt = new Date(result.current_period_end * 1000);

      await userRef.set(
        {
          requestedCancelAtPeriodEnd: true,
          cancelAt,
        },
        { merge: true }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        immediate,
        cancelAt,
        subscription: {
          id: result.id,
          status: result.status,
          cancel_at_period_end: result.cancel_at_period_end,
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error canceling subscription:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Cancellation failed" }),
      { status: 500 }
    );
  }
}
