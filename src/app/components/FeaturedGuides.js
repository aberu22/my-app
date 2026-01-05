"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

// Load Sora font once
function useSoraFont() {
  React.useEffect(() => {
    const id = "__sora_font__";
    if (!document.getElementById(id)) {
      const l1 = document.createElement("link");
      l1.rel = "preconnect";
      l1.href = "https://fonts.googleapis.com";
      l1.id = id;
      const l2 = document.createElement("link");
      l2.rel = "preconnect";
      l2.href = "https://fonts.gstatic.com";
      l2.crossOrigin = "";
      const l3 = document.createElement("link");
      l3.rel = "stylesheet";
      l3.href = "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap";
      document.head.append(l1, l2, l3);
    }
  }, []);
}

export default function CreativityRibbon() {
  useSoraFont();

  const items = [
    {
      title: "Video",
      desc: "Video generation with audio, cinematic visuals",
      href: "/studio/text-to-video", // ✅ your route
      cta: "Try Now",
    },
    {
      title: "Image",
      desc: "Image edit",
      href: "/create", // ✅ your route
      cta: "Explore",
    },
    {
      title: "Avatar",
      desc: "Avatar acting",
      href: "/tools", // ✅ your route
      cta: "Explore",
    },
  ];

  return (
    <section
      className="relative mx-auto max-w-7xl px-6 text-white"
      style={{ fontFamily: "Sora, ui-sans-serif, system-ui, -apple-system" }}
    >
      {/* subtle star field */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[#0b0b0c]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 40% 70%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent 51%)",
        }}
      />

      <h2 className="mb-4 text-3xl md:text-5xl font-extrabold tracking-tight text-white/90">
        Unleash Your Creativity
      </h2>

      {/* gradient ribbon */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_15px_60px_rgba(0,0,0,0.35)]">
        {/* base gradient sweep */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/35 via-sky-500/30 via-50% to-fuchsia-600/25" />
        {/* soft spotlights per segment (green / violet / amber) */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_280px_at_16%_50%,rgba(16,185,129,0.45),transparent),radial-gradient(900px_320px_at_50%_50%,rgba(124,58,237,0.35),transparent),radial-gradient(900px_320px_at_84%_50%,rgba(245,158,11,0.35),transparent)]" />

        <nav className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {items.map((it, i) => (
            <Link
              href={it.href}
              key={it.title}
              className="group block p-6 sm:p-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={`${it.title} – ${it.desc}`}
              title={it.title}
            >
              <div className="flex items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl md:text-[26px] font-semibold drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    {it.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/75">{it.desc}</p>
                </div>

                {/* Decorative Sora chip */}
                <div className="hidden sm:flex items-center justify-center">
                  <div className="h-12 w-20 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner transition group-hover:scale-105">
                    <Sparkles className="h-5 w-5 opacity-80" />
                  </div>
                </div>
              </div>

              {/* pill CTA (styled span to avoid nested links) */}
              <span
                className={`mt-6 inline-flex items-center rounded-full h-10 px-5 border transition ${
                  i === 0
                    ? "bg-indigo-500/40 hover:bg-indigo-500/50 border-white/15"
                    : "bg-white/10 hover:bg-white/15 border-white/10"
                }`}
              >
                {it.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
