// 🔹 MUST be first
const admin = require("firebase-admin");
admin.initializeApp();

// 🔹 MUST be before usage
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { defineSecret } = require("firebase-functions/params");

// 🔹 Other deps
const fetch = require("node-fetch");

// 🔹 Secrets
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// 🔹 ONLY NOW define exports
exports.scanNSFWOnImageCreate = onDocumentCreated(
  {
    document: "images/{imageId}",
    secrets: [OPENAI_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    if (!data?.imageUrl) return;

    try {
      const res = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY.value()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input: [
            {
              type: "input_image",
              image_url: data.imageUrl,
            },
          ],
        }),
      });

      const json = await res.json();
      const categories = json.results?.[0]?.categories;
      if (!categories) throw new Error("No moderation categories");

      let rating = "PG";
      let nsfw = false;

      if (categories.sexual || categories.nudity) {
        rating = "R";
        nsfw = true;
      }

      if (categories.sexual_explicit) {
        rating = "XXX";
        nsfw = true;
      }

      if (categories.sexual_minors) {
        await snap.ref.update({
          moderationStatus: "rejected",
          isPublic: false,
          nsfw: true,
          rating: "ILLEGAL",
        });
        return;
      }

      await snap.ref.update({
        nsfw,
        rating,
        moderationStatus: "approved",
      });

    } catch (err) {
      logger.error("❌ NSFW scan failed", err);
    }
  }
);
