"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HeroClient() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/text-to-video?prompt=${encodeURIComponent(prompt)}`);
    } else {
      router.push("/text-to-video");
    }
  };

  return (
    <div className="relative h-screen overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute w-full h-full object-cover z-0"
        src="/assets/landing-bg.mp4"
      />

      <div className="absolute inset-0 bg-black/50 z-10" />

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center px-4">
        <h1 className="text-4xl sm:text-6xl font-bold">FantasyVision.AI</h1>
        <p className="text-2xl italic mt-2 mb-8">One prompt. Infinite directions</p>

        <div className="flex bg-white/90 text-black rounded-full px-4 py-2 items-center w-full max-w-xl">
          <input
            type="text"
            placeholder="A woman twerking while she’s cooking..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 bg-transparent outline-none px-2 py-1 text-sm"
          />
          <button
            onClick={handleGenerate}
            className="bg-black text-white px-4 py-1 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
