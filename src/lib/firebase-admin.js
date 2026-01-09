// src/lib/firebase-admin.js
import admin from "firebase-admin";


if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
     storageBucket: "ai-gen-5eace.firebasestorage.app",
  });
}

const db = admin.firestore();
const app = admin.app();

export { admin, app, db };
