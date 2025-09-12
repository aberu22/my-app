"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";        // <-- adjust if needed
import { db, storage } from "@/lib/firebase";           // <-- adjust if needed
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
import { getExpectedRequestStore } from "next/dist/server/app-render/work-unit-async-storage.external";

/**
 * Enhanced Assets Page
 * - Full-height page with dark background
 * - Sticky header
 * - Responsive, equal-height cards (auto-rows-fr)
 * - Live Firestore query (where userId == uid, orderBy createdAt desc)
 * - Download via Storage (prefers storagePath)
 * - Delete (Storage then Firestore)
 */

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null); // assetId while deleting

  // Build query only when signed in
  const q = useMemo(() => {
    if (!user?.uid) return null;
    return query(
      collection(db, "assets"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user?.uid]);

  // Live subscription
  useEffect(() => {
    if (!q) return;
    setLoading(true);
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssets(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load assets:", err);
        setAssets([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [q]);

  const handleDownload = useCallback(async (asset) => {
    try {
      if (asset?.storagePath) {
        const ref = storageRef(storage, asset.storagePath);
        const url = await getDownloadURL(ref);
        triggerDownload(url, asset?.name || inferFilename(asset));
      } else if (asset?.imageUrl) {
        triggerDownload(asset.imageUrl, asset?.name || inferFilename(asset));
      } else {
        alert("No file reference found for this asset.");
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download this asset.");
    }
  }, []);





  const handleDelete = useCallback(async (asset) => {
    if (!asset?.id) return;
    if (!confirm("Delete this asset permanently?")) return;

    setBusyId(asset.id);
    try {
      // 1) delete Storage object (ok if missing)
      if (asset.storagePath) {
        const ref = storageRef(storage, asset.storagePath);
        try {
          await deleteObject(ref);
        } catch (err) {
          // if already gone, continue; otherwise bubble up
          if (err?.code !== "storage/object-not-found") throw err;
        }
      }
      // 2) delete Firestore doc
      await deleteDoc(doc(db, "assets", asset.id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete this asset.");
    } finally {
      setBusyId(null);
    }
  }, []);

  if (!user) {
    return (
      <main className="min-h-[100svh] w-full bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <h1 className="text-2xl font-semibold mb-2">My Assets</h1>
          <p className="text-sm text-neutral-400">Please sign in to view your assets.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] w-full bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Sticky page header */}
        <div className="sticky top-[64px] z-10 -mx-6 px-6 py-4 mb-4 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">My Assets</h1>
            <span className="text-xs text-neutral-400">
              {loading ? "Loading…" : `${assets.length} item${assets.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonGrid />
        ) : assets.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 flex flex-col"
              >
                <Thumb asset={asset} />

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDownload(asset)}
                    className="px-3 py-2 rounded-xl border border-zinc-700 text-sm hover:bg-zinc-800/60 transition"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    disabled={busyId === asset.id}
                    className="px-3 py-2 rounded-xl border border-zinc-700 text-sm hover:bg-red-500/10 disabled:opacity-60 transition"
                  >
                    {busyId === asset.id ? "Deleting…" : "Delete"}
                  </button>
                </div>

                <MetaLine asset={asset} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

/* ===================== Helpers & Subcomponents ===================== */

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `asset-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 p-10 text-center text-neutral-400 bg-zinc-900/30">
      <div className="mx-auto mb-4 h-14 w-14 rounded-xl border border-zinc-800 grid place-items-center bg-zinc-900">
        <svg width="24" height="24" viewBox="0 0 24 24" className="opacity-70">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <polyline points="21 15 16 10 5 21" fill="none" stroke="currentColor" />
        </svg>
      </div>
      <p className="mb-1 text-neutral-300">You don’t have any assets yet.</p>
      <p className="text-xs">Save items from your generator to see them here.</p>
    </div>
  );
}

function SkeletonGrid() {
  const items = Array.from({ length: 8 });
  return (
    <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 auto-rows-fr">
      {items.map((_, i) => (
        <li
          key={i}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 animate-pulse"
        >
          <div className="w-full aspect-square rounded-xl bg-zinc-800/70" />
          <div className="mt-3 h-9 rounded-xl bg-zinc-800/70" />
          <div className="mt-2 h-4 rounded bg-zinc-800/70" />
        </li>
      ))}
    </ul>
  );
}

function Thumb({ asset }) {
  const alt = asset?.name || "Asset";
  const src = asset?.imageUrl || "";
  const looksLikeImage = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(asset?.name || src);

  if (looksLikeImage && src) {
    return (
      <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-zinc-900">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw"
          // uncomment if you haven't configured next/image domains yet:
          // unoptimized
        />
      </div>
    );
  }

  // Non-image: generic file card
  return (
    <div className="w-full aspect-square rounded-xl border border-zinc-800 grid place-items-center p-4 bg-zinc-900">
      <div className="text-center">
        <div className="text-sm font-medium truncate max-w-[15rem] text-neutral-200">
          {asset?.name || "Asset"}
        </div>
        <div className="text-xs text-neutral-500">No preview</div>
      </div>
    </div>
  );
}

function MetaLine({ asset }) {
  const created =
    asset?.createdAt?.toDate?.() instanceof Date
      ? asset.createdAt.toDate()
      : null;
  return (
    <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
      <span className="truncate max-w-[70%]">
        {asset?.name || inferFilename(asset) || "—"}
      </span>
      <span title={created?.toLocaleString?.() || ""}>
        {created ? timeAgo(created) : ""}
      </span>
    </div>
  );
}

function timeAgo(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function inferFilename(asset) {
  if (asset?.name) return asset.name;
  try {
    if (asset?.imageUrl) {
      const u = new URL(asset.imageUrl);
      const last = u.pathname.split("/").pop();
      return last?.split("?")[0] || null;
    }
  } catch {}
  return null;
}
