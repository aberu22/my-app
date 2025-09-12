"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// lucide
import {
  Home,
  ImageIcon,
  Wrench,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default function HomeSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={
        `relative min-h-screen bg-zinc-950 text-white border-r border-zinc-800 shadow-inner` +
        ` ${collapsed ? "w-20" : "w-72"}`
      }
    >
      {/* Collapse toggle */}
      <button
        aria-label="Toggle sidebar"
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-6 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-zinc-900 hover:bg-zinc-800"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <div className="flex h-full flex-col justify-between p-4">
        {/* Top */}
        <div>
          {/* Brand */}
          <div
            className={`mb-8 flex items-center ${
              collapsed ? "justify-center" : "justify-start gap-2"
            }`}
          >
            <Image src="/logo.png" alt="FantasyVision.AI" width={24} height={24} />
            {!collapsed && (
              <span className="text-lg font-semibold tracking-wide">
                FantasyVision.AI
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            <NavItem
              href="/"
              icon={<Home className="h-4 w-4" />}
              label="Home"
              active={pathname === "/"}
              collapsed={collapsed}
            />
            <NavItem
              href="/create"
              icon={<ImageIcon className="h-4 w-4 text-emerald-400" />}
              label="Image Creation"
              active={pathname?.startsWith("/create")}
              collapsed={collapsed}
            />
            <NavItem
              href="/tools"
              icon={<Wrench className="h-4 w-4 text-purple-400" />}
              label="Tools"
              active={pathname?.startsWith("/tools")}
              collapsed={collapsed}
            />
            <NavItem
              href="/account"
              icon={<Settings className="h-4 w-4 text-blue-400" />}
              label="Account"
              active={pathname?.startsWith("/account")}
              collapsed={collapsed}
            />
          </nav>

          <Separator className="my-6 bg-white/10" />

          {/* Tip */}
          {!collapsed && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              Pro tip: Press{" "}
              <kbd className="rounded bg-black/40 px-1 py-0.5">/</kbd> to search
              creations.
            </div>
          )}
        </div>

        {/* Bottom section */}
        <div className="space-y-3 pb-2">
          {/* Brand chip (expanded) */}
          {!collapsed ? (
            <a
              href="https://wan.video/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos/wan1.png"
                alt="Wan 2.2 logo"
                className="h-16 w-16 object-contain"
              />
              <div className="leading-tight">
                <p className="text-xs text-white/80">
                  Powered by <span className="font-semibold">Wan 2.2</span>
                </p>
                <p className="text-[10px] text-white/45">
                  video & image generation
                </p>
              </div>
            </a>
          ) : (
            // Brand chip (collapsed): logo with tooltip
            <TooltipProvider>
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  <div className="grid place-items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/logos/wan1.png"
                      alt="Wan 2.2"
                      className="h-10 w-10 opacity-90"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Powered by Wan 2.2</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* LEGAL GROUP — Terms inside sidebar */}
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-2 text-[10px] uppercase tracking-wide text-white/40">
                Legal
              </p>
            )}
            <NavItem
              href="/terms"
              icon={<FileText className="h-4 w-4 text-amber-300" />}
              label="Terms"
              active={pathname === "/terms"}
              collapsed={collapsed}
            />
            {/* Optional extra links; remove if not needed */}
            <NavItem
              href="/privacy"
              icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
              label="Privacy"
              active={pathname === "/privacy"}
              collapsed={collapsed}
            />
            <NavItem
              href="/aup"
              icon={<Sparkles className="h-4 w-4 text-pink-300" />}
              label="Acceptable Use"
              active={pathname === "/aup"}
              collapsed={collapsed}
            />
          </div>

          {/* CTA */}
          <Button
            asChild
            className="w-full justify-center gap-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-black hover:brightness-110"
          >
            <Link href="/pricing">Upgrade</Link>
          </Button>

          {!collapsed && (
            <p className="text-center text-[11px] text-neutral-400">
              Plans from{" "}
              <span className="font-semibold text-yellow-300">$5.99</span>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, active, collapsed }) {
  const base =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const state = active
    ? "bg-white/10 text-white"
    : "text-zinc-400 hover:bg-white/5 hover:text-white";

  const content = (
    <div className={`${base} ${state}`} aria-current={active ? "page" : undefined}>
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  );

  return collapsed ? (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Link href={href}>{content}</Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <Link href={href}>{content}</Link>
  );
}
