// utils/saveAsset.js
import { db, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadString,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

/**
 * Normalize and validate a filename.
 */
function safeName(name) {
  const base = String(name || `asset-${Date.now()}.png`)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, ""); // keep . and _ for extensions
  return base || `asset-${Date.now()}.png`;
}

/**
 * Add doc safely (omit undefined fields)
 */
async function addAssetDocSafe({
  userId,
  imageUrl,      // must be a string
  storagePath,   // string or null
  name,          // string
}) {
  if (!userId) throw new Error("addAssetDocSafe: missing userId");
  if (!imageUrl) throw new Error("addAssetDocSafe: missing imageUrl string");
  const data = {
    userId,
    imageUrl,
    storagePath: storagePath || null, // use null, not undefined
    name: safeName(name),
    createdAt: serverTimestamp(),
  };
  // DEBUG: uncomment if needed
  // console.log("addAssetDocSafe payload:", data);
  return addDoc(collection(db, "assets"), data);
}

/**
 * Save a base64 data URL to /assets/{uid}/{name}
 * base64 must be like "data:image/png;base64,AAAA..."
 */
export async function saveAssetFromBase64({ uid, base64, name }) {
  if (!uid) throw new Error("saveAssetFromBase64: missing uid");
  if (!base64) throw new Error("saveAssetFromBase64: missing base64");

  const finalName = safeName(name);
  const path = `assets/${uid}/${finalName}`;
  const fileRef = storageRef(storage, path);

  // Ensure "data:" prefix exists
  const payload = base64.startsWith("data:")
    ? base64
    : `data:image/png;base64,${base64}`;

  await uploadString(fileRef, payload, "data_url");
  const downloadUrl = await getDownloadURL(fileRef);
  if (!downloadUrl) throw new Error("getDownloadURL returned empty string");

  const docRef = await addAssetDocSafe({
    userId: uid,
    imageUrl: downloadUrl,
    storagePath: path,
    name: finalName,
  });

  return { id: docRef.id, imageUrl: downloadUrl, storagePath: path, name: finalName };
}

/**
 * Save from an existing URL by re-uploading into /assets (so owner-only rules apply)
 * Works with http(s) URLs and data: URLs.
 */
export async function saveAssetFromUrl({ uid, url, name }) {
  if (!uid) throw new Error("saveAssetFromUrl: missing uid");
  if (!url) throw new Error("saveAssetFromUrl: missing url");

  // Fetch the bytes (data: URLs work with fetch in the browser)
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`saveAssetFromUrl: fetch failed (${res.status})`);
  }
  const buf = await res.arrayBuffer();

  const finalName = safeName(name);
  const path = `assets/${uid}/${finalName}`;
  const fileRef = storageRef(storage, path);

  await uploadBytes(fileRef, new Uint8Array(buf));
  const downloadUrl = await getDownloadURL(fileRef);
  if (!downloadUrl) throw new Error("getDownloadURL returned empty string");

  const docRef = await addAssetDocSafe({
    userId: uid,
    imageUrl: downloadUrl,
    storagePath: path,
    name: finalName,
  });

  return { id: docRef.id, imageUrl: downloadUrl, storagePath: path, name: finalName };
}
