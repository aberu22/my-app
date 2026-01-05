"use client";

import { motion } from "framer-motion";
import { Toaster } from "react-hot-toast";
import BillingDashboard from "@/app/components/BillingDashboard";
import CreateSidebar from "../../components/CreateSidebar";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 py-12 px-4">
      
      {/* 🔔 Toast container */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#0b0d12",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

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
