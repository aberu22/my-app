"use client"


import CreateSidebar from "../components/CreateSidebar";
import ImageGenerationPanel from "../components/ImageGenerationPanel";

export default function ImageToVideoPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-zinc-800 to-gray-800 text-white">
      <CreateSidebar mode="video" />
      <main className="flex-1 p-6 overflow-auto">
        <ImageGenerationPanel mode="video" />
      </main>
    </div>
  );
}
