const admin = require("firebase-admin");
const path = require("path");

// Load service account
const serviceAccount = require(path.join(__dirname, "service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function migrate() {
  const snap = await db.collection("images").get();

  let updated = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (!("rating" in data)) {
      await d.ref.update({
        rating: "R",
        nsfw: true,
        isSensitive: true,
      });
      updated++;
    }
  }

  console.log(`✅ Migration complete. Updated ${updated} documents.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
