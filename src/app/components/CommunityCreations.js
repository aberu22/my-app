"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Firebase
import { db, auth, storage } from "@/lib/firebase";
import {
  addDoc, arrayUnion, collection, doc, getDocs, increment, limit,
  onSnapshot, orderBy, query, runTransaction, serverTimestamp,
  startAfter, where, deleteDoc, getDoc, updateDoc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

// Context
import { useImageGeneration } from "@/context/ImageGenrationContext";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Icons
import {
  Heart, Share2, Copy, Loader2, MessageSquare,
  Sparkles, X, Send, Repeat2, Trash2, Play,
  Zap, Filter, Search, MoreVertical, Download,
  Eye, EyeOff, Clock, TrendingUp, Award,
  Image as ImageIcon, Video, Grid3x3,
  ChevronDown, ChevronUp, Star, Bookmark,
  Hash, User, Settings, TrendingUp as TrendingUpIcon,
  Flame, Crown, Rocket, Palette, Film,
} from "lucide-react";


import { DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";





// Custom Components
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

/* ------------------------------- Sora Font -------------------------------- */
function useSoraFont() {
  React.useEffect(() => {
    const id = "__sora_font__";
    if (!document.getElementById(id)) {
      const l1 = document.createElement("link");
      l1.rel = "preconnect"; l1.href = "https://fonts.googleapis.com"; l1.id = id;
      const l2 = document.createElement("link");
      l2.rel = "preconnect"; l2.href = "https://fonts.gstatic.com"; l2.crossOrigin = "";
      const l3 = document.createElement("link");
      l3.rel = "stylesheet";
      l3.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap";
      document.head.append(l1, l2, l3);
    }
  }, []);
}

/* --------------------------- SensitiveImageGuard --------------------------- */


const FORCE_SENSITIVE = false;

export function SensitiveImageGuard({
  id,
  src,
  alt = "",
  type = "image", // "image" | "video"
  poster,
  isSensitive,
  rating, // "R" | "XXX" (optional but recommended)
  className = "",
  imgProps = {},
  videoProps = {},
  onRevealed,
  children,
}) {
  const [revealedIds, setRevealedIds] = React.useState([]);
  const [hovered, setHovered] = React.useState(false);

  // Load reveal state once
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("revealedNsfwIds");
      if (raw) setRevealedIds(JSON.parse(raw));
    } catch {}
  }, []);

  const isRevealed = revealedIds.includes(id);
  const showContent = !isSensitive || isRevealed || FORCE_SENSITIVE;

  const persistReveal = () => {
    const next = [...new Set([...revealedIds, id])];
    setRevealedIds(next);
    try {
      localStorage.setItem("revealedNsfwIds", JSON.stringify(next));
    } catch {}
    onRevealed?.(id);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ===== MEDIA ===== */}
      {type === "video" ? (
        <video
          poster={poster}
          src={showContent ? src : undefined}
          preload="metadata"
          playsInline
          muted
          className={`
            w-full h-auto rounded-2xl transition-all duration-500
            ${!showContent
              ? "blur-2xl scale-110 brightness-90 saturate-90"
              : hovered
              ? "scale-[1.02]"
              : ""}
          `}
          {...videoProps}
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          {...imgProps}
          className={`
            ${imgProps.className ?? ""}
            transition-all duration-500
            ${!showContent
              ? "blur-2xl scale-110 brightness-90 saturate-90"
              : hovered
              ? "scale-[1.02]"
              : ""}
          `}
        />
      )}

      {/* ===== CHILD OVERLAYS (badges, hover UI) ===== */}
      {showContent && children}

      {/* ===== NSFW OVERLAY ===== */}
      {!showContent && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          {/* Gradient veil */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-black/90" />

          {/* Content */}
          <div className="relative z-10 max-w-xs text-center px-6">
            <EyeOff className="mx-auto mb-4 h-10 w-10 text-white/80" />

            <p className="text-white font-semibold text-lg">
              Sensitive Content
            </p>

            <p className="mt-1 text-sm text-white/60">
              {rating === "XXX"
                ? "This content contains explicit sexual material."
                : "This content may contain nudity or sexual themes."}
            </p>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                persistReveal();
              }}
              className="mt-6 w-full rounded-xl bg-white text-black hover:bg-white/90"
            >
              Show anyway
            </Button>
          </div>
        </div>
      )}

      {/* ===== BLOCK INTERACTION WHEN BLURRED ===== */}
      {!showContent && (
        <div className="absolute inset-0 z-20 pointer-events-auto" />
      )}
    </div>
  );
}



/* --------------------------- Floating Action Buttons ----------------------- */
function FloatingActions({ onNewCreation, onExploreTop }) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY.current || currentScrollY < 100);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col gap-3 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    }`}>
      <Button
        onClick={onNewCreation}
        className="h-14 px-6 rounded-full bg-zinc-900"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold">New Creation</span>
      </Button>
    </div>
  );
}

/* -------------------------------- Stats Card ------------------------------- */
function StatsCard({ icon: Icon, label, value, change, color }) {
  return (
    <Card className="bg-zinc-900 border border-zinc-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-lg text-zinc-100">{value}</p>
            </div>
          </div>
          {change && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------- User Profile Chip ----------------------------- */
function UserProfileChip({ userId, username, avatar }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      // Implement follow logic here
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
      <Avatar className="h-10 w-10 border-2 border-purple-500/30">
        <AvatarImage src={avatar} />
        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
          {username?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{username || 'Anonymous'}</p>
        <p className="text-xs text-white/60">AI Creator</p>
      </div>
      <Button
        size="sm"
        onClick={handleFollow}
        disabled={isLoading}
        className={`h-8 px-4 rounded-lg transition-all ${
          isFollowing
            ? 'bg-white/10 border-white/20'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </Button>
    </div>
  );
}



// helpers/buildCreationsQuery.js (or top of file)


function buildImagesQuery({ sortBy, searchQuery, pageSize }) {
  const constraints = [where("isPublic", "==", true)];

  if (searchQuery?.trim()) {
    const q = searchQuery.trim();
    constraints.push(
      orderBy("prompt"),
      where("prompt", ">=", q),
      where("prompt", "<=", q + "\uf8ff")
    );
  } else {
    let orderField = "createdAt";
    if (sortBy === "popular") orderField = "likes";
    if (sortBy === "trending") orderField = "views";
    constraints.push(orderBy(orderField, "desc"));
  }

  constraints.push(limit(pageSize));
  return query(collection(db, "images"), ...constraints);
}

function buildVideosQuery({ sortBy, searchQuery, pageSize }) {
  const constraints = [where("isPublic", "==", true)];

  if (searchQuery?.trim()) {
    const q = searchQuery.trim();
    constraints.push(
      orderBy("prompt"),
      where("prompt", ">=", q),
      where("prompt", "<=", q + "\uf8ff")
    );
  } else {
    let orderField = "createdAt";
    if (sortBy === "popular") orderField = "likes";
    if (sortBy === "trending") orderField = "views";
    constraints.push(orderBy(orderField, "desc"));
  }

  constraints.push(limit(pageSize));
  return query(collection(db, "videos"), ...constraints);
}





/* -------------------------------- Component ------------------------------- */
export default function CommunityCreations() {
  useSoraFont();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [stats, setStats] = useState({
    totalCreations: 0,
    totalLikes: 0,
    totalUsers: 0,
    trendingToday: 0,
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, itemId: null });
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('trending');
  const isSearching = Boolean(searchQuery.trim());


  const pageSize = 24;

  const lastItemRef = useRef();

  // Match your real sidebar width
  const sidebarPad = "var(--sidebar-w, 88px)";

  const computeIsSensitive = (item) => Boolean(FORCE_SENSITIVE || item?.isSensitive || item?.rating === "XXX" || item?.nsfw);
  const getWH = (item) => ({ w: item.width || item.meta?.w || 1024, h: item.height || item.meta?.h || 1024 });

  
  useEffect(() => {
  setIsLoading(true);

  const fetchGallery = async () => {
    try {
      let items = [];

      if (filter === "images" || filter === "all") {
        const imgSnap = await getDocs(
          buildImagesQuery({ sortBy, searchQuery, pageSize })
        );

        items.push(
          ...imgSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            isVideo: false,
          }))
        );
      }

      if (filter === "videos" || filter === "all") {
        const vidSnap = await getDocs(
          buildVideosQuery({ sortBy, searchQuery, pageSize })
        );

        items.push(
          ...vidSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            isVideo: true,
          }))
        );
      }

      // 🔹 Unified sort (newest first)
      items.sort((a, b) => {
  if (sortBy === "popular") {
    return (b.likes || 0) - (a.likes || 0);
  }

  if (sortBy === "trending") {
    return (b.views || 0) - (a.views || 0);
  }

  // latest (default)
  return (
    (b.createdAt?.toMillis?.() || 0) -
    (a.createdAt?.toMillis?.() || 0)
  );
});

     
      // 🔹 Update gallery
      setGallery(items);

      // 🔹 UPDATE STATS (✔ CORRECT PLACE)
      setStats({
        totalCreations: items.length,
        totalLikes: items.reduce((s, i) => s + (i.likes || 0), 0),
        totalUsers: new Set(items.map(i => i.userId)).size,
        trendingToday: items.filter(i => {
          const t = i.createdAt?.toDate?.();
          return t && Date.now() - t.getTime() < 86400000;
        }).length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  fetchGallery();
}, [filter, sortBy, searchQuery]);


useEffect(() => {
  if (!gallery.length) return;

  console.table(
    gallery.map(i => ({
      id: i.id,
      rating: i.rating,
      isSensitive: i.isSensitive,
      nsfw: i.nsfw,
    }))
  );
}, [gallery]);




  // Actions

  const handleLike = async (id) => {
  const user = auth.currentUser;
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to like creations.",
      variant: "destructive",
    });
    return;
  }

  // 🔹 Find the item to know if it's image or video
  const item = gallery.find((i) => i.id === id);
  if (!item) return;

  const collectionName = item.isVideo ? "videos" : "images";

  // 🔹 Optimistic UI update
  setGallery((prev) =>
    prev.map((i) =>
      i.id === id
        ? {
            ...i,
            likes: (i.likes || 0) + 1,
            likedBy: [...(i.likedBy || []), user.uid],
          }
        : i
    )
  );

  try {
    await runTransaction(db, async (tx) => {
      const ref = doc(db, collectionName, id);
      const snap = await tx.get(ref);

      if (!snap.exists()) {
        throw new Error("Item does not exist");
      }

      const data = snap.data();
      const likedBy = data.likedBy || [];

      if (likedBy.includes(user.uid)) {
        throw new Error("Already liked");
      }

      tx.update(ref, {
        likes: increment(1),
        likedBy: arrayUnion(user.uid),
      });
    });

    toast({
      title: "Liked!",
      description: "Your like has been recorded.",
    });
  } catch (e) {
    // 🔹 Rollback optimistic update
    setGallery((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              likes: Math.max((i.likes || 1) - 1, 0),
              likedBy: (i.likedBy || []).filter(
                (uid) => uid !== user.uid
              ),
            }
          : i
      )
    );

    if (e.message !== "Already liked") {
      toast({
        title: "Couldn't like creation",
        description: e.message,
        variant: "destructive",
      });
    }
  }
};

 

  const handleBookmark = async (id) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to bookmark creations.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        bookmarks: arrayUnion(id),
      });

      toast({
        title: "Bookmarked!",
        description: "Creation saved to your bookmarks.",
      });
    } catch (error) {
      console.error("Bookmark error:", error);
      toast({
        title: "Failed to bookmark",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (item) => {
    try {
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      const shareData = {
        title: `Check out this AI creation by ${item.username || 'Anonymous'}`,
        text: item.prompt || 'AI Generated Content',
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied!",
          description: "Share link copied to clipboard.",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      const shareUrl = `${window.location.origin}/share/${item.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard.",
      });
    }
  };

  const handleDownload = async (item) => {
    try {
     const urlToFetch = item.isVideo ? item.videoUrl : item.imageUrl;
      const response = await fetch(urlToFetch);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-creation-${item.id}.${item.isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: "Your download will begin shortly.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

 const handleDelete = async () => {
  if (!deleteDialog.itemId) return;

  const user = auth.currentUser;
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to delete creations.",
      variant: "destructive",
    });
    return;
  }

  const item = gallery.find((i) => i.id === deleteDialog.itemId);
  if (!item) return;

  const collectionName = item.isVideo ? "videos" : "images";

  try {
    // 🔹 Delete from Storage
    const fileUrl = item.isVideo ? item.videoUrl : item.imageUrl;

    if (fileUrl) {
      const storageRef = ref(storage, fileUrl);
      await deleteObject(storageRef).catch(console.error);
    }

    // 🔹 Delete Firestore doc
    await deleteDoc(doc(db, collectionName, deleteDialog.itemId));

    // 🔹 Update local UI
    setGallery((prev) =>
      prev.filter((i) => i.id !== deleteDialog.itemId)
    );

    if (selected?.id === deleteDialog.itemId) {
      setSelected(null);
    }

    toast({
      title: "Deleted Successfully",
      description: "Your creation has been removed.",
    });
  } catch (error) {
    console.error("Delete error:", error);
    toast({
      title: "Deletion Failed",
      description: error.message,
      variant: "destructive",
    });
  } finally {
    setDeleteDialog({ open: false, itemId: null });
  }
};


  const handleSendToTxt2Img = (p, n) => {
    router.push(`/create?prompt=${encodeURIComponent(p || "")}&negativePrompt=${encodeURIComponent(n || "")}`);
    setPrompt(p || "");
    setNegativePrompt(n || "");
  };

  const handleCopyPrompts = (p, n) => {
    const text = `Prompt: ${p || ""}\nNegative Prompt: ${n || ""}\n\nCreated with AI Studio`;
    navigator.clipboard.writeText(text);
    toast({
      title: "Prompts Copied",
      description: "Ready to be used in your next creation!",
    });
  };


  const handleSendToTxt2Video = (p) => {
  const prompt = encodeURIComponent(p || "");

  router.push(
    `/studio/text-to-video?prompt=${prompt}`
  );
};



const handleRecreate = (selected) => {
  if (!selected) return;

  if (selected.isVideo) {
    handleSendToTxt2Video(selected.prompt);
  } else {
    handleSendToTxt2Img(selected.prompt, selected.negativePrompt);
  }
};


  // Comments

  // Listen for comments on selected item

  const getParentCollection = (item) => {
  if (!item) return "images"; // safe fallback
  return item.isVideo ? "videos" : "images";
};


  useEffect(() => {
  if (!selected?.id) return;

  const parent = getParentCollection(selected);

  const qC = query(
    collection(db, `${parent}/${selected.id}/comments`),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const unsub = onSnapshot(qC, (snap) => {
    setComments((prev) => ({
      ...prev,
      [selected.id]: snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })),
    }));
  });

  return () => unsub();
}, [selected?.id, selected?.isVideo]);

  

  const handleComment = async (itemId) => {
  const user = auth.currentUser;
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please sign in to comment.",
      variant: "destructive",
    });
    return;
  }

  const text = commentInputs[itemId]?.trim();
  if (!text) return;

  const parent = getParentCollection(selected);

  const newComment = {
    text,
    userId: user.uid,
    user: user.displayName || "Anonymous",
    userAvatar: user.photoURL,
    createdAt: serverTimestamp(),
    likes: 0,
  };

  try {
    await addDoc(
      collection(db, `${parent}/${itemId}/comments`),
      newComment
    );

    setCommentInputs((prev) => ({ ...prev, [itemId]: "" }));

    toast({
      title: "Comment Posted",
      description: "Your comment has been shared.",
    });
  } catch (error) {
    console.error("Comment error:", error);
    toast({
      title: "Failed to post comment",
      description: error.message,
      variant: "destructive",
    });
  }
};


  const handleDeleteComment = async (itemId, commentId) => {
  const user = auth.currentUser;
  if (!user) return;

  const parent = getParentCollection(selected);

  setDeleting(commentId);

  const prev = comments[itemId] || [];
  setComments((s) => ({
    ...s,
    [itemId]: prev.filter((c) => c.id !== commentId),
  }));

  try {
    await deleteDoc(
      doc(db, `${parent}/${itemId}/comments`, commentId)
    );

    toast({
      title: "Comment Deleted",
      description: "Your comment has been removed.",
    });
  } catch (e) {
    setComments((s) => ({ ...s, [itemId]: prev }));
    toast({
      title: "Couldn't delete comment",
      description: e.message,
      variant: "destructive",
    });
  } finally {
    setDeleting(null);
  }
};


  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-8">
      <div className="relative">
        <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl rounded-full" />
        <div className="relative p-8 rounded-3xl bg-zinc-900/60 border border-white/10 backdrop-blur-xl">
          <Palette className="w-20 h-20 text-white/80" />
        </div>
      </div>
      <div className="text-center space-y-4 max-w-lg">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
          No Creations Yet
        </h3>
        <p className="text-white/60 text-lg">
          Be the pioneer! Create and share your first AI masterpiece with the community.
        </p>
      </div>
      <Button
        onClick={() => router.push("/create")}
        className="mt-4 px-8 py-6 text-lg rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-2xl shadow-purple-500/30"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Create First Masterpiece
      </Button>
    </div>
  );

  const GridSkeleton = () => (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 px-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="mb-4 break-inside-avoid">
          <div
  className="
    relative overflow-hidden
    rounded-[18px]
    bg-[var(--retro-panel)]
    border border-[var(--retro-border)]
    shadow-[0_20px_60px_rgba(0,0,0,0.6)]
    transition-all duration-700 ease-out
    cursor-pointer
    group
    hover:border-white/15
    hover:shadow-[0_30px_80px_rgba(0,0,0,0.8)]
  "
>
            <Skeleton className="h-64 w-full bg-gradient-to-br from-white/10 to-white/5" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <Skeleton className="h-4 w-3/4 bg-white/20 rounded" />
              <Skeleton className="h-3 w-1/2 bg-white/20 rounded mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  


  return (
    <section
      className="min-h-screen relative overflow-hidden text-white"
      style={{ fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system", paddingLeft: sidebarPad }}
    >
      {/* Futuristic background */}
      <div className="absolute inset-0 -z-10 bg-zinc-950" />


      
      {/* Animated grid overlay */}
   
    

      {/* Top Navigation */}
      {/* Top Navigation — Zinc / Editorial */}
<div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
  <div className="px-6 py-4">
    <div className="flex items-center justify-between gap-6">

      {/* Left: Text tabs */}
      <div className="flex items-center gap-6 text-sm">
        <button
          onClick={() => setActiveTab("trending")}
          className={`pb-1 transition-colors ${
            activeTab === "trending"
              ? "text-zinc-100 border-b border-zinc-100"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Explore
        </button>

        <button
          onClick={() => setActiveTab("latest")}
          className={`pb-1 transition-colors ${
            activeTab === "latest"
              ? "text-zinc-100 border-b border-zinc-100"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          My Creations
        </button>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              pl-9 w-56
              bg-zinc-900
              border-zinc-800
              text-zinc-200
              placeholder:text-zinc-500
              focus-visible:ring-0
            "
          />
        </div>

        {/* Filter */}

        <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900"
    >
      Filter
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="bg-zinc-900 border-zinc-800 text-zinc-200"
  >
    {/* FILTERS */}
    <DropdownMenuItem onClick={() => setFilter("all")}>
      All
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setFilter("images")}>
      Images
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => setFilter("videos")}>
      Videos
    </DropdownMenuItem>

    <DropdownMenuSeparator />

    {/* SORTING */}
    

    {isSearching && (
      <>
        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-zinc-500">
          Sorting is disabled while searching
        </div>
      </>
    )}
  </DropdownMenuContent>
</DropdownMenu>


     

       

        {/* Create */}
        <Button
          onClick={() => router.push("/create")}
          className="
            bg-zinc-100 text-zinc-900
            hover:bg-zinc-200
            rounded-full
            px-4
          "
        >
          Create
        </Button>
      </div>
    </div>
  </div>
</div>

      

      {/* Stats Overview */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={Palette}
            label="Total Creations"
            value={stats.totalCreations.toLocaleString()}
            change={12}
            color="bg-purple-500/20 text-purple-400"
          />
          <StatsCard
            icon={Heart}
            label="Total Likes"
            value={stats.totalLikes.toLocaleString()}
            change={8}
            color="bg-pink-500/20 text-pink-400"
          />
          <StatsCard
            icon={User}
            label="Active Creators"
            value={stats.totalUsers.toLocaleString()}
            change={5}
            color="bg-blue-500/20 text-zinc-400"
          />
          <StatsCard
            icon={Flame}
            label="Trending Today"
            value={stats.trendingToday.toLocaleString()}
            change={24}
            color="bg-orange-500/20 text-orange-400"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-20">
        {isLoading ? (
          <GridSkeleton />
        ) : gallery.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 [column-fill:_balance]">
            {gallery.map((item, index) => {
              const isSensitive = computeIsSensitive(item);
              const { w, h } = getWH(item);
              const isLastItem = index === gallery.length - 1;
              const currentUser = auth.currentUser;
              const isOwner = currentUser?.uid === item.userId;

              

              return (
                <div
                  key={item.id}
                  ref={isLastItem ? lastItemRef : null}
                  className="mb-4 break-inside-avoid group relative"
                >
                  <div
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer group-hover:shadow-2xl group-hover:bg-black/80"
                    onClick={() => setSelected(item)}
                  >
                   <SensitiveImageGuard
                        id={item.id}
                        src={item.isVideo ? item.videoUrl : item.imageUrl}
                        type={item.isVideo ? "video" : "image"}
                        poster={item.thumbnailUrl}
                        isSensitive={isSensitive}
                        rating={item.rating} 
                        imgProps={{
                          width: w,
                          height: h,
                          className: "w-full h-auto transition-transform duration-700 group-hover:scale-105",
                        }}
                      >
                        {item.isVideo && (
                          <div className="absolute top-3 right-3 z-10">
                            <div className="px-3 py-1.5 rounded-full bg-black/80 flex items-center gap-2">
                              <Play className="w-4 h-4" />
                              <span className="text-xs">Video</span>
                            </div>
                          </div>
                        )}

                      {/* Model badge */}
                      {item.modelType && (
                        <div className="absolute top-3 left-3 z-10">
                          <Badge className="bg-black/80 border-white/10 backdrop-blur-sm text-xs font-medium">
                            {item.modelType}
                          </Badge>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent
 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                        <div className="space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <p className="text-sm line-clamp-2 text-white/90">{item.prompt?.substring(0, 100)}...</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-white/20">
                                <AvatarImage src={item.userAvatar} />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-purple-600 to-pink-600">
                                  {item.username?.charAt(0).toUpperCase() || 'A'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{item.username || "Anon"}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-pink-400" />
                                <span className="text-xs">{item.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4 text-blue-400" />
                                <span className="text-xs">{item.commentCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                className="h-10 w-10 rounded-full bg-black/80 border-white/20 hover:bg-black hover:border-white/30 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(item.id);
                                }}
                              >
                                <Heart className="w-5 h-5" />
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
                                className="h-10 w-10 rounded-full bg-black/80 border-white/20 hover:bg-black hover:border-white/30 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(item);
                                }}
                              >
                                <Share2 className="w-5 h-5" />
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
                                className="h-10 w-10 rounded-full bg-black/80 border-white/20 hover:bg-black hover:border-white/30 shadow-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookmark(item.id);
                                }}
                              >
                                <Bookmark className="w-5 h-5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Save</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Bottom info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-white/60" />
                            <span className="text-xs text-white/70">
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.rating && (
                              <Badge variant="outline" className="text-xs border-white/20">
                                {item.rating}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </SensitiveImageGuard>
                  </div>

                  {/* More options dropdown */}
                  <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="
                            h-8 w-8 rounded-full
                            bg-black/70
                            text-white
                            border border-white/10
                            hover:bg-black
                            hover:border-white/20
                          "
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="
                          w-48
                          bg-black
                          border border-white/10
                          p-1
                          text-white
                        "
                      >
                        <DropdownMenuItem
                          onClick={() => handleDownload(item)}
                          className="
                            flex items-center gap-2
                            rounded-md px-3 py-2
                            text-sm
                            cursor-pointer
                            focus:bg-white/10
                            hover:bg-white/10
                          "
                        >
                          <Download className="w-4 h-4 opacity-80" />
                          Download
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => handleCopyPrompts(item.prompt, item.negativePrompt)}
                          className="
                            flex items-center gap-2
                            rounded-md px-3 py-2
                            text-sm
                            cursor-pointer
                            focus:bg-white/10
                            hover:bg-white/10
                          "
                        >
                          <Copy className="w-4 h-4 opacity-80" />
                          Copy prompts
                        </DropdownMenuItem>

                        <DropdownMenuItem
                        onClick={() => handleRecreate(item)}
                        className="
                          flex items-center gap-2
                          rounded-md px-3 py-2
                          text-sm
                          cursor-pointer
                          focus:bg-white/10
                          hover:bg-white/10
                        "
                      >
                        <Repeat2 className="w-4 h-4 opacity-80" />
                        Recreate
                      </DropdownMenuItem>


                        {isOwner && (
                          <>
                            <DropdownMenuSeparator className="my-1 bg-white/10" />

                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteDialog({ open: true, itemId: item.id })
                              }
                              className="
                                flex items-center gap-2
                                rounded-md px-3 py-2
                                text-sm
                                cursor-pointer
                                text-red-400
                                focus:bg-red-500/15
                                hover:bg-red-500/15
                              "
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                 
                </div>
              );
            })}
          </div>
        )}

        {/* Loading indicator */}
        {isPaging && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-white/60">Loading more creations...</span>
            </div>
          </div>
        )}

        {/* End of content message */}
        {!isLoading && !isPaging && nextCursor === null && gallery.length > 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
              <Sparkles className="w-5 h-5 text-zinc-300" />
              <span className="text-white/70">You've reached the end of amazing creations!</span>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FloatingActions
        onNewCreation={() => router.push("/create")}
        onExploreTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />

      {/* Detail Dialog */}

      {/* Detail Dialog */}
     

<Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>

  <VisuallyHidden>
  <DialogTitle>
    Community Creation Details
  </DialogTitle>
</VisuallyHidden>

  
  {selected && (
  
  <DialogContent
    className="
      fixed inset-0
    left-0 top-0
    translate-x-0 translate-y-0
    w-screen h-screen max-w-none
    p-0 gap-0
    overflow-hidden
    bg-zinc-900
    border-none rounded-none
    "
  >
    {/* Close Button */}
    <button
      className="
        fixed top-4 left-4 z-50
        p-2 rounded-full
        bg-black/70
        border border-white/10
        hover:bg-black
      "
      onClick={() => setSelected(null)}
      aria-label="Close"
    >
      <X className="w-5 h-5" />
    </button>

    <div className="grid grid-cols-1 lg:grid-cols-12 w-screen h-screen">

      {/* ================= LEFT : MEDIA ================= */}
      <div className="lg:col-span-8 relative flex items-center justify-center bg-zinc-800 overflow-hidden">

        <SensitiveImageGuard
          id={`dialog-${selected.id}`}
          src={selected.isVideo ? selected.videoUrl : selected.imageUrl}
          type={selected.isVideo ? "video" : "image"}
          poster={selected.thumbnailUrl}
          isSensitive={computeIsSensitive(selected)}
          rating={selected.rating}
          imgProps={{
            width: 1600,
            height: 2400,
            className: "max-h-screen max-w-full object-contain",
          }}
        >
          {selected.isVideo && (
            <video
              src={selected.videoUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
        </SensitiveImageGuard>

        {/* Thumbnails */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-3 z-30">
          {selected.thumbnailUrl && (
            <img
              src={selected.thumbnailUrl}
              className="w-16 h-16 rounded-md object-cover border border-white/20 hover:border-white cursor-pointer"
            />
          )}

          {selected.isVideo && (
            <div className="w-16 h-16 rounded-md bg-black flex items-center justify-center border border-white/20">
              <Play className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT : DETAILS ================= */}
      <div className="lg:col-span-4 flex flex-col h-screen bg-black border-l border-white/10">

        {/* Header */}
        <div className="sticky top-0 z-20 p-6 bg-black border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-white/20">
                <AvatarImage src={selected.userAvatar} />
                <AvatarFallback>
                  {selected.username?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selected.username || "Anonymous"}</p>
                <p className="text-xs text-white/60">
                  {formatTimeAgo(selected.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/10 border-white/10 hover:bg-white/20"
                onClick={() => handleLike(selected.id)}
              >
                <Heart
                  className={`w-5 h-5 ${
                    selected.likedBy?.includes(auth.currentUser?.uid)
                      ? "fill-pink-500 text-pink-500"
                      : ""
                  }`}
                />
              </Button>
              <span className="text-sm">{selected.likes || 0}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-8">

            {/* Description */}
            {selected.description && (
              <div className="rounded-lg bg-zinc-900 border border-white/5 p-4">
                <p className="text-sm text-white/90 leading-relaxed">
                  {selected.description}
                </p>
              </div>
            )}

            {/* Generation Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white/80">
                  Generation Details
                </h4>
                {selected.modelType && (
                  <Badge className="bg-white/10 border-white/10">
                    {selected.modelType}
                  </Badge>
                )}
              </div>

              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Prompt</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={() =>
                      handleCopyPrompts(
                        selected.prompt,
                        selected.negativePrompt
                      )
                    }
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="rounded-lg bg-zinc-900 border border-white/5 p-3">
                  <p className="text-sm">
                    {selected.prompt || "No prompt provided"}
                  </p>
                </div>

                {selected.negativePrompt && (
                  <div className="mt-3">
                    <span className="text-xs text-white/60">
                      Negative Prompt
                    </span>
                    <div className="mt-2 rounded-lg bg-zinc-900 border border-white/5 p-3">
                      <p className="text-sm">
                        {selected.negativePrompt}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Params */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selected.seed && (
                  <div>
                    <p className="text-xs text-white/50">Seed</p>
                    <p className="font-mono">{selected.seed}</p>
                  </div>
                )}
                {selected.steps && (
                  <div>
                    <p className="text-xs text-white/50">Steps</p>
                    <p>{selected.steps}</p>
                  </div>
                )}
                {selected.guidanceScale && (
                  <div>
                    <p className="text-xs text-white/50">Guidance</p>
                    <p>{selected.guidanceScale}</p>
                  </div>
                )}
                {selected.dimensions && (
                  <div>
                    <p className="text-xs text-white/50">Dimensions</p>
                    <p>{selected.dimensions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-5">
              <h4 className="font-semibold">Comments</h4>

              {/* Add Comment */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={auth.currentUser?.photoURL} />
                  <AvatarFallback>
                    {auth.currentUser?.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 flex gap-2">
                  <Textarea
                    placeholder="Add a comment…"
                    className="flex-1 bg-zinc-900 border-white/10 resize-none"
                    value={commentInputs[selected.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((s) => ({
                        ...s,
                        [selected.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    className="bg-white text-black hover:bg-white/90"
                    onClick={() => handleComment(selected.id)}
                    disabled={!commentInputs[selected.id]?.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Comment List */}
              {(comments[selected.id] ?? []).map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.userAvatar} />
                    <AvatarFallback>
                      {comment.user?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {comment.user || "Anonymous"}
                      </span>
                      {auth.currentUser?.uid === comment.userId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:bg-red-500/10"
                          onClick={() =>
                            handleDeleteComment(selected.id, comment.id)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-white/80">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 bg-black border-t border-white/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">

                        <Button
                        onClick={() => handleRecreate(selected)}
                        className="
                          flex items-center gap-2
                          rounded-md px-3 py-2
                          text-sm
                          cursor-pointer
                          focus:bg-white/10
                          hover:bg-white/10
                        "
                      >
                        <Repeat2 className="w-4 h-4 opacity-80" />
                        Recreate
                      </Button>
            

            <Button
              className="gap-2 bg-white text-black hover:bg-white/90"
              onClick={() => handleShare(selected)}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          <div className="text-xs text-white/40">
            ID: {selected.id.substring(0, 8)}...
          </div>
        </div>
      </div>
    </div>
  
  </DialogContent>
  )}
</Dialog>

      
     

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent className="bg-neutral-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Creation</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this creation? This action cannot be undone and
              the image will be permanently removed from the community gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-red-600 to-pink-600 border-0 hover:from-red-700 hover:to-pink-700"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}