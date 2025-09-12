"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import toast from "react-hot-toast";

const fmtDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "N/A" : dt.toLocaleString();
};

export default function SuccessClient() {
  const router = useRouter();
  const search = useSearchParams();
  const { user, loading } = useAuth();
  const { setCredits, setMembershipStatus } = useImageGeneration();

  const [error, setError] = useState(null);
  const [waitingMs, setWaitingMs] = useState(0);
  const toastShownRef = useRef(false);
  const start = useRef(Date.now());

  const sessionId = useMemo(() => search?.get("session_id") || null, [search]);
  const creditsHint = useMemo(() => search?.get("credits") || null, [search]);

  useEffect(() => {
    const t = setInterval(() => setWaitingMs(Date.now() - start.current), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError("❌ User not found in Firestore.");
          return;
        }

        const u = snapshot.data();
        if (typeof u.credits === "number") setCredits(u.credits);
        if (u.membershipStatus) setMembershipStatus(u.membershipStatus);

        const isSubActive =
          u.subscriptionStatus === "active" ||
          (u.membershipStatus && u.membershipStatus !== "free");
        const hasCredits = (u.credits ?? 0) > 0;

        if (!toastShownRef.current && (isSubActive || hasCredits)) {
          toast.success("✅ Payment successful! Redirecting…");
          toastShownRef.current = true;
          setTimeout(() => router.push("/create"), 1200);
        }
      },
      (err) => setError("🔥 Firestore error: " + err.message)
    );

    return () => unsubscribe();
  }, [user, loading, router, setCredits, setMembershipStatus]);

  return (
    <div className="min-h-screen flex flex-col gap-4 justify-center items-center bg-gray-900 text-white p-6">
      <h2 className="text-2xl">🔄 Verifying payment…</h2>

      {sessionId && (
        <p className="text-sm text-zinc-400">
          Checkout session: <code className="text-zinc-300">{sessionId}</code>
        </p>
      )}

      {creditsHint && (
        <p className="text-sm text-zinc-400">
          Credit pack requested: <strong>{creditsHint}</strong>
        </p>
      )}

      {error && <p className="text-red-400">{error}</p>}

      {!error && (
        <p className="text-zinc-400 text-sm">
          Waiting for Stripe webhook to update your account… ({Math.ceil(waitingMs / 1000)}s)
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push("/create")}
          className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
        >
          Go to Create
        </button>

        <p className="text-zinc-400 text-sm">
          Started at: {fmtDate(start.current)}
        </p>

        <button
          onClick={() => router.push("/billing")}
          className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
        >
          Manage Billing
        </button>
      </div>

      <p className="text-xs text-zinc-500 pt-2">
        Tip: keep this tab open for a few seconds while the webhook updates your account.
      </p>
    </div>
  );
}
