// app/api/webhooks/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* =========================================================
   Subscription plans (priceId → plan)
========================================================= */

const PLAN_DETAILS = {
  [process.env.STRIPE_SUB_CREATOR]: {
    credits: 800,
    status: "creator",
  },
  [process.env.STRIPE_SUB_VISIONARY]: {
    credits: 3000,
    status: "visionary",
  },
  [process.env.STRIPE_SUB_PRO]: {
    credits: 8000,
    status: "pro",
  },
};

function planFromPrice(price) {
  if (!price) return null;
  return PLAN_DETAILS[price.id] || null;
}

/* =========================================================
   Idempotency helpers
========================================================= */

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

/* =========================================================
   Expand thin Stripe events safely
========================================================= */

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

/* =========================================================
   WEBHOOK HANDLER
========================================================= */

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

  // Prevent duplicate processing
  if (await hasProcessed(event.id)) {
    return NextResponse.json({ received: true });
  }

  try {
    /* =====================================================
       CHECKOUT COMPLETED
       - Credit packs: grant credits
       - Subscriptions: store IDs only
    ===================================================== */

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("🧾 checkout.session.completed", {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
      });

      /* ---------- CREDIT PACKS ---------- */
      if (session.payment_status === "paid") {
        const isCreditPack = session.metadata?.type === "credit_pack";

        if (isCreditPack) {
          // userId fallback: client_reference_id is set in buy-credits
          let userId =
            session.metadata?.userId || session.client_reference_id;

          let credits = Number(session.metadata?.credits || 0);

          // Fallback: retrieve expanded session if metadata incomplete
          if (!userId || !credits) {
            const full = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ["line_items.data.price"],
            });

            userId =
              userId ||
              full.metadata?.userId ||
              full.client_reference_id;

            credits =
              credits || Number(full.metadata?.credits || 0);
          }

          // Final validation
          if (!userId) {
            console.warn("⚠️ credit_pack missing userId", session.id);
            await markProcessed(event.id);
            return NextResponse.json({ received: true });
          }

          if (!Number.isFinite(credits) || credits <= 0) {
            console.warn(
              "⚠️ credit_pack invalid credits",
              credits,
              session.id
            );
            await markProcessed(event.id);
            return NextResponse.json({ received: true });
          }

          await db.collection("users").doc(userId).update({
            credits: admin.firestore.FieldValue.increment(credits),
          });

          await markProcessed(event.id);
          return NextResponse.json({ received: true });
        }

        /* ---------- SUBSCRIPTION CHECKOUT ---------- */
        if (session.mode === "subscription") {
          const userId =
            session.metadata?.userId || session.client_reference_id;

          if (!userId) {
            await markProcessed(event.id);
            return NextResponse.json({ received: true });
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
    }

    /* =====================================================
       INVOICE PAID → GRANT SUBSCRIPTION CREDITS
    ===================================================== */

    if (event.type === "invoice.payment_succeeded") {
      const invoice = await materialize(event);

      if (!invoice.subscription) {
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      // Never grant credits for prorations
      const isProration = invoice.lines.data.some((l) => l.proration);
      if (isProration) {
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

    /* =====================================================
       PAYMENT FAILED
    ===================================================== */

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

    /* =====================================================
       SUBSCRIPTION CANCELED
    ===================================================== */

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
