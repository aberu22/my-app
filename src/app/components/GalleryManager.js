// components/GalleryManager.js
'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  doc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { useImageGeneration } from '@/context/ImageGenrationContext';
import { FiTrash2, FiGlobe, FiLock } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';

/** Quick URL probe so we don’t store broken links */
async function urlOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Props (rendered by ImageActionMenu):
 * - generatedImageUrl: string
 * - prompt: string
 * - negativePrompt: string
 * - modelType: string
 * - imageId?: string               // existing Firestore doc id, if known
 * - uiId?: string                  // UI id from the gallery tile (required for UI callbacks)
 * - onDocId?(uiId, docId): void    // notify gallery once a doc id exists
 * - onDeleted?(uiId, docId): void  // notify gallery after delete
 * - onVisibilityChange?(uiId, isPublic): void // notify gallery after publish/unpublish
 */
export default function GalleryManager({
  generatedImageUrl,
  prompt,
  negativePrompt,
  modelType,
  imageId, // optional Firestore id
  uiId,
  onDocId,
  onDeleted,
  onVisibilityChange,
}) {
  const [imageDocId, setImageDocId] = useState(imageId || null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { deleteImage } = useImageGeneration();

  // Auto-save on mount/changes (private by default)
  useEffect(() => {
    autoSaveToPrivateFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    generatedImageUrl,
    prompt,
    negativePrompt,
    modelType,
    auth.currentUser?.uid,
  ]);

  const autoSaveToPrivateFeed = async () => {
    const user = auth.currentUser;
    if (!generatedImageUrl || !user) return;

    // If we already know the doc id, no need to create/lookup again
    if (imageDocId) {
      onDocId?.(uiId, imageDocId);
      return;
    }

    // Skip saving if URL is not fetchable (avoids broken/legacy links)
    if (!(await urlOk(generatedImageUrl))) {
      console.warn('Skipping broken/legacy imageUrl:', generatedImageUrl);
      return;
    }

    setSaving(true);
    try {
      // De-dupe by user + imageUrl
      const q = query(
        collection(db, 'images'),
        where('userId', '==', user.uid),
        where('imageUrl', '==', generatedImageUrl)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const found = snap.docs[0];
        setImageDocId(found.id);
        setIsPublic(!!found.data().isPublic);
        onDocId?.(uiId, found.id);
        return;
      }

      // Create a new private record
      const ref = await addDoc(collection(db, 'images'), {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        avatar: user.photoURL || '/default-avatar.png',
        imageUrl: generatedImageUrl,
        prompt: prompt || 'N/A',
        negativePrompt: negativePrompt || 'N/A',
        modelType: modelType || 'Unknown',
        isPublic: false,
        createdAt: serverTimestamp(),
      });

      setImageDocId(ref.id);
      setIsPublic(false);
      onDocId?.(uiId, ref.id);
      // eslint-disable-next-line no-console
      console.log('✅ Image added to Private Feed:', ref.id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('🚨 Error saving image:', err);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!imageDocId) return;
    setSaving(true);
    try {
      const next = !isPublic;
      await updateDoc(doc(db, 'images', imageDocId), { isPublic: next });
      setIsPublic(next);
      onVisibilityChange?.(uiId, next);
      // eslint-disable-next-line no-console
      console.log(`✅ ${next ? 'Published' : 'Unpublished'} image`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('🚨 Error toggling publish:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!imageDocId) return;
    if (!confirm('Delete this image permanently?')) return;

    setDeleting(true);
    try {
      // If your context wraps deletion, use it; otherwise delete direct
      if (typeof deleteImage === 'function') {
        await deleteImage(imageDocId);
      } else {
        await deleteDoc(doc(db, 'images', imageDocId));
      }
      onDeleted?.(uiId, imageDocId);
      setImageDocId(null);
      setIsPublic(false);
      // eslint-disable-next-line no-console
      console.log('✅ Image deleted');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('🚨 Error deleting image:', err);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const disabled = saving || deleting || !imageDocId;

  return (
    <div
      className="p-3 bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-lg mt-1"
      onClick={(e) => e.stopPropagation()}
    >
      {saving || deleting ? (
        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-800/50 text-zinc-400">
          <FaSpinner className="animate-spin text-purple-400" />
          <span className="text-sm">
            {deleting ? 'Deleting…' : 'Saving changes…'}
          </span>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          {/* Publish / Unpublish */}
          <button
            onClick={togglePublish}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
              isPublic
                ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-800/30 text-purple-300 hover:bg-purple-900/40'
                : 'bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-800/70'
            } disabled:opacity-50`}
            title={isPublic ? 'Unpublish' : 'Publish'}
          >
            {isPublic ? <FiLock className="text-blue-400" /> : <FiGlobe className="text-purple-400" />}
            <span>{isPublic ? 'Unpublish' : 'Publish'}</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={disabled}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-800/30 text-red-300 hover:bg-red-900/40 px-3 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
            title="Delete"
          >
            <FiTrash2 />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center gap-2 font-semibold transition duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 disabled:aria-pressed:cursor-default disabled:aria-pressed:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-border-10 active:outline-none h-8 px-4 text-xs bg-ghost-0 text-ghost-foreground-0 aria-pressed:bg-ghost-2 hover:enabled:bg-ghost-1 active:enabled:bg-ghost-2 rounded w-full justify-start">
        {imageDocId ? (
          isPublic ? (
            <span className="flex items-center gap-1 text-blue-400">
              <FiGlobe className="text-xs" /> Published
            </span>
          ) : (
            <span className="flex items-center gap-1 text-purple-400">
              <FiLock className="text-xs" /> Unpublished
            </span>
          )
        ) : (
          <span className="text-zinc-500">Preparing…</span>
        )}
      </div>
    </div>
  );
}
