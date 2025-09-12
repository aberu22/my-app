// app/api/webhooks/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

export const runtime = "nodejs";        // required for raw body + Stripe verification
export const dynamic = "force-dynamic"; // never cache webhooks

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

// -------- Plans (map by price id; lookup_key supported too) --------
const PLAN_DETAILS = {
  free: { credits: 50, status: "free", price: 0 },
  [process.env.STRIPE_SUBSCRIPTION_BASIC]: { credits: 600,  status: "basic", price: 5.99 },
  [process.env.STRIPE_SUBSCRIPTION_PLUS]:  { credits: 3000, status: "plus",  price: 19.99 },
};

function planFromPrice(price) {
  if (!price) return null;
  return PLAN_DETAILS[price.id] || PLAN_DETAILS[price.lookup_key] || null;
}

// --------- Event idempotency helpers ----------
async function hasProcessed(eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  const snap = await ref.get();
  return snap.exists;
}
async function markProcessed(eventId) {
  const ref = db.collection("stripe_events").doc(eventId);
  await ref.set({ processedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

// --------- Thin-event safe fetch/expand ----------
async function materialize(event) {
  const obj = event.data.object;
  if (event.type.startsWith("invoice.")) {
    const id = typeof obj === "string" ? obj : obj?.id;
    return await stripe.invoices.retrieve(id, { expand: ["lines.data.price"] });
  }
  if (event.type.startsWith("checkout.session.")) {
    const id = typeof obj === "string" ? obj : obj?.id;
    return await stripe.checkout.sessions.retrieve(id);
  }
  if (event.type.startsWith("customer.subscription.")) {
    const id = typeof obj === "string" ? obj : obj?.id;
    return await stripe.subscriptions.retrieve(id, { expand: ["items.data.price"] });
  }
  return obj;
}

export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });

  let event;
  try {
    const raw = await req.text(); // RAW body required for verification
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error("Webhook signature verification failed:", e.message);
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  // Event-level idempotency (check only; mark after successful handling)
  if (await hasProcessed(event.id)) return NextResponse.json({ received: true });

  try {
    // =========================================
    // CHECKOUT (credit packs & subscription create)
    // =========================================
    if (event.type === "checkout.session.completed") {
      const session = await materialize(event);

      // ---- One-time credit pack purchase ----
      if (session.metadata?.type === "credit_pack" && session.payment_status === "paid") {
        const { userId } = session.metadata;
        const credits = parseInt(session.metadata.credits || "0", 10);
        if (!userId || !credits) {
          return NextResponse.json({ error: "Invalid credit pack metadata" }, { status: 400 });
        }

        await db.collection("users").doc(userId).set({
          credits: admin.firestore.FieldValue.increment(credits),
          lastPaymentId: session.id,
        }, { merge: true });

        console.log(`💳 Credits added: +${credits} → user ${userId}`);
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      // ---- Subscription created via Checkout ----
      if (session.mode === "subscription" && session.metadata?.priceId) {
        const userId = session.metadata.userId;
        const plan = PLAN_DETAILS[session.metadata.priceId] || null;
        if (!userId || !plan) {
          return NextResponse.json({ error: "Invalid subscription metadata" }, { status: 400 });
        }

        await db.collection("users").doc(userId).set({
          email: session.customer_details?.email || session.metadata.email || null,
          stripeCustomerId: session.customer || null,            // store customer for lookups
          stripeSubscriptionId: session.subscription || null,    // store subscription id
          stripePriceId: session.metadata.priceId,
          membershipStatus: plan.status,
          isPremium: plan.status !== "free",
          subscriptionStatus: "pending", // will flip to 'active' after first successful invoice
          lastPaymentId: session.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`🆕 Subscribed (pending): user ${userId} → ${plan.status}`);
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }
    }

    // =========================================
    // INVOICE SUCCEEDED (renewals & mid-cycle changes)
    // =========================================
    if (event.type === "invoice.payment_succeeded") {
      const invoice = await materialize(event);

      // Some invoices are not tied to subscriptions (manual invoices, credits, etc.)
      if (!invoice.subscription) {
        console.log("ℹ️ Skipping non-subscription invoice:", invoice.id, invoice.billing_reason);
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const billingReason = invoice.billing_reason || null; // 'subscription_create' | 'subscription_cycle' | 'subscription_update' | ...
      const isProration  = invoice.lines.data.some(l => l.proration);

      const subId = invoice.subscription;
      // Get plan from subscription (expanded price)
      let sub;
      try {
        sub = await stripe.subscriptions.retrieve(subId, { expand: ["items.data.price"] });
      } catch (e) {
        if (e?.statusCode === 404) {
          console.warn("⚠️ Subscription missing on Stripe:", subId, "for invoice", invoice.id);
          await markProcessed(event.id);
          return NextResponse.json({ received: true });
        }
        throw e;
      }

      const activeItem = sub.items.data[0];
      const price = activeItem?.price || null;
      const plan  = planFromPrice(price);
      if (!plan) {
        console.warn("⚠️ Unknown plan for price", price?.id || price?.lookup_key);
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      // Find user by subscription, fall back to customer id
      let snap = await db.collection("users")
        .where("stripeSubscriptionId", "==", subId)
        .limit(1)
        .get();

      if (snap.empty && invoice.customer) {
        snap = await db.collection("users")
          .where("stripeCustomerId", "==", invoice.customer)
          .limit(1)
          .get();
      }
      if (snap.empty) {
        console.warn("⚠️ No user matched for sub/customer", subId, invoice.customer);
        await markProcessed(event.id);
        return NextResponse.json({ received: true });
      }

      const userRef = snap.docs[0].ref;

      await db.runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        const data = doc.data() || {};
        if (data.lastCreditedInvoiceId === invoice.id) return; // idempotency at user level

        const baseUpdates = {
          membershipStatus: plan.status,
          isPremium: plan.status !== "free",
          pricePaid: plan.price,
          stripePriceId: price?.id || null,
          lastCreditedInvoiceId: invoice.id,
        };

        // 🔒 Mid-cycle change (UPGRADE or DOWNGRADE / proration) → update plan only, NO credits
        if (isProration || billingReason === "subscription_update") {
          tx.update(userRef, baseUpdates);
          console.log(`⚖️ Proration invoice processed (no credits). reason=${billingReason}`);
          return;
        }

        // ✅ Renewal → grant monthly credits
        if (billingReason === "subscription_cycle") {
          tx.update(userRef, {
            ...baseUpdates,
            subscriptionStatus: "active",
            credits: admin.firestore.FieldValue.increment(plan.credits),
            lastCreditGrantCycle: new Date().toISOString().slice(0, 7), // YYYY-MM
          });
          console.log(`🔄 Renewal: +${plan.credits} credits`);
          return;
        }

        // First invoice after subscription create (keep as grant, like your original)
        if (billingReason === "subscription_create") {
          tx.update(userRef, {
            ...baseUpdates,
            subscriptionStatus: "active",
            credits: admin.firestore.FieldValue.increment(plan.credits),
            lastCreditGrantCycle: new Date().toISOString().slice(0, 7),
          });
          console.log(`🆕 Subscription created: +${plan.credits} credits`);
          return;
        }

        // Fallback: conservative (no credit change)
        tx.update(userRef, baseUpdates);
        console.log(`ℹ️ Invoice processed with no credit change. reason=${billingReason}`);
      });

      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // =========================================
    // INVOICE FAILED → mark past_due
    // =========================================
    if (event.type === "invoice.payment_failed") {
      const invoice = await materialize(event);
      if (invoice.subscription) {
        const snap = await db.collection("users")
          .where("stripeSubscriptionId", "==", invoice.subscription)
          .limit(1)
          .get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({ subscriptionStatus: "past_due" });
        }
      }
      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // =========================================
    // SUBSCRIPTION UPDATED (e.g., cancel_at_period_end)
    // =========================================
    if (event.type === "customer.subscription.updated") {
      const sub = await materialize(event);
      const snap = await db.collection("users")
        .where("stripeSubscriptionId", "==", sub.id)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          stripePriceId: sub.items.data[0]?.price?.id || null,
          subscriptionStatus: sub.cancel_at_period_end ? "cancels_at_period_end" : sub.status,
        });
      }
      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // =========================================
    // SUBSCRIPTION DELETED (immediate cancel)
    // =========================================
    if (event.type === "customer.subscription.deleted") {
      const sub = await materialize(event);
      const snap = await db.collection("users")
        .where("stripeSubscriptionId", "==", sub.id)
        .limit(1)
        .get();
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          isPremium: false,
          membershipStatus: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
          stripePriceId: null,
        });
      }
      await markProcessed(event.id);
      return NextResponse.json({ received: true });
    }

    // Default ack
    await markProcessed(event.id);
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook handler error:", e);
    const msg = e?.raw?.message || e?.message || "Internal webhook error";
    const code = e?.raw?.code;
    const type = e?.raw?.type;
    return NextResponse.json({ error: msg, code, type }, { status: e?.statusCode || 500 });
  }
}

// Optional: quick health check in local dev
export async function GET() {
  return new Response("webhooks up", { status: 200 });
}
