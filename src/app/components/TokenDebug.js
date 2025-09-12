"use client";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // Adjust path if needed

export default function TokenDebug() {
  const { user } = useAuth(); // 👈 use context instead of getAuth()

  useEffect(() => {
    if (!user) {
      console.warn("⏳ TokenDebug: Waiting for user...");
      return;
    }

    async function testToken() {
      const token = await user.getIdToken(true); // force refresh
      console.log("✅ Firebase ID token length:", token.length);

      const res = await fetch("/videoapi/job-status?id=dummy", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📡 Response from backend (expect 404):", res.status);
    }

    testToken();
  }, [user]); // 👈 run effect when `user` becomes available

  return <p>🧪 TokenDebug: Check your console.</p>;
}
