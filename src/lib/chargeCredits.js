import { db } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
} from "firebase/firestore";

/**
 * Atomically charge credits from a user.
 * This is the ONLY place credits should ever be deducted.
 *
 * @param {Object} params
 * @param {string} params.userId - Firebase UID
 * @param {number} params.amount - Credits to deduct (positive integer)
 * @param {string} params.reason - Short reason (e.g. "seedance_720p_5s")
 * @param {Object} [params.meta] - Optional metadata (model, duration, resolution, jobId)
 *
 * @throws Error if insufficient credits or user doc missing
 */
export async function chargeCredits({
  userId,
  amount,
  reason,
  meta = {},
}) {
  if (!userId) throw new Error("chargeCredits: userId required");
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("chargeCredits: amount must be positive integer");
  }

  const userRef = doc(db, "users", userId);
  const ledgerRef = doc(db, "credit_ledger", crypto.randomUUID());

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);

    if (!snap.exists()) {
      throw new Error("User document not found");
    }

    const currentCredits = snap.data().credits ?? 0;

    if (currentCredits < amount) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    // 1️⃣ Deduct credits
    tx.update(userRef, {
      credits: increment(-amount),
      updatedAt: serverTimestamp(),
    });

    // 2️⃣ Write ledger record (immutable audit trail)
    tx.set(ledgerRef, {
      userId,
      amount: -amount,              // negative = charge
      reason,
      meta,
      createdAt: serverTimestamp(),
      type: "debit",
    });
  });
}

/**
 * Refund credits (used ONLY on failure / cancel)
 * Safe to call even if partial flows fail
 */
export async function refundCredits({
  userId,
  amount,
  reason,
  meta = {},
}) {
  if (!userId) throw new Error("refundCredits: userId required");
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("refundCredits: amount must be positive integer");
  }

  const userRef = doc(db, "users", userId);
  const ledgerRef = doc(db, "credit_ledger", crypto.randomUUID());

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);

    if (!snap.exists()) {
      throw new Error("User document not found");
    }

    // 1️⃣ Add credits back
    tx.update(userRef, {
      credits: increment(amount),
      updatedAt: serverTimestamp(),
    });

    // 2️⃣ Ledger entry
    tx.set(ledgerRef, {
      userId,
      amount,                       // positive = refund
      reason,
      meta,
      createdAt: serverTimestamp(),
      type: "credit",
    });
  });
}
