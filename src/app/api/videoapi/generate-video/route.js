export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyUser } from "../../../../lib/verifyUser";
import { admin } from "@/lib/firebase-admin";
import FormData from "form-data";


export async function POST(req) {
  console.log("🔥 Route hit — /videoapi/generate-video");

  try {
    const rawForm = await req.formData();

    const prompt = rawForm.get("prompt");
    const negative_prompt = rawForm.get("negative_prompt");
    const lora_name = rawForm.get("lora_name");
    const fps = rawForm.get("fps");
    const duration = rawForm.get("duration");
    const imageBlob = rawForm.get("image");

    console.log("🎯 Incoming Prompt:", prompt);

    const { uid, user, userRef } = await verifyUser(req, { prompt });

    console.log("👤 Verified UID:", uid);
    console.log("💳 Membership:", user.membershipStatus, "| Credits:", user.credits);

    if (user.membershipStatus === "free") {
      await admin.firestore().runTransaction(async (tx) => {
        const doc = await tx.get(userRef);
        const credits = doc.data()?.credits ?? 0;

        if (credits < 1) {
          console.log("❌ User is out of credits");
          throw new Error("You are out of credits");
        }

        tx.update(userRef, {
          credits: admin.firestore.FieldValue.increment(-1),
        });

        console.log("✅ 1 credit deducted for", uid);
      });
    }

    const proxyForm = new FormData();
    proxyForm.append("prompt", prompt);
    proxyForm.append("negative_prompt", negative_prompt);
    proxyForm.append("lora_name", lora_name);
    proxyForm.append("fps", fps);
    proxyForm.append("duration", duration);
    proxyForm.append("image", imageBlob, "image.png");

    const backendRes = await fetch("https://5gn30iqkk8hxgq-8899.proxy.runpod.net/videoapi/generate-video", {
      method: "POST",
      headers: proxyForm.getHeaders?.(),
      body: proxyForm,
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      console.error("⚠️ Backend error from RunPod:", backendData);
      throw new Error(backendData?.error || "Video generation failed");
    }

    console.log("🚀 Job sent to backend. Job ID:", backendData.job_id);

    return NextResponse.json({ job_id: backendData.job_id });
  } catch (err) {
    console.error("❌ generate-video failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
}
