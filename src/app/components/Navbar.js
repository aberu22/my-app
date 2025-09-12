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
  Folder, // new icon for Assets
} from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userSnapshot = await getDoc(userDocRef);
        if (userSnapshot.exists()) {
          setUserData(userSnapshot.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setMenuOpen(false);
    } catch (error) {
      console.error("🚨 Logout error:", error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative bg-gradient-to-r from-[#0f0f0f] to-[#1a1a2e] backdrop-blur-md text-white px-2 py-2 shadow-md border-b border-gray-800 flex justify-between items-center z-50"
    >
      {/* Brand */}
      <div className="flex items-center space-x-3 group">
        <motion.div whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }}>
          <Image
            src="/logo.png" // fixed path
            alt="Logo"
            width={120}
            height={120}
            className="rounded-xl shadow-md group-hover:shadow-purple-500/50 transition-all duration-300"
          />
        </motion.div>
        <Link
          href="/"
          className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 hover:opacity-90 transition group-hover:from-pink-500 group-hover:to-purple-600"
        >
          FantasyVision.Ai
        </Link>
      </div>

      {/* Mode Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <ModeTabs />
      </motion.div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-5 text-sm font-medium">
        <NavLink href="/home" icon={<Home size={16} />} label="Home" isActive={pathname === "/home"} />
        <NavLink href="/create" icon={<ImageIcon size={16} />} label="Create" isActive={pathname === "/create"} />
        <NavLink href="/asset" icon={<Folder size={16} />} label="Assets" isActive={pathname === "/asset"} />
        <NavLink href="/account" icon={<User size={16} />} label="Account" isActive={pathname === "/account"} />
        <NavLink href="/tools" icon={<Settings size={16} />} label="AI Influencer Studio" isActive={pathname === "/tools"} />
        <NavLink href="/pricing" icon={<Sparkles size={16} />} label="Pricing" isActive={pathname === "/pricing"} />
        {/* Optional: Access Landing page */}
        <NavLink href="/" icon={<Sparkles size={16} />} label="Landing" isActive={pathname === "/"} />
      </div>

      {/* Mobile hamburger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="md:hidden text-white hover:text-purple-400 transition"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </motion.button>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 right-6 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg w-56 z-50 p-4 space-y-3 text-sm"
          >
            <NavItem href="/home" icon={<Home />} label="Home" setMenuOpen={setMenuOpen} isActive={pathname === "/home"} />
            <NavItem href="/create" icon={<ImageIcon />} label="Create" setMenuOpen={setMenuOpen} isActive={pathname === "/create"} />
            <NavItem href="/asset" icon={<Folder />} label="Assets" setMenuOpen={setMenuOpen} isActive={pathname === "/asset"} />
            <NavItem href="/account" icon={<User />} label="Account" setMenuOpen={setMenuOpen} isActive={pathname === "/account"} />
            <NavItem href="/tools" icon={<Settings />} label="AI Influencer Studio" setMenuOpen={setMenuOpen} isActive={pathname === "/tools"} />
            <NavItem href="/pricing" icon={<Sparkles />} label="Pricing" setMenuOpen={setMenuOpen} isActive={pathname === "/pricing"} />
            <NavItem href="/" icon={<Sparkles />} label="Landing" setMenuOpen={setMenuOpen} isActive={pathname === "/"} />
            {user && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left text-red-400 hover:text-red-500 mt-2 pt-2 border-t border-zinc-700"
              >
                <LogOut size={16} />
                Logout
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* User section */}
      <div className="hidden md:flex items-center space-x-4">
        {user ? (
          <>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
              <Image
                src={userData?.avatar || user.photoURL || "/default-avatar.png"}
                alt="User Avatar"
                width={36}
                height={36}
                className="rounded-full border border-gray-600 object-cover shadow-md cursor-pointer"
                onClick={() => router.push("/account")}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
            </motion.div>
            <Tooltip title="View profile">
              <span
                className="text-gray-300 font-medium hover:text-white transition cursor-pointer"
                onClick={() => router.push("/account")}
              >
                {userData?.username || user.displayName || "User"}
              </span>
            </Tooltip>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-600 px-4 py-2 rounded-xl font-semibold hover:shadow-red-500/30 transition-all shadow-lg hover:shadow-xl"
            >
              Logout
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded-xl font-semibold hover:shadow-purple-500/30 transition-all shadow-lg hover:shadow-xl"
          >
            Login
          </motion.button>
        )}
      </div>
    </motion.nav>
  );
}

// Reusable NavLink for desktop
function NavLink({ href, icon, label, isActive }) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 transition-all px-3 py-2 rounded-lg relative ${
          isActive
            ? "bg-purple-900/50 text-white shadow-purple-500/20"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800"
        }`}
      >
        {icon}
        {label}
        {isActive && (
          <motion.span
            layoutId="navActiveIndicator"
            className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-full"
          />
        )}
      </motion.div>
    </Link>
  );
}

// Reusable NavItem for mobile
function NavItem({ href, icon, label, setMenuOpen, isActive }) {
  return (
    <Link href={href} passHref>
      <motion.div
        whileHover={{ x: 5 }}
        onClick={() => setMenuOpen(false)}
        className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${
          isActive
            ? "bg-purple-900/30 text-purple-400"
            : "text-zinc-300 hover:text-white hover:bg-zinc-800"
        }`}
      >
        <span className={`${isActive ? "text-purple-400" : "text-zinc-400"}`}>
          {icon}
        </span>
        <span>{label}</span>
      </motion.div>
    </Link>
  );
}
