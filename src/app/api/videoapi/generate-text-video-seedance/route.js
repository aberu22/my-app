export const dynamic = "force-dynamic";

import { admin, db } from "@/lib/firebase-admin";
import { getSeedanceCreditCost } from "@/lib/creditCosts";

/* ======================================================
   CREATE TASK — SEEDANCE 1.5 PRO (TEXT → VIDEO)
====================================================== */
export async function POST(req) {
  let userId;
  let creditsToCharge = 0;
  let creditsDeducted = false;

  try {
    const body = await req.json();

    /* ---------------- VALIDATION ---------------- */
    if (!body?.prompt?.trim()) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    /* ---------------- AUTH ---------------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await admin.auth().verifyIdToken(token);
    userId = decoded.uid;

    /* ---------------- NORMALIZE INPUT ---------------- */
    const duration = ["4", "8", "12"].includes(String(body.duration))
      ? String(body.duration)
      : "8";

    const resolution =
      body.resolution === "480p" || body.resolution === "720p"
        ? body.resolution
        : "720p";

    const aspect_ratio = [
      "1:1",
      "21:9",
      "4:3",
      "3:4",
      "16:9",
      "9:16",
    ].includes(body.aspect_ratio)
      ? body.aspect_ratio
      : "16:9";

    const fixed_lens = Boolean(body.fixed_lens);
    const generate_audio = Boolean(body.generate_audio);

    /* ---------------- PRICING ---------------- */
    creditsToCharge = getSeedanceCreditCost({ duration, resolution });

    /* ---------------- DEDUCT CREDITS ---------------- */
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const currentCredits = snap.data().credits ?? 0;
      if (currentCredits < creditsToCharge) {
        throw new Error("Insufficient credits");
      }

      tx.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-creditsToCharge),
      });
    });

    creditsDeducted = true;

    /* ---------------- CALL SEEDANCE ---------------- */
    const response = await fetch(
      "https://api.kie.ai/api/v1/jobs/createTask",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "bytedance/seedance-1.5-pro",
          input: {
            prompt: body.prompt,
            aspect_ratio,
            resolution,
            duration,
            fixed_lens,
            generate_audio,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      }
    );

    const raw = await response.text();
    const data = JSON.parse(raw);

    const taskId =
      data?.taskId ||
      data?.task_id ||
      data?.data?.taskId ||
      data?.data?.task_id;

    if (!response.ok || !taskId) {
      throw new Error(data?.msg || "Seedance text-to-video task failed");
    }

    return Response.json({ ...data, taskId }, { status: 200 });

  } catch (err) {
    console.error("❌ Seedance T2V error:", err);

    if (creditsDeducted && userId && creditsToCharge > 0) {
      await db.collection("users").doc(userId).update({
        credits: admin.firestore.FieldValue.increment(creditsToCharge),
      });
    }

    return Response.json(
      { error: err.message || "Seedance text-to-video route failed" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POLL TASK STATUS — SAME AS I2V
====================================================== */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return Response.json({ error: "taskId is required" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
      },
      signal: AbortSignal.timeout(30_000),
    }
  );

  const data = await response.json();
  return Response.json(data, { status: response.status });
}
