// app/api/webhooks/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ------------------------------------
// Subscription plans (priceId → plan)
// ------------------------------------
const PLAN_DETAILS = {
  [process.env.STRIPE_SUB_CREATOR]: {
    credits: 800,
    status: "creator",
    price: 12,
  },
  [process.env.STRIPE_SUB_VISIONARY]: {
    credits: 3000,
    status: "visionary",
    price: 29,
  },
  [process.env.STRIPE_SUB_PRO]: {
    credits: 8000,
    status: "pro",
    price: 59,
  },
};

function planFromPrice(price) {
  if (!price) return null;
  return PLAN_DETAILS[price.id] || null;
}

// ------------------------------------
// Idempotency helpers
// ------------------------------------
async function hasProcessed(eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  const snap = await ref.get();
  return snap.exists;
}

async function markProcessed(eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  await ref.set(
    { processedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

// ------------------------------------
// Expand thin events safely
// ------------------------------------
async function materialize(event) {
  const obj = event.data.object;

  if (event.type.startsWith("invoice.")) {
    return stripe.invoices.retrieve(obj.id, {
      expand: ["lines.data.price"],
    });
  }

  if (event.type.startsWith("customer.subscription.")) {
    return stripe.subscriptions.retrieve(obj.id, {
      expand: ["items.data.price"],
    });
  }

  return obj;
}

// ------------------------------------
// WEBHOOK HANDLER
// ------------------------------------
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (await hasProcessed(event.id)) {
    return NextResponse.json({ received: true });
  }

  try {
    // ------------------------------------
    // CHECKOUT COMPLETED (NO CREDITS HERE)
    // ------------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Credit packs
      if (
        session.metadata?.type === "credit_pack" &&
        session.payment_status === "paid"
      ) {
        const userId = session.metadata.userId;
        const credits = parseInt(session.metadata.credits, 10);

        await db.collection("users").doc(userId).update({
          credits: admin.firestore.FieldValue.increment(credits),
        });

        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      // Subscriptions → ONLY store IDs
      if (session.mode === "subscription") {
        const userId = session.metadata?.userId;
        if (!userId) {
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        await db.collection("users").doc(userId).set(
          {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: "pending",
          },
          { merge: true }
        );

        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }
    }

    // ------------------------------------
    // INVOICE PAID → GRANT CREDITS
    // ------------------------------------
    if (event.type === "invoice.payment_succeeded") {
      const invoice = await materialize(event);

      if (!invoice.subscription) {
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const isProration = invoice.lines.data.some((l) => l.proration);
      if (isProration) {
        // ⚠️ NEVER grant credits on prorations
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const sub = await stripe.subscriptions.retrieve(invoice.subscription, {
        expand: ["items.data.price"],
      });

      const price = sub.items.data[0]?.price;
      const plan = planFromPrice(price);
      if (!plan) {
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const snap = await db
        .collection("users")
        .where("stripeSubscriptionId", "==", sub.id)
        .limit(1)
        .get();

      if (snap.empty) {
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const userRef = snap.docs[0].ref;

      await db.runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        if (doc.data()?.lastInvoiceId === invoice.id) return;

        tx.update(userRef, {
          membershipStatus: plan.status,
          isPremium: true,
          subscriptionStatus: "active",
          stripePriceId: price.id,
          credits: admin.firestore.FieldValue.increment(plan.credits),
          lastInvoiceId: invoice.id,
        });
      });

      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // ------------------------------------
    // PAYMENT FAILED
    // ------------------------------------
    if (event.type === "invoice.payment_failed") {
      const invoice = await materialize(event);
      if (invoice.subscription) {
        const snap = await db
          .collection("users")
          .where("stripeSubscriptionId", "==", invoice.subscription)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            subscriptionStatus: "past_due",
          });
        }
      }
      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // ------------------------------------
    // SUBSCRIPTION CANCELED
    // ------------------------------------
    if (event.type === "customer.subscription.deleted") {
      const sub = await materialize(event);
      const snap = await db
        .collection("users")
        .where("stripeSubscriptionId", "==", sub.id)
        .limit(1)
        .get();

      if (!snap.empty) {
        await snap.docs[0].ref.update({
          membershipStatus: "free",
          isPremium: false,
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          stripePriceId: null,
        });
      }

      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    await markProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
