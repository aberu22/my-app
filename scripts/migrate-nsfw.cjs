const admin = require("firebase-admin");
const path = require("path");

// ----------------------------------
// Firebase Admin Init
// ----------------------------------
const serviceAccount = require(path.join(
  __dirname,
  "service-account.json"
));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ----------------------------------
// Migration Config
// ----------------------------------
const COLLECTIONS = ["images", "videos"];

const DEFAULT_FIELDS = {
  rating: "R",
  nsfw: true,
  isSensitive: true,
};

// ----------------------------------
// Migration Logic
// ----------------------------------
async function migrateCollection(collectionName) {
  console.log(`🔄 Migrating collection: ${collectionName}`);

  const snap = await db.collection(collectionName).get();
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // Only update if ANY field is missing
    const missing = Object.keys(DEFAULT_FIELDS).some(
      (key) => !(key in data)
    );

    if (!missing) continue;

    await doc.ref.update({
      ...DEFAULT_FIELDS,
    });

    updated++;
  }

  console.log(
    `✅ ${collectionName}: Updated ${updated} documents`
  );
}

// ----------------------------------
// Runner
// ----------------------------------
async function migrate() {
  for (const collection of COLLECTIONS) {
    await migrateCollection(collection);
  }

  console.log("🎉 Migration complete for all collections.");
  process.exit(0);
}

// ----------------------------------
// Execute
// ----------------------------------
migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
