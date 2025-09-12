

"use client";

import { motion } from "framer-motion";
import BillingDashboard from "../components/BillingDashboard";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-lg border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8"
        >
          Account Settings
        </motion.h1>

        <BillingDashboard />
      </div>
    </div>
  );
}
