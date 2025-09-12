import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  doc,
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { useImageGeneration } from "@/context/ImageGenrationContext";
import { FiEye, FiEyeOff, FiTrash2, FiLock, FiGlobe } from "react-icons/fi";
import { FaSpinner } from "react-icons/fa";

// ✅ Helper to check if an image URL is valid & accessible
async function urlOk(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

export default function GalleryManager({ generatedImageUrl, prompt, negativePrompt, modelType, imageId }) {
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageDocId, setImageDocId] = useState(null);
  const { deleteImage } = useImageGeneration();

  useEffect(() => {
    autoSaveToPrivateFeed();
  }, [generatedImageUrl, prompt, negativePrompt, modelType, auth.currentUser?.uid]);

  const autoSaveToPrivateFeed = async () => {
    const user = auth.currentUser;
    if (!generatedImageUrl || !user) return;

    // ✅ Skip saving if the image URL is broken or from old structure
    if (!(await urlOk(generatedImageUrl))) {
      console.warn("Skipping broken/legacy imageUrl:", generatedImageUrl);
      return;
    }

    setSaving(true);

    try {
      const q = query(
        collection(db, "images"),
        where("userId", "==", user.uid),
        where("imageUrl", "==", generatedImageUrl)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setImageDocId(docSnap.id);
        setIsPublic(docSnap.data().isPublic);
        setSaving(false);
        return;
      }

      const imageRef = await addDoc(collection(db, "images"), {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        avatar: user.photoURL || "/default-avatar.png",
        imageUrl: generatedImageUrl,
        prompt: prompt || "N/A",
        negativePrompt: negativePrompt || "N/A",
        modelType: modelType || "Unknown",
        isPublic: false,
        createdAt: serverTimestamp(),
      });

      setImageDocId(imageRef.id);
      setIsPublic(false);
      console.log("✅ Image added to Private Feed:", imageRef.id);
    } catch (error) {
      console.error("🚨 Error saving image:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateImageVisibility = async (imageId, newStatus) => {
    if (!imageId) {
      console.error("🚨 No image ID found! Cannot update visibility.");
      return;
    }

    setSaving(true);

    try {
      const imageRef = doc(db, "images", imageId);
      await updateDoc(imageRef, { isPublic: newStatus });
      setIsPublic(newStatus);
      console.log(`✅ Image moved to ${newStatus ? "Public" : "Private"} Feed!`);
    } catch (error) {
      console.error("🚨 Error updating visibility:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const docIdToDelete = imageId || imageDocId;
    if (!docIdToDelete) {
      console.error("No image ID found for deletion");
      return;
    }
    if (!confirm("Are you sure you want to permanently delete this image?")) {
      return;
    }

    setDeleting(true);
    try {
      if (deleteImage && typeof deleteImage === "function") {
        await deleteImage(docIdToDelete);
      } else {
        await deleteDoc(doc(db, "images", docIdToDelete));
      }
      console.log("✅ Image deleted successfully");
      setImageDocId(null);
      setIsPublic(false);
    } catch (error) {
      console.error("🚨 Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="p-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-lg mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      {saving || deleting ? (
        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-800/50 text-zinc-400">
          <FaSpinner className="animate-spin text-purple-400" />
          <span className="text-sm">
            {deleting ? "Deleting..." : "Saving changes..."}
          </span>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          <button
            onClick={() => updateImageVisibility(imageDocId, !isPublic)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              isPublic
                ? "bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800/30 text-purple-300 hover:bg-purple-900/40"
                : "bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-800/70"
            }`}
            disabled={saving || deleting}
          >
            {isPublic ? (
              <>
                <FiGlobe className="text-blue-400" />
                <span>Public</span>
              </>
            ) : (
              <>
                <FiLock className="text-purple-400" />
                <span>Private</span>
              </>
            )}
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-800/30 text-red-300 hover:bg-red-900/40 px-3 py-2 rounded-lg transition-all text-sm font-medium"
            disabled={saving || deleting}
          >
            {deleting ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <>
                <FiTrash2 />
                <span>Delete</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {isPublic ? (
            <span className="flex items-center gap-1 text-blue-400">
              <FiEye className="text-xs" /> Visible to everyone
            </span>
          ) : (
            <span className="flex items-center gap-1 text-purple-400">
              <FiEyeOff className="text-xs" /> Only visible to you
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
