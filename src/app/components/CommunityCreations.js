"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Firebase
import { db, auth } from "@/lib/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  deleteDoc,
} from "firebase/firestore";

// Context
import { useImageGeneration } from "@/context/ImageGenrationContext";

// shadcn/ui
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Icons (lucide)
import {
  Heart,
  Share2,
  Copy,
  Loader2,
  MessageSquare,
  Sparkles,
  X,
  Send,
  Repeat2,
  Trash2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                            SensitiveImageGuard                              */
/* -------------------------------------------------------------------------- */

const FORCE_SENSITIVE = true; // TEMP: force the overlay to verify it appears


function SensitiveImageGuard({
  id,
  src,
  alt,
  isSensitive,
  className = "",
  imgProps = {},
  onRevealed,
}) {
  const [revealedIds, setRevealedIds] = React.useState(new Set());

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("revealedImageIds");
      if (raw) setRevealedIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  


  const persist = React.useCallback((nextSet) => {
    setRevealedIds(nextSet);
    try { localStorage.setItem("revealedImageIds", JSON.stringify([...nextSet])); } catch {}
  }, []);

  const isRevealed = revealedIds.has(id);

  const handleShow = (e) => {
    e.stopPropagation(); // don't open the dialog
    const next = new Set(revealedIds);
    next.add(id);
    persist(next);
    onRevealed?.(id);
  };

  // ✅ If not sensitive OR already revealed, show the normal image (no blur, no overlay)
  if (!isSensitive || isRevealed) {
    return (
      <Image
        src={src}
        alt={alt}
        {...imgProps}
        className={`${imgProps.className ?? ""} ${className}`}
      />
    );
  }

  // 🚫 Blocked state
  return (
    <div className={`relative block ${className}`}>
      {/* Keep image mounted/blurred for layout stability */}
      <Image
        src={src}
        alt={alt}
        {...imgProps}
        className={`${imgProps.className ?? ""} blur-2xl scale-105`}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-20 grid place-items-center bg-black/90"
        role="dialog"
        aria-label="Sensitive content"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-white/90 text-lg">This image is rated</p>
          <span className="px-3 py-1 rounded-md bg-red-800/90 text-white font-semibold tracking-wide">
            XXX
          </span>
          <Button onClick={handleShow} className="px-6" aria-label="Show this image">
            Show
          </Button>
          <p className="text-xs text-white/50 max-w-xs">
            Click “Show” to reveal once. Your choice is remembered for this image.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           CommunityCreations Page                           */
/* -------------------------------------------------------------------------- */

export default function CommunityCreations() {
  const router = useRouter();
  const { toast } = useToast();
  const { setPrompt, setNegativePrompt } = useImageGeneration();

  const [gallery, setGallery] = useState([]);
  const [selected, setSelected] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [comments, setComments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPaging, setIsPaging] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const pageSize = 24;

  /* ---------------- Fetch & realtime updates (first page) ----------------- */
  useEffect(() => {
    const q1 = query(
      collection(db, "images"),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const unsub = onSnapshot(
      q1,
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.createdAt);
        setGallery(docs);
        setNextCursor(snap.docs[snap.docs.length - 1] || null);
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        setIsLoading(false);
        toast({
          title: "Couldn't load gallery",
          description: err.message,
          variant: "destructive",
        });
      }
    );

    return () => unsub();
  }, [toast]);

  /* -------------------- Paging (load more) via one-shot ------------------- */
  const loadMore = useCallback(async () => {
    if (!nextCursor || isPaging) return;
    try {
      setIsPaging(true);
      const q2 = query(
        collection(db, "images"),
        where("isPublic", "==", true),
        orderBy("createdAt", "desc"),
        startAfter(nextCursor),
        limit(pageSize)
      );
      const snap = await getDocs(q2);
      const more = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setGallery((prev) => [...prev, ...more]);
      setNextCursor(snap.docs[snap.docs.length - 1] || null);
    } catch (e) {
      console.error(e);
      toast({ title: "Couldn't load more", description: e.message, variant: "destructive" });
    } finally {
      setIsPaging(false);
    }
  }, [nextCursor, isPaging, toast]);

  /* -------------------------------- Actions ------------------------------- */
  const handleLike = async (id) => {
    const user = auth.currentUser;
    if (!user) return toast({ title: "Please sign in to like." });

    // Optimistic UI
    setGallery((prev) =>
      prev.map((img) => (img.id === id ? { ...img, likes: (img.likes || 0) + 1 } : img))
    );

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "images", id);
        const snap = await tx.get(ref);
        const data = snap.data() || {};
        const likedBy = data.likedBy || [];
        if (likedBy.includes(user.uid)) return; // already liked elsewhere
        tx.update(ref, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid),
        });
      });
    } catch (e) {
      // revert on failure
      setGallery((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, likes: Math.max((img.likes || 1) - 1, 0) } : img
        )
      );
      toast({ title: "Couldn't like image", description: e.message, variant: "destructive" });
    }
  };

  const handleShare = (src) => {
    try {
      const url = src?.startsWith("http")
        ? src
        : `${window?.location?.origin ?? ""}${src || ""}`;

      if (!url) throw new Error("No URL available");

      if (navigator.share) {
        navigator.share({ title: "Check this image", url }).catch(async () => {
          await navigator.clipboard.writeText(url);
          toast({ title: "Link copied" });
        });
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        toast({ title: "Link copied" });
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast({ title: "Link copied" });
      }
    } catch (e) {
      toast({ title: "Couldn't share", description: e.message, variant: "destructive" });
    }
  };

  const handleSendToTxt2Img = (prompt, negativePrompt) => {
    router.push(
      `/create?prompt=${encodeURIComponent(prompt || "")}&&negativePrompt=${encodeURIComponent(
        negativePrompt || ""
      )}`
    );
    setPrompt(prompt || "");
    setNegativePrompt(negativePrompt || "");
  };

  const handleCopyPrompts = (prompt, negativePrompt) => {
    const text = `Prompt: ${prompt || ""}\nNegative Prompt: ${negativePrompt || ""}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Prompts copied" });
  };

  const handleComment = async (id) => {
    const commentText = (commentInputs[id] || "").trim();
    if (!commentText) return;

    const user = auth.currentUser;
    if (!user) return toast({ title: "Please sign in to comment." });

    const newComment = {
      text: commentText,
      user: user.displayName || "Anonymous",
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, `images/${id}/comments`), newComment);
      setCommentInputs((s) => ({ ...s, [id]: "" }));
      toast({ title: "Comment posted" });
    } catch (e) {
      console.error(e);
      toast({ title: "Couldn't post comment", description: e.message, variant: "destructive" });
    }
  };

  // Live comments for selected image (latest 20)
  useEffect(() => {
    if (!selected?.id) return;
    const qC = query(
      collection(db, `images/${selected.id}/comments`),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(qC, (snap) => {
      setComments((prev) => ({
        ...prev,
        [selected.id]: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      }));
    });
    return () => unsub();
  }, [selected?.id]);

  // Delete a comment
  const handleDeleteComment = async (imageId, commentId) => {
    const user = auth.currentUser;
    if (!user) return toast({ title: "Please sign in to delete comments." });

    setDeleting(commentId);

    const prev = comments[imageId] || [];
    const next = prev.filter((c) => c.id !== commentId);
    setComments((s) => ({ ...s, [imageId]: next })); // optimistic

    try {
      await deleteDoc(doc(db, `images/${imageId}/comments`, commentId));
      toast({ title: "Comment deleted" });
    } catch (e) {
      setComments((s) => ({ ...s, [imageId]: prev })); // revert
      toast({ title: "Couldn't delete comment", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  /* --------------------------------- UI ---------------------------------- */

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <div className="rounded-full p-3 bg-white/5 border border-white/10">
        <Sparkles className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold">No public creations yet</h3>
      <p className="text-sm text-white/60 max-w-md">
        Be the first to share a masterpiece with the community.
      </p>
      <Button onClick={() => router.push("/create")} className="mt-2">
        Create now
      </Button>
    </div>
  );

  const GridSkeleton = () => (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-6 p-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="mb-6 break-inside-avoid">
          <Skeleton className="w-full h-[320px] rounded-3xl" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="px-6 pt-8 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Community Creations</h1>
            <p className="text-sm text-white/60">Explore, like, and remix AI-generated art from the community.</p>
          </div>
          <Button onClick={() => router.push("/create")} size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" /> New creation
          </Button>
        </header>

        {isLoading ? (
          <GridSkeleton />
        ) : gallery.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-6 p-6">
            {gallery.map((item) => {
              const isSensitive =
+             FORCE_SENSITIVE || Boolean(item.isSensitive || item.rating === "XXX" || item.nsfw);
              
              return (
                <Card
                  key={item.id}
                  className="mb-6 break-inside-avoid overflow-hidden border-white/10 bg-white/5 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group"
                  onClick={() => setSelected(item)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <SensitiveImageGuard
                        id={item.id}
                        src={item.imageUrl}
                        alt={item.username ? `${item.username}'s creation` : "Community creation"}
                        isSensitive={isSensitive}
                        imgProps={{
                          width: 600,
                          height: 900,
                          sizes:
                            "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
                          className:
                            "w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300",
                          priority: false,
                        }}
                      />

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/40 px-3 py-2 rounded-xl backdrop-blur-sm">
                        <div className="truncate text-sm">{item.username || "Anon"}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span>{item.likes || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {nextCursor && (
          <div className="flex justify-center pb-10">
            <Button onClick={loadMore} disabled={isPaging} className="gap-2">
              {isPaging ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Load more
            </Button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-6xl gap-0 p-0 overflow-hidden bg-zinc-950/95 border-white/10">
          {selected && (
            <div className="grid grid-cols-1 lg:grid-cols-12 h-[85vh]">
              {/* Left: image */}
              <div className="lg:col-span-7 flex items-center justify-center bg-black/60 relative">
                <button
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 border border-white/10 hover:bg-black/70"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <SensitiveImageGuard
                  id={`dialog-${selected.id}`}
                  src={selected.imageUrl}
                  alt="Preview"
                  imgProps={{
                    width: 1200,
                    height: 1600,
                    sizes: "100vw",
                    className: "object-contain max-h-[85vh] w-auto h-auto",
                  }}
                />
              </div>

              {/* Right: meta */}
              <div className="lg:col-span-5 flex flex-col h-full">
                <DialogHeader className="px-6 pt-5">
                  <DialogTitle className="flex items-center justify-between">
                    <span className="truncate">{selected.username || "Anon"}</span>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="bg-white/10 border-white/10"
                              onClick={() => handleLike(selected.id)}
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Like</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="bg-white/10 border-white/10"
                              onClick={() => handleShare(selected.imageUrl)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Share</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="bg-white/10 border-white/10"
                              onClick={() =>
                                handleCopyPrompts(selected.prompt, selected.negativePrompt)
                              }
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy prompts</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <Separator className="bg-white/10" />

                <div className="p-6 space-y-5 flex-1 overflow-hidden">
                  {/* Description */}
                  {selected.description ? (
                    <p className="text-sm text-white/70">{selected.description}</p>
                  ) : null}

                  {/* Details */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Details</h4>
                      {selected.modelType ? (
                        <Badge variant="secondary" className="bg-white/10 border-white/10">
                          {selected.modelType}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {selected.avatar ? (
                        <div>
                          <p className="text-xs text-white/50 mb-1">Reference</p>
                          <Image
                            src={selected.avatar}
                            alt="reference"
                            width={56}
                            height={56}
                            className="rounded-full border border-white/10"
                          />
                        </div>
                      ) : null}

                      <div>
                        <p className="text-xs text-white/50 mb-1">Prompt</p>
                        <ScrollArea className="h-32 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed">
                          {selected.prompt || "—"}
                        </ScrollArea>
                      </div>

                      {selected.negativePrompt ? (
                        <div>
                          <p className="text-xs text-white/50 mb-1">Negative Prompt</p>
                          <ScrollArea className="h-20 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed">
                            {selected.negativePrompt}
                          </ScrollArea>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  {/* Comments */}
                  <div className="space-y-3 min-h-[180px]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <h4 className="text-sm font-semibold">Comments</h4>
                    </div>

                    {/* Existing comments (latest 20) */}
                    <div className="space-y-2 max-h-48 overflow-auto pr-1">
                      {(comments[selected.id] ?? []).map((c) => {
                        const currentUid = auth.currentUser?.uid;
                        const isOwner = currentUid === c.userId;
                        return (
                          <div key={c.id} className="text-sm flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="font-medium">{c.user || "Anon"}</span>
                              <span className="text-white/50"> — {c.text}</span>
                            </div>

                            {isOwner ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 shrink-0"
                                disabled={deleting === c.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteComment(selected.id, c.id);
                                }}
                                aria-label="Delete comment"
                                title="Delete comment"
                              >
                                {deleting === c.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* Input */}
                    <div className="flex items-end gap-2">
                      <Textarea
                        placeholder="Share your thoughts"
                        className="bg-white/5 border-white/10"
                        value={commentInputs[selected.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((s) => ({ ...s, [selected.id]: e.target.value }))
                        }
                      />
                      <Button className="shrink-0 gap-2" onClick={() => handleComment(selected.id)}>
                        <Send className="w-4 h-4" /> Post
                      </Button>
                    </div>
                    {!(comments[selected.id] ?? []).length ? (
                      <p className="text-xs text-white/50">Be the first to share your thoughts</p>
                    ) : null}
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-sm text-white/60">Like, share or remix this creation.</div>
                  <div className="flex gap-3">
                    <Button
                      className="gap-2"
                      onClick={() => handleSendToTxt2Img(selected.prompt, selected.negativePrompt)}
                    >
                      <Repeat2 className="w-4 h-4" /> Recreate
                    </Button>
                    <Button
                      variant="secondary"
                      className="gap-2 bg-white/10 border-white/10"
                      onClick={() => handleCopyPrompts(selected.prompt, selected.negativePrompt)}
                    >
                      <Copy className="w-4 h-4" /> Copy prompts
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
