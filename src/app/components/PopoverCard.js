// src/components/PopoverCard.js
"use client";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function PopoverCard({ title, children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className=" fixed top-24 right-8 z-50 bg-zinc-900 text-white p-6 rounded-2xl shadow-xl border border-zinc-700 w-[420px]"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
      >
        <FaTimes />
      </button>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="space-y-4 text-sm text-zinc-300">{children}</div>
    </motion.div>
  );
}
