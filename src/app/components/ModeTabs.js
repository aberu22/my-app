"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Video, ImageIcon } from "lucide-react";

export default function ModeTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: "Text-to-Image", href: "/create", icon: <ImageIcon className="w-4 h-4" /> },
    { name: "Image-to-Video", href: "/text-to-video", icon: <Video className="w-4 h-4" /> },
  ];

  return (
    <div className="flex justify-center gap-4 bg-zinc-900 py-2 px-4 border-b border-zinc-700 sticky top-0 z-40 shadow-inner">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}