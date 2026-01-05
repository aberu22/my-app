// lib/uploadSeedanceImage.js
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function uploadSeedanceImage(file) {
  const storage = getStorage();

  const fileRef = ref(
    storage,
    `seedance-inputs/${Date.now()}-${file.name}`
  );

  await uploadBytes(fileRef, file);
  const publicUrl = await getDownloadURL(fileRef);

  return publicUrl; // 🔥 THIS is what Seedance needs
}
