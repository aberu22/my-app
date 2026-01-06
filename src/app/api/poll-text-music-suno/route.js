import { NextResponse } from "next/server";

// Ensure global store exists
globalThis.__SUNO_RESULTS__ ||= new Map();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");

  if (!taskId) {
    return NextResponse.json(
      { status: "error", error: "Missing taskId" },
      { status: 400 }
    );
  }

  // ✅ Check callback results FIRST
  const tracks = globalThis.__SUNO_RESULTS__.get(taskId);

  if (tracks) {
    return NextResponse.json({
      status: "complete",
      tracks,
    });
  }

  // ⏳ Still waiting for callback
  return NextResponse.json({
    status: "generating",
  });
}
