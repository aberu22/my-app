"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref as storageRef,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function AssetsPage() {
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [activeAsset, setActiveAsset] = useState(null);

  const q = useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, "assets"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user?.uid]);

  useEffect(() => {
    if (!q) {
      setAssets([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(q, (snap) => {
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [q]);

  const handleDownload = useCallback(async (asset) => {
    const ref = storageRef(storage, asset.storagePath);
    const url = await getDownloadURL(ref);
    const a = document.createElement("a");
    a.href = url;
    a.download = asset.name;
    a.click();
  }, []);

  const handleDelete = useCallback(async (asset) => {
    if (!confirm("Delete this asset permanently?")) return;
    setBusyId(asset.id);
    try {
      await deleteObject(storageRef(storage, asset.storagePath));
      await deleteDoc(doc(db, "assets", asset.id));
    } finally {
      setBusyId(null);
      setActiveAsset(null);
    }
  }, []);

  /* ===================== AUTH GUARD ===================== */

  if (!user) {
    return (
      <main className="min-h-[100svh] bg-zinc-950 flex items-center justify-center px-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-10 text-center">
          <h1 className="text-2xl font-semibold mb-2">My Assets</h1>
          <p className="text-sm text-neutral-400">
            You must log in to see your assets.
          </p>
        </div>
      </main>
    );
  }

  /* ===================== MAIN UI ===================== */

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-6">
      <h1 className="text-2xl font-semibold mb-4">My Assets</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {assets.map((asset) => (
          <li
            key={asset.id}
            onClick={() => setActiveAsset(asset)}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 cursor-pointer hover:border-zinc-600 transition"
          >
            <Thumb asset={asset} />

            <div className="mt-3 flex justify-between gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(asset);
                }}
                className="px-3 py-2 rounded-xl border border-zinc-700 text-sm"
              >
                Download
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(asset);
                }}
                disabled={busyId === asset.id}
                className="px-3 py-2 rounded-xl border border-zinc-700 text-sm"
              >
                {busyId === asset.id ? "Deleting…" : "Delete"}
              </button>
            </div>

            <div className="mt-2 text-xs text-neutral-400 truncate">
              {asset.name}
            </div>
          </li>
        ))}
      </ul>

      {/* 🔥 MODAL RENDER */}
      {activeAsset && (
        <AssetViewerModal
          asset={activeAsset}
          onClose={() => setActiveAsset(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </main>
  );
}

/* ===================== THUMB ===================== */

function Thumb({ asset }) {
  if (!asset.imageUrl) {
    return (
      <div className="h-48 rounded-xl bg-zinc-800 flex items-center justify-center text-xs text-red-400">
        Missing imageUrl
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-zinc-900">
      <Image
        src={asset.imageUrl}
        alt={asset.name}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

/* ===================== MODAL ===================== */




function AssetViewerModal({ asset, onClose, onDownload, onDelete }) {
  const images = asset.images?.length
    ? asset.images
    : [asset.imageUrl];

  const [activeIndex, setActiveIndex] = useState(0);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* click outside */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-neutral-300 hover:text-white transition"
        >
          <span className="text-xl">←</span>
          <span className="hidden sm:inline">Back</span>
        </button>

        <button
          onClick={onClose}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition text-neutral-300 hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* MAIN */}
      <div className="relative z-10 h-full w-full flex pt-14">
        {/* IMAGE VIEWER */}
        <div className="flex-1 flex items-center justify-center px-10">
          <img
            src={images[activeIndex]}
            alt={asset.name}
            className="max-h-full max-w-full rounded-xl shadow-2xl"
          />
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[420px] bg-zinc-950 border-l border-zinc-800 flex">
          {/* INFO */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="text-sm text-neutral-400">Images</div>

            <div className="text-xs text-neutral-500">
              {asset.createdAt?.toDate?.().toLocaleString?.()}
            </div>

            {/* PROMPT */}
            {asset.prompt && (
              <div>
                <div className="text-sm font-semibold mb-1">Prompt</div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {asset.prompt}
                </p>
              </div>
            )}

            {/* TAGS */}
            <div className="flex gap-2 text-xs mt-2">
              <span className="px-2 py-1 rounded bg-zinc-800">
                IMAGE 2.1
              </span>
              <span className="px-2 py-1 rounded bg-zinc-800">
                High-Res
              </span>
            </div>

            {/* ACTIONS */}
            <div className="mt-4 flex gap-3">
              <IconButton
                label="Download"
                onClick={() =>
                  onDownload({
                    ...asset,
                    imageUrl: images[activeIndex],
                  })
                }
              >
                ⬇
              </IconButton>

              <IconButton
                label="Delete"
                danger
                onClick={() => onDelete(asset)}
              >
                🗑
              </IconButton>
            </div>

            <div className="mt-auto text-xs text-neutral-500">
              Generated with StableDiffusion AI ✨
            </div>
          </div>

          {/* THUMBNAILS */}
          <div className="w-[96px] border-l border-zinc-800 p-2 overflow-y-auto flex flex-col gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`relative rounded-lg overflow-hidden border transition
                  ${
                    i === activeIndex
                      ? "border-green-500"
                      : "border-zinc-700 hover:border-zinc-500"
                  }
                `}
              >
                <img
                  src={img}
                  alt=""
                  className="h-20 w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== */

function IconButton({ children, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition
        ${
          danger
            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
            : "bg-zinc-800 hover:bg-zinc-700"
        }
      `}
    >
      <span className="text-lg">{children}</span>
      {label}
    </button>
  );
}

