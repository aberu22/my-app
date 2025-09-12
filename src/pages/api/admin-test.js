import { db } from "@/lib/firebase-admin";

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("users").limit(1).get();
    const users = snapshot.docs.map(doc => doc.data());

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Admin SDK error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
