"use client";

import HomeLayout from "../layouts/HomeLayout";
import FeaturedGuides from "../components/FeaturedGuides";
import CommunityCreations from "../components/CommunityCreations";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      
      <HomeLayout>
        <FeaturedGuides />
        <CommunityCreations />
      </HomeLayout>
    </div>
  );
}
