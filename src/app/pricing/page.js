"use client";

import Pricing from "../components/Pricing";
import { motion } from "framer-motion";
import PricingSEOContent from "../pricing/PricingSEOContent";
import { Toaster } from "react-hot-toast";

export default function PricingPage() {
  return (
    <main className="bg-gradient-to-b from-zinc-950 to-zinc-900 min-h-screen py-12 px-6">
      
      {/* 🔔 Toast container */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#05060aff",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-10"
      >
        Pricing
      </motion.h1>

      <section className="mb-20">
        <Pricing />
      </section>

      <PricingSEOContent />
    </main>
  );
}
