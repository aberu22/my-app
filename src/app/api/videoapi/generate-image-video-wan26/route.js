export const dynamic = "force-dynamic";

import { admin, db } from "@/lib/firebase-admin";
import { getWan26CreditCost } from "@/lib/creditCosts";

/* ======================================================
   POST — Create Wan 2.6 Image-to-Video Task
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

    if (
      !Array.isArray(body.image_urls) ||
      body.image_urls.length === 0
    ) {
      return Response.json(
        { error: "image_urls is required for image-to-video" },
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
    const duration = ["5", "10", "15"].includes(String(body.duration))
      ? String(body.duration)
      : "5";

    const resolution = ["720p", "1080p"].includes(body.resolution)
      ? body.resolution
      : "720p";

    const multi_shots = Boolean(body.multi_shots);

    /* ---------------- PRICING ---------------- */
    creditsToCharge = getWan26CreditCost({
      duration,
      resolution,
    });

    if (!creditsToCharge || creditsToCharge <= 0) {
      throw new Error(
        `Invalid Wan 2.6 pricing: ${resolution} / ${duration}s`
      );
    }

    console.log("💳 WAN 2.6 I2V CHARGE", {
      userId,
      resolution,
      duration,
      creditsToCharge,
    });

    /* ---------------- DEDUCT CREDITS (ATOMIC) ---------------- */
    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const current = snap.data().credits ?? 0;
      if (current < creditsToCharge) {
        throw new Error("Insufficient credits");
      }

      tx.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-creditsToCharge),
      });
    });

    creditsDeducted = true;

    /* ---------------- CALL KIE API ---------------- */
    const response = await fetch(
      "https://api.kie.ai/api/v1/jobs/createTask",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "wan/2-6-image-to-video",
          input: {
            prompt: body.prompt,
            image_urls: body.image_urls, // ✅ REQUIRED
            duration,
            resolution,
            multi_shots,
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
      throw new Error("Wan 2.6 I2V returned invalid JSON");
    }

    /* ---------------- TASK ID EXTRACTION ---------------- */
    const taskId =
      data?.taskId ||
      data?.task_id ||
      data?.data?.taskId ||
      data?.data?.task_id;

    if (!response.ok || !taskId) {
      throw new Error(data?.msg || "Wan 2.6 image-to-video createTask failed");
    }

    return Response.json({ ...data, taskId }, { status: 200 });

  } catch (err) {
    console.error("❌ Wan 2.6 I2V POST error:", err);

    /* ---------------- REFUND ON FAILURE ---------------- */
    if (creditsDeducted && userId && creditsToCharge > 0) {
      try {
        await db.collection("users").doc(userId).update({
          credits: admin.firestore.FieldValue.increment(creditsToCharge),
        });
      } catch (refundErr) {
        console.error("🔥 Wan 2.6 I2V credit refund failed:", refundErr);
      }
    }

    return Response.json(
      { error: err.message || "Wan 2.6 image-to-video route failed" },
      { status: 500 }
    );
  }
}

/* ======================================================
   GET — Poll Wan 2.6 Image-to-Video Task Status
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

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Wan 2.6 I2V returned invalid JSON" },
      { status: 500 }
    );
  }

  return Response.json(data, { status: response.status });
}
