"use client";

import UpscalingHero from "./UpscalingHero";

import CreateSidebar from "@/app/components/CreateSidebar";

export default function UpscalingPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <CreateSidebar mode="upscaling" />

      <main className="flex-1 sm:ml-72">
        <UpscalingHero />
      </main>
    </div>
  );
}
