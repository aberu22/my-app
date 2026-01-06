import { NextResponse } from "next/server";

// simple in-memory store for now
globalThis.__SUNO_RESULTS__ ||= new Map();

export async function POST(req) {
  try {
    const body = await req.json();

    const { data } = body;
    const taskId = data?.task_id;
    const callbackType = data?.callbackType;

    if (!taskId) {
      return NextResponse.json({ ok: true });
    }

    // Only store when COMPLETE
    if (callbackType === "complete") {
      globalThis.__SUNO_RESULTS__.set(taskId, data.data || []);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
