// app/api/checkout/route.js
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription price IDs (ENV = source of truth)
const PRICE_IDS = {
  creator: process.env.STRIPE_SUB_CREATOR,
  visionary: process.env.STRIPE_SUB_VISIONARY,
  pro: process.env.STRIPE_SUB_PRO,
};

const ACTIVE_LIKE_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

async function findExistingSubscription(stripeCustomerId) {
  // List subscriptions for the customer and find any "active-like"
  const subs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 20,
    expand: ["data.items.data.price"],
  });

  return subs.data.find((s) => ACTIVE_LIKE_STATUSES.has(s.status)) || null;
}

export async function POST(req) {
  try {
    const { plan, email, userId } = await req.json();

    if (!plan || !email || !userId) {
      return NextResponse.json(
        { error: "plan, email, and userId are required" },
        { status: 400 }
      );
    }

    const normalizedPlan = String(plan).toLowerCase();
    const priceId = PRICE_IDS[normalizedPlan];

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    // Base URL (local + prod safe)
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      "http://localhost:3000";

    // Ensure price exists (prevents test/live mismatch)
    await stripe.prices.retrieve(priceId);

    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();
    const user = snap.exists ? snap.data() : null;

    // OPTIONAL: very short click-lock (prevents double click spam)
    // (Not required, but helps UX and reduces duplicate sessions.)
    const lockUntil = user?.checkoutLockUntil?.toMillis?.() ?? 0;
    if (lockUntil && Date.now() < lockUntil) {
      return NextResponse.json(
        { error: "Checkout already in progress. Please wait a moment." },
        { status: 429 }
      );
    }

    // Ensure a Stripe customer (one per user forever)
    let stripeCustomerId = user?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;

      await userRef.set(
        {
          email,
          stripeCustomerId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // ✅ HARD BLOCK USING STRIPE AS SOURCE OF TRUTH
    // Even if Firestore/webhook is stale, this prevents double subscriptions.
    const existingSub = await findExistingSubscription(stripeCustomerId);

    if (existingSub) {
      const currentPriceId = existingSub.items?.data?.[0]?.price?.id || null;

      return NextResponse.json(
        {
          upgradeRequired: true,
          error: "Subscription already exists. Use upgrade/downgrade instead.",
          stripeSubscriptionId: existingSub.id,
          currentPriceId,
          status: existingSub.status,
        },
        { status: 409 }
      );
    }

    // Idempotency key (prevents accidental dupes)
    const idem = req.headers.get("x-idempotency-key") || crypto.randomUUID();

    // Set short checkout lock (e.g., 45s)
    await userRef.set(
      {
        checkoutLockUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 45_000),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Create Checkout Session (SUBSCRIPTION ONLY)
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: stripeCustomerId,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          type: "subscription",
          userId,
          plan: normalizedPlan, // helpful for debugging; not for credits
        },
        allow_promotion_codes: false,
        success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
      },
      { idempotencyKey: idem }
    );

    // OPTIONAL: record the session id (useful if debugging “stuck checkout”)
    await userRef.set(
      {
        lastCheckoutSessionId: session.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url }, { status: 200 });
  } catch (error) {
    console.error("🔥 Stripe Checkout Error:", error);

    const msg =
      error?.raw?.message ||
      error?.message ||
      "Stripe checkout session creation failed";

    return NextResponse.json({ error: msg }, { status: error?.statusCode || 500 });
  }
}
