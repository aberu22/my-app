export const dynamic = "force-dynamic";

import { admin, db } from "@/lib/firebase-admin";
import { getSeedanceCreditCost } from "@/lib/creditCosts";

/* ======================================================
   CREATE TASK — Seedance Image → Video
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

    if (!Array.isArray(body.input_urls) || body.input_urls.length === 0) {
      return Response.json(
        { error: "input_urls is required for image-to-video" },
        { status: 400 }
      );
    }

    if (body.input_urls.length > 2) {
      return Response.json(
        { error: "A maximum of 2 images is allowed" },
        { status: 400 }
      );
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
        : "480p";

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
    console.log("💳 SEEDANCE I2V CHARGE", {
      userId,
      resolution,
      duration,
    });

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

    /* ---------------- CALL SEEDANCE API ---------------- */
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
            input_urls: body.input_urls, // ✅ REQUIRED FOR I2V
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
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Seedance returned invalid JSON");
    }

    /* ---------------- TASK ID EXTRACTION ---------------- */
    const taskId =
      data?.taskId ||
      data?.task_id ||
      data?.data?.taskId ||
      data?.data?.task_id;

    if (!response.ok || !taskId) {
      throw new Error(
        data?.error || data?.msg || "Seedance image-to-video task failed"
      );
    }

    return Response.json({ ...data, taskId }, { status: 200 });

  } catch (err) {
    console.error("❌ Seedance I2V POST error:", err);

    /* ---------------- REFUND ON FAILURE ---------------- */
    if (creditsDeducted && userId && creditsToCharge > 0) {
      try {
        await db.collection("users").doc(userId).update({
          credits: admin.firestore.FieldValue.increment(creditsToCharge),
        });
      } catch (refundErr) {
        console.error("🔥 CREDIT REFUND FAILED:", refundErr);
      }
    }

    return Response.json(
      { error: err.message || "Seedance image-to-video route failed" },
      { status: 500 }
    );
  }
}

/* ======================================================
   POLL TASK STATUS — SAME AS T2V
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
