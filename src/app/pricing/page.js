"use client";


// Local component imports
import Pricing from "../components/Pricing";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <main className="bg-gradient-to-b from-zinc-950 to-zinc-900 min-h-screen py-12 px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-10"
      >
        FantasyVison.AI Pricing
      </motion.h1>

      <section className="mb-20">
        <Pricing />
      </section>
    </main>
  );
}
