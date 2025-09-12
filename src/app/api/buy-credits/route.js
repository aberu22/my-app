export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

const {
  STRIPE_SECRET_KEY,
  STRIPE_CREDIT_PACK_500,
  STRIPE_CREDIT_PACK_1000,
  STRIPE_CREDIT_PACK_2000,
  NEXT_PUBLIC_CLIENT_URL,
  NODE_ENV,
} = process.env;

function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

const CREDIT_PACKS = {
  [STRIPE_CREDIT_PACK_500]: 500,
  [STRIPE_CREDIT_PACK_1000]: 1000,
  [STRIPE_CREDIT_PACK_2000]: 2000,
};

export async function POST(req) {
  try {
    const { userId, email, packType } = await req.json();
    if (!userId || !email || !packType) {
      return jsonError("Missing userId, email, or packType", 400);
    }

    const prices = {
      "500": STRIPE_CREDIT_PACK_500,
      "1000": STRIPE_CREDIT_PACK_1000,
      "2000": STRIPE_CREDIT_PACK_2000,
    };
    const priceId = prices[String(packType)];
    if (!priceId) return jsonError(`Invalid packType '${packType}'`, 400);

    const userRef = db.collection("users").doc(userId);
    const snap = await userRef.get();
    if (!snap.exists) return jsonError("User not found", 404);
    const user = snap.data();

    // Your business rule
    if (typeof user.credits === "number" && user.credits > 0) {
      return jsonError(
        "You still have unused credits. Please use them before buying more.",
        403,
        { currentCredits: user.credits }
      );
    }

    // Ensure a Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
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

    const idem =
      req.headers.get("x-idempotency-key") ||
      globalThis.crypto?.randomUUID?.() ||
      `${userId}-${Date.now()}`;

    // ✅ Define the values you later reference
    const creditsForPack = CREDIT_PACKS[priceId];
    const packName = `${creditsForPack} Credits`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: stripeCustomerId, // ✅ keep this; do NOT also pass customer_email
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: userId,
        success_url: `${NEXT_PUBLIC_CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${NEXT_PUBLIC_CLIENT_URL}/pricing`,
        payment_intent_data: {
          setup_future_usage: "off_session",
          metadata: {
            userId,
            type: "credit_pack",
            credits: String(creditsForPack),
            packName,
          },
        },
        metadata: {
          userId,
          type: "credit_pack",
          credits: String(creditsForPack),
          packName,
        },
      },
      { idempotencyKey: idem }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("🚨 /api/buy-credits server error", {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      raw: error?.raw?.message,
      stack: NODE_ENV !== "production" ? error?.stack : undefined,
    });

    const msg =
      NODE_ENV !== "production" && (error?.raw?.message || error?.message)
        ? `Unable to create checkout session: ${error.raw?.message || error.message}`
        : "Unable to create checkout session";
    return jsonError(msg, 500);
  }
}
