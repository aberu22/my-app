// src/app/api/nano-banana/route.js

// 🚨 REQUIRED: force Node.js runtime
export const runtime = "nodejs";

import { NextResponse } from "next/server";

// ✅ USE THE CORRECT ENV VAR
const KIE_API_KEY = process.env.SEEDANCE_API_KEY;
const BASE_URL = "https://api.kie.ai/api/v1/jobs";

// Helpful warning if env is missing
if (!KIE_API_KEY) {
  console.warn("⚠️ SEEDANCE_API_KEY is not set");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pollTask(taskId, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(
      `${BASE_URL}/recordInfo?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${KIE_API_KEY}`,
        },
        cache: "no-store",
      }
    );

    const json = await res.json();

    if (json?.data?.state === "success") {
      const resultJson = JSON.parse(json.data.resultJson || "{}");
      return resultJson.resultUrls || [];
    }

    if (json?.data?.state === "fail") {
      throw new Error(json.data.failMsg || "Nano Banana task failed");
    }

    await sleep(2000); // poll every 2s
  }

  throw new Error("Nano Banana polling timeout");
}

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("🍌 Nano Banana request received", {
      promptLength: body?.prompt?.length,
      aspect_ratio: body?.aspect_ratio,
      resolution: body?.resolution,
      output_format: body?.output_format,
    });

    const createRes = await fetch(`${BASE_URL}/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "nano-banana-pro",
        input: {
          prompt: body.prompt,
          image_input: body.image_input ?? [],
          aspect_ratio: body.aspect_ratio ?? "1:1",
          resolution: body.resolution ?? "1K",
          output_format: body.output_format ?? "png",
        },
      }),
    });

    const createJson = await createRes.json();

    if (!createRes.ok || !createJson?.data?.taskId) {
      console.error("❌ Failed to create Nano Banana task", createJson);
      return NextResponse.json(
        { error: "Failed to create Nano Banana task" },
        { status: 500 }
      );
    }

    console.log("⏳ Nano Banana task created", createJson.data.taskId);

    const resultUrls = await pollTask(createJson.data.taskId);

    console.log("✅ Nano Banana completed", resultUrls);

    return NextResponse.json({ resultUrls });
  } catch (err) {
    console.error("❌ Nano Banana route error", err);
    return NextResponse.json(
      { error: err.message || "Nano Banana error" },
      { status: 500 }
    );
  }
}
