'use client';

import { useState, useRef, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FiGlobe, FiLock, FiTrash2, FiClipboard } from 'react-icons/fi';
import { serverTimestamp } from 'firebase/firestore';

export default function VideoActionMenu({
  videoId,
  prompt,
  isPublic,
  onVisibilityChange,
  onDeleted,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        btnRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  async function handlePublishToggle() {
    const user = auth.currentUser;
    if (!user) return;

    const videoRef = doc(db, 'videos', videoId);

    if (isPublic) {
      // UNPUBLISH
      await updateDoc(videoRef, {
        isPublic: false,
        publishedAt: null,
      });
      onVisibilityChange?.(videoId, false);
    } else {
      // PUBLISH
      await updateDoc(videoRef, {
        isPublic: true,
        publishedAt: serverTimestamp(),
      });
      onVisibilityChange?.(videoId, true);
    }

    setOpen(false);
  }

  async function handleDelete() {
    if (!confirm('Delete this video permanently?')) return;
    await deleteDoc(doc(db, 'videos', videoId));
    onDeleted?.(videoId);
    setOpen(false);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt || '');
    setOpen(false);
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="
          h-9 w-9 rounded-full
          bg-zinc-900/70
          border border-white/10
          text-zinc-200
          backdrop-blur-md
          hover:bg-zinc-800/80
          transition
        "
        aria-label="Video actions"
      >
        ⋯
      </button>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          className="
            absolute right-0 mt-2 w-48
            rounded-2xl
            bg-zinc-950/90
            backdrop-blur-2xl
            border border-white/10
            shadow-[0_20px_80px_rgba(0,0,0,0.85)]
            ring-1 ring-white/5
            p-1
            z-50
          "
        >
          <MenuItem
            icon={<FiClipboard />}
            label="Copy prompt"
            onClick={copyPrompt}
          />

          <MenuItem
            icon={isPublic ? <FiLock /> : <FiGlobe />}
            label={isPublic ? 'Unpublish' : 'Publish'}
            onClick={handlePublishToggle}
          />

          <MenuItem
            icon={<FiTrash2 />}
            label="Delete"
            destructive
            onClick={handleDelete}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, destructive }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex w-full items-center gap-3
        rounded-xl px-3 py-2 text-sm
        transition
        ${
          destructive
            ? 'text-red-400 hover:bg-red-500/10'
            : 'text-zinc-200 hover:bg-white/5'
        }
      `}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
    </button>
  );
}
