// app/api/checkout/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // no apiVersion override

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

    // Build base URL (works locally & on Vercel)
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      "http://localhost:3000";

    // Verify the price exists in THIS Stripe mode (prevents test/live mismatch)
    await stripe.prices.retrieve(selectedPrice);

    // --- Read user, check current sub status ---
    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();
    const user = snap.exists ? snap.data() : null;

    const blocked = new Set(["active","trialing","past_due","unpaid","cancels_at_period_end","incomplete"]);
    if (user?.stripeSubscriptionId && blocked.has(user.subscriptionStatus)) {
      return NextResponse.json(
        { alreadySubscribed: true, message: "User already has an active or pending subscription." },
        { status: 400 }
      );
    }

    // Ensure a Stripe Customer
    let stripeCustomerId = user?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      stripeCustomerId = customer.id;
      await userRef.set(
        { email, stripeCustomerId, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    // Idempotency
    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: stripeCustomerId,
        client_reference_id: userId,
        line_items: [{ price: selectedPrice, quantity: 1 }],
        metadata: { userId, priceId: selectedPrice, type: "subscription" }, // your webhook expects this
        allow_promotion_codes: false,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${encodeURIComponent(plan)}`,
        cancel_url: `${origin}/pricing`,
      },
      { idempotencyKey: idem }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error) {
    console.error("🔥 Stripe Checkout Error:", error);
    const msg = error?.raw?.message || error?.message || "Stripe session creation failed";
    return NextResponse.json({ error: msg }, { status: error?.statusCode || 500 });
  }
}
