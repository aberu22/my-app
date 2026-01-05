"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Video, ImageIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function ModeTabs() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = useMemo(
    () => [
      { name: "Text-to-Image", href: "/create", icon: ImageIcon },
      { name: "Image-to-Video", href: "/studio/text-to-video", icon: Video },
    ],
    []
  );

  // animated indicator position/width
  const containerRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 8, width: 0 });

  const updateIndicator = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    if (!active) return;
    const c = el.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    setIndicator({ left: a.left - c.left, width: a.width });
  }, []);

  useEffect(() => {
    updateIndicator();
  }, [pathname, updateIndicator]);

  useEffect(() => {
    const ro = new ResizeObserver(updateIndicator);
    if (containerRef.current) ro.observe(containerRef.current);
    const onResize = () => updateIndicator();
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [updateIndicator]);

  // Arrow-key navigation
  const onKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.href === pathname);
    if (i === -1) return;
    const next =
      e.key === "ArrowRight"
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
    router.push(next.href);
  };

  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto max-w-4xl px-3 sm:px-6 pt-3">
        <div
          ref={containerRef}
          role="tablist"
          aria-label="Generation mode"
          onKeyDown={onKeyDown}
          className="relative flex items-center gap-1 rounded-2xl bg-[#0b0d12]/80 backdrop-blur-xl
                     ring-1 ring-white/10 shadow-[0_6px_30px_-12px_rgba(0,0,0,.6)] p-1"
        >
          {/* animated gradient pill */}
          <div
            aria-hidden
            className="absolute top-1 bottom-1 rounded-xl transition-all duration-300 ease-out"
            style={{
              left: indicator.left,
              width: indicator.width,
              background:
                "linear-gradient(90deg, rgba(99,102,241,.65), rgba(217,70,239,.65))",
              boxShadow: "0 0 28px rgba(99,102,241,.35)",
            }}
          />

          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                role="tab"
                aria-selected={active}
                data-active={active ? "true" : undefined}
                className={[
                  "relative z-10 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5",
                  "rounded-xl text-sm font-medium transition-colors",
                  active ? "text-white" : "text-zinc-400 hover:text-zinc-200",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.name}</span>
              </Link>
            );
          })}

          {/* subtle inner ring */}
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
        </div>

        {/* slim accent bar (very Sora) */}
        <div className="mt-2 h-[2px] w-full bg-gradient-to-r from-fuchsia-500/70 via-indigo-400/70 to-cyan-400/70 rounded-full blur-[0.3px]" />
      </div>
    </div>
  );
}
