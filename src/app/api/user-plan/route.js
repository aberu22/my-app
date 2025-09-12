import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return new Response(JSON.stringify({ error: "Missing UID" }), { status: 400 });
  }

  const docRef = db.collection("users").doc(uid);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  const data = docSnap.data();

  return new Response(
    JSON.stringify({
      plan: data.membershipStatus || "free",
      credits: data.credits ?? 0,
      nextBillingDate: data.nextBillingDate ?? null,
    }),
    { status: 200 }
  );
}