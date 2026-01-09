// app/api/videoapi/generate-text-video-sora/route.js
import { NextResponse } from "next/server";

const API_BASE = "https://api.kie.ai/api/v1/jobs";
const MODEL_ID = "sora-2-pro-text-to-video";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      prompt,
      aspect_ratio = "landscape",
      n_frames = "10",
      size = "high",
      remove_watermark = true,
    } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE}/createTask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        input: {
          prompt: prompt.trim(),
          aspect_ratio,
          n_frames: String(n_frames),
          size,
          remove_watermark: Boolean(remove_watermark),
        },
      }),
    });

    const json = await res.json();

    if (!res.ok || !json?.data?.taskId) {
      console.error("Sora createTask failed:", json);
      return NextResponse.json(
        { error: json?.msg || "Sora createTask failed" },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      taskId: json.data.taskId,
    });
  } catch (err) {
    console.error("Sora POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${API_BASE}/recordInfo?taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
        },
      }
    );

    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: json?.msg || "Polling failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error("Sora polling error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
