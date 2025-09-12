"use client";

import { useState, useEffect } from "react";
import { useImageGeneration } from "../../context/ImageGenrationContext";
import { fetchModels, fetchLoras,setOptions } from "../utils/api";
import { motion } from "framer-motion";
import Image from "next/image";

const MODEL_LORA_COMPATIBILITY = {
  "Pony": ["Pony", "SDXL 1.0", "illustrious"],
  "illustrious": ["Pony", "SDXL 1.0", "illustrious"],
  "SDXL 1.0": ["Pony", "SDXL 1.0", "illustrious"],
  "SD 1.5": [
    "SD 1.5", "flux.1d", "anything", "revanimated",
    "sd1", "realistic", "photo", "photoreal",
    "bpbjsc-000009", "milf", "ups", "tapegag-v1"
  ],
};


const ModelGrid = ({ isVisible, onClose, onSelect, setFilteredLoras }) => {
  const { selectedModel, setSelectedModel, membershipStatus } = useImageGeneration();
  const [models, setModels] = useState([]);
  const [loras, setLoras] = useState([]);

  useEffect(() => {
    const loadModelsAndLoras = async () => {
      const fetchedModels = await fetchModels(membershipStatus);
      const fetchedLoras = await fetchLoras();
      setModels(fetchedModels);
      setLoras(fetchedLoras);
    };

    if (isVisible) {
      loadModelsAndLoras();
    }
  }, [isVisible, membershipStatus]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  
    const modelName = model.model_name?.toLowerCase().trim() || "";
    const compatibleKeys = new Set();
  
    if (modelName.includes("pony")) MODEL_LORA_COMPATIBILITY["Pony"].forEach(k => compatibleKeys.add(k));
    if (modelName.includes("illustrious")) MODEL_LORA_COMPATIBILITY["illustrious"].forEach(k => compatibleKeys.add(k));
    if (modelName.includes("sd xl") || modelName.includes("sd_xl")) MODEL_LORA_COMPATIBILITY["SDXL 1.0"].forEach(k => compatibleKeys.add(k));
    if (
      modelName.includes("sd 1.5") ||
      modelName.includes("v1-5") ||
      modelName.includes("1.5") ||
      modelName.includes("flux") ||
      modelName.includes("realism")
    ) MODEL_LORA_COMPATIBILITY["SD 1.5"].forEach(k => compatibleKeys.add(k));
  
    const keys = Array.from(compatibleKeys).map(k => k.toLowerCase());
  
    const matchedLoras = loras.filter((lora) => {
      const base = lora.baseModel?.toLowerCase();
      const name = lora.name?.toLowerCase() || "";
      return base && keys.some(key => base === key || name.includes(key));
    });
  
    console.log("🧩 Compatible keys:", keys);
    console.log("🧠 BaseModels from LoRAs:", loras.map(l => l.baseModel));
    console.log("🎯 Matched LoRAs:", matchedLoras.length);
  
    const bypassNSFW = true;
    const filteredLoras = bypassNSFW
      ? matchedLoras
      : matchedLoras.filter(lora => !lora.isNSFW || membershipStatus === "plus");
  
    console.log("🔒 Final visible LoRAs:", filteredLoras.length);
  
    if (setFilteredLoras) setFilteredLoras(filteredLoras);
    if (onSelect) onSelect(model);
  };
  

 
  
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-lg z-[1000]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-black/80 p-6 rounded-2xl shadow-2xl w-[90vw] max-w-[900px] h-[85vh] relative z-[1100] overflow-y-auto border border-gray-700"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Model</h2>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl transition-all"
          onClick={onClose}
        >
          ✖
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.length === 0 ? (
            <p className="text-gray-400 text-center col-span-full">Loading models...</p>
          ) : (
            models.map((model, index) => (
              <ModelCard
                key={model.id || model.name || index}
                model={model}
                selectedModel={selectedModel}
                onSelect={() => handleModelSelect(model)}
                membershipStatus={membershipStatus}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ModelCard = ({ model, selectedModel, onSelect, membershipStatus }) => {
  const [imgError, setImgError] = useState(false);

  const NSFW_KEYWORDS = ["nsfw", "hentai", "hardcore", "adult", "porn", "nudity"];
  const isNSFW = NSFW_KEYWORDS.some((keyword) =>
    model.model_name.toLowerCase().includes(keyword)
  );

  const handleClick = () => {
    if (isNSFW && membershipStatus === "free") {
      window.location.href = "/pricing";
      return;
    }
    onSelect();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative p-4 bg-gray-900/70 rounded-xl transition-all border border-transparent hover:border-blue-500 ${
        selectedModel?.model_name === model.model_name ? "border-blue-500" : ""
      }`}
      onClick={handleClick}
    >
      <div className="absolute top-2 left-2 bg-green-600 text-xs text-white px-2 py-1 rounded-full">Model</div>

      {isNSFW && membershipStatus === "free" && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
          <span>⭐</span> PLUS
        </div>
      )}

      <Image
        src={imgError ? "/models/default-thumbnail.png" : model.thumbnail}
        alt={model.model_name || "Model Thumbnail"}
        width={280}
        height={160}
        className="rounded-lg h-auto"
        unoptimized
        onError={() => setImgError(true)}
      />

      <p className="text-center text-white mt-3 font-medium">{model.model_name}</p>

      {isNSFW && membershipStatus === "free" && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center">
          <button
            className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:bg-yellow-600 transition"
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = "/pricing";
            }}
          >
            ⭐ Get PLUS
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ModelGrid;