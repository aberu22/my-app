"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import ModeTabs from "../components/ModeTabs";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";

import {
  Home,
  Image as ImageIcon,
  User,
  Settings,
  LogOut,
  Sparkles,
  Folder,
  Zap,
  Crown,
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        setUserData(userSnapshot.exists() ? userSnapshot.data() : null);
      } else {
        setUserData(null);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut(auth);
      router.push("/");
      setMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={[
        "sticky top-0 z-50 w-full transition-all duration-300",
        "backdrop-blur bg-zinc-950/70 text-zinc-100",
        "border-b border-zinc-800/60",
        "px-4 py-3 shadow-[0_1px_0_0_rgba(255,255,255,0.04)]",
        scrolled ? "py-2 bg-zinc-950/90" : "",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand */}
        <div className="group flex items-center space-x-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
            <div className="absolute inset-0 rounded-xl bg-zinc-100/5 blur-md opacity-70 group-hover:opacity-90 transition-opacity" />
            <Image
              src="/logos/fan2.png"
              alt="FantasyVisionAI Logo"
              width={48}
              height={48}
              priority
              className="
                relative z-10 rounded-xl
                ring-1 ring-white/10
                shadow-[0_0_20px_rgba(255,255,255,0.08)]
              "
            />

          </motion.div>
          <Link
            href="/"
            className="text-xl font-semibold text-white hover:text-zinc-200 transition-colors"
          >
            FantasyVision<span className="text-zinc-300">.Ai</span>
          </Link>
        </div>

        {/* Mode Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block"
        >
          <ModeTabs />
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          <NavLink
            href="/home"
            icon={<Home size={18} />}
            label="Home"
            isActive={pathname === "/home"}
          />
          <NavLink
            href="/create"
            icon={<ImageIcon size={18} />}
            label="Create"
            isActive={pathname === "/create"}
          />
          <NavLink
            href="/asset"
            icon={<Folder size={18} />}
            label="Assets"
            isActive={pathname === "/asset"}
          />
          <NavLink
            href="/tools"
            icon={<Zap size={18} />}
            label="Studio"
            isActive={pathname === "/tools"}
          />

          {/* Subtle Pro badge (zinc theme) */}
          <div className="relative mx-1">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-amber-300">
              <Crown size={16} className="opacity-90" />
              <span className="font-medium">Pro</span>
            </div>
            <div className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          </div>
        </div>

        {/* Mobile hamburger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-lg bg-zinc-800/60 p-1.5 text-zinc-200 hover:bg-zinc-800 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </motion.button>

        {/* User section (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Tooltip title="Quick generate">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/create")}
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-zinc-100 hover:bg-zinc-800"
                >
                  <Sparkles size={16} />
                  <span>Generate</span>
                </motion.button>
              </Tooltip>

              <Tooltip title="View profile">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 pl-1 pr-3 py-1 hover:bg-zinc-800"
                  onClick={() => router.push("/account")}
                >
                  <div className="relative">
                    <Image
                      src={userData?.avatar || user.photoURL || "/default-avatar.png"}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                    <div className="absolute -bottom-0 -right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    {userData?.username || user.displayName || "User"}
                  </span>
                </motion.div>
              </Tooltip>

              {/* Logout */}
              <Tooltip title="Sign out">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-70"
                  aria-label="Sign out"
                >
                  {logoutLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <LogOut size={18} />
                  )}
                </motion.button>
              </Tooltip>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/login")}
                className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-zinc-100 hover:bg-zinc-800"
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/signup")}
                className="rounded-xl bg-white px-4 py-2 font-medium text-black hover:bg-zinc-200"
              >
                Sign Up
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-4 top-full z-50 mt-2 w-64 rounded-xl border border-zinc-700/60 bg-zinc-900/95 p-3 text-sm text-zinc-200 shadow-2xl backdrop-blur"
          >
            <div className="mb-1 border-b border-zinc-700/50 px-3 py-2">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Navigation</p>
            </div>

            <NavItem
              href="/home"
              icon={<Home size={18} />}
              label="Home"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/home"}
            />
            <NavItem
              href="/create"
              icon={<ImageIcon size={18} />}
              label="Create"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/create"}
            />
            <NavItem
              href="/asset"
              icon={<Folder size={18} />}
              label="Assets"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/asset"}
            />
            <NavItem
              href="/account"
              icon={<User size={18} />}
              label="Account"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/account"}
            />
            <NavItem
              href="/tools"
              icon={<Zap size={18} />}
              label="AI Studio"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/tools"}
            />
            <NavItem
              href="/pricing"
              icon={<Crown size={18} />}
              label="Upgrade"
              setMenuOpen={setMenuOpen}
              isActive={pathname === "/pricing"}
            />

            <div className="mt-2 border-t border-zinc-700/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Status</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
            </div>

            {user && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                disabled={logoutLoading}
                className="mt-2 flex w-full items-center gap-3 rounded-lg border border-rose-700/30 bg-rose-600/10 px-3 py-2 text-left text-rose-300 hover:bg-rose-700/20 disabled:opacity-70"
              >
                <LogOut size={18} />
                {logoutLoading ? "Logging out..." : "Logout"}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ----------------------------- Reusable items ----------------------------- */

function NavLink({ href, icon, label, isActive }) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={[
          "group relative flex items-center gap-2 rounded-lg px-3 py-2 transition-all",
          isActive
            ? "bg-white/10 text-white ring-1 ring-white/10"
            : "text-zinc-400 hover:text-white hover:bg-white/5",
        ].join(" ")}
      >
        <span className={isActive ? "text-zinc-100" : "text-zinc-300 group-hover:text-zinc-200"}>
          {icon}
        </span>
        <span className="font-medium">{label}</span>
        {isActive && (
          <motion.span
            layoutId="navActiveIndicator"
            className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-zinc-300/70"
          />
        )}
      </motion.div>
    </Link>
  );
}

function NavItem({ href, icon, label, setMenuOpen, isActive }) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setMenuOpen(false)}
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
          isActive
            ? "bg-white/10 text-white ring-1 ring-white/10"
            : "text-zinc-400 hover:text-white hover:bg-white/5",
        ].join(" ")}
      >
        <span className={isActive ? "text-zinc-200" : "text-zinc-400"}>{icon}</span>
        <span className="font-medium">{label}</span>
        {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-zinc-300" />}
      </motion.div>
    </Link>
  );
}
