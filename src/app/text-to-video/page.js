

"use client";

import React from "react";
import VideoGenerationPanel from "../components/VideoGenerationPanel";

export default function TextToVideoPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🎥 Text-to-Video Generator</h1>
      <VideoGenerationPanel />
    </div>
  );
}
