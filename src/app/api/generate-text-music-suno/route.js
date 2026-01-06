import { NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

const MUSIC_COST = 35;

export async function POST(req) {
  let userRef = null;

  try {
    /* --------------------------------------------------
       🔐 AUTH (Firebase ID token)
    -------------------------------------------------- */
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const decoded = await admin.auth().verifyIdToken(token);
    const userId = decoded.uid;

    userRef = db.collection("users").doc(userId);

    /* --------------------------------------------------
       📥 REQUEST BODY
    -------------------------------------------------- */
    const body = await req.json();

    const { model = "V5", instrumental = false, title, style, prompt } = body;

    // 🔒 KIE Playground behavior: always customMode
    const customMode = true;

    /* --------------------------------------------------
       ✅ VALIDATION (exactly like Playground)
    -------------------------------------------------- */
    if (!title || !style) {
      return NextResponse.json(
        { error: "Title and style are required" },
        { status: 400 }
      );
    }

    if (!instrumental && !prompt) {
      return NextResponse.json(
        { error: "Lyrics are required when not instrumental" },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
       💳 ATOMIC CREDIT DEDUCTION
    -------------------------------------------------- */
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) throw new Error("User not found");

      const credits = snap.data().credits ?? 0;
      if (credits < MUSIC_COST) throw new Error("Not enough credits");

      tx.update(userRef, {
        credits: admin.firestore.FieldValue.increment(-MUSIC_COST),
      });
    });

    /* --------------------------------------------------
       🎵 BUILD SUNO PAYLOAD
    -------------------------------------------------- */
    const payload = {
      model,
      customMode,
      instrumental,
      title,
      style,
      callBackUrl:
        process.env.SUNO_CALLBACK_URL ||
        "http://localhost:3000/api/suno-callback",
    };

    if (!instrumental) payload.prompt = prompt;

    console.log("🎵 SUNO GENERATE PAYLOAD:", payload);

    /* --------------------------------------------------
       🚀 CALL KIE API
    -------------------------------------------------- */
    let res;
    try {
      res = await fetch("https://api.kie.ai/api/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // 🔁 REFUND ON NETWORK FAILURE
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(MUSIC_COST),
      });
      throw err;
    }

    const raw = await res.text();
    let json;

    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      console.error("❌ Suno non-JSON response:", raw);

      // 🔁 REFUND
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(MUSIC_COST),
      });

      return NextResponse.json(
        { error: "Invalid Suno response", raw },
        { status: 500 }
      );
    }

    if (!res.ok || !json?.data?.taskId) {
      console.error("❌ Suno API error:", json);

      // 🔁 REFUND
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(MUSIC_COST),
      });

      return NextResponse.json(
        { error: json?.msg || "Suno generation failed", raw: json },
        { status: 500 }
      );
    }

    console.log("✅ SUNO TASK CREATED:", json.data.taskId);

    return NextResponse.json({ taskId: json.data.taskId });
  } catch (err) {
    console.error("❌ generate-text-music-suno crashed:", err);

    // Optional: if you want to be extra safe, you could refund here ONLY if
    // you tracked a boolean like `deducted = true` before calling Suno.

    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
