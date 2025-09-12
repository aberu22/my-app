"use client";

import Image from "next/image";
import { FaHeart, FaCopy, FaShareAlt } from "react-icons/fa";

export default function AssetCard({ image }) {
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(image.prompt || "No prompt found");
    alert("📋 Prompt copied!");
  };

  const handleShare = () => {
    const link = `${window.location.origin}/share/${image.id}`;
    navigator.clipboard.writeText(link);
    alert("🔗 Link copied to clipboard!");
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow hover:shadow-glow transition-all group relative cursor-pointer">
      <Image
        src={image.imageUrl}
        alt={image.prompt}
        width={600}
        height={800}
        className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-3 py-2 flex justify-between items-center backdrop-blur-sm">
        <span className="truncate w-4/5">{image.prompt?.slice(0, 60) || "Untitled"}</span>
        <span className="flex gap-2 text-pink-400">
          <FaHeart className="text-sm" /> {image.likes || 0}
        </span>
      </div>
      <div className="absolute top-2 right-2 flex gap-2">
        <button onClick={handleShare} className="text-white hover:text-green-400">
          <FaShareAlt />
        </button>
        <button onClick={handleCopyPrompt} className="text-white hover:text-blue-400">
          <FaCopy />
        </button>
      </div>
    </div>
  );
}
