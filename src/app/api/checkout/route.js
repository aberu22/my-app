// app/api/checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
});

const priceIds = {
  basic: process.env.STRIPE_SUBSCRIPTION_BASIC,
  plus:  process.env.STRIPE_SUBSCRIPTION_PLUS,
};

export async function POST(req) {
  try {
    const { plan, email, userId } = await req.json();
    if (!plan || !email || !userId) {
      return NextResponse.json({ error: "Plan, email, and userId are required" }, { status: 400 });
    }

    const selectedPrice = priceIds[plan.toLowerCase()];
    if (!selectedPrice) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const clientUrl = process.env.NEXT_PUBLIC_CLIENT_URL;
    if (!clientUrl) {
      return NextResponse.json({ error: "Missing client URL" }, { status: 500 });
    }

    // Verify the price exists in THIS mode (prevents live/test mismatch)
    try {
      await stripe.prices.retrieve(selectedPrice);
    } catch (e) {
      return NextResponse.json(
        { error: "Selected price is not available in current Stripe mode" },
        { status: 400 }
      );
    }

    // --- Read user, check current sub status ---
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    const user = userSnap.exists ? userSnap.data() : null;

    // Block creating another sub if they already have one that isn't fully canceled/expired.
    // (If they are 'cancels_at_period_end', they still have an active sub; let them resume/change via change-subscription.)
    const blockedStatuses = new Set(["active", "trialing", "past_due", "unpaid", "cancels_at_period_end", "incomplete"]);
    if (user?.stripeSubscriptionId && blockedStatuses.has(user.subscriptionStatus)) {
      return NextResponse.json({
        alreadySubscribed: true,
        message: "User already has an active or pending subscription.",
      }, { status: 400 });
    }

    // --- Ensure a Stripe Customer exists & is saved ---
    let stripeCustomerId = user?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await userRef.set({
        email,
        stripeCustomerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Idempotency for the Checkout session create
    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    // --- Create Checkout Session (subscription) ---
   const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: stripeCustomerId,
  client_reference_id: userId,
  line_items: [{ price: selectedPrice, quantity: 1 }],
  metadata: { userId, priceId: selectedPrice, type: "subscription" },
  allow_promotion_codes: false,
  success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
  cancel_url: `${clientUrl}/cancel`,
}, { idempotencyKey: idem });


    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error) {
    console.error("🔥 Stripe Checkout Error:", error);
    const msg = error?.raw?.message || error?.message || "Stripe session creation failed";
    return NextResponse.json({ error: msg }, { status: error?.statusCode || 500 });
  }
}
