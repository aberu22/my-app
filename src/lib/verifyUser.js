import { admin } from "@/lib/firebase-admin";

/**
 * Verifies the Firebase user making the request.
 * Throws an error if:
 * - No token is provided
 * - Token is invalid
 * - User is not found in Firestore
 * - User is banned or blocked
 * - NSFW content is requested by non-premium users
 * - User has no credits (unless they're premium)
 */
export async function verifyUser(req, { prompt = "" } = {}) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!token) throw new Error("Missing Firebase token");

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }

  const uid = decoded.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data();

  // 🚫 Ban / block enforcement
  if (user.isBanned || user.blocked) {
    throw new Error("Account is restricted");
  }

  // 🔞 NSFW filter check
  const normalizedPrompt = prompt.toLowerCase().replace(/[^a-z]/g, "");
  const isNSFW = normalizedPrompt.includes("nsfw");
  const hasNSFWPermission = user.nsfwAccess === true || user.membershipStatus !== "free";

  if (isNSFW && !hasNSFWPermission) {
    throw new Error("NSFW content is only available to premium members");
  }

  // 💳 Credit check for free-tier users
  const hasCredits = (user.credits ?? 0) > 0;
  const isPremium = user.membershipStatus !== "free" || user.isPremium;

  if (!hasCredits && !isPremium) {
    throw new Error("You are out of credits");
  }

  // ✅ Logging (dev only)
  if (process.env.NODE_ENV === "development") {
    console.log("[verifyUser] ✅ Verified:", uid);
    console.log("[verifyUser] 🧪 NSFW Check:", { isNSFW, nsfwAccess: user.nsfwAccess });
    console.log("[verifyUser] 💳 Credits:", user.credits, "| Membership:", user.membershipStatus);
  }

  return { uid, user, userRef };
}
