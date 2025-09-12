"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiTemplates from "../assets/api.json";
import loraTemplates from "../assets/Loras.json";
import { FaTimes } from "react-icons/fa";
import { FaSearch , FaCheck, FaExclamationTriangle,FaLock,FaTags,FaImage,FaMagic,FaBan,FaRocket} from "react-icons/fa";


const nsfwKeywords = [
  "nsfw", "nude", "explicit", "pussy", "no_panties", "breasts", "gigantic penis","nsfw",
  "naked", "nipples", "vagina", "sex", "erotic", "fetish", "lewd", "panties" ,"vagina","uncensored", "blowjob", "bondage", "tied","upskirt","underclothes","removingpanties","pov","tape"
];

const isNSFW = (template) => {
  const text = `${template.prompt || ""} ${template.negative_prompt || ""}`.toLowerCase();
  return nsfwKeywords.some((keyword) => text.includes(keyword));
};

const TemplateSelection = ({ onSendToPrompt }) => {
  const [showNSFW, setShowNSFW] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [revealedNSFW, setRevealedNSFW] = useState({});

  useEffect(() => {
  if (typeof window !== "undefined") {
    const consent = localStorage.getItem("nsfwConsent") === "true";
    setShowNSFW(consent);

    const revealed = localStorage.getItem("revealedNSFWTemplates");
    if (revealed) {
      setRevealedNSFW(JSON.parse(revealed));
    }
  }
}, []);



  const allTemplates = useMemo(() => {
    const safeTemplates = apiTemplates.map((t, i) => ({
      ...t,
      name: t.name || `Realism Template #${i + 1} - ${t.model || t.prompt?.substring(0, 30) || "Untitled"}`,
      safe: true
    }));

    const lora = loraTemplates
      .filter(t => t && (t.prompt || t.image_url))
      .map((t, i) => ({
        ...t,
        name: t.name || `LoRA Template #${i + 1} - ${t.model || t.prompt?.substring(0, 30) || "Untitled"}`,
        safe: false
      }));

    return [...safeTemplates, ...lora];
  }, []);

  

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag =
        selectedTag === "All" ||
        (template.prompt && template.prompt.toLowerCase().includes(selectedTag.toLowerCase()));
      return matchesSearch && matchesTag;
    });
  }, [allTemplates, searchTerm, selectedTag]);
  

  const sfwTemplates = filteredTemplates.filter((t) => t.safe || !isNSFW(t));
  const nsfwTemplates = filteredTemplates.filter((t) => !t.safe && isNSFW(t));

  const confirmNSFWAccess = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nsfwConsent", "true");
      setShowNSFW(true);
    }
  }, []);

  const openModal = useCallback((template) => {
    setSelectedTemplate(template);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedTemplate(null);
    setModalOpen(false);
  }, []);

  const handleNSFWReveal = (id) => {
  if (revealedNSFW[id]) return; // already revealed

  const confirm = window.confirm("⚠️ You are about to view adult content.\n\nIf you are under 18, please leave.");
  if (confirm) {
    const updated = { ...revealedNSFW, [id]: true };
    setRevealedNSFW(updated);
    localStorage.setItem("revealedNSFWTemplates", JSON.stringify(updated));
  }
};




  const popularTags = [
    "1girl", "blowjob", "1boy", "pov", "upskirt", "gagged", "tied", "panties",
    "hogtied", "cum", "asian", "fellatio", "underwear", "lingerie", "solo",
    "nipples", "looking at viewer", "deepthroat", "leash", "collar",
  ];
  


  return (
    <div className="bg-gradient-to-b from-zinc-950 to-zinc-900 min-h-screen text-white font-sans p-6 md:p-10 max-w-screen-xxl mx-auto">
  {/* Header Section */}
  <header className="mb-8">
    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-balance bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 text-transparent bg-clip-text animate-gradient bg-300%">
      AI Template Gallery
    </h2>
    
    {/* Search & Filter */}
    <div className="mb-8 flex flex-col gap-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-12 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-zinc-500 transition-all shadow-lg"
        />
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
      </div>

      {/* Tag Filter */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedTag("All")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedTag === "All" 
              ? "bg-purple-600 text-white shadow-purple-glow" 
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          }`}
        >
          All Templates
        </button>
        {popularTags.map((tag) => (
          <motion.button
            key={tag}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedTag(tag)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedTag === tag 
                ? "bg-purple-600 text-white shadow-purple-glow" 
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            #{tag}
          </motion.button>
        ))}
      </div>
    </div>
  </header>

  {/* SFW Templates */}
  <section className="mb-12">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-green-500/10 rounded-lg">
        <FaCheck className="text-green-400" />
      </div>
      <h3 className="text-2xl font-bold">Safe for Work</h3>
      <span className="ml-auto px-3 py-1 rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
        {sfwTemplates.length} templates
      </span>
    </div>

    {sfwTemplates.length > 0 ? (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
    {sfwTemplates.map((template, index) => (
      <motion.div
        key={template.id || `${template.name}-${index}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -5 }}
        className="relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-zinc-800 backdrop-blur-sm transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(139,92,246,0.3)]"
        onClick={() => openModal(template)}
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={template.image_url}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="p-4">
          <p className="font-semibold truncate text-white">{template.name}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {template.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    ))}
  </div>
) : (
  <div className="text-center py-12 bg-zinc-900/50 rounded-2xl">
    <FaImage className="mx-auto text-4xl text-zinc-600 mb-3" />
    <p className="text-zinc-400">No SFW templates match your search</p>
  </div>
)}

    

  </section>

  {/* NSFW Templates */}
  <section>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-red-500/10 rounded-lg">
        <FaExclamationTriangle className="text-red-400" />
      </div>
      <h3 className="text-2xl font-bold">NSFW Content</h3>
      <span className="ml-auto px-3 py-1 rounded-full bg-zinc-800 text-sm font-medium text-zinc-300">
        {nsfwTemplates.length} templates
      </span>
    </div>
    
    {!showNSFW ? (
      <div className="bg-gradient-to-br from-red-900/30 to-zinc-900/50 backdrop-blur-md p-8 text-center rounded-2xl border border-red-500/50">
        <div className="max-w-md mx-auto">
          <div className="p-3 bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-2xl text-red-400" />
          </div>
          <h4 className="text-xl font-bold text-red-400 mb-2">Adult Content Warning</h4>
          <p className="text-zinc-400 mb-6">This section contains content suitable for adults only. You must be 18+ to view.</p>
          <button
            onClick={confirmNSFWAccess}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all hover:shadow-red-500/30"
          >
            Confirm I'm 18+ to Continue
          </button>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {nsfwTemplates.map((template, index) => (
          <motion.div
            key={template.id || `${template.name}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/60 border border-zinc-800 backdrop-blur-sm"
          >
            {!revealedNSFW[index] ? (
              <div className="relative aspect-square">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="bg-red-500/20 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                    <FaLock className="text-red-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">NSFW Content</h4>
                  <p className="text-zinc-400 text-sm mb-4">This template contains adult content</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNSFWReveal(index);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full text-sm font-medium transition-all"
                  >
                    Reveal Content
                  </button>
                </div>
                <img
                  src={template.image_url}
                  alt="NSFW Content"
                  className="w-full h-full object-cover blur-xl scale-110 opacity-30"
                  loading="lazy"
                />
              </div>
            ) : (
              <>
                <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => openModal(template)}>
                  <img
                    src={template.image_url}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <p className="font-semibold truncate text-white">{template.name}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">NSFW</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    )}
  </section>

  {/* Template Modal */}
  <AnimatePresence>
    {modalOpen && selectedTemplate && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl border border-zinc-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
            aria-label="Close modal"
          >
            <FaTimes size={20} />
          </button>

          <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
            <img
              src={selectedTemplate.image_url}
              alt={selectedTemplate.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{selectedTemplate.name}</h3>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FaTags className="text-purple-400" />
                <h4 className="font-semibold">Tags</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags?.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FaMagic className="text-blue-400" />
                <h4 className="font-semibold">Prompt</h4>
              </div>
              <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                <p className="text-zinc-300 whitespace-pre-line">{selectedTemplate.prompt}</p>
              </div>
            </div>

            {selectedTemplate.negative_prompt && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <FaBan className="text-red-400" />
                  <h4 className="font-semibold">Negative Prompt</h4>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                  <p className="text-zinc-300 whitespace-pre-line">{selectedTemplate.negative_prompt}</p>
                </div>
              </div>
            )}

            <button
  onClick={() => {
    onSendToPrompt({
      text: selectedTemplate.prompt,
      negative: selectedTemplate.negative_prompt,
    });
    closeModal();

    // Scroll to top after a slight delay so modal can close smoothly
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300); // matches modal close animation
  }}
  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all hover:shadow-purple-500/30 flex items-center justify-center gap-2"
>
  <FaRocket className="text-lg" />
  Use This Template
</button>

          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
  );
};

export default TemplateSelection;
