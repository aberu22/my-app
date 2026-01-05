"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/account/billing", label: "Billing" },
  { href: "/profile/username", label: "Profile" },
  { href: "/home", label: "Home" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        hidden sm:flex
        w-56 shrink-0
        flex-col
        border-r border-white/10
        bg-[#0b0d12]
        px-3 py-6
      "
    >
      {/* Header */}
      <div className="mb-5 px-2">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">
          Account
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/account" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative rounded-lg px-3 py-2
                text-[13px] transition
                ${
                  active
                    ? "bg-white/[0.06] text-white ring-1 ring-white/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                }
              `}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint (optional, Sora-style subtle) */}
      <div className="mt-auto px-2 pt-6 text-[11px] text-zinc-500">
        FantasyVisionAI
      </div>
    </aside>
  );
}
