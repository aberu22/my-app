// src/app/profile/[username]/page.js
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ProfileHeader from "@/app/components/ProfileHeader";
import ProfileStatsBar from "@/app/components/ProfileStatsBar";
import ProfileTabs from "@/app/components/ProfileTabs";
import PublishedGrid from "@/app/components/PublishedGrid";

export default function ProfilePage() {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Replace with real API call
    async function fetchProfile() {
      setLoading(true);

      // MOCK DATA (replace later)
      setProfile({
        username,
        displayName: username,
        bio: "AI Creator • Visual Storyteller",
        avatar: "/avatar.png",
        stats: {
          followers: 120,
          following: 34,
          likes: 982,
          published: 12,
        },
      });

      setLoading(false);
    }

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-zinc-400">
        Loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen text-zinc-400">
        Profile not found
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProfileHeader profile={profile} />
      <ProfileStatsBar stats={profile.stats} />
      <ProfileTabs />
      <PublishedGrid username={username} />
    </div>
  );
}
