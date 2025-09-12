"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Video, ImageIcon } from "lucide-react";

export default function ModeToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const isVideoMode = pathname === "/text-to-video";
  const [enabled, setEnabled] = useState(isVideoMode);

  useEffect(() => {
    setEnabled(isVideoMode);
  }, [pathname]);

  const handleToggle = () => {
    const newMode = !enabled;
    setEnabled(newMode);
    router.push(newMode ? "/text-to-video" : "/create");
  };

  return (
    <div className="flex items-center justify-center mb-6">
      <div
        className="relative inline-flex items-center cursor-pointer select-none"
        onClick={handleToggle}
      >
        <input
          type="checkbox"
          checked={enabled}
          readOnly
          className="sr-only"
        />
        <div
          className={`w-28 h-12 bg-zinc-700 rounded-full transition-colors duration-300 ease-in-out flex items-center px-1 ${
            enabled ? "bg-purple-600" : "bg-blue-600"
          }`}
        >
          <div
            className={`flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
              enabled ? "translate-x-16" : "translate-x-0"
            }`}
          >
            {enabled ? <Video size={18} className="text-purple-600" /> : <ImageIcon size={18} className="text-blue-600" />}
          </div>
        </div>
        <div className="absolute text-xs font-bold w-full top-14 text-center text-zinc-400">
          {enabled ? "Text-to-Vide 🎥" : "Text-to-Image 🖼️"}
        </div>
      </div>
    </div>
  );
}