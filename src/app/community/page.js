"use client";


import CommunityCreations from "../components/CommunityCreations";

export default function CommunityPage() {
  return (
    <div className="min-h-screen text-white p-6 bg-background text-textPrimary">
      <h1 className="text-3xl font-bold mb-4 text-center">Community Creations</h1>
      <CommunityCreations />
    </div>
  );
}


