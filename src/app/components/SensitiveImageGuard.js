"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const FORCE_SENSITIVE = false;

export default function SensitiveImageGuard({
  id,
  src,
  alt,
  isSensitive,
  className = "",
  imgProps = {},
  onRevealed,
  children,
}) {
  const [revealedIds, setRevealedIds] = useState(new Set());
  const [isHovered, setIsHovered] = useState(false);

  /* ---------------- Load persisted reveals ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("revealedImageIds");
      if (raw) {
        setRevealedIds(new Set(JSON.parse(raw)));
      }
    } catch {
      /* noop */
    }
  }, []);

  const persist = useCallback((next) => {
    setRevealedIds(next);
    try {
      localStorage.setItem(
        "revealedImageIds",
        JSON.stringify([...next])
      );
    } catch {
      /* noop */
    }
  }, []);

  const isRevealed =
    revealedIds.has(id) || FORCE_SENSITIVE === false && !isSensitive;

  const handleReveal = (e) => {
    e.stopPropagation();
    const next = new Set(revealedIds);
    next.add(id);
    persist(next);
    onRevealed?.(id);
  };

  /* ---------------- Non-sensitive OR revealed ---------------- */
  if (!isSensitive || isRevealed) {
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={src}
          alt={alt}
          {...imgProps}
          className={`${imgProps.className ?? ""} transition-transform duration-300 ${
            isHovered ? "scale-[1.04]" : "scale-100"
          }`}
        />
        {children}
      </div>
    );
  }

  /* ---------------- Sensitive (blocked) ---------------- */
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-zinc-900 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Blurred preview */}
      <Image
        src={src}
        alt={alt}
        {...imgProps}
        aria-hidden
        className={`${imgProps.className ?? ""} blur-xl scale-110 transition-all duration-300`}
      />

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-sm text-center px-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
            <EyeOff className="h-7 w-7 text-zinc-300" />
          </div>

          <h3 className="text-sm font-semibold text-zinc-100">
            Sensitive content
          </h3>

          <p className="mt-1 text-xs text-zinc-400">
            This image may contain content some viewers find sensitive.
          </p>

          <Button
            onClick={handleReveal}
            className="mt-4 w-full rounded-md bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            Show anyway
          </Button>

          <p className="mt-2 text-[11px] text-zinc-500">
            Your choice will be remembered on this device
          </p>
        </div>
      </div>
    </div>
  );
}
