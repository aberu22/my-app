// components/ImageActionMenu.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
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
import { FiTrash2, FiGlobe, FiLock, FiClipboard, FiBookmark } from 'react-icons/fi';

async function urlOk(url) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * Props:
 * - generatedImageUrl: string
 * - prompt: string
 * - negativePrompt: string
 * - modelType: string
 * - imageId?: string
 * - uiId: string
 * - onDocId?(uiId, docId)
 * - onDeleted?(uiId, docId)
 * - onVisibilityChange?(uiId, isPublic)
 */
export default function ImageActionMenu({
  generatedImageUrl,
  prompt,
  negativePrompt,
  modelType,
  imageId,
  uiId,
  onDocId,
  onDeleted,
  onVisibilityChange,
}) {
  const [open, setOpen] = useState(false);

  const [imageDocId, setImageDocId] = useState(imageId || null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // ------- outside-click & ESC close -------
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  // ------- auto-save private record once we have a URL & user -------
  useEffect(() => {
    autoSaveToPrivateFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedImageUrl, prompt, negativePrompt, modelType, auth.currentUser?.uid]);

  async function autoSaveToPrivateFeed() {
    const user = auth.currentUser;
    if (!generatedImageUrl || !user) return;

    if (imageDocId) {
      onDocId?.(uiId, imageDocId);
      return;
    }

    if (!(await urlOk(generatedImageUrl))) return;

    setSaving(true);
    try {
      // dedupe by user + url
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
    } catch (err) {
      console.error('Error saving image:', err);
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    if (!imageDocId) return;
    setSaving(true);
    try {
      const next = !isPublic;
      await updateDoc(doc(db, 'images', imageDocId), { isPublic: next });
      setIsPublic(next);
      onVisibilityChange?.(uiId, next);
      setOpen(false);
    } catch (err) {
      console.error('Error toggling publish:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!imageDocId) return;
    if (!confirm('Delete this image permanently?')) return;

    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'images', imageDocId));
      onDeleted?.(uiId, imageDocId);
      setImageDocId(null);
      setIsPublic(false);
      setOpen(false);
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  const disabled = saving || deleting || !imageDocId;

//copy function
  async function copyToClipboard(text) {
  // 1) Modern API (requires secure context: https or localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text || '');
      return true;
    } catch (e) {
      // fall through
    }
  }

  // 2) Fallback: hidden textarea + execCommand (works in Safari/iOS, http)
  try {
    const ta = document.createElement('textarea');
    ta.value = text || '';
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}


  // ------- UI -------
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* trigger (3 dots) */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="h-8 w-8 rounded-lg bg-black/55 hover:bg-black/65 ring-1 ring-white/15
                   flex items-center justify-center text-white/90"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {/* menu */}
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#101214]/95 text-white/90
                     ring-1 ring-white/10 backdrop-blur-xl shadow-[0_20px_70px_-20px_rgba(0,0,0,.6)] p-1 z-50"
        >
         <MenuItem
  icon={<FiClipboard className="text-[16px]" />}
  label="Copy prompt"
  onClick={async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(prompt ?? '');
    // replace alert with your toast lib if you have one
    if (ok) {
      // toast.success('Prompt copied');
    } else {
      alert('Could not copy. On mobile/Safari, long-press to copy.');
    }
    setOpen(false);
  }}
/>

          <MenuItem
            icon={<FiBookmark className="text-[16px]" />}
            label="Save as style"
            onClick={() => {
              // hook up your style-save flow here
              // e.g. openStyleModal({ prompt, negativePrompt, modelType })
              setOpen(false);
            }}
          />
          <MenuItem
            icon={isPublic ? <FiLock className="text-[16px]" /> : <FiGlobe className="text-[16px]" />}
            label={isPublic ? 'Unpublish' : 'Publish'}
            onClick={togglePublish}
            disabled={disabled}
          />
          <MenuItem
            icon={<FiTrash2 className="text-[16px]" />}
            label="Delete"
            onClick={handleDelete}
            destructive
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, destructive = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[14px]',
        'hover:bg-white/10 transition',
        destructive ? 'text-red-300 hover:text-red-200' : 'text-white/90 hover:text-white',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
