// app/api/cancel-subscription/route.js
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req) {
  try {
    const { userId, immediate = false } = await req.json();
    if (!userId) return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    const user = userSnap.data();
    const subscriptionId = user.stripeSubscriptionId;
    if (!subscriptionId) return new Response(JSON.stringify({ error: "No active subscription" }), { status: 400 });

    // Get current sub to short-circuit repeats
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    // Already fully canceled
    if (sub.status === "canceled") {
      await userRef.set({ subscriptionStatus: "canceled" }, { merge: true });
      return new Response(JSON.stringify({ success: true, alreadyCanceled: true }));
    }

    // Already set to cancel at period end
    if (sub.cancel_at_period_end && !immediate) {
      const cancelAt = new Date(sub.current_period_end * 1000);
      return new Response(JSON.stringify({ success: true, cancelsAtPeriodEnd: true, cancelAt }));
    }

    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    let result, cancelAt = null;

    if (immediate) {
      // Immediate termination without refunds or credits:
      // - prorate:false -> don't create credits for unused time
      // - invoice_now:false -> don't try to charge right now
      result = await stripe.subscriptions.cancel(
        subscriptionId,
        { prorate: false, invoice_now: false },
        { idempotencyKey: idem }
      );
      // Let webhooks (`customer.subscription.deleted`) flip the user to free.
      await userRef.set(
        {
          subscriptionStatus: "canceled_pending_webhook",
          requestedImmediateCancelAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // Soft cancel at period end (no mid-cycle refunds/credits)
      result = await stripe.subscriptions.update(
        subscriptionId,
        { cancel_at_period_end: true },
        { idempotencyKey: idem }
      );
      cancelAt = new Date(result.current_period_end * 1000);

      // Minimal local reflection; webhooks will set final status later.
      await userRef.set(
        {
          subscriptionStatus: "cancels_at_period_end",
          cancelAt,
          pendingCancelAtPeriodEnd: true,
        },
        { merge: true }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        immediate,
        cancelAt,
        subscription: { id: result.id, status: result.status, cancel_at_period_end: result.cancel_at_period_end },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error canceling subscription:", err);
    return new Response(JSON.stringify({ error: "Cancellation failed" }), { status: 500 });
  }
}
